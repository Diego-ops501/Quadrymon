(function (root) {
  'use strict';
  // Passive observation: never initiates a purchase, breed, hatch or extra socket.
  if (root.QuadrymonBreedingObserver || root.location?.origin !== 'https://poke.idleworld.online' || root.location?.pathname !== '/play') return;
  const D = root.QuadrymonBreedingCost;
  if (!D) return;
  const account = () => String(root.__poke?.api?.['/api/characters/me']?.character?.id || '');
  let cid = account(), events = [], quotes = new Map(), center = null, sequence = 0;
  const storage = 'quadrymon-breeding-events-v1';
  try { const saved = JSON.parse(sessionStorage.getItem(storage)); if (saved?.cid && (!cid || saved.cid === cid) && Array.isArray(saved.events)) { cid = saved.cid; events = saved.events.slice(-300); } } catch {}
  const persist = () => { try { sessionStorage.setItem(storage, JSON.stringify({ cid, events })); } catch {} };
  function sync() { const next = account(); if (!next) return; if (next !== cid) { cid = next; events = []; quotes.clear(); center = null; seenPokemon.clear(); recentPokemon.clear(); marketListings.clear(); persist(); } }
  const emit = event => { if (!event.cid || event.cid !== account()) return; events.push(event); events = events.slice(-300); persist(); };
  const pokes = () => root.__poke?.ws?.pokes?.list || [];
  const seenPokemon = new Set(pokes().map(p => String(p.id))), recentPokemon = new Map(), marketListings = new Map();
  function observeRows(rows) {
    sync();
    for (const raw of rows) {
      const p = D.pokemon(raw); if (!p) continue;
      if (!seenPokemon.has(p.id)) { seenPokemon.add(p.id); recentPokemon.set(p.id, { ...p, at: Date.now() }); }
    }
    for (const [id, p] of recentPokemon) if (Date.now() - p.at > 120000) recentPokemon.delete(id);
    while (recentPokemon.size > 512) recentPokemon.delete(recentPokemon.keys().next().value);
    if (seenPokemon.size > 100000) { seenPokemon.clear(); for (const p of pokes()) seenPokemon.add(String(p.id)); }
  }
  const nativeFetch = root.fetch.bind(root);
  root.fetch = function (resource, options) {
    let url;
    try { url = new URL(typeof resource === 'string' ? resource : resource.url || String(resource), location.href); } catch { return nativeFetch(resource, options); }
    if (url.origin !== location.origin) return nativeFetch(resource, options);
    sync();
    const owner = cid, method = String(options?.method || resource?.method || 'GET').toUpperCase();
    const watched = url.pathname === '/api/game/breeding' || url.pathname === '/api/game/market/action' || url.pathname === '/api/game/market';
    if (!watched) return nativeFetch(resource, options);
    let request;
    // Read a Request clone only; the original request/response streams stay owned by the game.
    if (watched && method === 'POST') {
      try { request = typeof options?.body === 'string' ? Promise.resolve(JSON.parse(options.body)) : resource instanceof Request ? resource.clone().json().catch(() => null) : Promise.resolve(null); } catch { request = Promise.resolve(null); }
    }
    const before = method === 'POST' ? pokes().map(D.pokemon).filter(Boolean) : [], oldEggs = new Set((center?.eggs || []).map(x => String(x.id)));
    if (method === 'POST') { observeRows(before); root.QuadrymonBreedingObserver?.read(); }
    const oldCenter = center && { ...center }, at = Date.now();
    const quoteSnapshot = new Map(quotes);
    const listings = [...marketListings.values(), ...Object.values(root.__poke?.api || {}).flatMap(data => data && Array.isArray(data.listings) ? data.listings : [])];
    const result = nativeFetch(resource, options);
    if (watched) result.then(async response => {
      if (!response.ok) return;
      const data = await response.clone().json();
      if (owner !== account() || !owner || data.error) return;
      if (method === 'GET' && url.pathname === '/api/game/market') {
        for (const listing of data.listings || []) if (listing.id) marketListings.set(String(listing.id), listing);
        while (marketListings.size > 2048) marketListings.delete(marketListings.keys().next().value);
        return;
      }
      if (method === 'GET' && url.pathname === '/api/game/breeding') {
        if (url.searchParams.get('action') === 'quote') {
          const k = JSON.stringify([url.searchParams.get('parent1'), url.searchParams.get('parent2'), url.searchParams.get('free') === '1']);
          quotes.set(k, { ...data, at: Date.now() });
          if (quotes.size > 128) quotes.delete(quotes.keys().next().value);
        } else if (url.searchParams.get('action') === 'center') center = data;
        return;
      }
      const body = await request;
      if (!body || owner !== account()) return;
      const base = { cid: owner, at, id: 'action:' + at + ':' + (++sequence) + ':' + Math.random().toString(36).slice(2) };
      if (url.pathname === '/api/game/breeding' && body.action === 'breed') {
        const added = (data.eggs || []).filter(x => !oldEggs.has(String(x.id)));
        // An unknown prior center cannot distinguish a new egg from an existing one.
        if (!oldCenter || added.length !== 1) return;
        const quote = quoteSnapshot.get(JSON.stringify([String(body.parent1), String(body.parent2), !!body.free]));
        emit({ ...base, id: 'breed:' + added[0].id, kind: 'breed', egg: added[0], parents: [body.parent1, body.parent2].map(id => before.find(p => p.id === String(id)) || { id: String(id), name: 'Pai não observado' }), quote: quote && at - quote.at < 300000 ? quote : null, double: body.double === true, free: body.free === true });
        center = data;
      } else if (url.pathname === '/api/game/breeding' && ['hatch', 'hatch-now'].includes(body.action) && data.child) {
        const child = { ...data.child };
        emit({ ...base, id: 'hatch:' + body.eggId, kind: 'hatch', eggId: String(body.eggId), child, instant: body.action === 'hatch-now', diamonds: oldCenter?.instantHatchCost ?? null });
        // Some responses omit child.id; identify it later from an exact single inventory delta.
        const current = events.at(-1); if (current?.kind === 'hatch' && !current.child.id) current.beforeIds = before.filter(x => Number(x.speciesId) === Number(child.speciesId)).map(x => x.id);
        persist();
      } else if (url.pathname === '/api/game/market/action' && body.action === 'buy') {
        const listing = listings.find(x => String(x.id) === String(body.id));
        const raw = data.pokemon || data.poke || data.captured;
        const exactId = raw?.id || data.capturedId || data.pokemonId || listing?.capturedId || listing?.pokemonId || listing?.pokemon?.id;
        if (exactId) emit({ ...base, kind: 'purchase', pokemon: D.pokemon({ ...listing, ...raw, id: exactId }), price: D.number(data.pricePaid ?? body.price ?? listing?.price), currency: data.currency || body.currency || listing?.currency, evidence: 'server-pokemon-id' });
        else {
          if (listing?.kind === 'pokemon') emit({ ...base, kind: 'purchase', listing, beforeIds: before.filter(x => Number(x.speciesId) === Number(listing.speciesId)).map(x => x.id), price: D.number(body.price), currency: body.currency });
        }
      }
    }).catch(() => {});
    return result;
  };
  root.QuadrymonBreedingObserver = {
    read() {
      sync();
      const candidates = () => [...new Map([...events.flatMap(e => e.kind === 'breed' ? e.parents || [] : []), ...pokes(), ...recentPokemon.values()].map(p => [String(p.id), p])).values()];
      for (const event of events) if (event.kind === 'hatch' && !event.child.id && event.beforeIds) {
        const others = events.filter(e => e.kind === 'hatch' && !e.child?.id && Number(e.child?.speciesId) === Number(event.child.speciesId) && Number(e.child?.ivTotal) === Number(event.child.ivTotal) && Number(e.child?.quality) === Number(event.child.quality));
        if (others.length !== 1) continue;
        const caught = new Set((root.__poke?.catchLog || []).map(p => String(p.id)));
        const claimed = new Set(events.filter(e => e.child?.id || e.pokemon?.id).map(e => String(e.child?.id || e.pokemon?.id)));
        const added = candidates().filter(p => !event.beforeIds.includes(String(p.id)) && !caught.has(String(p.id)) && !claimed.has(String(p.id)) && Number(p.speciesId) === Number(event.child.speciesId) && Number(p.ivTotal) === Number(event.child.ivTotal) && Number(p.quality) === Number(event.child.quality) && !!p.shiny === !!event.child.shiny);
        if (added.length === 1) { event.child.id = String(added[0].id); persist(); }
      }
      for (const event of events) if (event.kind === 'purchase' && !event.pokemon && event.listing) {
        const l = event.listing;
        // Never match on species/name alone, and never claim an observed capture as a purchase.
        if (l.speciesId == null || l.ivTotal == null || l.quality == null || l.level == null) continue;
        const competing = events.filter(e => e.kind === 'purchase' && !e.pokemon && e.listing && Number(e.listing.speciesId) === Number(l.speciesId) && Number(e.listing.ivTotal) === Number(l.ivTotal) && Number(e.listing.quality) === Number(l.quality));
        if (competing.length !== 1) continue;
        const catches = new Set((root.__poke?.catchLog || []).map(p => String(p.id)));
        const claimed = new Set(events.filter(e => e.pokemon).map(e => String(e.pokemon.id)));
        const added = candidates().filter(p => !event.beforeIds.includes(String(p.id)) && !catches.has(String(p.id)) && !claimed.has(String(p.id)) && Number(p.speciesId) === Number(l.speciesId) && Number(p.ivTotal) === Number(l.ivTotal) && Number(p.quality) === Number(l.quality) && Number(p.level) === Number(l.level) && !!p.shiny === !!l.shiny);
        if (added.length === 1) { event.pokemon = D.pokemon(added[0]); event.evidence = 'purchase-and-unique-inventory-delta'; persist(); }
      }
      return { cid, events, center };
    },
    onPokemon(rows) { observeRows(rows); this.read(); },
    ack(ids) { sync(); events = events.filter(x => !ids.includes(x.id)); persist(); }
  };
})(globalThis);
