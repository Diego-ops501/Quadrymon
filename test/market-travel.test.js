const assert = require('node:assert/strict');
const vm = require('node:vm');
const MarketTravel = require('../src/domain/market-travel');

function game(options = {}) {
  const calls = [], character = {id:'c1'}, P = {api:{'/api/characters/me':{character}},ws:{pokes:{list:[{team:true,leader:true,hp:100}]}},sock:{readyState:1},hunting:true,lastSlug:'nightmare_beedrill',fiT:1};
  const nav = {currentSlug:options.map || 'nightmare_beedrill',playerLevel:2500,onSelect:async(slug,name)=>{
    calls.push({slug,name});
    if(options.changed)character.id='c2';
    if(options.denied)return;
    nav.currentSlug=slug;P.currentMap=slug;P.hunting=slug!=='shopping';
    if(P.hunting){P.lastSlug=slug;P.fiT++;}
  }};
  P.hunting=options.hunting ?? !['shopping','cerulean','pewter','viridian','cassino','arena_pvp','goldenrod'].includes(nav.currentSlug);
  let mounted=!options.closed,marketClicks=0,mapClicks=0;
  const root={memoizedProps:nav},element={'__reactFiber$fixture':root};
  const document={querySelectorAll:()=>mounted?[element]:[],querySelector:selector=>selector==='[data-guide="dock-map"]'?{click(){mapClicks++;mounted=true;}}
    :selector==='.market-cta' && P.currentMap==='shopping' && !options.noMarket?{click(){marketClicks++;}}:null};
  const context={window:{__poke:P},location:{origin:'https://poke.idleworld.online',pathname:'/play'},document,setTimeout:fn=>{fn();return 1;},clearInterval() {calls.push({cancelReturn:true});}};
  return {P,nav,context,calls,character,get marketClicks(){return marketClicks;},get mapClicks(){return mapClicks;},run:previous=>vm.runInNewContext(MarketTravel.script('c1',previous),context)};
}

(async()=>{
  const outbound=game({closed:true}), result=await outbound.run();
  assert.equal(result.ok,true);assert.equal(result.atMarket,true);
  assert.equal(result.returnHunt.slug,'nightmare_beedrill');
  assert.equal(outbound.calls.length,1);assert.equal(outbound.calls[0].slug,'shopping');
  assert.equal(outbound.mapClicks,1,'opens native map when its callback is not mounted');
  assert.equal(outbound.marketClicks,1,'uses native market action to reach the NPC');
  const returning=game({map:'shopping'}), back=await returning.run(result.returnHunt);
  assert.equal(back.ok,true);assert.equal(back.atMarket,false);
  assert.equal(returning.calls[0].slug,'nightmare_beedrill');assert.equal(returning.marketClicks,0);
  for(const map of ['cerulean','pewter','viridian','cassino','arena_pvp','goldenrod','gym_brock','furious_scyther']) {
    const outside=game({map,hunting:false});
    assert.equal((await outside.run(result.returnHunt)).ok,true,'returns from '+map);
    assert.equal(outside.calls[0].slug,'nightmare_beedrill','keeps previous hunt outside '+map);
    assert.equal(outside.marketClicks,0);
    assert.equal((await game({map,hunting:false}).run()).reason,'noHunt');
  }
  assert.equal((await game({map:'shopping'}).run()).reason,'noHunt');
  assert.equal((await game({map:'shopping'}).run({slug:'shopping'})).reason,'noHunt');
  assert.equal((await game({map:'shopping'}).run({slug:'bad";alert(1)'})).reason,'noHunt');
  const fainted=game({map:'shopping'});fainted.P.ws.pokes.list[0].hp=0;
  assert.equal((await fainted.run(result.returnHunt)).reason,'fainted');assert.equal(fainted.calls.length,0);
  const other=game();other.character.id='c2';assert.equal((await other.run()).reason,'changed');assert.equal(other.calls.length,0);
  assert.equal((await game({changed:true}).run()).reason,'changed');
  const offline=game();offline.P.sock.readyState=3;assert.equal((await offline.run()).reason,'offline');assert.equal(offline.calls.length,0);
  const login=game();login.context.location.pathname='/login';assert.equal((await login.run()).reason,'offline');
  const denied=game({denied:true}), refused=await denied.run();
  assert.equal(refused.reason,'unconfirmed');assert.equal(refused.returnHunt.slug,'nightmare_beedrill');assert.equal(denied.calls.length,1,'blocked travel does not retry or bypass game checks');
  const missing=game({noMarket:true});assert.equal((await missing.run()).reason,'unconfirmed');assert.equal(missing.marketClicks,0);
  const recovery=game();recovery.context.window.__pgVoltaTimer=1;recovery.context.window.__pgVolta=true;
  assert.equal((await recovery.run()).ok,true);assert.equal(recovery.calls[0].cancelReturn,true);assert.equal(recovery.context.window.__pgVolta,undefined,'manual market trip cancels pending auto-return');
  const another=game();another.nav.currentSlug='furious_scyther';another.P.lastSlug='furious_scyther';
  assert.equal((await another.run()).returnHunt.slug,'furious_scyther','accounts keep their own hunt');
  const manual=game({map:'shopping'});manual.context.window.PokeMuxGamePreferences={state:()=>({userActivity:1,manualPauseUntil:Date.now()+300000})};
  assert.equal((await vm.runInNewContext(MarketTravel.script('c1',result.returnHunt,true),manual.context)).reason,'user-control');
  assert.equal(manual.calls.length,0,'automatic return never overrides manual input');
  manual.context.window.PokeMuxGamePreferences={state:()=>({userActivity:1,manualPauseUntil:Date.now()-1})};
  assert.equal((await vm.runInNewContext(MarketTravel.script('c1',result.returnHunt,true),manual.context)).ok,true,'automatic recovery resumes after the last user input cooldown expires');
  const idle=game({map:'shopping'});idle.context.window.PokeMuxGamePreferences={state:()=>({userActivity:0})};
  assert.equal((await vm.runInNewContext(MarketTravel.script('c1',result.returnHunt,true),idle.context)).ok,true,'idle automatic recovery can return to its exact captured hunt');
  const hunting=game();hunting.context.window.PokeMuxGamePreferences={state:()=>({userActivity:0})};
  assert.equal((await vm.runInNewContext(MarketTravel.script('c1',result.returnHunt,true),hunting.context)).reason,'changed');assert.equal(hunting.calls.length,0,'automatic recovery never sends an active hunt to Shopping');
  const interrupted=game({closed:true});let activity=0;interrupted.context.window.PokeMuxGamePreferences={state:()=>({userActivity:activity})};interrupted.context.setTimeout=fn=>{activity++;fn();return 1;};
  assert.equal((await interrupted.run()).reason,'user-control');assert.equal(interrupted.calls.length,0,'manual input during map loading cancels delayed navigation');
  console.log('Market travel: native map, market NPC, exact return, account isolation, offline, HP, rejected travel and auth guards passed.');
})().catch(error=>{console.error(error);process.exitCode=1;});
