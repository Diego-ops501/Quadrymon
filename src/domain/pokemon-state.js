(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PokeMuxPokemonState = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // The game sends large bags as numbered chunks. Publish only a complete generation.
  function receive(state, event) {
    if (!event || typeof event !== 'object') return null;
    if (event.type === 'pokes-chunk') {
      const gen = Number(event.gen), seq = Number(event.seq), total = Number(event.total);
      if (![gen, seq, total].every(Number.isSafeInteger) || gen < 0 || total < 1 || total > 1000 || seq < 0 || seq >= total || !Array.isArray(event.list)) return null;
      if (state.pokeGeneration != null && gen <= state.pokeGeneration) return null;
      let pending = state.pokeChunks;
      if (pending && gen < pending.gen) return null;
      if (!pending || gen !== pending.gen) pending = state.pokeChunks = { gen, total, parts: new Map(), deltas: new Map() };
      if (pending.total !== total) return null;
      pending.parts.set(seq, event.list);
      if (pending.parts.size !== total) return null;
      const byId = new Map();
      for (let i = 0; i < total; i++) for (const poke of pending.parts.get(i)) {
        if (poke && poke.id != null) byId.set(String(poke.id), poke);
      }
      for (const [id, delta] of pending.deltas) {
        if (byId.has(id)) byId.set(id, { ...byId.get(id), ...delta });
        else if (delta.speciesId != null || delta.pokeId != null) byId.set(id, delta);
      }
      state.pokeGeneration = gen; state.pokeChunks = null;
      return { type: 'pokes', list: [...byId.values()] };
    }
    if (event.type === 'pokes') state.pokeChunks = null;
    const delta = event.type === 'poke-delta' ? event.poke : event.type === 'poke-xp' ? { id: event.id,
      ...(event.xp != null ? { xp: event.xp } : {}), ...(event.level != null ? { level: event.level } : {}) } : null;
    if (delta && delta.id != null) {
      const id = String(delta.id), list = state.ws && state.ws.pokes && state.ws.pokes.list;
      if (state.pokeChunks) state.pokeChunks.deltas.set(id, { ...state.pokeChunks.deltas.get(id), ...delta });
      if (event.type === 'poke-xp' && Array.isArray(list)) {
        const poke = list.find(x => String(x.id) === id);
        if (poke) { if (delta.xp != null) poke.xp = delta.xp; if (delta.level != null) poke.level = delta.level; }
      }
    }
    return event;
  }

  return { receive };
});
