(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.QuadrymonHealthAlerts = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  // Loading and reconnecting are not reliable evidence of a farm problem.
  const GRACE_MS = 60000, PERSIST_MS = 30000;
  function create() {
    let identity, connectedAt = null, wasLive = false;
    const pending = new Map(), delivered = new Set();
    return {
      observe({ key, live, issues = [], enabled = () => true, now = Date.now() }) {
        if (key !== identity) {
          identity = key;
          connectedAt = null;
          wasLive = false;
          pending.clear();
          delivered.clear();
        }
        if (live && !wasLive) {
          connectedAt = now;
          pending.clear();
          delivered.clear();
        }
        wasLive = !!live;
        const active = new Set(issues);
        for (const issue of pending.keys()) if (!active.has(issue)) pending.delete(issue);
        for (const issue of delivered) if (!active.has(issue)) delivered.delete(issue);
        const ready = [];
        for (const issue of active) {
          if (!pending.has(issue)) pending.set(issue, now);
          if (connectedAt === null || now - connectedAt < GRACE_MS ||
              now - pending.get(issue) < PERSIST_MS || delivered.has(issue) || !enabled(issue)) continue;
          delivered.add(issue);
          ready.push(issue);
        }
        return ready;
      },
    };
  }
  return { create, GRACE_MS, PERSIST_MS };
});
