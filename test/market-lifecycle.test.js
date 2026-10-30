'use strict';
const assert = require('node:assert/strict');
const M = require('../src/domain/global-market');
const turn = () => new Promise(resolve=>setImmediate(resolve));
(async()=>{
  let calls = 0;
  const reader = M.createMarketReader(async (_account,script)=>{
    calls++;
    if (script === 'stalled') return new Promise(()=>{});
    return {ok:true,data:{version:calls}};
  },{interval:0,timeoutMs:20});
  const stalled = reader(0,'stalled'), after = reader(0,'after');
  assert.equal((await stalled).reason,'timeout');
  assert.equal((await after).ok,true,'a stuck guest does not block the market/alert queue');
  const script = '"browse":"pokemon"';
  const initial = await reader(0,script);
  assert.equal((await reader(0,script)).data.version,initial.data.version);
  assert.notEqual((await reader(0,script,()=>true,10,true)).data.version,initial.data.version,'alerts bypass the five-minute page cache');

  let active = true, release, generation = 1;
  const cancelledReader = M.createMarketReader(async()=>{
    const version = generation;
    if (version === 1) await new Promise(resolve=>{release=resolve;});
    return {ok:true,data:{version}};
  },{interval:0});
  const old = cancelledReader(0,script,()=>active);
  active = false; generation = 2;
  const fresh = cancelledReader(0,script);
  release();
  assert.equal((await old).reason,'changed');
  assert.equal((await fresh).data.version,2,'reopening does not join a cancelled request for the same page');

  let invalidateRelease, reads = 0;
  const invalidated = M.createMarketReader(async()=>{
    const version = ++reads;
    if (version === 1) await new Promise(resolve=>{invalidateRelease=resolve;});
    return {ok:true,data:{version}};
  },{interval:0});
  const stale = invalidated(0,script);
  invalidated.clearPages(0); invalidateRelease(); await stale;
  assert.equal((await invalidated(0,script)).data.version,2,'a response from before invalidation cannot repopulate the new page cache');

  let now = 100000, valid = true, pageRelease, pageCalls = 0;
  const scan = async (_account,code,check=()=>true)=>{
    if (!check()) return {ok:false,reason:'changed'};
    const q = JSON.parse(code.match(/\}\)\((\{[^\n]*?\}),/)[1]);
    if (q.page === '2') { pageCalls++; if (pageRelease) await new Promise(resolve=>pageRelease.push(resolve)); }
    return {ok:true,data:{cid:'c1',pages:q.browse?2:1,total:2,listings:q.browse?[{id:'ad'+q.page,kind:'pokemon',name:'Abra',speciesId:63,price:100,currency:'GOLD'}]:[]}};
  };
  const store = M.createSnapshotCache(scan,{now:()=>now});
  await store.ensure(0,'c1');
  const saved = store.get(0,'c1');
  now+=60001; pageRelease=[];
  const pending = store.ensure(0,'c1',true,undefined,{valid:()=>valid});
  await turn(); valid=false;
  const callbacks=pageRelease;pageRelease=null;callbacks.forEach(resolve=>resolve());
  assert.equal((await pending).reason,'changed');
  assert.equal(store.get(0,'c1'),saved,'closing mid-scan never publishes a partial or cancelled snapshot');
  valid=true;
  await store.ensure(0,'c1',true,undefined,{valid:()=>valid,maxAge:0});
  const before=pageCalls;
  await store.ensure(0,'c1',true,undefined,{valid:()=>valid,maxAge:0});
  assert.equal(pageCalls,before+1,'reopening requests fresh data even inside the one-minute cache age');
  const slow = M.createSnapshotCache(async(...args)=>{now+=30;return scan(...args);},{now:()=>now,timeoutMs:45});
  assert.equal((await slow.ensure(0,'c1')).reason,'timeout');
  assert.equal(slow.get(0,'c1'),null,'a scan that exceeds its time budget never becomes the current market');
  console.log('Market lifecycle: stalled requests, fresh alerts, cancelled jobs, cache generations, reopening and bounded atomic scans passed.');
})().catch(error=>{console.error(error);process.exitCode=1;});
