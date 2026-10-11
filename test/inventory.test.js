const assert = require('node:assert/strict'), vm = require('node:vm');
const I = require('../src/renderer/inventory'), M = require('../src/domain/global-market'), P = require('../src/domain/pokemon-state');
const rows = [{id:'same',name:'Rhydon',kind:'pokemon',iv:175,quality:1.8},{id:'same',name:'Rhydon',kind:'pokemon',iv:129,quality:1.2},{name:'Poção',kind:'item',quantity:3},{name:'Sem IV',kind:'pokemon',iv:null,quality:null}];
assert.equal(I.filterRows(rows,{},M.rarity).length,4);
assert.equal(I.filterRows(rows,{name:'POCAO'},M.rarity)[0].quantity,3);
assert.equal(I.filterRows(rows,{rarity:'Lendária',min:'170',max:'180'},M.rarity)[0].iv,175);
assert.equal(I.filterRows(rows,{min:'0'},M.rarity).length,2);
assert.equal(I.filterRows(rows,{kind:'item',min:'150'},M.rarity).length,0);
const pokes=[{id:'a',name:'Mais Q',quality:1.799,iv:129},{id:'b',name:'Mais IV',quality:1.777,iv:156},{id:'c',name:'Épico',quality:1.6,iv:192},{id:'d',name:'Sem IV',quality:1.8,iv:null},{id:'e',name:'Desconhecido',quality:null,iv:192}];
assert.deepEqual(I.sortRows(pokes,'pokemon',M.rarity,M.GRADES).map(x=>x.id),['b','a','d','c','e']);
assert.equal(pokes[0].id,'a','ordenação não altera os dados da bag');
assert.deepEqual(I.sortRows([{id:'a',npcPrice:10,quantity:500},{id:'b',npcPrice:100,quantity:1},{id:'c',npcPrice:null},{id:'d',npcPrice:0}],'item',M.rarity,M.GRADES).map(x=>x.id),['b','a','d','c']);
const quotes=M.itemPriceSummary([{kind:'item',refId:70000,currency:'GOLD',price:18000000,quantity:3},{kind:'item',refId:70000,currency:'GOLD',price:16000000,quantity:1},{kind:'item',refId:70000,currency:'DIAMONDS',price:7,quantity:4},{kind:'item',refId:70000,currency:'GOLD',price:1,quantity:0},{kind:'item',refId:70000,currency:'DIAMONDS',price:1,offerOnly:true},{kind:'pokemon',refId:70000,currency:'GOLD',price:1},{kind:'item',refId:70000,currency:'GOLD',price:null},{kind:'diamonds',currency:'GOLD',price:2746000}]);
assert.deepEqual(quotes['item:70000'],{GOLD:16000000,DIAMONDS:7});assert.equal(quotes.diamonds.GOLD,2746000);
async function collect(changeCharacter=false) {
  const listeners=new Set(), sent=[], character={id:'one',diamonds:10};
  const ws={inventory:{items:[]},pokes:{list:[]}};
  const socket={readyState:1,addEventListener:(_,fn)=>listeners.add(fn),removeEventListener:(_,fn)=>listeners.delete(fn),send:json=>{
    const type=JSON.parse(json).type;sent.push(type);
    if(type!=='pokes-get')return;
    queueMicrotask(()=>{if(changeCharacter)character.id='two';
      const events=[{type:'inventory',items:[{itemId:5,quantity:4,bound:true}]},{type:'balls',catalog:[{id:1,name:'Infinita',infinite:true}],counts:{1:1}},
        {type:'pokes-chunk',gen:1,seq:1,total:2,list:[{id:'b',name:'Pinsir',speciesId:127,level:1,quality:'1,8',ivTotal:'IV 175',maxHp:100,atk:110,def:90,spa:50,spd:60,speed:70}]},
        {type:'pokes-chunk',gen:1,seq:0,total:2,list:[{id:'a',name:'Rhydon',level:400,quality:1.8,ivTotal:129,team:true}]}];
      for(const event of events)for(const fn of [...listeners])fn({data:JSON.stringify(event)});
    });
  }};
  const context={window:{__poke:{ws,sock:socket,api:{'/api/characters/me':{character},'/game/items.json':{items:[{id:5,name:'Poção',category:'heal'}]}}}},location:{origin:'https://poke.idleworld.online',pathname:'/play'},setTimeout,clearTimeout};
  const result=await vm.runInNewContext('('+I.readInGame.toString()+')('+P.receive.toString()+')',context);
  assert.deepEqual(sent,['inv-get','balls-get','pokes-get']);assert.equal(listeners.size,0);
  return result;
}
(async()=>{const result=await collect();assert.equal(result.complete,true);assert.equal(result.rows.length,5);const pokemon=result.rows.find(x=>x.id==='b');assert.equal(pokemon.iv,175);assert.equal(pokemon.speciesId,127);assert.equal(pokemon.stats.hp,100);assert.equal(pokemon.stats.spAtk,50);assert.equal(pokemon.stats.spDef,60);assert.equal(pokemon.ivTotal,175);assert.equal(result.rows.find(x=>x.id==='item:5').bound,true);assert.equal(result.rows.find(x=>x.kind==='ball').infinite,true);assert.equal((await collect(true)).ok,false);console.log('Inventário: filtros, itens vinculados, bolas infinitas, chunks, atributos para IV e troca de personagem aprovados.');})().catch(e=>{console.error(e);process.exitCode=1;});
