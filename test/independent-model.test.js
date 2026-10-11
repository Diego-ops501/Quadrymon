"use strict";
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  vm = require("node:vm");
const model = require("../src/domain/hunt-combat-model"),
  hunts = require("../src/domain/hunt-recommendations"),
  preferences = require("../src/game/preferences");
assert.equal(
  model.throughput({ hitIntervalMs: 2000, spawnDelayMs: 1000 }, [1, 2]),
  900,
);
assert.equal(model.throughput({ hitIntervalMs: 2000 }, [0]), null);
assert.equal(model.throughput({}, [1]), null);
assert.equal(
  model.capture(60000, [{ npcPrice: 5, captureMultiplier: 1 }]),
  null,
  "unknown catch probability remains unknown",
);
assert.equal(
  model.capture(60000, [{ npcPrice: 5, captureProbability: 0.1 }]).perKill,
  6000,
);
for (const level of [150, 361, 500, 599])
  assert.deepEqual(hunts.progressionBand({ level }), {
    min: 150,
    max: 150,
    region: "outland",
  });
assert.deepEqual(hunts.progressionBand({ level: 15 }), {
  min: 1,
  max: 15,
  region: "",
});
assert.equal(hunts.progressionBand({ level: 650 }).region, "orre");
const state = {
  ws: {
    pokes: {
      list: [
        { id: "rare", name: "Dratini", quality: 1.8 },
        { id: "ordinary", name: "Abra", quality: 1.2 },
      ],
    },
  },
  api: { "/game/items.json": { items: [{ id: 10, name: "Locked Loot" }] } },
};
assert.deepEqual(
  preferences.protectedSale({ pokeIds: ["ordinary"] }, state),
  [],
);
assert.deepEqual(
  preferences.protectedSale({ pokeIds: ["rare"], itemId: 10 }, state, [
    "Locked Loot",
  ]),
  ["Dratini", "Locked Loot"],
);
// All animations scheduled for an accepted display frame must run together.
const callbacks = new Map();
let next = 0;
const scope = {
  requestAnimationFrame: (callback) => {
    callbacks.set(++next, callback);
    return next;
  },
  cancelAnimationFrame: (id) => callbacks.delete(id),
  fetch: () => Promise.resolve({}),
  location: { href: "https://poke.idleworld.online/play" },
  document: { createElement: () => ({}), head: { append() {} } },
  URL,
};
scope.globalThis = scope;
vm.runInNewContext(
  fs.readFileSync(require.resolve("../src/game/preferences"), "utf8"),
  scope,
);
scope.PokeMuxGamePreferences.configure({ fps: 15 });
let delivered = 0;
scope.requestAnimationFrame(() => delivered++);
scope.requestAnimationFrame(() => delivered++);
for (const callback of [...callbacks.values()]) callback(100);
assert.equal(
  delivered,
  2,
  "rate limiter does not starve concurrent game animations",
);
console.log(
  "Independent model: official cadence, missing probability, level bands, sale protection and frame scheduling passed.",
);
