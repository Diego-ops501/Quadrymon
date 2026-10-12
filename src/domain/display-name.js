(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.QuadrymonNames = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  // Presentation only: native slugs, character names and identifiers stay intact.
  const display = value => String(value ?? "").replace(/_+/g, " ").replace(/\s+/g, " ").trim().replace(/(^|\s)([a-z])/g, (_, space, letter) => space + letter.toUpperCase());
  const key = value => display(value).toLowerCase().replace(/\s+(?:lv\.?|lvl\.?|level)\s*\d+.*$/i, "").replace(/[^a-z0-9]/g, "");
  function spriteId(id, name, entries = [], dex = {}) {
    id = Number(id) || 0;
    if (Number(dex[id]) > 0) return Number(dex[id]);
    if (id >= 13000 && id < 14000) return id - 13000;
    const pokemon = entries.filter(x => x.kind === "pokemon" && Number(x.speciesId) > 0);
    const source = name || pokemon.find(x => Number(x.speciesId) === id)?.name;
    const normalized = key(source);
    const base = pokemon.filter(x => Number(x.speciesId) < 10000 && key(x.name) && normalized.includes(key(x.name))).sort((a, b) => key(b.name).length - key(a.name).length)[0];
    if (base && (id >= 10000 || !id)) return Number(base.speciesId);
    return id > 0 && id < 10000 ? id : 0;
  }
  return { display, spriteId };
});
