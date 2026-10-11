const assert = require('node:assert/strict');
const vm = require('node:vm');
const M = require('../src/domain/global-market');

async function run() {
  assert.deepEqual(M.query({ category: '../../action' }), { category: 'All' });
  assert.deepEqual(M.query({ browse: 'species', action: 'buy' }), { browse: 'species' });
  const query = M.query({ browse: 'pokemon', page: -3, sort: 'price-asc', shiny: true, q: 'Abra & shiny', type: 'PSYCHIC', ivMin: 130, lvMax: 50, qMin: '1,5', gradesOff: ['Fraca', 'Fraca', 'invalid'], action: 'buy' });
  assert.deepEqual(query, { browse: 'pokemon', page: '1', sort: 'price-asc', q: 'Abra & shiny', shiny: '1', type: 'PSYCHIC', gradesOff: 'Fraca', ivMin: '130', lvMax: '50', qMin: '1.5' });
  assert.equal(M.query({ browse: 'pokemon', speciesId: 63, q: 'Abra' }).q, undefined);
  const chain = [{ speciesId: 63, evolvesToId: 64 }, { speciesId: 64, evolvesToId: 65 }, { speciesId: 65, evolvesToId: 0 }, { speciesId: 10063, evolvesToId: 10064 }, { speciesId: 10064 }];
  assert.deepEqual(M.evolutionIds(63, chain), [63, 64, 65]);
  assert.deepEqual(M.evolutionIds(64, chain), [63, 64, 65]);
  assert.deepEqual(M.evolutionIds(10063, chain), [10063, 10064]);
  assert.deepEqual(M.evolutionIds(65, chain), [63, 64, 65]);
  const starters = [{ speciesId: 1, evolvesToId: 2 }, { speciesId: 2, evolvesToId: 3 }, { speciesId: 3 }];
  assert.deepEqual(M.evolutionIds(3, starters), [1, 2, 3]);
  assert.deepEqual(M.evolutionIds(2, starters), [1, 2, 3]);
  assert.deepEqual(M.evolutionIds(26, [{ speciesId: 172, evolvesToId: 25 }, { speciesId: 25, evolvesToId: 26 }, { speciesId: 26 }]), [172, 25, 26]);
  assert.deepEqual(M.evolutionIds(63, [{ speciesId: 63, evolvesToId: 64 }, { speciesId: 64, evolvesToId: 63 }]), [63, 64]);
  assert.deepEqual(M.evolutionIds(0, chain), []);
  const larvitarFamily = [{ speciesId: 246, name: 'Larvitar', evolvesToId: 247 }, { speciesId: 247, name: 'Pupitar', evolvesToId: 248 }, { speciesId: 248, name: 'Tyranitar' }, { speciesId: 63, name: 'Abra' }];
  const familyOptions = { q: ' PUPITAR ', includeEvolutions: true, shiny: true, ivMin: 150, lvMax: 50, qMin: 1.5, type: 'ROCK', gradesOff: ['Lendária'], sort: 'price-asc' };
  const familyRows = larvitarFamily.map((x,i) => ({ ...x, id: String(x.speciesId), kind: 'pokemon', shiny: true, ivTotal: 170, level: 30, quality: 1.5, type1: 'ROCK', currency: 'GOLD', price: (i+1)*10000 }));
  const excludedRows = [
    { ...familyRows[0], id: 'low-iv', ivTotal: 100 }, { ...familyRows[0], id: 'high-level', level: 60 },
    { ...familyRows[0], id: 'low-quality', quality: 1 }, { ...familyRows[0], id: 'normal', shiny: false },
    { ...familyRows[0], id: 'wrong-type', type1: 'FIRE' }, { ...familyRows[0], id: 'excluded-grade', quality: 1.7 }
  ];
  const familySnapshot = { data: { cid: 'trainer1' }, rate: 10000, listings: [...familyRows, ...excludedRows] };
  assert.deepEqual(M.snapshotPage(familySnapshot, familyOptions, larvitarFamily).data.listings.map(x => x.name), ['Larvitar', 'Pupitar', 'Tyranitar']);
  assert.deepEqual(M.snapshotPage(familySnapshot, { ...familyOptions, includeEvolutions: false }, larvitarFamily).data.listings.map(x => x.name), ['Pupitar']);
  assert.equal(M.snapshotPage(familySnapshot, { q: 'Missing', includeEvolutions: true }, larvitarFamily).data.total, 0);
  assert.equal(M.snapshotPage(familySnapshot, { q: '', includeEvolutions: true }, larvitarFamily).data.total, familySnapshot.listings.length);
  const familyCalls = [];
  const familyRead = async script => {
    const params = JSON.parse(script.match(/\}\)\((\{[^\n]*?\}),/)[1]); familyCalls.push(params);
    assert.equal(params.q, undefined, 'the original name must not exclude evolutions');
    assert.equal(params.ivMin, '150'); assert.equal(params.lvMax, '50'); assert.equal(params.qMin, '1.5');
    assert.equal(params.shiny, '1'); assert.equal(params.type, 'ROCK'); assert.equal(params.gradesOff, 'Lendária');
    const listings = familyRows.filter(x => x.speciesId === Number(params.speciesId) && (!params.currency || x.currency === params.currency));
    return { ok: true, data: { cid: 'trainer1', listings, total: listings.length, pages: 1 } };
  };
  for (const read of [M.readPokemonGroup, M.readPriceBook, M.readPricePage]) {
    familyCalls.length = 0;
    const response = await read(familyRead, familyOptions, 'trainer1', larvitarFamily, 10000);
    assert.equal(response.ok, true);
    assert.deepEqual(response.data.listings.map(x => x.name), ['Larvitar', 'Pupitar', 'Tyranitar']);
    assert.deepEqual([...new Set(familyCalls.map(x => Number(x.speciesId)))], [246, 247, 248]);
  }
  assert.equal(M.safeIcon('https://evil.example/assets/test.png'), '');
  assert.equal(M.safeIcon('/assets/items/potion.png'), 'https://poke.idleworld.online/assets/items/potion.png');
  const safe = M.sanitizeResponse({ token: 'secret', listings: [{ id: 'a', name: 'Abra', auth: 'secret', stats: { hp: 20, token: 'secret' } }], species: [{ speciesId: 63, shiny: 14 }] });
  assert.equal(JSON.stringify(safe).includes('secret'), false);
  assert.equal(safe.species[0].shiny, 14);
  assert.equal(M.sanitizeResponse(safe).species[0].shiny, 14);
  const list = [{ id: 'a', kind: 'pokemon', name: 'Éevee', quality: 1.5, shiny: true, ivTotal: 170, level: 30, type1: 'NORMAL', price: 200 }, { id: 'b', kind: 'pokemon', name: 'Eevee', quality: 1, shiny: false, ivTotal: 80, level: 2, price: 100 }];
  assert.deepEqual(M.filterListings(list, { pokemonOnly: true, q: 'eevee', shiny: true, ivMin: 150, type: 'NORMAL' }).map(x => x.id), ['a']);
  assert.deepEqual(M.filterListings(list, { pokemonOnly: true, gradesOff: ['Épica'] }).map(x => x.id), ['b']);
  assert.deepEqual(M.filterListings(list, { sort: 'price-asc' }).map(x => x.id), ['b', 'a']);
  assert.equal(list[0].id, 'a');
  const mixed = [
    {id:'diamond',currency:'DIAMONDS',price:2},
    {id:'dollar-cheap',currency:'GOLD',price:5000},
    {id:'dollar-expensive',currency:'GOLD',price:30000},
    {id:'proposal',currency:'GOLD',price:0,offerOnly:true},
    {id:'unknown',currency:'UNKNOWN',price:1}
  ];
  assert.equal(M.diamondRate([{kind:'diamonds',currency:'GOLD',price:10000,quantity:2},{kind:'diamonds',currency:'GOLD',price:1,quantity:0}]),10000);
  assert.equal(M.diamondRate([{kind:'diamonds',currency:'GOLD',price:1,offerOnly:true}]),null);
  assert.equal(M.equivalentDiamonds(mixed[1],10000),.5);
  assert.equal(M.equivalentDiamonds(mixed[1],0),null);
  assert.equal(M.equivalentDiamonds({price:NaN,currency:'GOLD'},10000),null);
  assert.deepEqual(M.filterListings(mixed,{sort:'price-asc',diamondRate:10000}).map(x=>x.id),['dollar-cheap','diamond','dollar-expensive','proposal','unknown']);
  assert.deepEqual(M.filterListings(mixed,{sort:'price-desc',diamondRate:10000}).map(x=>x.id),['dollar-expensive','diamond','dollar-cheap','proposal','unknown']);
  assert.deepEqual(M.sortPrices([{currency:'GOLD',price:15000},{currency:'DIAMONDS',price:1.5}],'price-asc',10000).map(x=>x.currency),['GOLD','DIAMONDS'],'equivalências empatadas preservam a ordem');
  assert.deepEqual(M.sortPrices(mixed,'price-asc',null),mixed,'sem cotação não inventa uma taxa');
  const own = { kind: 'pokemon', speciesId: 63, shiny: false, level: 30, ivTotal: 100, quality: 1.5 };
  const offers = [
    { ...own, id: 'near', level: 35, price: 200, currency: 'GOLD' },
    { ...own, id: 'cheap', price: 100, currency: 'GOLD' },
    { ...own, id: 'diamond', price: 3, currency: 'DIAMONDS' },
    { ...own, id: 'offer', price: 0, offerOnly: true, currency: 'GOLD' },
    { ...own, id: 'shiny', shiny: true, price: 1, currency: 'GOLD' },
    { ...own, id: 'form', speciesId: 10063, price: 1, currency: 'GOLD' },
    { ...own, id: 'different', ivTotal: 150, price: 300, currency: 'GOLD' },
    { ...own, id: 'unknown', quality: null, price: 400, currency: 'GOLD' }
  ];
  assert.deepEqual(M.comparable(offers, own).map(x => x.id), ['near', 'cheap', 'diamond', 'offer']);
  assert.equal(M.comparable(offers, own, { iv: 0, lv: 0, q: 0 }).length, 3);
  assert.deepEqual(M.comparable(offers, own, { broad: true }).map(x => x.id), ['near', 'cheap', 'diamond', 'offer', 'different', 'unknown']);
  const summary = M.priceSummary(M.comparable(offers, own));
  assert.deepEqual(summary.GOLD, { count: 2, min: 100, max: 200, median: 150 });
  assert.equal(summary.DIAMONDS.median, 3);
  assert.equal(M.priceSummary([]).GOLD.min, null);
  const highlights = M.marketHighlights([
    { kind: 'diamonds', currency: 'GOLD', price: 15000, quantity: 5 },
    { kind: 'diamonds', currency: 'GOLD', price: 12000, quantity: 1 },
    { kind: 'item', refId: 44417, currency: 'GOLD', price: 8000, quantity: 10 },
    { kind: 'item', refId: 44417, currency: 'DIAMONDS', price: 2, quantity: 1 },
    { kind: 'item', refId: 70000, currency: 'GOLD', price: 6000, quantity: 1 },
    { kind: 'item', refId: 70000, currency: 'GOLD', price: 1, quantity: 0 },
    { kind: 'item', refId: 70000, currency: 'DIAMONDS', price: 1, offerOnly: true },
    { kind: 'pokemon', refId: 44417, currency: 'GOLD', price: 1 }
  ]);
  assert.deepEqual(highlights, { diamond: { gold: 12000, diamonds: null }, pheromone: { gold: 8000, diamonds: 2 }, boss: { gold: 6000, diamonds: null } });
  assert.equal(M.comparable([{ kind: 'ball', refId: 1 }, { kind: 'item', refId: 1 }, { kind: 'item', refId: 2 }], { kind: 'item', refId: 1 }).length, 1);
  assert.equal(M.comparable([{ kind: 'item', refId: null }], { kind: 'item', refId: null }).length, 0);
  const now = Date.parse('2026-10-07T21:00:00Z');
  assert.deepEqual(M.listingTime('2026-10-07T19:30:00Z', now), { timestamp: now - 5400000, minutes: 90 });
  assert.equal(M.listingTime(String((now - 60000) / 1000), now).minutes, 1);
  assert.equal(M.listingTime(String(now - 60000), now).minutes, 1);
  assert.equal(M.listingTime('invalid', now), null);
  assert.equal(M.listingTime('', now), null);
  assert.equal(M.listingTime(now + 3600000, now), null);
  assert.equal(M.sanitizeResponse({ listings: [{ at: '2026-10-07T19:30:00Z' }] }).listings[0].at, '2026-10-07T19:30:00Z');
  let calls = [], payload = { listings: list }, status = 200;
  const P = { auth: 'Bearer private-session', api: { '/api/characters/me': { character: { id: 'trainer1', name: 'Tester', gold: 100 } } }, ws: { inventory: { items: [] } } };
  const context = { window: { __poke: P }, location: { origin: 'https://poke.idleworld.online', pathname: '/play' }, AbortController, URLSearchParams, setTimeout, clearTimeout,
    fetch: async (url, options) => { calls.push({ url, options }); return { ok: status === 200, status, json: async () => payload }; } };
  const read = (options = {}, cid = 'trainer1') => vm.runInNewContext(M.readScript(options, cid), context);
  let result = await read();
  assert.equal(result.ok, true);
  assert.equal(calls[0].options.method, 'GET');
  assert.equal(calls[0].url, '/api/game/market?category=All');
  assert.equal(calls[0].options.headers.Authorization, P.auth);
  assert.equal(JSON.stringify(result).includes(P.auth), false);
  P.api['/game/items.json'] = { items: [{ id: 9, name: 'Potion', token: 'private-inventory' }] };
  P.ws.inventory.items = [{ itemId: 9, quantity: 4 }];
  P.ws.balls = { catalog: [{ id: 1, name: 'Ball' }, { id: 2, name: 'Infinite', infinite: true }], counts: { 1: 3, 2: 100 } };
  P.ws.pokes = { list: [{ id: 'p1', pokeId: 63, name: 'Abra', ivTotal: '100/192', quality: '1,50', level: 30, token: 'private-inventory' }] };
  P.api['/game/creatures.json'] = { creatures: [{ pokeId: 10063, name: 'Regional Abra', evolvesToId: 10064, token: 'private-inventory' }] };
  result = await read({ includeOwned: true, includeAlertCatalog: true });
  assert.equal(result.data.ownedReady, true);
  assert.equal(result.data.owned.length, 3);
  assert.equal(result.data.owned[2].speciesId, 63);
  assert.equal(result.data.owned[2].ivTotal, 100);
  assert.equal(result.data.owned[2].quality, 1.5);
  assert.equal(result.data.alertCatalog[0].speciesId, 10063);
  assert.equal(result.data.alertCatalog[0].evolvesToId, 10064);
  assert.equal(JSON.stringify(result).includes('private-inventory'), false);
  assert.equal(calls[1].url, '/api/game/market?category=All');
  assert.equal((await read({}, 'other-trainer')).reason, 'changed');
  assert.equal(calls.length, 2);
  status = 429; assert.equal((await read()).reason, 'limited');
  status = 200; payload = { emailGate: true }; assert.equal((await read()).reason, 'email');
  payload = {}; assert.equal((await read()).reason, 'server');
  payload = { species: [{ name: 'Abra', speciesId: 63, shiny: 5 }] };
  assert.equal((await read({ browse: 'species' })).data.species[0].shiny, 5);
  context.fetch = async () => { P.api['/api/characters/me'].character.id = 'trainer2'; return { ok: true, json: async () => ({ listings: [] }) }; };
  assert.equal((await read()).reason, 'changed');
  context.location.pathname = '/login'; assert.equal((await read()).reason, 'offline');
  const groupCalls = [];
  const groupRead = async script => {
    const q = JSON.parse(script.match(/\}\)\((\{[^\n]*?\}),/)[1]);
    groupCalls.push(q);
    const start = (Number(q.page) - 1) * 12;
    const listings = Array.from({ length: 24 }, (_, i) => ({ id: q.speciesId + ':' + i, speciesId: Number(q.speciesId), kind: 'pokemon', price: i * 3 + Number(q.speciesId) - 63, at: new Date(Date.now() - (i * 3 + Number(q.speciesId) - 63) * 1000).toISOString() }));
    return { ok: true, data: { cid: 'trainer1', listings: listings.slice(start, start + 12), total: 24, pages: 2 } };
  };
  const firstGroup = await M.readPokemonGroup(groupRead, { speciesId: 63, sort: 'price-asc', page: 1, ivMin: 150, shiny: true }, 'trainer1', chain);
  const secondGroup = await M.readPokemonGroup(groupRead, { speciesId: 63, sort: 'price-asc', page: 2, ivMin: 150, shiny: true }, 'trainer1', chain);
  assert.equal(firstGroup.data.total, 72); assert.equal(firstGroup.data.pages, 6);
  assert.deepEqual(firstGroup.data.listings.map(x => x.price), Array.from({ length: 12 }, (_, i) => i));
  assert.deepEqual(secondGroup.data.listings.map(x => x.price), Array.from({ length: 12 }, (_, i) => i + 12));
  assert.equal(groupCalls.every(x => x.ivMin === '150' && x.shiny === '1'), true);
  assert.equal((await M.readPokemonGroup(async () => ({ ok: false, reason: 'limited' }), { speciesId: 63 }, 'trainer1', chain)).reason, 'limited');
  assert.equal((await M.readPokemonGroup(async () => ({ ok: true, data: { cid: 'other', listings: [] } }), { speciesId: 63 }, 'trainer1', chain)).reason, 'changed');
  let bookCalls = 0;
  const bookRead = async script => {
    const q = JSON.parse(script.match(/\}\)\((\{[^\n]*?\}),/)[1]);
    bookCalls++;
    const page = Number(q.page);
    // O servidor deixa todos os dólares depois dos diamantes.
    const listings = page===1 ? Array.from({length:12},(_,i)=>({id:'dia'+i,currency:'DIAMONDS',price:i+1,kind:'pokemon'}))
      : [{id:'gold-cheapest',currency:'GOLD',price:100,kind:'pokemon'},{id:'gold-expensive',currency:'GOLD',price:500000,kind:'pokemon'}];
    return {ok:true,data:{cid:'trainer1',listings,pages:2,total:14}};
  };
  const book = await M.readPriceBook(bookRead,{speciesId:63,sort:'price-asc',page:1},'trainer1',chain,10000);
  assert.equal(bookCalls,2,'consulta páginas antes de converter');
  assert.equal(book.data.listings[0].id,'gold-cheapest','oferta em dólares da página 2 passa à primeira posição');
  assert.equal(book.data.total,14);
  const cached = await M.readPriceBook(bookRead,{speciesId:63,sort:'price-desc',page:1},'trainer1',chain,10000,book.book);
  assert.equal(bookCalls,2,'troca da ordenação reaproveita a consulta completa');
  assert.equal(cached.data.listings[0].id,'gold-expensive');
  const page2 = await M.readPriceBook(bookRead,{speciesId:63,sort:'price-asc',page:2},'trainer1',chain,10000,book.book);
  assert.deepEqual(page2.data.listings.map(x=>x.id),['dia11','gold-expensive']);
  assert.equal((await M.readPriceBook(async()=>({ok:false,reason:'limited'}),{speciesId:63},'trainer1',chain,10000)).reason,'limited');
  assert.equal((await M.readPriceBook(async()=>({ok:true,data:{cid:'other',listings:[]}}),{speciesId:63},'trainer1',chain,10000)).reason,'changed');
  const failedBook = await M.readPriceBook(async script=> {
    const q=JSON.parse(script.match(/\}\)\((\{[^\n]*?\}),/)[1]);
    return q.page==='2'?{ok:false,reason:'limited'}:bookRead(script);
  },{speciesId:63},'trainer1',chain,10000);
  assert.equal(failedBook.reason,'limited','consulta incompleta não vira ranking global');
  assert.equal(failedBook.book,undefined);
  const evolutionBook = await M.readPriceBook(async script=> {
    const q=JSON.parse(script.match(/\}\)\((\{[^\n]*?\}),/)[1]);
    const result=await bookRead(script);
    result.data.listings=result.data.listings.map(x=>({...x,id:q.speciesId+':'+x.id}));
    return result;
  },{speciesId:63,includeEvolutions:true,sort:'price-asc'},'trainer1',chain,10000);
  assert.equal(evolutionBook.data.total,42,'converte todas as páginas de todas as evoluções');
  assert(evolutionBook.data.listings.slice(0,3).every(x=>x.id.endsWith('gold-cheapest')));
  // A fresh bag can arrive in chunks, with updates between parts.
  context.location.pathname = '/play'; P.api['/api/characters/me'].character.id = 'trainer1';
  context.fetch = async (url, options) => { calls.push({ url, options }); return { ok: true, json: async () => payload }; };
  const listeners = new Set(), sent = [];
  P.sock = { readyState: 1, addEventListener(type, callback) { listeners.add(callback); }, removeEventListener(type, callback) { listeners.delete(callback); },
    send(raw) {
      const type = JSON.parse(raw).type; sent.push(type);
      const emit = event => { for (const callback of [...listeners]) callback({ data: JSON.stringify(event) }); };
      if (type === 'inv-get') emit({ type: 'inventory', items: [{ itemId: 9, quantity: 8 }] });
      if (type === 'balls-get') emit({ type: 'balls', catalog: [{ id: 1, name: 'Ball' }, { id: 2, bound: true }, { id: 3 }], counts: { 1: 5, 2: 4, 3: 2 }, expires: { 3: '2000-01-01' } });
      if (type === 'pokes-get') {
        emit({ type: 'pokes-chunk', gen: 7, seq: 1, total: 2, list: [{ id: 'regional', speciesId: 10063, name: 'Regional Abra', level: 30, quality: 1.5, ivTotal: 170, stats: { spa: 120, spd: 70 } }] });
        emit({ type: 'poke-xp', id: 'regional', level: 31, xp: 123 });
        emit({ type: 'pokes-chunk', gen: 7, seq: 0, total: 2, list: [{ id: 'starter', speciesId: 1, name: 'Bulbasaur', starter: true, level: 10, quality: 1, ivTotal: 100 }] });
      }
    }
  };
  status = 200; payload = { listings: [], catalog: {} };
  result = await read({ includeOwned: true });
  assert.equal(result.data.ownedReady, true);
  assert.deepEqual(sent, ['inv-get', 'balls-get', 'pokes-get']);
  assert.equal(listeners.size, 0, 'snapshot listeners cleaned up');
  const bag = result.data.owned;
  assert.equal(bag.find(x => x.id === 'item:9').quantity, 8);
  assert.equal(bag.find(x => x.id === 'ball:1').quantity, 5);
  assert.equal(bag.some(x => x.id === 'ball:2' || x.id === 'ball:3'), false);
  const regional = bag.find(x => x.id === 'pokemon:regional');
  assert.equal(regional.speciesId, 10063, 'regional form preserved');
  assert.equal(regional.level, 31, 'XP delta preserved during chunk assembly');
  assert.equal(regional.stats.spAtk, 120);
  assert.equal(regional.stats.spDef, 70);
  const snapshotSend = P.sock.send, realTimeout = context.setTimeout;
  P.sock.send = () => {};
  context.setTimeout = (callback, ms) => setTimeout(callback, ms === 2500 ? 0 : ms);
  result = await read({ includeOwned: true });
  assert.equal(result.data.ownedReady, false, 'missing snapshots are not presented as fresh inventory');
  assert.equal(listeners.size, 0, 'snapshot timeout removes listener');
  context.setTimeout = realTimeout;
  P.sock.send = raw => { snapshotSend(raw); if (JSON.parse(raw).type === 'pokes-get') P.api['/api/characters/me'].character.id = 'trainer2'; };
  assert.equal((await read({ includeOwned: true })).reason, 'changed', 'character change during bag refresh rejected');
  assert.equal(listeners.size, 0);
  P.api['/api/characters/me'].character.id = 'trainer1';
  delete P.sock;
  delete P.api['/game/items.json'];
  const originalFetch = context.fetch;
  context.fetch = async (url, options) => url === '/game/items.json' ? { ok: true, json: async () => ({ items: [{ id: 9, name: 'Potion', npcPrice: 5 }] }) } : originalFetch(url, options);
  result = await read({ includeOwned: true });
  assert.equal(result.data.owned.find(x => x.id === 'item:9').name, 'Potion', 'uncached item definitions fetched');
  const asset = { kind: 'item', refId: 9, npcPrice: 5 };
  const prices = [{ ...asset, id: 'gold', currency: 'GOLD', price: 10000, quantity: 2 }, { ...asset, id: 'dia', currency: 'DIAMONDS', price: 3 }, { ...asset, id: 'mine', currency: 'GOLD', price: 1 }, { ...asset, id: 'offers', offerOnly: true, currency: 'GOLD', price: 1 }, { ...asset, id: 'empty', currency: 'GOLD', price: 1, quantity: 0 }];
  assert.deepEqual(M.saleRecommendation(prices, asset, {}, 10000, [{ id: 'mine' }]), { GOLD: 20000, DIAMONDS: 2, count: 2, converted: true });
  assert.deepEqual(M.saleRecommendation(prices.slice(0,2), asset, {}, null), { GOLD: 10000, DIAMONDS: 3, count: 2, converted: false });
  assert.equal(M.saleRecommendation([{ ...asset, price: 2, currency: 'GOLD' }], asset, {}, null).GOLD, 5, 'NPC price floor');
  assert.equal(M.saleRecommendation([], asset, {}, 10000).count, 0);
  assert.equal(M.saleRecommendation([{ ...own, price: 100, currency: 'GOLD' }], { ...own, ivTotal: null }, {}, 10000).count, 0);
  assert.equal(M.saleRecommendation([{ ...own, price: 100, currency: 'GOLD' }], { ...own, starter: true }, {}, 10000).count, 0);
  let clock = 0, pacedCalls = 0, limited = false;
  const starts = [];
  const paced = M.createMarketReader(async () => {
    pacedCalls++; starts.push(clock);
    return limited ? {ok:false,reason:'limited',retryAfterMs:120000} : {ok:true,data:{}};
  }, {now:()=>clock, wait:async ms=>{clock+=ms;},interval:2000,ttl:300000});
  const pageScript = '"browse":"pokemon":page1';
  await Promise.all([paced(0,pageScript),paced(0,pageScript)]);
  assert.equal(pacedCalls,1,'identical concurrent listing reads coalesce');
  await paced(0,pageScript);
  assert.equal(pacedCalls,1,'received pages reused for five minutes');
  await paced(0,'quote');
  assert.deepEqual(starts,[0,2000],'market requests spaced');
  limited = true;
  await paced(0,'limited');
  const afterLimit = pacedCalls;
  assert.equal((await paced(1,'another-account')).reason,'limited');
  assert.equal(pacedCalls,afterLimit,'cooldown shared with alerts and other accounts');
  assert.equal((await paced(0,pageScript)).ok,true,'cached page remains usable during cooldown');
  clock += 120001; limited = false;
  assert.equal((await paced(0,'resume')).ok,true,'Retry-After elapsed resumes requests');
  assert.equal((await paced(0,'obsolete',()=>false)).reason,'changed');
  assert.equal(pacedCalls,afterLimit+1,'obsolete queued requests do not reach game');
  console.log('ok global-market: filtros, paginação, consulta GET, isolamento de sessão e respostas inválidas');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
