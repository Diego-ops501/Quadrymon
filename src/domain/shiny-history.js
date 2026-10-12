(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.QuadrymonShinyHistory = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const key = x => [Number(x.p) || 0, Number(x.t) || 0, String(x.n || "").replace(/_/g, " ").toLowerCase()].join(":");
  function merge(history, entries, index, cid, account, onAdd = () => {}) {
    const known = new Map(history.map(x => [key(x), x]));
    let changed = false;
    for (const x of entries || []) {
      if (!x || !x.n || !(Number(x.t) > 0)) continue;
      const entry = { ...x, p: index, cid, account, cap: x.cap ? 1 : 0, def: x.def ? 1 : 0 };
      const previous = known.get(key(entry));
      if (previous) {
        if (entry.cap && !previous.cap) { previous.cap = 1; changed = true; }
        for (const field of ["iv", "q", "cid", "account"])
          if (previous[field] == null && entry[field] != null) { previous[field] = entry[field]; changed = true; }
        continue;
      }
      history.push(entry);
      known.set(key(entry), entry);
      onAdd(entry);
      changed = true;
    }
    return changed;
  }
  return { merge };
});
