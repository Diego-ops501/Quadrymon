(function (root, factory) {
  const api = factory(typeof module === 'object' && module.exports ? require('./global-market') : root.PokeMuxGlobalMarket);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PokeMuxMarketAlerts = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (M) {
  'use strict';
  function normalize(rule) {
    if (!rule || !['item', 'ball', 'diamonds', 'pokemon'].includes(rule.kind) || !rule.cid || !rule.name || !rule.id) return null;
    const out = { id: String(rule.id).slice(0, 80), cid: String(rule.cid).slice(0, 100), account: Number(rule.account),
      accountName: String(rule.accountName || '').slice(0, 80), name: String(rule.name).slice(0, 120), kind: rule.kind,
      refId: Number(rule.refId), speciesId: Number(rule.speciesId), currency: ['GOLD', 'DIAMONDS'].includes(rule.currency) ? rule.currency : 'ANY',
      shiny: ['yes', 'no'].includes(rule.shiny) ? rule.shiny : 'any', enabled: rule.enabled !== false, desktop: rule.desktop !== false, voice: rule.voice !== false };
    if (!Number.isInteger(out.account) || out.account < 0 || out.account > 3 || !(Number.isSafeInteger(out.kind === 'pokemon' ? out.speciesId : out.refId) && (out.kind === 'pokemon' ? out.speciesId > 0 : out.refId >= 0))) return null;
    out.includeEvolutions = out.kind === 'pokemon' && rule.includeEvolutions === true;
    out.speciesIds = out.kind === 'pokemon' ? [...new Set([out.speciesId, ...(out.includeEvolutions && Array.isArray(rule.speciesIds) ? rule.speciesIds : [])].map(Number).filter(x => Number.isSafeInteger(x) && x > 0 && x < 1000000))].slice(0, 64) : [];
    for (const key of ['priceMax', 'ivMin', 'ivMax', 'lvMin', 'lvMax', 'qMin', 'qMax']) {
      const max = key.startsWith('iv') ? 192 : key.startsWith('q') ? 100 : key.startsWith('lv') ? 100000 : Number.MAX_SAFE_INTEGER;
      const n = rule[key] == null || rule[key] === '' ? null : Number(String(rule[key]).replace(',', '.'));
      if (n != null && (!Number.isFinite(n) || n < (key.startsWith('lv') || key === 'priceMax' ? 1 : 0) || n > max)) return null;
      out[key] = n;
    }
    for (const prefix of ['iv', 'lv', 'q']) if (out[prefix + 'Min'] != null && out[prefix + 'Max'] != null && out[prefix + 'Min'] > out[prefix + 'Max']) return null;
    return out;
  }
  function matches(rule, x) {
    if (x.kind !== rule.kind || x.offerOnly || !(x.price > 0) || !['GOLD', 'DIAMONDS'].includes(x.currency) || (x.quantity != null && x.quantity <= 0)) return false;
    if (rule.currency !== 'ANY' && rule.currency !== x.currency || rule.priceMax != null && x.price > rule.priceMax) return false;
    if (rule.kind !== 'pokemon') return Number(x.refId) === rule.refId;
    if (!rule.speciesIds.includes(Number(x.speciesId)) || rule.shiny === 'yes' && !x.shiny || rule.shiny === 'no' && x.shiny) return false;
    return [['ivTotal', 'iv'], ['level', 'lv'], ['quality', 'q']].every(([field, prefix]) =>
      (rule[prefix + 'Min'] == null || x[field] != null && x[field] >= rule[prefix + 'Min']) &&
      (rule[prefix + 'Max'] == null || x[field] != null && x[field] <= rule[prefix + 'Max']));
  }
  function scan(state, rule, listings, now = Date.now()) {
    const found = [];
    for (const x of listings) {
      if (x.kind !== rule.kind || (rule.kind === 'pokemon' ? !rule.speciesIds.includes(Number(x.speciesId)) : Number(x.refId) !== rule.refId)) continue;
      const ids = x.ids && x.ids.length ? x.ids : [x.id];
      const unseen = ids.some(id => id && !state.seen.has(String(id)));
      for (const id of ids) if (id) state.seen.add(String(id));
      const time = M.listingTime(x.at, now);
      if (state.ready && unseen && matches(rule, x) && (!time || time.timestamp >= state.armedAt - 5000)) found.push(x);
    }
    while (state.seen.size > 20000) state.seen.delete(state.seen.values().next().value);
    if (!state.ready) { state.ready = true; state.armedAt = now; }
    return found;
  }
  function create(bridge) {
    let rules = [], timer, busy = false, version = 0, stopped = false;
    const states = new Map();
    const schedule = ms => { clearTimeout(timer); if (!stopped) timer = setTimeout(tick, ms); };
    async function tick() {
      if (busy || stopped) return;
      busy = true; const current = version; let delay = 60000;
      const itemCache = new Map();
      try {
        for (const rule of rules.filter(x => x.enabled)) {
          if (version !== current || stopped) break;
          const state = states.get(rule.id);
          if (!state) continue;
          try {
            const options = rule.kind === 'pokemon' ? { ...rule, browse: 'pokemon', sort: 'recent', shiny: rule.shiny === 'yes' } : { category: 'All' };
            const cacheKey = rule.account + ':' + rule.cid;
            let list = [], failed = false;
            state.error = '';
            let firstResponse;
            if (rule.kind === 'pokemon' && rule.includeEvolutions && !state.family) {
              firstResponse = await bridge.read(rule.account, M.readScript({ ...options, speciesId: rule.speciesId, page: 1, includeAlertCatalog: true }, rule.cid));
              if (version !== current || stopped) break;
              if (!firstResponse || !firstResponse.ok) {
                state.error = firstResponse && firstResponse.reason || 'network';
                if (state.error === 'limited') { delay = 300000; break; }
                continue;
              }
              const data = M.sanitizeResponse(firstResponse.data);
              if (data.cid !== rule.cid) { state.error = 'changed'; continue; }
              state.family = data.alertCatalog.length ? M.evolutionIds(rule.speciesId, data.alertCatalog) : rule.speciesIds;
            }
            const effectiveRule = state.family ? { ...rule, speciesIds: state.family } : rule;
            for (const speciesId of rule.kind === 'pokemon' ? effectiveRule.speciesIds : [null]) {
              const read = page => bridge.read(rule.account, M.readScript({ ...options, speciesId, page }, rule.cid));
              let response = firstResponse && speciesId === rule.speciesId ? firstResponse : rule.kind !== 'pokemon' ? itemCache.get(cacheKey) : null;
              if (!response) { response = await read(1); if (rule.kind !== 'pokemon') itemCache.set(cacheKey, response); }
              if (version !== current || stopped) break;
              if (!response || !response.ok) { state.error = response && response.reason || 'network'; failed = true; break; }
              const data = M.sanitizeResponse(response.data);
              if (data.cid !== rule.cid) { state.error = 'changed'; failed = true; break; }
              let speciesList = data.listings;
              // Up to 60 recent filtered offers per species, including evolutions.
              for (let page = 2; rule.kind === 'pokemon' && page <= Math.min(5, data.pages); page++) {
                const oldest = M.listingTime(speciesList[speciesList.length - 1] && speciesList[speciesList.length - 1].at);
                if (state.ready && oldest && oldest.timestamp < state.armedAt - 5000) break;
                const next = await read(page);
                if (version !== current || stopped) break;
                if (!next || !next.ok) { state.error = next && next.reason || 'network'; failed = true; break; }
                const safe = M.sanitizeResponse(next.data);
                if (safe.cid !== rule.cid) { state.error = 'changed'; failed = true; break; }
                speciesList = speciesList.concat(safe.listings);
              }
              list.push(...speciesList);
              if (failed || version !== current || stopped) break;
            }
            if (version !== current || stopped) break;
            if (failed) { if (state.error === 'limited') { delay = 300000; break; } continue; }
            const found = scan(state, effectiveRule, list);
            state.checkedAt = Date.now(); state.error = 'ok';
            if (found.length) { state.lastHit = found[0]; state.lastHitAt = Date.now(); await bridge.notify(rule, found); }
          } catch { state.error = 'network'; }
        }
      } finally { busy = false; bridge.changed(); schedule(version !== current ? 1000 : delay); }
    }
    return {
      setRules(next) {
        version++; rules = next.map(normalize).filter(Boolean).slice(0, 10);
        for (const rule of rules) {
          const signature = JSON.stringify(rule), previous = states.get(rule.id);
          if (!previous || previous.signature !== signature) states.set(rule.id, { signature, seen: new Set(), ready: false, armedAt: 0, checkedAt: 0, error: '' });
        }
        for (const id of states.keys()) if (!rules.some(x => x.id === id)) states.delete(id);
        if (!busy) schedule(1000);
      },
      state: id => states.get(id), check: () => { clearTimeout(timer); return tick(); },
      stop: () => { stopped = true; version++; clearTimeout(timer); }
    };
  }
  return { normalize, matches, scan, create };
});
