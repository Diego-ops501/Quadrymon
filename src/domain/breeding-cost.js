(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.QuadrymonBreedingCost = api;
})(globalThis, function () {
  'use strict';
  const number = value => value != null && value !== '' && Number.isFinite(Number(value)) && Number(value) >= 0 ? Number(value) : null;
  const key = (cid, id) => JSON.stringify([String(cid), String(id)]);
  const pokemon = value => {
    if (!value || value.id == null) return null;
    return { id: String(value.id), name: String(value.name || value.speciesName || 'Pokémon').slice(0, 120), speciesId: number(value.speciesId ?? value.pokeId), ivTotal: number(value.ivTotal ?? value.iv), quality: number(value.quality), level: number(value.level), shiny: !!(value.shiny ?? value.shinyChild), breeds: number(value.breeds) };
  };
  function create(saved) {
    const state = saved?.version === 1 && Array.isArray(saved.projects) && Array.isArray(saved.events) && saved.nodes && typeof saved.nodes === 'object'
      ? JSON.parse(JSON.stringify(saved)) : { version: 1, projects: [], events: [], nodes: {}, aliases: {} };
    state.aliases ||= {};
    const own = (object, k) => Object.prototype.hasOwnProperty.call(object, k);
    const resolve = k => { const seen = new Set(); while (own(state.aliases, k) && !seen.has(k)) { seen.add(k); k = state.aliases[k]; } return k; };
    function ensure(cid, p) {
      p = pokemon(p); if (!p) return null;
      const k = resolve(key(cid, p.id));
      if (!own(state.nodes, k)) state.nodes[k] = { cid: String(cid), pokemon: p, origin: 'unknown', costs: [], parents: [] };
      else {
        const update = Object.fromEntries(Object.entries(p).filter(([, v]) => v != null));
        state.nodes[k].pokemon = { ...state.nodes[k].pokemon, ...update };
        if (state.nodes[k].child?.id === p.id) state.nodes[k].child = { ...state.nodes[k].child, ...update };
      }
      return k;
    }
    function acquisition(cid, p, origin, amount, currency = 'GOLD') {
      const k = ensure(cid, p); if (!k) return;
      const node = state.nodes[k];
      // A hatch alias retains its lineage; it must never be reclassified as a free capture.
      if (node.eggId) return;
      node.origin = ['captured', 'bought', 'manual', 'unknown'].includes(origin) ? origin : 'unknown';
      const value = number(amount);
      node.costs = node.origin === 'captured' ? [{ label: 'Aquisição por captura (farm não incluído)', gold: 0, diamonds: 0 }]
        : value != null ? [{ label: 'Aquisição', gold: currency === 'GOLD' ? value : 0, diamonds: currency === 'DIAMONDS' ? value : 0 }]
          : [{ label: 'Aquisição sem preço registrado', gold: null, diamonds: null }];
    }
    function ingest(event) {
      if (!event?.cid || !event.id || !['breed', 'hatch', 'purchase'].includes(event.kind)) return false;
      const existing = state.events.find(x => x.id === event.id && x.cid === String(event.cid));
      if (existing) {
        if (event.kind === 'breed' && existing.existing && !event.existing) {
          const projectId = existing.projectId;
          state.events.splice(state.events.indexOf(existing), 1);
          const changed = ingest({ ...event, projectId });
          if (projectId) assign(event.id, projectId, event.cid);
          return changed;
        }
        // A hatch response may omit the inventory ID; enrich it once the socket delivers it.
        if (event.kind === 'hatch' && event.child?.id && !existing.child?.id) {
          const k = resolve(key(event.cid, event.eggId)), node = state.nodes[k];
          if (node) { node.child = pokemon({ ...event.child, name: event.child.name || node.pokemon.name }); node.result = event.child; node.pokemon = node.child; state.aliases[key(event.cid, event.child.id)] = k; existing.child = event.child; reconcile(); return true; }
        }
        return false;
      }
      event = JSON.parse(JSON.stringify(event)); event.cid = String(event.cid);
      if (event.kind === 'breed') {
        if (!event.egg?.id) return false;
        const k = ensure(event.cid, { ...event.egg, name: event.egg.speciesName || event.egg.name });
        const node = state.nodes[k]; node.origin = 'bred'; node.eggId = String(event.egg.id); node.status = 'incubating';
        node.parents = (event.parents || []).map(p => ensure(event.cid, p)).filter(Boolean);
        node.costs = event.costs || [{ label: 'Custo do breed indisponível', gold: null, diamonds: null }];
        node.baselineIv = number(event.baselineIv); node.double = event.double == null ? null : !!event.double; node.bumpPossible = event.bumpPossible === true;
      } else if (event.kind === 'hatch') {
        if (!event.eggId || !event.child) return false;
        const k = ensure(event.cid, { id: event.eggId, name: event.child.name || 'Ovo anterior' }), node = state.nodes[k];
        if (!node.eggId) { node.eggId = String(event.eggId); node.origin = 'bred'; node.costs = [{ label: 'Breed anterior ao acompanhamento', gold: null, diamonds: null }]; }
        event.child.name ||= node.pokemon.name;
        node.status = 'hatched'; node.child = pokemon(event.child); node.result = event.child; node.delta = number(event.child.delta);
        if (node.child) { node.pokemon = node.child; state.aliases[key(event.cid, node.child.id)] = k; }
        if (event.instant) node.costs.push({ label: 'Nascimento instantâneo', gold: 0, diamonds: number(event.diamonds) });
        node.bump = node.double == null ? 'unknown' : !node.double || !node.bumpPossible ? 'not-eligible' : node.baselineIv == null || number(event.child.ivTotal) == null ? 'unknown'
          : Number(event.child.ivTotal) === node.baselineIv + 1 ? 'success' : Number(event.child.ivTotal) === node.baselineIv ? 'miss' : 'unknown';
      } else if (event.pokemon) acquisition(event.cid, event.pokemon, 'bought', event.price, event.currency);
      state.events.push(event);
      reconcile();
      return true;
    }
    function project(name, cid, pokes) {
      const row = { id: globalThis.crypto?.randomUUID?.() || 'project-' + Date.now() + '-' + Math.random().toString(36).slice(2), name: String(name || 'Pokémon em montagem').slice(0, 100), cid: String(cid), roots: [...new Set(pokes.map(p => ensure(cid, p)).filter(Boolean))], at: Date.now() };
      if (!row.roots.length) throw Error('Selecione pelo menos um Pokémon.');
      state.projects.push(row); reconcile(); return row;
    }
    function assign(eventId, projectId, cid) {
      const event = state.events.find(x => x.id === eventId && x.cid === String(cid)), row = state.projects.find(x => x.id === projectId);
      if (!event || !row || row.cid !== event.cid || !['breed', 'hatch'].includes(event.kind)) return false;
      const eggId = event.egg?.id || event.eggId;
      // One operation belongs to one project. Shared parents are still deduplicated within each total.
      if (event.projectId && event.projectId !== projectId) return false;
      event.projectId = projectId;
      const root = resolve(key(event.cid, eggId)); if (!row.roots.includes(root)) row.roots.push(root);
      for (const sibling of state.events) if (sibling.cid === event.cid && (sibling.egg?.id || sibling.eggId) === eggId) sibling.projectId = projectId;
      return true;
    }
    function total(row, rate) {
      const seen = new Set(), entries = [], nodes = [];
      function visit(k) {
        k = resolve(k); if (seen.has(k)) return; seen.add(k);
        const node = state.nodes[k]; if (!node || node.cid !== row.cid) return;
        nodes.push(node); for (const parent of node.parents || []) visit(parent);
        if (!node.costs?.length) entries.push({ label: 'Aquisição não identificada', gold: null, diamonds: null });
        else entries.push(...node.costs);
      }
      for (const k of row.roots) visit(k);
      const gold = entries.reduce((sum, x) => sum + (number(x.gold) || 0), 0), diamonds = entries.reduce((sum, x) => sum + (number(x.diamonds) || 0), 0);
      const validRate = number(rate) > 0;
      const missing = entries.filter(x => number(x.gold) == null || number(x.diamonds) == null).length;
      const known = entries.some(x => number(x.gold) != null || number(x.diamonds) != null);
      const unpriced = missing > 0 && gold === 0 && diamonds === 0;
      return { gold, diamonds, dollarTotal: unpriced ? null : validRate ? gold + diamonds * rate : diamonds ? null : gold, diamondTotal: unpriced ? null : validRate ? diamonds + gold / rate : gold ? null : diamonds,
        missing, known, estimated: entries.some(x => x.estimated), entries, nodes,
        breeds: nodes.filter(x => x.eggId).length, hatched: nodes.filter(x => x.status === 'hatched').length };
    }
    function contains(row, target) {
      target = resolve(target); const seen = new Set();
      function visit(k) { k = resolve(k); if (k === target) return true; if (seen.has(k)) return false; seen.add(k); const n = state.nodes[k]; return n?.cid === row.cid && (n.parents || []).some(visit); }
      return row.roots.some(visit);
    }
    function candidates(event) {
      if (!event || !['breed', 'hatch'].includes(event.kind)) return [];
      const egg = key(event.cid, event.egg?.id || event.eggId);
      // A parent in exactly one project is enough to continue that project; two
      // different projects sharing parents require an explicit choice.
      const references = [egg, ...(event.parents || []).map(p => key(event.cid, p.id))];
      if (event.child?.id) references.push(key(event.cid, event.child.id));
      return state.projects.filter(p => p.cid === event.cid && references.some(k => contains(p, k)));
    }
    function reconcile() {
      let changed = false;
      for (const node of Object.values(state.nodes)) if (node.child && node.pokemon?.id === node.child.id && !['Pokémon', 'Ovo anterior'].includes(node.pokemon.name)) node.child = { ...node.child, ...node.pokemon };
      // Revisit persisted events too: a project may be created after an egg, or
      // a hatch ID may be resolved after the next crossing has already begun.
      for (let pass = 0; pass < 3; pass++) {
        let progress = false;
        for (const event of state.events) {
          if (!['breed', 'hatch'].includes(event.kind) || event.projectId) continue;
          const previous = state.events.find(e => e.cid === event.cid && e.projectId && (e.egg?.id || e.eggId) === (event.egg?.id || event.eggId));
          const owners = previous ? state.projects.filter(p => p.id === previous.projectId && p.cid === event.cid) : candidates(event);
          if (owners.length === 1 && assign(event.id, owners[0].id, event.cid)) { event.automatic = true; progress = changed = true; }
        }
        if (!progress) break;
      }
      return changed;
    }
    reconcile();
    return { state, ensure, acquisition, ingest, project, assign, total, resolve, candidates, reconcile };
  }
  function breedCosts(quote, double, prices = {}, rate) {
    if (!quote) return [{ label: 'Cotação do breed não observada', gold: null, diamonds: null }];
    const result = [{ label: 'Taxa do breed', gold: number(quote.goldFee), diamonds: 0 }];
    const materials = [...(double ? quote.stones?.double || [] : quote.stones?.base || [])];
    if (number(quote.pheromoneCost) > 0) materials.push({ itemId: quote.pheromoneItemId || 44417, name: 'Strange Pheromone', need: quote.pheromoneCost });
    for (const item of materials) {
      const qty = number(item.need), price = prices['item:' + item.itemId];
      const gold = number(price?.GOLD), dia = number(price?.DIAMONDS);
      if (qty == null) result.push({ label: item.name || 'Material', gold: null, diamonds: null });
      else if (gold != null && (dia == null || !(rate > 0) || gold <= dia * rate)) result.push({ label: item.name || 'Material', quantity: qty, gold: qty * gold, diamonds: 0, estimated: true });
      else if (dia != null) result.push({ label: item.name || 'Material', quantity: qty, gold: 0, diamonds: qty * dia, estimated: true });
      else result.push({ label: item.name || 'Material', quantity: qty, gold: null, diamonds: null, estimated: true });
    }
    if (!quote.stones || !(double ? quote.stones.double : quote.stones.base)?.length) result.push({ label: 'Pedras sem cotação', gold: null, diamonds: null });
    return result;
  }
  return { create, key, pokemon, breedCosts, number };
});
