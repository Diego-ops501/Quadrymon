'use strict';
const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const D=require('../src/domain/breeding-cost');
const storage=new Map();let fail=false, calls=0;
const parent={id:'p1',speciesId:247,name:'Pupitar',ivTotal:175,quality:1.7,level:1};
const P={api:{'/api/characters/me':{character:{id:'one'}}},ws:{pokes:{list:[parent,{...parent,id:'p2'}]}},catchLog:[]};
const response=data=>new Response(JSON.stringify(data),{headers:{'Content-Type':'application/json'}});
const context=vm.createContext({QuadrymonBreedingCost:D,location:{origin:'https://poke.idleworld.online',pathname:'/play',href:'https://poke.idleworld.online/play'},__poke:P,URL,Request,Response,Date,console,
sessionStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},
fetch:async(url,options)=>{calls++;const u=new URL(typeof url==='string'?url:url.url,'https://poke.idleworld.online');const body=options?.body?JSON.parse(options.body):{};
if(u.searchParams.get('action')==='center')return response({eggs:[],instantHatchCost:2});
if(u.searchParams.get('action')==='quote')return response({goldFee:2000000,ivPreview:{ivTotal:175,bump:{possible:true}}});
if(fail)return new Response('{}',{status:400});
if(body.action==='breed'){P.ws.pokes.list=[];return response({eggs:[{id:'egg',speciesId:247,speciesName:'Pupitar'}]});}
if(body.action==='hatch'){return response({child:{speciesId:247,ivTotal:176,quality:1.735,delta:.035}});}
return response({ok:true});}});
const source=fs.readFileSync(require.resolve('../src/game/breeding-observer'),'utf8');vm.runInContext(source,context);
const flush=()=>new Promise(r=>setTimeout(r,20));
(async()=>{
const observed=context.QuadrymonBreedingObserver;
await context.fetch('/api/game/breeding?action=center');await flush();
await context.fetch('/api/game/breeding?action=quote&parent1=p1&parent2=p2&free=0');await flush();
const result=await context.fetch('/api/game/breeding',{method:'POST',body:JSON.stringify({action:'breed',parent1:'p1',parent2:'p2',free:false,double:true})});
assert((await result.json()).eggs.length===1,'game retains original response stream');await flush();
let event=observed.read().events[0];assert.equal(event.kind,'breed');assert.equal(event.parents[0].id,'p1');assert.equal(event.quote.ivPreview.ivTotal,175);assert(event.double);
assert.equal(calls,3,'observer makes no extra request');
observed.ack(['breed:egg']);assert.equal(observed.read().events.length,0);
await context.fetch('/api/game/breeding',{method:'POST',body:JSON.stringify({action:'hatch',eggId:'egg'})});await flush();
P.ws.pokes.list=[{...parent,id:'child',ivTotal:176,quality:1.735}];
observed.onPokemon(P.ws.pokes.list);P.ws.pokes.list=[];
event=observed.read().events[0];assert.equal(event.child.id,'child');assert.equal(event.child.delta,.035);
assert.equal(event.child.id,'child','ID is retained even when the hatchling is consumed before the next host poll');
observed.ack(['hatch:egg']);
P.api['/api/game/market']={listings:[{...parent,id:'listing',kind:'pokemon'}]};
P.ws.pokes.list=[];await context.fetch('/api/game/market/action',{method:'POST',body:JSON.stringify({action:'buy',id:'listing',price:5,currency:'DIAMONDS'})});await flush();
P.ws.pokes.list=[{...parent,id:'caught'}];P.catchLog=[{id:'caught'}];
assert(!observed.read().events[0].pokemon,'a concurrent capture is never labeled as a purchase');
P.ws.pokes.list.push({...parent,id:'purchased'});event=observed.read().events[0];
assert.equal(event.pokemon.id,'purchased');assert.equal(event.price,5);assert.equal(event.currency,'DIAMONDS');
assert.equal(event.evidence,'purchase-and-unique-inventory-delta');
observed.ack([event.id]);
await context.fetch('/api/game/breeding',{method:'POST',body:JSON.stringify({action:'hatch',eggId:'reloadEgg'})});await flush();
const fresh=vm.createContext({...context,QuadrymonBreedingObserver:undefined,__poke:{api:{},ws:{pokes:{list:[]}}}});
vm.runInContext(source,fresh);assert.equal(fresh.QuadrymonBreedingObserver.read().events.length,1,'queue survives reload before character hydration');
fresh.__poke.api['/api/characters/me']={character:{id:'one'}};assert.equal(fresh.QuadrymonBreedingObserver.read().events.length,1,'same character recovers unacknowledged result');
vm.runInContext(source,context);assert.equal(context.QuadrymonBreedingObserver,observed,'reinjection does not wrap twice');
fail=true;await context.fetch('/api/game/breeding',{method:'POST',body:JSON.stringify({action:'breed',parent1:'p1',parent2:'p2'})});await flush();assert.equal(observed.read().events.length,1,'failed actions do not create events');
P.api['/api/characters/me'].character.id='two';assert.equal(observed.read().events.length,0,'character switch clears old queue');
console.log('Breeding observer: passive fetch, confirmed breed, pre-consumption parents, quote, hatch result/ID, failures, reinjection and account isolation passed.');
const session=require('../src/game/session');let observedId;
globalThis.QuadrymonBreedingObserver={onPokemon:rows=>{observedId=rows[0]?.id;}};
session.reduce(session.createState(),{type:'pokes',list:[{...parent,id:'socket-child'}]});
assert.equal(observedId,'socket-child','actual game reducer forwards inventory IDs immediately');delete globalThis.QuadrymonBreedingObserver;
})().catch(e=>{console.error(e);process.exitCode=1});
