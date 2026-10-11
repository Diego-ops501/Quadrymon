(function (root, factory) {
  const api = factory(typeof module === 'object' && module.exports ? require('./pokemon-state') : root.PokeMuxPokemonState);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PokeMuxGlobalMarket = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (PokemonState) {
  'use strict';

  const CATEGORIES = ['All', 'Items', 'Stones', 'Poke Balls', 'Diamonds', 'Pokemon'];
  const SORTS = ['recent', 'price-asc', 'price-desc', 'iv-desc', 'power-desc', 'level-desc', 'quality-desc'];
  const GRADES = ['Fraca', 'Comum', 'Incomum', 'Rara', 'Épica', 'Lendária', 'Mítica', 'Anciã', 'Divina'];
  const TYPES = ['NORMAL', 'FIRE', 'WATER', 'ELECTRIC', 'GRASS', 'ICE', 'FIGHTING', 'POISON', 'GROUND', 'FLYING', 'PSYCHIC', 'BUG', 'ROCK', 'GHOST', 'DRAGON', 'DARK', 'STEEL', 'FAIRY'];
  const normalized = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const rarity = q => GRADES[q >= 4 ? 8 : q >= 3 ? 7 : q >= 2 ? 6 : q >= 1.7 ? 5 : q >= 1.5 ? 4 : q >= 1.3 ? 3 : q >= 1.1 ? 2 : q >= 1 ? 1 : 0];

  function diamondRate(list) {
    const rates = (list || []).filter(x => x.kind === 'diamonds' && x.currency === 'GOLD' && !x.offerOnly
      && (x.quantity == null || Number(x.quantity) > 0) && x.price != null && Number(x.price) > 0 && Number.isFinite(Number(x.price))).map(x => Number(x.price));
    return rates.length ? Math.min(...rates) : null;
  }

  function equivalentDiamonds(listing, rate) {
    if (!listing || listing.offerOnly || listing.price == null || !(Number(listing.price) > 0) || !Number.isFinite(Number(listing.price))) return null;
    if (listing.currency === 'DIAMONDS') return Number(listing.price);
    if (listing.currency === 'GOLD' && Number(rate) > 0 && Number.isFinite(Number(rate))) {
      const value = Number(listing.price) / Number(rate);
      return Number.isFinite(value) ? value : null;
    }
    return null;
  }

  function sortPrices(list, sort, rate) {
    const ascending = sort !== 'price-desc';
    // Sem cotação, conserva a ordem recebida para moedas diferentes, sem fingir equivalência.
    if (!(Number(rate) > 0) || !Number.isFinite(Number(rate))) {
      const currencies = new Set(list.filter(x => !x.offerOnly && x.price != null).map(x => x.currency || 'GOLD'));
      if (currencies.size > 1) return [...list];
      return [...list].sort((a,b) => {
        const valid = x => !x.offerOnly && x.price != null && Number(x.price) > 0 && Number.isFinite(Number(x.price));
        if (!valid(a) || !valid(b)) return Number(!valid(a)) - Number(!valid(b));
        return (Number(a.price)-Number(b.price)) * (ascending ? 1 : -1);
      });
    }
    return [...list].sort((a,b) => {
      const value = x => x.currency ? equivalentDiamonds(x, rate) : x.price != null && !x.offerOnly && Number(x.price) > 0 ? Number(x.price) : null;
      const av = value(a), bv = value(b);
      if (av == null || bv == null) return Number(av == null) - Number(bv == null);
      return (av - bv) * (ascending ? 1 : -1);
    });
  }

  function query(options = {}) {
    const out = {};
    if (options.browse === 'species') return { browse: 'species' };
    if (options.browse !== 'pokemon') return { category: CATEGORIES.includes(options.category) ? options.category : 'All' };
    out.browse = 'pokemon';
    out.page = String(Math.max(1, Math.min(100000, Math.trunc(Number(options.page)) || 1)));
    out.sort = SORTS.includes(options.sort) ? options.sort : 'recent';
    if (['GOLD','DIAMONDS'].includes(options.currency)) out.currency = options.currency;
    const species = Number(options.speciesId);
    if (Number.isSafeInteger(species) && species > 0 && species < 1000000) out.speciesId = String(species);
    else if (String(options.q || '').trim()) out.q = String(options.q).trim().slice(0, 120);
    if (options.shiny === true || options.shiny === '1') out.shiny = '1';
    if (TYPES.includes(options.type)) out.type = options.type;
    const grades = (Array.isArray(options.gradesOff) ? options.gradesOff : String(options.gradesOff || '').split(',')).filter(g => GRADES.includes(g));
    if (grades.length) out.gradesOff = [...new Set(grades)].join(',');
    for (const key of ['ivMin', 'ivMax', 'lvMin', 'lvMax', 'qMin', 'qMax']) {
      if (options[key] == null || String(options[key]).trim() === '') continue;
      const n = Number(String(options[key]).replace(',', '.'));
      const max = key.startsWith('iv') ? 192 : key.startsWith('lv') ? 100000 : 100;
      if (Number.isFinite(n) && n >= (key.startsWith('lv') ? 1 : 0) && n <= max) out[key] = String(n);
    }
    return out;
  }

  // Self-contained so the same allowlist also runs inside the authenticated game frame.
  function sanitizeResponse(input) {
    const obj = x => x && typeof x === 'object' && !Array.isArray(x) ? x : {};
    const txt = (v, max = 160) => String(v == null ? '' : v).slice(0, max);
    const num = v => Number.isFinite(Number(v)) ? Math.max(0, Number(v)) : 0;
    const arr = (v, max = 12000) => Array.isArray(v) ? v.slice(0, max) : [];
    const entry = value => {
      const x = obj(value), stats = obj(x.stats), out = {};
      for (const key of ['id', 'kind', 'name', 'type1', 'type2', 'currency', 'category', 'targetName', 'at']) out[key] = txt(x[key]);
      out.desc = txt(x.desc, 1200);
      out.icon = txt(x.icon || x.iconUrl, 400);
      for (const key of ['refId', 'speciesId', 'evolvesToId', 'level', 'ivTotal', 'quality', 'power', 'price', 'quantity', 'sellers', 'amount', 'total', 'minGold', 'minDia', 'npcPrice']) out[key] = x[key] == null ? null : num(x[key]);
      out.shiny = !!x.shiny;
      out.bought = !!x.bought;
      out.offer = !!x.offer;
      out.offerOnly = !!x.offerOnly;
      out.hasOffers = !!x.hasOffers;
      out.starter = !!x.starter;
      out.team = !!x.team;
      out.stats = Object.fromEntries(['hp', 'atk', 'def', 'spAtk', 'spDef', 'speed'].map(key => [key, stats[key] == null ? null : num(stats[key])]));
      out.tms = arr(x.tms, 24).map(v => txt(typeof v === 'object' && v ? v.name || v.id : v, 80));
      out.ids = arr(x.ids, 2000).map(v => txt(v, 100));
      return out;
    };
    const x = obj(input), catalog = obj(x.catalog), window = obj(x.pkWindow);
    const out = { catalog: {}, pkWindow: { cap: num(window.cap), more: !!window.more },
      total: num(x.total), pages: Math.max(1, num(x.pages)), cid: txt(x.cid, 100), name: txt(x.name, 60),
      gold: num(x.gold), diamonds: num(x.diamonds), isVip: x.isVip === true, emailGate: !!x.emailGate };
    for (const key of ['listings', 'mine', 'requests', 'myRequests', 'history', 'species', 'owned', 'alertCatalog']) out[key] = arr(x[key]).map(entry);
    out.ownedReady = x.ownedReady === true;
    out.species = arr(x.species).map(value => ({ ...entry(value), shiny: num(obj(value).shiny) }));
    for (const key of ['items', 'balls']) out.catalog[key] = arr(catalog[key], 2000).map(entry);
    out.catalog.diamonds = catalog.diamonds ? entry(catalog.diamonds) : null;
    return out;
  }

  function filterListings(list, filters = {}) {
    const needle = normalized(filters.q).trim();
    const off = Array.isArray(filters.gradesOff) ? filters.gradesOff : [];
    const result = (Array.isArray(list) ? list : []).filter(x => {
      if (needle && !normalized(x.name).includes(needle)) return false;
      if (filters.pokemonOnly && x.kind !== 'pokemon') return false;
      if (!filters.pokemonOnly) return true;
      if (filters.shiny && !x.shiny) return false;
      if (filters.type && filters.type !== x.type1 && filters.type !== x.type2) return false;
      if (off.includes(rarity(Number(x.quality)))) return false;
      return [['ivTotal', 'ivMin', 'ivMax'], ['level', 'lvMin', 'lvMax'], ['quality', 'qMin', 'qMax']].every(([field, min, max]) => {
        const value = Number(x[field]) || 0;
        return (filters[min] == null || filters[min] === '' || value >= Number(filters[min]))
          && (filters[max] == null || filters[max] === '' || value <= Number(filters[max]));
      });
    });
    const field = { 'price-asc': 'price', 'price-desc': 'price', 'iv-desc': 'ivTotal', 'power-desc': 'power', 'level-desc': 'level', 'quality-desc': 'quality' }[filters.sort];
    if (field === 'price') return sortPrices(result, filters.sort, filters.diamondRate);
    if (field) result.sort((a, b) => ((Number(a[field]) || 0) - (Number(b[field]) || 0)) * -1);
    return result;
  }

  function safeIcon(value) {
    try {
      let v = String(value || '');
      if (!v) return '';
      if (!v.startsWith('/') && !/^https?:/i.test(v)) v = '/assets/items/' + v;
      const u = new URL(v, 'https://poke.idleworld.online');
      if (u.protocol !== 'https:' || u.origin !== 'https://poke.idleworld.online' || !u.pathname.startsWith('/assets/') || /["'<>\\]/.test(v)) return '';
      return u.href;
    } catch { return ''; }
  }

  function listingTime(value, now = Date.now()) {
    if (value == null || String(value).trim() === '') return null;
    const raw = String(value).trim();
    const numeric = /^\d{10,13}$/.test(raw) ? Number(raw) : NaN;
    const timestamp = Number.isFinite(numeric) ? numeric < 1e12 ? numeric * 1000 : numeric : Date.parse(raw);
    if (!Number.isFinite(timestamp) || timestamp <= 0 || timestamp > now + 60000) return null;
    return { timestamp, minutes: Math.max(0, Math.floor((now - timestamp) / 60000)) };
  }

  function comparisonFilters(owned, tolerance = {}) {
    const out = { browse: 'pokemon', speciesId: owned.speciesId, shiny: !!owned.shiny, sort: 'price-asc' };
    if (tolerance.broad) return out;
    if (owned.quality != null) out.gradesOff = GRADES.filter(grade => grade !== rarity(Number(owned.quality)));
    for (const [field, prefix, fallback, max] of [['ivTotal', 'iv', 10, 192], ['level', 'lv', 10, 100000], ['quality', 'q', .1, 100]]) {
      if (owned[field] == null || !Number.isFinite(Number(owned[field]))) continue;
      const delta = Number.isFinite(Number(tolerance[prefix])) ? Math.max(0, Math.min(max, Number(tolerance[prefix]))) : fallback;
      out[prefix + 'Min'] = +Math.max(prefix === 'lv' ? 1 : 0, Number(owned[field]) - delta).toFixed(2);
      out[prefix + 'Max'] = +Math.min(max, Number(owned[field]) + delta).toFixed(2);
    }
    return out;
  }

  function evolutionIds(speciesId, catalog = []) {
    const id = Number(speciesId);
    if (!Number.isSafeInteger(id) || id <= 0 || id >= 1000000) return [];
    const definitions = new Map(catalog.filter(x => Number.isSafeInteger(Number(x.speciesId)) && Number(x.speciesId) > 0 && Number(x.speciesId) < 1000000).map(x => [Number(x.speciesId), x]));
    const links = new Map(), successors = new Map();
    for (const [source, definition] of definitions) {
      const dest = Number(definition.evolvesToId);
      if (!Number.isSafeInteger(dest) || dest <= 0 || !definitions.has(dest)) continue;
      successors.set(source, dest);
      for (const [a, b] of [[source, dest], [dest, source]]) {
        if (!links.has(a)) links.set(a, []);
        links.get(a).push(b);
      }
    }
    const family = new Set(), pending = [id];
    while (pending.length && family.size < 64) {
      const current = pending.shift();
      if (family.has(current)) continue;
      family.add(current); pending.push(...(links.get(current) || []));
    }
    // Put pre-evolutions first, even when their Pokédex number is higher.
    const incoming = new Map([...family].map(x => [x, 0]));
    for (const source of family) if (family.has(successors.get(source))) incoming.set(successors.get(source), incoming.get(successors.get(source)) + 1);
    const ready = [...family].filter(x => !incoming.get(x)).sort((a, b) => a - b), result = [];
    while (ready.length) {
      const current = ready.shift(); result.push(current);
      const dest = successors.get(current);
      if (family.has(dest)) { incoming.set(dest, incoming.get(dest) - 1); if (!incoming.get(dest)) ready.push(dest); }
    }
    return [...result, ...[...family].filter(x => !result.includes(x)).sort((a, b) => a - b)];
  }

  function pokemonSearch(options, catalog = []) {
    if (!options.includeEvolutions) return options;
    const needle = normalized(options.q).trim();
    const selected = Number(options.speciesId) > 0 ? [Number(options.speciesId)]
      : needle ? catalog.filter(x => normalized(x.name).includes(needle)).map(x => x.speciesId) : [];
    const speciesIds = [...new Set(selected.flatMap(id => evolutionIds(id, catalog)))];
    // Replace the name constraint with the family IDs so related names survive filtering.
    return speciesIds.length ? { ...options, q: '', speciesIds } : options;
  }

  // The game accepts one species per query. Merge sorted prefixes to make one
  // complete page across the selected species and its full evolution family.
  async function readPokemonGroup(read, options, expectedCid, catalog) {
    options = pokemonSearch({ ...options, includeEvolutions: true }, catalog);
    const ids = options.speciesIds || [];
    if (!ids.length) return read(readScript(options, expectedCid));
    if (ids.length === 1) return read(readScript({ ...options, speciesId: ids[0] }, expectedCid));
    const page = Number(query({ ...options, browse: 'pokemon' }).page), size = 12;
    const groups = [];
    for (const speciesId of ids) {
      const rows = []; let first;
      for (let p = 1; p <= page; p++) {
        const response = await read(readScript({ ...options, browse: 'pokemon', speciesId, page: p }, expectedCid));
        if (!response || !response.ok) return response || { ok: false, reason: 'network' };
        const data = sanitizeResponse(response.data);
        if (data.cid !== String(expectedCid)) return { ok: false, reason: 'changed' };
        if (!first) first = data;
        rows.push(...data.listings);
        if (p >= data.pages) break;
      }
      groups.push({ data: first, rows });
    }
    const sort = options.sort, field = { 'price-asc': 'price', 'price-desc': 'price', 'iv-desc': 'ivTotal', 'power-desc': 'power', 'level-desc': 'level', 'quality-desc': 'quality' }[sort];
    const rows = groups.flatMap(x => x.rows).sort((a, b) => {
      const delta = field ? (Number(a[field]) - Number(b[field])) * (sort === 'price-asc' ? 1 : -1)
        : (listingTime(b.at)?.timestamp || 0) - (listingTime(a.at)?.timestamp || 0);
      // Stable ties retain each species' server order across page boundaries.
      return delta || 0;
    });
    const total = groups.reduce((sum, x) => sum + x.data.total, 0);
    return { ok: true, data: { ...groups[0].data, listings: rows.slice((page - 1) * size, page * size), total, pages: Math.max(1, Math.ceil(total / size)) } };
  }

  // A API pagina preços separados por moeda. É necessário consultar todas as páginas
  // da busca antes de converter e recortar a página local; ordenar só 12 anúncios é incorreto.
  function createMarketReader(read, options = {}) {
    const now = options.now || Date.now, wait = options.wait || (ms => new Promise(resolve => setTimeout(resolve, ms)));
    const interval = options.interval ?? 2000, ttl = options.ttl ?? 300000;
    const cache = new Map(), pending = new Map();
    let next = 0, blockedUntil = 0, running = false;
    const jobs = [];
    async function drain() {
      if (running) return;
      running = true;
      try {
        while (jobs.length) {
          jobs.sort((a,b)=>b.priority-a.priority);
          const job = jobs.shift();
          try {
            let response;
            if (!job.valid()) response = {ok:false,reason:'changed'};
            else if (now() < blockedUntil) response = {ok:false,reason:'limited',retryAfterMs:blockedUntil-now()};
            else {
              if (next > now()) await wait(next-now());
              if (!job.valid()) response = {ok:false,reason:'changed'};
              else {
                next = now()+interval;
                response = await read(job.account,job.script);
                if (response?.reason === 'limited') blockedUntil = now()+Math.max(60000,Number(response.retryAfterMs)||60000);
                if (response?.ok && job.script.includes('"browse":"pokemon"')) {
                  cache.set(job.key,{at:now(),response});
                  if (cache.size>256) cache.delete(cache.keys().next().value);
                }
              }
            }
            job.resolve(response);
          } catch (error) { job.reject(error); }
        }
      } finally { running = false; }
    }
    const reader = function(account,script,valid=()=>true,priority=10) {
      const key = account+':'+script, cached=cache.get(key);
      if (valid() && cached && now()-cached.at<ttl) return Promise.resolve(cached.response);
      if (pending.has(key)) {
        const job=jobs.find(x=>x.key===key); if(job) job.priority=Math.max(job.priority,priority);
        return pending.get(key).then(result=>valid()?result:{ok:false,reason:'changed'});
      }
      let resolve,reject;
      const task=new Promise((yes,no)=>{resolve=yes;reject=no;});
      pending.set(key,task);
      jobs.push({account,script,valid,priority,key,resolve,reject});
      task.finally(()=>{if(pending.get(key)===task)pending.delete(key);}).catch(()=>{});
      void drain();
      return task;
    };
    reader.clearPages = account => {
      for (const key of cache.keys()) if (key.startsWith(account + ':')) cache.delete(key);
    };
    return reader;
  }

  function createSnapshotCache(read, options = {}) {
    const snapshots = new Map(), jobs = new Map();
    const now = options.now || Date.now;
    let stopped = false;
    const keyOf = (account,cid) => account + ':' + String(cid);
    for (const entry of options.initial?.version === 1 && Array.isArray(options.initial.entries) ? options.initial.entries.slice(0,4) : []) {
      const raw = entry?.snapshot, account = Number(entry?.account);
      if (!raw || !Number.isInteger(account) || account < 0 || account > 3 || !(raw.at > 0) || raw.at > now()) continue;
      const data = sanitizeResponse(raw.data);
      if (!data.cid || data.cid !== raw.cid || !Array.isArray(raw.listings)) continue;
      snapshots.set(keyOf(account,data.cid),{cid:data.cid,at:raw.at,data,listings:sanitizeResponse({listings:raw.listings}).listings,rate:diamondRate(data.listings)});
    }
    function get(account,cid) { return snapshots.get(keyOf(account,cid)) || null; }
    function ensure(account,cid,force = false,onProgress) {
      const key = keyOf(account,cid), cached = get(account,cid);
      if (jobs.has(key)) return jobs.get(key);
      // Reopening cannot trigger repeated full scans within the same minute.
      if (cached && now()-cached.at < (force ? 60000 : 300000)) return Promise.resolve({ok:true,snapshot:cached});
      const task = (async () => {
        const valid = () => !stopped;
        const quote = await read(account,readScript({category:'All',includeAlertCatalog:true},cid),valid);
        if (!quote?.ok) return quote || {ok:false,reason:'network'};
        const data = sanitizeResponse(quote.data);
        if (!cid || data.cid !== String(cid)) return {ok:false,reason:'changed'};
        // A reconciliation must really read the server, so removed listings disappear.
        if (cached) read.clearPages?.(account);
        const response = await readPriceBook(script=>read(account,script,valid), {sort:'recent',onProgress},cid,[],diamondRate(data.listings));
        if (!response?.ok || stopped) return response?.ok ? {ok:false,reason:'changed'} : response;
        const snapshot = {cid:String(cid),at:now(),data,listings:response.book.listings,rate:diamondRate(data.listings)};
        // Replace the whole snapshot only after every page succeeds. Never merge stale IDs.
        snapshots.set(key,snapshot);
        for (const oldKey of snapshots.keys()) if (oldKey.startsWith(account+':') && oldKey!==key) snapshots.delete(oldKey);
        if (options.save) try {
          const entries = [...snapshots.entries()].map(([key,snapshot])=>({account:Number(key.split(':')[0]),snapshot})).sort((a,b)=>b.snapshot.at-a.snapshot.at);
          while (entries.length && JSON.stringify({version:1,entries}).length > 2000000) entries.pop();
          options.save({version:1,entries});
        } catch {}
        return {ok:true,snapshot};
      })().catch(()=>({ok:false,reason:'network'}));
      jobs.set(key,task);
      task.finally(()=>{if(jobs.get(key)===task)jobs.delete(key);}).catch(()=>{});
      return task;
    }
    return {get,ensure,stop:()=>{stopped=true;}};
  }

  function snapshotPage(snapshot, options = {}, catalog = []) {
    options = pokemonSearch(options, catalog);
    let list = snapshot.listings;
    if (options.speciesIds || Number(options.speciesId)>0) {
      const ids = options.speciesIds || [Number(options.speciesId)];
      list = list.filter(x=>ids.includes(Number(x.speciesId)));
    }
    list = filterListings(list,{...options,pokemonOnly:true,diamondRate:snapshot.rate});
    const pages = Math.max(1,Math.ceil(list.length/12));
    const page = Math.max(1,Math.min(pages,Math.trunc(Number(options.page))||1));
    return {ok:true,data:{...snapshot.data,listings:list.slice((page-1)*12,page*12),total:list.length,pages},snapshot};
  }

  async function readPriceBook(read, options, expectedCid, catalog, rate, cache) {
    options = pokemonSearch(options, catalog);
    const ids = options.speciesIds || [options.speciesId];
    const params = query({ ...options, browse:'pokemon', page:1, sort:'recent' });
    const key = JSON.stringify([String(expectedCid), params, ids]);
    let book = cache && cache.key === key && Date.now() - (cache.at || 0) < 300000 ? cache : null;
    if (!book) {
      const all = []; let first;
      for (const speciesId of ids) {
        let pages = 1;
        for (let page = 1; page <= pages; page++) {
          const response = await read(readScript({ ...options, browse:'pokemon', speciesId, page, sort:'recent' }, expectedCid));
          if (!response || !response.ok) return response || {ok:false,reason:'network'};
          const data = sanitizeResponse(response.data);
          if (data.cid !== String(expectedCid)) return {ok:false,reason:'changed'};
          first ||= data; pages = Math.max(1, Math.ceil(data.pages));
          if (pages > 100000) return {ok:false,reason:'server'};
          all.push(...data.listings);
          options.onProgress?.(page, pages);
        }
      }
      book = {key,at:Date.now(),data:first,listings:[...new Map(all.map(x=>[x.id,x])).values()]};
    }
    const listings = sortPrices(book.listings, options.sort, rate), size = 12;
    const pages = Math.max(1,Math.ceil(listings.length/size));
    // params.page é sempre 1 (chave do cache); a página solicitada é local.
    const requested = Math.max(1,Math.min(pages,Math.trunc(Number(options.page)) || 1));
    return {ok:true,book,data:{...book.data,listings:listings.slice((requested-1)*size,requested*size),total:listings.length,pages}};
  }

  async function readComparisonBook(read, owned, tolerance, cid, rate) {
    const filters = comparisonFilters(owned, tolerance);
    const response = await readPriceBook(read, filters, cid, [], rate);
    return response;
  }

  // Each currency is ordered by the server. A merge of their frontiers needs only
  // enough pages to establish the requested global page, rather than the whole market.
  async function readPricePage(read, options, expectedCid, catalog, rate, cache) {
    if (!(rate > 0)) return {ok:false,reason:'server'};
    options = pokemonSearch(options, catalog);
    const ids = options.speciesIds || [options.speciesId];
    const params = query({...options,browse:'pokemon',page:1});
    const key = JSON.stringify(['price-page',String(expectedCid),params,ids,Number(rate)]);
    let book = cache?.key === key && Date.now()-cache.at < 300000 ? cache : null;
    if (!book) book = {key,at:Date.now(),listings:[],deferred:[],seen:[],total:0,data:null,streams:ids.flatMap(speciesId=>['GOLD','DIAMONDS'].map(currency=>({speciesId,currency,page:0,pages:1,rows:[],index:0,last:null})))};
    // Work on a copy so a failed next-page query cannot corrupt the displayed cursor.
    book = {...book,listings:[...book.listings],deferred:[...book.deferred],seen:[...book.seen],streams:book.streams.map(x=>({...x,rows:[...x.rows]}))};
    const ascending = options.sort !== 'price-desc', seen = new Set(book.seen);
    async function head(stream) {
      while (stream.index >= stream.rows.length && stream.page < stream.pages) {
        const response = await read(readScript({...options,browse:'pokemon',speciesId:stream.speciesId,currency:stream.currency,page:stream.page+1},expectedCid));
        if (!response?.ok) return response || {ok:false,reason:'network'};
        const data = sanitizeResponse(response.data);
        if (data.cid !== String(expectedCid)) return {ok:false,reason:'changed'};
        if (data.listings.some(x=>x.currency !== stream.currency)) return {ok:false,reason:'server'};
        if (!stream.page) { book.total += data.total; book.data ||= data; }
        stream.page++; stream.pages = Math.max(1,data.pages); stream.rows = []; stream.index = 0;
        for (const row of data.listings) {
          const value = equivalentDiamonds(row,rate);
          if (value == null) { book.deferred.push(row); continue; }
          if (stream.last != null && (ascending ? value < stream.last : value > stream.last)) return {ok:false,reason:'server'};
          stream.last = value; stream.rows.push(row);
        }
      }
      return {ok:true,row:stream.rows[stream.index] || null};
    }
    // First pages establish totals and both currency frontiers.
    for (const stream of book.streams) if (!stream.page) { const response=await head(stream); if(!response.ok)return response; }
    const pages = Math.max(1,Math.ceil(book.total/12));
    const page = Math.max(1,Math.min(pages,Math.trunc(Number(options.page))||1)), target=page*12;
    while (book.listings.length < target) {
      let best = null;
      for (const stream of book.streams) {
        const response=await head(stream); if(!response.ok)return response;
        if (!response.row) continue;
        const value=equivalentDiamonds(response.row,rate);
        if (!best || (ascending ? value < best.value : value > best.value)) best={stream,row:response.row,value};
      }
      if (!best) {
        for (const row of book.deferred) if (!seen.has(row.id)) {seen.add(row.id);book.listings.push(row);}
        book.deferred=[]; break;
      }
      best.stream.index++;
      if (!seen.has(best.row.id)) {seen.add(best.row.id);book.listings.push(best.row);}
    }
    book.seen=[...seen];
    return {ok:true,book,data:{...book.data,listings:book.listings.slice((page-1)*12,page*12),total:book.total,pages}};
  }

  function comparable(list, owned, tolerance = {}) {
    if (!owned) return [];
    const filters = comparisonFilters(owned, tolerance);
    return (list || []).filter(x => {
      if (x.kind !== owned.kind) return false;
      if (x.kind !== 'pokemon') return x.refId != null && owned.refId != null && Number(x.refId) === Number(owned.refId);
      if (!(Number(owned.speciesId) > 0) || Number(x.speciesId) !== Number(owned.speciesId) || !!x.shiny !== !!owned.shiny) return false;
      if (!tolerance.broad && owned.quality != null && (x.quality == null || rarity(Number(x.quality)) !== rarity(Number(owned.quality)))) return false;
      return [['ivTotal', 'iv'], ['level', 'lv'], ['quality', 'q']].every(([field, prefix]) => filters[prefix + 'Min'] == null ||
        (x[field] != null && Number(x[field]) >= filters[prefix + 'Min'] && Number(x[field]) <= filters[prefix + 'Max']));
    });
  }

  function priceSummary(list) {
    const out = {};
    for (const currency of ['GOLD', 'DIAMONDS']) {
      const prices = (list || []).filter(x => x.currency === currency && !x.offerOnly && x.price != null && Number.isFinite(Number(x.price)) && Number(x.price) > 0).map(x => Number(x.price)).sort((a, b) => a - b);
      const mid = Math.floor(prices.length / 2);
      out[currency] = { count: prices.length, min: prices.length ? prices[0] : null, max: prices.length ? prices[prices.length - 1] : null,
        median: prices.length ? prices.length % 2 ? prices[mid] : (prices[mid - 1] + prices[mid]) / 2 : null };
    }
    return out;
  }

  function saleRecommendation(list, owned, tolerance, rate, mine = []) {
    const unavailable = { GOLD: null, DIAMONDS: null, count: 0, converted: false };
    if (!owned || owned.starter || owned.kind === 'pokemon' && ['speciesId', 'level', 'ivTotal', 'quality'].some(key => owned[key] == null)) return unavailable;
    const ownIds = new Set(mine.map(x => x.id));
    const offers = comparable(list, owned, tolerance).filter(x => !ownIds.has(x.id) && !x.offerOnly && x.price > 0
      && Number.isFinite(Number(x.price)) && (x.kind === 'pokemon' || x.quantity == null || x.quantity > 0));
    const median = values => { values.sort((a,b) => a-b); const i = Math.floor(values.length/2); return values.length ? values.length%2 ? values[i] : (values[i-1]+values[i])/2 : null; };
    if (Number(rate) > 0 && Number.isFinite(Number(rate))) {
      const values = offers.map(x => equivalentDiamonds(x, rate)).filter(x => x != null);
      const price = median(values);
      return { GOLD: price == null ? null : Math.max(1, Math.round(price * rate), Number(owned.npcPrice) || 0),
        DIAMONDS: price == null ? null : Math.max(1, Math.ceil(price)), count: values.length, converted: true };
    }
    const summary = priceSummary(offers);
    return { GOLD: summary.GOLD.median == null ? null : Math.max(1, Math.round(summary.GOLD.median), Number(owned.npcPrice) || 0),
      DIAMONDS: summary.DIAMONDS.median == null ? null : Math.max(1, Math.ceil(summary.DIAMONDS.median)), count: summary.GOLD.count + summary.DIAMONDS.count, converted: false };
  }

  function marketHighlights(list) {
    const available = (list || []).filter(x => !x.offerOnly && (x.quantity == null || Number(x.quantity) > 0));
    const minimum = match => {
      const prices = priceSummary(available.filter(match));
      return { gold: prices.GOLD.min, diamonds: prices.DIAMONDS.min };
    };
    return {
      diamond: minimum(x => x.kind === 'diamonds'),
      pheromone: minimum(x => x.kind === 'item' && Number(x.refId) === 44417),
      boss: minimum(x => x.kind === 'item' && Number(x.refId) === 70000)
    };
  }
  function itemPriceSummary(list) {
    const prices = {};
    for (const row of list || []) {
      if (!['item','diamonds'].includes(row.kind) || row.offerOnly || !(Number(row.price)>0) || !Number.isFinite(Number(row.price)) || row.quantity != null && !(Number(row.quantity)>0) || !['GOLD','DIAMONDS'].includes(row.currency)) continue;
      const key = row.kind === 'diamonds' ? 'diamonds' : 'item:'+row.refId;
      if (row.kind === 'item' && (!Number.isSafeInteger(Number(row.refId)) || !(Number(row.refId)>0))) continue;
      const group = prices[key] ||= { GOLD:null, DIAMONDS:null };
      group[row.currency] = group[row.currency] == null ? Number(row.price) : Math.min(group[row.currency],Number(row.price));
    }
    return prices;
  }

  async function readInGame(params, expectedCid, sanitize, includeOwned, includeAlertCatalog, receivePokemon) {
    const P = window.__poke;
    const character = () => P && P.api && P.api['/api/characters/me'] && P.api['/api/characters/me'].character;
    if (location.origin !== 'https://poke.idleworld.online' || location.pathname !== '/play' || !P || !character()) return { ok: false, reason: 'offline' };
    const cid = String(character().id || '');
    if (expectedCid && expectedCid !== cid) return { ok: false, reason: 'changed' };
    if (!P.auth) return { ok: false, reason: 'auth' };
    const abort = new AbortController(), timer = setTimeout(() => abort.abort(), 12000);
    let stopInventory = () => {};
    try {
      // Ask for the same snapshots requested by the game's bag. Listen before sending.
      let freshInventory = true;
      const inventorySnapshot = includeOwned && P.sock && P.sock.readyState === 1 ? new Promise(resolve => {
        const socket = P.sock, seen = new Set(), assembly = { ws: {} };
        let waitTimer;
        const finish = ready => { clearTimeout(waitTimer); socket.removeEventListener('message', onMessage); freshInventory = ready; resolve(); };
        const onMessage = message => {
          try {
            const event = receivePokemon(assembly, JSON.parse(message.data));
            if (!event || !['inventory', 'balls', 'pokes'].includes(event.type)) return;
            if (event.type === 'pokes' && !Array.isArray(event.list) || event.type === 'inventory' && !Array.isArray(event.items)
              || event.type === 'balls' && (!Array.isArray(event.catalog) || !event.counts)) return;
            assembly.ws[event.type] = event; P.ws ||= {}; P.ws[event.type] = event; seen.add(event.type);
            if (seen.size === 3) finish(true);
          } catch {}
        };
        stopInventory = () => finish(false);
        socket.addEventListener('message', onMessage);
        waitTimer = setTimeout(() => finish(false), 2500);
        try { for (const type of ['inv-get', 'balls-get', 'pokes-get']) socket.send(JSON.stringify({ type })); }
        catch { finish(false); }
      }) : Promise.resolve();
      const response = await fetch('/api/game/market?' + new URLSearchParams(params), {
        method: 'GET', credentials: 'same-origin', headers: { Authorization: P.auth }, signal: abort.signal
      });
      if (!response.ok) {
        const retry = response.headers?.get('Retry-After');
        const retryAfterMs = retry ? (Number.isFinite(Number(retry)) ? Number(retry)*1000 : Math.max(0, Date.parse(retry)-Date.now())) : 0;
        return { ok: false, reason: response.status === 401 ? 'auth' : response.status === 403 ? 'denied' : response.status === 429 ? 'limited' : 'server', status: response.status, retryAfterMs };
      }
      const data = await response.json();
      if (!data || typeof data !== 'object' || Array.isArray(data)) return { ok: false, reason: 'server' };
      if (String(character() && character().id || '') !== cid) return { ok: false, reason: 'changed' };
      if (data.emailGate) return { ok: false, reason: 'email' };
      if (data.error) return { ok: false, reason: 'denied' };
      if (!Array.isArray(params.browse === 'species' ? data.species : data.listings)) return { ok: false, reason: 'server' };
      await inventorySnapshot;
      if (String(character() && character().id || '') !== cid) return { ok: false, reason: 'changed' };
      const ch = character();
      let alertCatalog = [];
      if (includeAlertCatalog) {
        try {
          const definitions = P.api['/game/creatures.json'] || await (await fetch('/game/creatures.json', { signal: abort.signal })).json();
          alertCatalog = (definitions.creatures || []).map(x => ({ kind: 'pokemon', name: x.name, speciesId: x.pokeId, evolvesToId: x.evolvesToId }));
        } catch {}
        if (String(character() && character().id || '') !== cid) return { ok: false, reason: 'changed' };
      }
      const owned = [];
      const ws = P.ws || {};
      if (includeOwned) {
        let itemCatalog = P.api['/game/items.json'];
        if (!itemCatalog || !Array.isArray(itemCatalog.items)) {
          try {
            const catalogResponse = await fetch('/game/items.json', { signal: abort.signal });
            if (catalogResponse.ok) { itemCatalog = await catalogResponse.json(); P.api['/game/items.json'] = itemCatalog; }
          } catch {}
        }
        const definitions = new Map(((itemCatalog || {}).items || []).map(x => [Number(x.id), x]));
        const marketItems = new Map(((data.catalog || {}).items || []).map(x => [Number(x.refId), x]));
        for (const x of (ws.inventory || {}).items || []) {
          const def = marketItems.get(Number(x.itemId)) || definitions.get(Number(x.itemId));
          if (def && Number(x.quantity) > 0 && !x.bound && !def.bound) owned.push({ ...def, id: 'item:' + x.itemId, kind: 'item', refId: x.itemId, quantity: x.quantity });
        }
        for (const x of (ws.balls || {}).catalog || []) {
          const quantity = ((ws.balls || {}).counts || {})[x.id];
          const expires = ((ws.balls || {}).expires || {})[x.id];
          if (Number(quantity) > 0 && !x.infinite && !x.bound && (!expires || Date.parse(expires) > Date.now())) owned.push({ ...x, id: 'ball:' + x.id, kind: 'ball', refId: x.id, quantity });
        }
        const numeric = v => { if (v == null || v === '') return null; const m = String(v).match(/[0-9]+([.,][0-9]+)?/); return m ? Number(m[0].replace(',', '.')) : null; };
        for (const x of (ws.pokes || {}).list || []) owned.push({ ...x, id: 'pokemon:' + x.id, kind: 'pokemon', speciesId: x.speciesId || x.pokeId,
          ivTotal: numeric(x.ivTotal), quality: numeric(x.quality), level: numeric(x.level),
          stats: { hp: x.stats?.hp ?? x.maxHp, atk: x.stats?.atk ?? x.atk, def: x.stats?.def ?? x.def,
            spAtk: x.stats?.spAtk ?? x.stats?.spa ?? x.spAtk ?? x.spa, spDef: x.stats?.spDef ?? x.stats?.spd ?? x.spDef ?? x.spd, speed: x.stats?.speed ?? x.speed } });
        const diamond = (data.catalog || {}).diamonds;
        const balance = (P.api['/api/game/diamonds'] || {}).diamonds ?? ch.diamonds;
        if (diamond && Number(balance) > 0) owned.push({ ...diamond, id: 'diamonds', quantity: balance });
      }
      if (String(character() && character().id || '') !== cid) return { ok: false, reason: 'changed' };
      return { ok: true, data: sanitize({ ...data, cid, name: ch.name, gold: ch.gold,
        owned, alertCatalog, ownedReady: includeOwned && freshInventory && Array.isArray(ws.inventory?.items) && Array.isArray(ws.pokes?.list) && Array.isArray(ws.balls?.catalog) && !!ws.balls?.counts,
        diamonds: (P.api['/api/game/diamonds'] || {}).diamonds ?? ch.diamonds,
        isVip: (P.ws.autohelper || {}).isVip }) };
    } catch (error) { return { ok: false, reason: error && error.name === 'AbortError' ? 'timeout' : 'network' }; }
    finally { stopInventory(); clearTimeout(timer); }
  }

  function readScript(options, expectedCid = '') {
    return '(' + readInGame.toString() + ')(' + JSON.stringify(query(options)) + ','
      + JSON.stringify(String(expectedCid).slice(0, 100)) + ',(' + sanitizeResponse.toString() + '),' + (options && options.includeOwned === true) + ',' + (options && options.includeAlertCatalog === true) + ',(' + PokemonState.receive.toString() + '))';
  }

  async function readIvInGame(pokemon, expectedCid) {
    const P = window.__poke;
    const cid = () => String(P?.api?.['/api/characters/me']?.character?.id || '');
    if (location.origin !== 'https://poke.idleworld.online' || location.pathname !== '/play' || !cid()) return { erro: 'offline', nome: pokemon.name };
    if (cid() !== expectedCid) return { erro: 'changed', nome: pokemon.name };
    if (typeof window.__pgIv?.calc !== 'function') return { erro: 'ivUnavailable', nome: pokemon.name };
    const stats = pokemon.stats;
    if (!(pokemon.speciesId > 0) || !(pokemon.level > 0) || !(pokemon.quality > 0)
      || ['hp', 'atk', 'def', 'spAtk', 'spDef', 'speed'].some(key => stats[key] == null || !Number.isFinite(Number(stats[key])))) {
      return { erro: 'missingConditions', nome: pokemon.name };
    }
    const abort = new AbortController(), timer = setTimeout(() => abort.abort(), 12000);
    try {
      let catalog = P.api['/game/creatures.json'];
      if (!Array.isArray(catalog?.creatures)) {
        const response = await fetch('/game/creatures.json', { signal: abort.signal });
        if (!response.ok) return { erro: 'network', nome: pokemon.name };
        catalog = await response.json(); P.api['/game/creatures.json'] = catalog;
      }
      const species = (catalog.creatures || []).find(x => Number(x.pokeId) === Number(pokemon.speciesId));
      const fields = { hp: 'baseHp', atk: 'baseAtk', def: 'baseDef', spa: 'baseSpAtk', spd: 'baseSpDef', vel: 'baseSpeed' };
      if (!species || Object.values(fields).some(key => species[key] == null || !Number.isFinite(Number(species[key])))) return { erro: 'noSpecies', nome: pokemon.name };
      const bases = Object.fromEntries(Object.entries(fields).map(([key, field]) => [key, Number(species[field])]));
      bases.tipos = [species.type1, species.type2].filter(Boolean);
      const result = await window.__pgIv.calc({ bases, pokemon: {
        nome: (pokemon.shiny ? 'Shiny ' : '') + species.name, nivel: pokemon.level, multiplicadorQualidade: pokemon.quality,
        ivAtual: pokemon.ivTotal, poder: pokemon.power, tms: pokemon.tms,
        hp: stats.hp, atk: stats.atk, def: stats.def, spa: stats.spAtk, spd: stats.spDef, vel: stats.speed
      } });
      if (cid() !== expectedCid) return { erro: 'changed', nome: pokemon.name };
      return result ? { ...result, nome: pokemon.name, shiny: pokemon.shiny, tipos: bases.tipos } : { erro: 'ivUnavailable', nome: pokemon.name };
    } catch { return { erro: 'network', nome: pokemon.name }; }
    finally { clearTimeout(timer); }
  }

  function ivScript(pokemon, expectedCid) {
    const safe = sanitizeResponse({ listings: [pokemon] }).listings[0];
    return '(' + readIvInGame.toString() + ')(' + JSON.stringify(safe) + ',' + JSON.stringify(String(expectedCid).slice(0, 100)) + ')';
  }

  return { CATEGORIES, SORTS, GRADES, TYPES, normalized, rarity, query, sanitizeResponse, filterListings, diamondRate, equivalentDiamonds, sortPrices, createMarketReader, createSnapshotCache, snapshotPage, readPriceBook, readPricePage, readComparisonBook, safeIcon, listingTime, comparisonFilters, comparable, priceSummary, saleRecommendation, marketHighlights, itemPriceSummary, evolutionIds, pokemonSearch, readPokemonGroup, readScript, ivScript };
});
