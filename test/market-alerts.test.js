const assert = require('node:assert/strict');
const A = require('../src/domain/market-alerts');
async function run() {
  const rule = A.normalize({ id: 'r1', cid: 'c1', account: 0, accountName: 'Tester', kind: 'pokemon', speciesId: 63, name: 'Abra', currency: 'DIAMONDS', priceMax: 10, ivMin: 150, ivMax: 192, qMin: 1.7, lvMax: 50, shiny: 'yes' });
  const offer = { id: 'p1', kind: 'pokemon', speciesId: 63, name: 'Abra', currency: 'DIAMONDS', price: 8, ivTotal: 160, quality: 1.8, level: 20, shiny: true, quantity: 1, at: new Date().toISOString() };
  assert.equal(A.matches(rule, offer), true);
  for (const delta of [{ currency: 'GOLD' }, { price: 11 }, { shiny: false }, { speciesId: 10063 }, { ivTotal: 149 }, { quality: null }, { level: 51 }, { offerOnly: true }, { quantity: 0 }]) assert.equal(A.matches(rule, { ...offer, ...delta }), false);
  assert.equal(A.normalize({ ...rule, ivMin: 170, ivMax: 160 }), null);
  assert.equal(A.normalize({ ...rule, priceMax: -1 }), null);
  const evolved = A.normalize({ ...rule, includeEvolutions: true, speciesIds: [63, 64, 65, 65, 'invalid'] });
  assert.deepEqual(evolved.speciesIds, [63, 64, 65]);
  assert.equal(A.matches(evolved, { ...offer, speciesId: 65 }), true);
  assert.equal(A.matches(rule, { ...offer, speciesId: 65 }), false);
  assert.equal(A.matches(evolved, { ...offer, speciesId: 65, ivTotal: 100 }), false);
  assert.equal(A.matches(evolved, { ...offer, speciesId: 10065 }), false);
  assert.deepEqual(A.normalize({ ...evolved, includeEvolutions: false }).speciesIds, [63]);
  const state = { seen: new Set(), ready: false, armedAt: 0 };
  const now = Date.now();
  assert.equal(A.scan(state, rule, [offer], now).length, 0);
  assert.equal(A.scan(state, rule, [offer], now + 1000).length, 0);
  assert.equal(A.scan(state, rule, [{ ...offer, id: 'p2', at: new Date(now + 1000).toISOString() }], now + 1000).length, 1);
  assert.equal(A.scan(state, rule, [{ ...offer, id: 'old', at: new Date(now - 60000).toISOString() }], now + 1000).length, 0);
  const item = A.normalize({ id: 'i1', cid: 'c1', account: 0, kind: 'item', refId: 44417, name: 'Pheromone', currency: 'GOLD', priceMax: 100 });
  const group = { id: 'group', ids: ['i1', 'i2'], kind: 'item', refId: 44417, currency: 'GOLD', price: 50, quantity: 2, at: new Date().toISOString() };
  const grouped = { seen: new Set(), ready: false, armedAt: 0 };
  A.scan(grouped, item, [group]);
  assert.equal(A.scan(grouped, item, [{ ...group, ids: ['i1', 'i2', 'i3'] }]).length, 1);
  assert.equal(A.scan(grouped, item, [{ ...group, ids: ['i1', 'i2', 'i3'] }]).length, 0);
  let payload = { ok: true, data: { cid: 'c1', listings: [group] } }, notifications = [], calls = 0;
  const monitor = A.create({ read: async () => { calls++; return payload; }, changed() {}, notify: (r, found) => notifications.push({ r, found }) });
  try {
    monitor.setRules([item]); await monitor.check(); assert.equal(notifications.length, 0);
    payload = { ok: true, data: { cid: 'c1', listings: [{ ...group, ids: ['i1', 'i2', 'i4'] }] } };
    await monitor.check(); assert.equal(notifications.length, 1);
    await monitor.check(); assert.equal(notifications.length, 1);
    payload = { ok: false, reason: 'offline' }; await monitor.check(); assert.equal(monitor.state(item.id).error, 'offline');
    payload = { ok: true, data: { cid: 'other', listings: [{ ...group, id: 'bad', ids: ['bad'] }] } };
    await monitor.check(); assert.equal(notifications.length, 1); assert.equal(monitor.state(item.id).error, 'changed');
    monitor.setRules([{ ...item, enabled: false }]); const before = calls; await monitor.check(); assert.equal(calls, before);
  } finally { monitor.stop(); }
  const evolutionQueries = [], evolutionNotifications = []; let newEvolution = false;
  const evolutionMonitor = A.create({
    read: async (_account, script) => {
      const q = JSON.parse(script.match(/\}\)\((\{[^\n]*?\}),/)[1]); evolutionQueries.push(q);
      return { ok: true, data: { cid: 'c1', pages: 1, listings: [{ ...offer, id: 'base:' + q.speciesId, speciesId: Number(q.speciesId) }, ...(newEvolution && q.speciesId === '65' ? [{ ...offer, id: 'new:evolution', speciesId: 65 }] : [])] } };
    }, changed() {}, notify: (rule, found) => evolutionNotifications.push(found)
  });
  try {
    evolutionMonitor.setRules([evolved]); await evolutionMonitor.check();
    assert.deepEqual(evolutionQueries.map(x => x.speciesId), ['63', '64', '65']);
    assert.equal(evolutionNotifications.length, 0);
    newEvolution = true; await evolutionMonitor.check();
    assert.equal(evolutionNotifications.length, 1); assert.equal(evolutionNotifications[0][0].speciesId, 65);
    await evolutionMonitor.check(); assert.equal(evolutionNotifications.length, 1);
  } finally { evolutionMonitor.stop(); }
  // Previously saved alerts on a final evolution must also pick up pre-evolutions.
  const finalRule = A.normalize({ ...rule, speciesId: 65, name: 'Alakazam', includeEvolutions: true, speciesIds: [65] });
  const familyCalls = [], familyHits = []; let added = false;
  const familyMonitor = A.create({
    read: async (_account, script) => {
      const q = JSON.parse(script.match(/\}\)\((\{[^\n]*?\}),/)[1]); familyCalls.push(q.speciesId);
      return { ok: true, data: { cid: 'c1', pages: 1, alertCatalog: [{ speciesId: 63, evolvesToId: 64 }, { speciesId: 64, evolvesToId: 65 }, { speciesId: 65 }], listings: added && q.speciesId === '63' ? [{ ...offer, id: 'new:pre-evolution' }] : [] } };
    }, changed() {}, notify: (_rule, hits) => familyHits.push(hits)
  });
  try {
    familyMonitor.setRules([finalRule]); await familyMonitor.check();
    assert.deepEqual(familyCalls, ['65', '63', '64']);
    added = true; await familyMonitor.check();
    assert.equal(familyHits.length, 1); assert.equal(familyHits[0][0].speciesId, 63);
  } finally { familyMonitor.stop(); }
  // A rule changed while a request is pending must never receive its old response.
  let resolve;
  const pending = A.create({ read: () => new Promise(r => { resolve = r; }), changed() {}, notify: () => { throw Error('stale notification'); } });
  try {
    pending.setRules([item]); const task = pending.check(); pending.setRules([]); resolve({ ok: true, data: { cid: 'c1', listings: [group] } }); await task;
    assert.equal(pending.state(item.id), undefined);
  } finally { pending.stop(); }
  console.log('ok market-alerts: condições, baseline, grupos, deduplicação, offline, personagem, pausa e consultas atrasadas');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
