const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const {createGameCatalog} = require('../src/main/game-catalog');
(async()=>{
  const dir = fs.mkdtempSync(path.join(os.tmpdir(),'pokemux-game-catalog-'));
  try {
    let calls = 0;
    const fetcher = async url => {
      calls++;assert.match(url,/^https:\/\/poke\.idleworld\.online\/game\/(creatures|items)\.json$/);
      return {ok:true,text:async()=>JSON.stringify(url.endsWith('creatures.json') ? {creatures:[{pokeId:714,name:'Noibat'},{pokeId:715,name:'Noivern'}]} : {items:[{id:7,name:'Potion',icon:'potion.png',category:'heal'},{id:8,name:'Fire Stone',category:'stone'}]})};
    };
    const catalog=createGameCatalog(dir,fetcher,()=>100);
    const [a,b]=await Promise.all([catalog.load(),catalog.load()]);
    assert.equal(calls,2,'concurrent requests share the two static catalog reads');assert.deepEqual(a,b);
    assert.equal(a.entries.length,4);assert.equal(a.entries[1].speciesId,715);
    const cached=createGameCatalog(dir,async()=>{throw Error('offline');},()=>200);
    assert.deepEqual(await cached.load(),a,'saved catalog works without network or shop');
    const stale=createGameCatalog(dir,async()=>{throw Error('offline');},()=>90000000);
    assert.deepEqual(await stale.load(),a,'stale catalog remains immediately available while refresh fails');
    console.log('Game catalog: complete static sources, shared fetch, persistent offline cache and stale refresh passed.');
  } finally {
    assert.equal(path.dirname(path.resolve(dir)),path.resolve(os.tmpdir()));
    assert.ok(path.basename(dir).startsWith('pokemux-game-catalog-'));
    fs.rmSync(dir,{recursive:true,force:true});
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
