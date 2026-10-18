(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.QuadrymonAccountNotifications = api;
})(globalThis, function () {
  'use strict';
  const DEFAULT_ITEMS = ['Strange Pheromone', 'Boss Token'];
  const normalized = value => String(value || '').trim().toLowerCase();
  function create(saved = {}, persist = () => {}) {
    const history = Object.create(null), observations = new Map();
    for (const [cid, entries] of Object.entries(saved || {})) {
      if (!Array.isArray(entries)) continue;
      history[cid] = entries.filter(x => x && ['capture', 'drop'].includes(x.kind) && typeof x.name === 'string' && Number.isFinite(x.at)).slice(-200).map(x => ({ ...x, read: !!x.read }));
    }
    const entries = cid => history[String(cid)] || [];
    function observe(data, important, rareItems = DEFAULT_ITEMS, now = Date.now()) {
      if (!data?.ok || !data.live || !data.cid) return;
      const cid = String(data.cid), epoch = String(data.a?.epoch ?? data.hunt ?? '');
      const captureKey = x => [x.id, x.t].join(':');
      const dropKey = x => String(x.id ?? normalized(x.name));
      const drops = new Map((data.drops || []).map(x => [dropKey(x), Number(x.qty) || 0]));
      let previous = observations.get(cid);
      if (!previous) {
        observations.set(cid, { epoch, drops, captures: new Set((data.captures || []).map(captureKey)) });
        return;
      }
      const added = [];
      for (const capture of data.captures || []) {
        const key = captureKey(capture);
        if (previous.captures.has(key)) continue;
        previous.captures.add(key);
        if (!capture.sh && !important(capture)) continue;
        added.push({ kind: 'capture', name: String(capture.n || ''), at: Number(capture.t) || now, iv: capture.iv, quality: capture.q, shiny: !!capture.sh, read: false });
      }
      {
        const targets = new Set(rareItems.map(normalized));
        for (const drop of data.drops || []) {
          const delta = (Number(drop.qty) || 0) - (previous.epoch === epoch ? previous.drops.get(dropKey(drop)) || 0 : 0);
          if (delta > 0 && targets.has(normalized(drop.name)))
            added.push({ kind: 'drop', name: String(drop.name), quantity: delta, at: now, read: false });
        }
      }
      previous.epoch = epoch;
      previous.drops = drops;
      if (previous.captures.size > 1500) previous.captures = new Set([...previous.captures].slice(-1000));
      if (added.length) { history[cid] = [...entries(cid), ...added].slice(-200); persist(history); }
    }
    function markRead(cid) {
      let changed = false;
      for (const entry of entries(cid)) if (!entry.read) { entry.read = true; changed = true; }
      if (changed) persist(history);
    }
    return { observe, entries, unread: cid => entries(cid).filter(x => !x.read).length, markRead };
  }
  return { create, DEFAULT_ITEMS };
});
