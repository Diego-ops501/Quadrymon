"use strict";
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  zlib = require("node:zlib");
const catalogApi = require("../src/domain/hunt-catalog"),
  engine = require("../src/domain/hunt-recommendations"),
  math = require("../src/domain/iv-math"),
  model = require("../src/domain/hunt-combat-model");
const fixture = JSON.parse(
  zlib.gunzipSync(
    fs.readFileSync(
      require("node:path").join(__dirname, "fixtures/game-catalog.json.gz"),
    ),
  ),
);
const catalog = catalogApi.assemble(
  fixture.creatures,
  fixture.hunts,
  fixture.items,
);
assert.equal(
  catalog.h.length,
  fixture.hunts.filter((row) => row.level > 0).length,
  "every real hunt marker maps to its species",
);
assert(
  fixture.creatures
    .filter((row) => row.pokeId >= 10000)
    .every((row) => catalog.dex[row.pokeId]),
  "all regional forms have a base sprite",
);
assert.equal(
  catalog.h.find((row) => row.sl === "blastoise").ar,
  "",
  "normal map never inherits the homonymous Outland form",
);
const project = (species, level, quality, total) => {
  const base = catalog.bs[species];
  return base
    ? math.projectPokemon(
        {
          quality,
          ivTotal: total,
          species: {
            baseStats: Object.fromEntries(
              math.STAT_KEYS.map((key, index) => [key, base[index]]),
            ),
          },
        },
        level,
      ).stats
    : null;
};
// Neutral effectiveness isolates hourly accounting and progression from type ranking.
const effectiveness = () => 1;
const offense = (attacker, hunt) => {
  const wild = { ...project(hunt.sp, hunt.level, 1, 96), ...hunt.combatStats };
  return model.attack(
    attacker,
    {
      ...hunt,
      combatHp: hunt.combatHp || Math.max(24, Math.round(wild.hp * 7)) * 5,
      combatStats: wild,
    },
    {
      ...project(attacker.sp, attacker.level, attacker.q, attacker.ivt),
      ...attacker.stats,
    },
    { moves: catalog.mv },
    effectiveness,
  );
};
const settings = {
  hunts: catalog.h,
  project,
  offense,
  effectiveness,
  moves: (species) => catalog.mv[species]?.a || [],
  simulation: {
    bases: catalog.bs,
    moves: catalog.mv,
    items: catalog.items,
    model: "local",
  },
};
const pinsir = {
  sp: "pinsir",
  level: 361,
  tlv: 569,
  q: 1.78,
  ivt: 156,
  t1: "BUG",
  t2: "",
  tms: [],
  stats: { hp: 9504, atk: 1013, def: 927, spa: 475, spd: 687, speed: 892 },
};
const measurements = {
  "enigmatic girafarig": {
    xph: 5596835,
    kph: 276,
    hpk: 1.5,
    gph: 1234,
    metricVersion: 2,
  },
};
const restored = engine.rank({ ...settings, attacker:pinsir, simulation:{ ...settings.simulation, model:"piw" }, measurements, objective:"xp" });
assert(restored.length>0,"restored map model produces recommendations from the game catalog");
assert(restored.some(row=>row.simulation?.samples===256&&row.simulation.kph>0&&row.kphSource==="calibrated"),"256 scenarios use the original map productivity table");
const restoredMeasured = restored.find(row=>row.hunt.sl==="enigmatic_girafarig");
assert.equal(restoredMeasured.xph,5596835,"actual Girafarig hourly XP overrides the restored model");
assert.equal(restoredMeasured.kph,276,"actual kills per hour override the map table");
assert.equal(restoredMeasured.observedHits,1.5,"actual hits per kill remain authoritative");
const rows = engine.rank({
  ...settings,
  attacker: pinsir,
  measurements,
  xpMultiplier: 1.5,
});
assert(rows.length > 0);
assert(
  rows.every((row) => row.hunt.level === 150),
  "a Lv361 leader cannot receive a Lv50 map",
);
const actual = rows.find((row) => row.hunt.sl === "enigmatic_girafarig");
assert(actual);
assert.equal(
  actual.xph,
  5596835,
  "server-derived hourly XP is never multiplied a second time",
);
assert.equal(actual.kph, 276);
assert.equal(actual.observedHits, 1.5);
assert.equal(actual.kphSource, "measured");
const gold = engine
  .rank({ ...settings, attacker: pinsir, measurements, objective: "gold" })
  .find((row) => row.hunt.sl === "enigmatic_girafarig");
assert.equal(
  gold.gph,
  1234,
  "measured balance is not charged for supplies twice",
);
const zero = engine
  .rank({
    ...settings,
    attacker: pinsir,
    measurements: {
      "enigmatic girafarig": { ...measurements["enigmatic girafarig"], xph: 0 },
    },
    xpMultiplier: 1.5,
  })
  .find((row) => row.hunt.sl === "enigmatic_girafarig");
assert.equal(zero.xph, 0, "valid observed zero XP remains zero");
const young = engine.rank({
  ...settings,
  attacker: {
    sp: "pupitar",
    level: 17,
    tlv: 569,
    q: 1.33,
    ivt: 176,
    t1: "ROCK",
    t2: "GROUND",
    tms: [],
  },
});
assert(young.length > 0);
assert(
  young.every((row) => row.hunt.level <= 17 && row.simulation.samples === 256),
);
for (const row of young.filter((row) => row.kph != null))
  assert.equal(
    row.xph,
    row.kph * row.hunt.xp,
    "official per-kill XP and own cadence are combined once",
  );
const expected = { cid: "fixture", id: "leader", level: 17 };
assert.equal(
  engine.travelScript(expected, { sl: "bad');execute()", level: 10 }),
  null,
);
assert.equal(
  engine.lootValue(
    [{ name: "Coin", chance: 50000, minCount: 1, maxCount: 3 }],
    [{ name: "Coin", npcPrice: 10 }],
  ),
  10,
);
console.log(
  "Independent recommendations: 450 real maps, variant sprites, progression, measured XP/profit and local scenarios passed.",
);
