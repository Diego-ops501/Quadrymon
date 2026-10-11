const fs = require('node:fs');
const path = require('node:path');

function createGameCatalog(directory, fetcher = fetch, now = Date.now) {
  const file = path.join(directory, 'game-search-catalog.json');
  let cached = null, job = null;
  const normalize = data => {
    if (!data || data.version !== 1 || !Array.isArray(data.entries)) return null;
    const entries = data.entries.slice(0, 10000).filter(x => x && typeof x.name === 'string' && x.name && ['pokemon','item'].includes(x.kind)).map(x => ({
      kind:x.kind, name:x.name.slice(0,120), speciesId:x.kind === 'pokemon' ? Number(x.speciesId) : undefined,
      refId:x.kind === 'item' ? Number(x.refId) : undefined, category:String(x.category || '').slice(0,40), icon:String(x.icon || '').slice(0,200)
    })).filter(x => Number.isSafeInteger(x.speciesId || x.refId) && (x.speciesId || x.refId) > 0);
    return entries.length ? {version:1,at:Number(data.at) || 0,entries} : null;
  };
  try { cached = normalize(JSON.parse(fs.readFileSync(file, 'utf8'))); } catch {}
  async function refresh() {
    if (job) return job;
    job = (async () => {
      try {
        const [creatures, items] = await Promise.all(['creatures','items'].map(async name => {
          const response = await fetcher('https://poke.idleworld.online/game/'+name+'.json', {signal:AbortSignal.timeout(15000)});
          if (!response.ok) throw Error('catalog unavailable');
          const text = await response.text(); if (text.length > 12000000) throw Error('catalog too large');
          const data = JSON.parse(text); if (!Array.isArray(data[name]) || !data[name].length) throw Error('catalog incomplete');
          return data[name];
        }));
        const data = normalize({version:1,at:now(),entries:[
          ...creatures.map(x=>({kind:'pokemon',speciesId:x.pokeId,name:x.name})),
          ...items.map(x=>({kind:'item',refId:x.id,name:x.name,icon:x.icon,category:x.category}))
        ]});
        if (data) {
          cached = data;
          try { fs.mkdirSync(directory,{recursive:true}); fs.writeFileSync(file+'.tmp', JSON.stringify(data)); fs.renameSync(file+'.tmp',file); } catch {}
        }
      } catch {}
      return cached;
    })().finally(()=>{job=null;});
    return job;
  }
  function load() {
    if (cached) { if (now()-cached.at > 86400000) void refresh(); return Promise.resolve(cached); }
    return refresh();
  }
  return {load};
}
module.exports = {createGameCatalog};
