"use strict";
const assert = require("node:assert/strict");
const math = require("../src/domain/iv-math");
const reader = require("../src/game/iv-reader");
const session = require("../src/game/session");
const catalog = require("../src/domain/hunt-catalog");
let checks = 0;
for (const level of [1, 10, 15, 50, 150, 500, 650])
  for (const q of [0.85, 1, 1.33, 1.8])
    for (const base of [20, 95, 125])
      for (const key of math.STAT_KEYS) {
        const observed = math.projectStat(base, 17, level, q, key);
        const oracle = Array.from(
          { length: 32 },
          (_, index) => index + 1,
        ).filter(
          (iv) =>
            Math.round(
              (((base + 2 * iv) * level) / 100) *
                Math.pow(q, key === "hp" || key === "speed" ? 0.95 : 0.8),
            ) === observed,
        );
        assert.deepEqual(
          math.inferCandidates(observed, base, level, q, key),
          oracle,
        );
        checks++;
      }
assert.deepEqual(math.inferCandidates(10, 95, 0, 1, "hp"), []);
assert.deepEqual(math.inferCandidates(10, 95, 10, 0, "hp"), []);
const bases = { hp: 95, atk: 125, def: 79, spa: 60, spd: 100, vel: 81 };
const pokemon = {
  nome: "Gyarados",
  nivel: 138,
  multiplicadorQualidade: 1.53,
  ivAtual: 177,
  hp: 325,
  atk: 359,
  def: 262,
  spa: 221,
  spd: 310,
  vel: 296,
  poder: 2713,
};
const inferred = reader.calculate({ bases, pokemon }, math, {
  pokeId: 130,
  attacks: [
    {
      name: "Bite",
      power: 60,
      type: "DARK",
      category: "PHYSICAL",
      learnLevel: 1,
    },
    {
      name: "Hydro Pump",
      power: 110,
      type: "WATER",
      category: "SPECIAL",
      learnLevel: 50,
      tm: "TM001",
    },
  ],
});
assert.equal(inferred.ivTotal, 177);
assert.equal(inferred.poder, 2713);
assert.deepEqual(inferred.ivs, {
  hp: 31,
  atk: 30,
  def: 28,
  spa: 27,
  spd: 30,
  vel: 31,
});
assert.equal(inferred.golpes[1].tmAprendida, null);
const projected = reader.calculate({ bases, pokemon, nivel: 500 }, math, {
  pokeId: 130,
});
const tooltip = reader.parseTooltip({
  innerText:
    "Pinsir Lv361\n×1,78\nHP 9.504/9.504\nAtk 1.013\nDef 927\nSpA 475\nSpD 687\nSpeed 892\nIV 156",
  querySelectorAll: () => [],
});
assert.equal(tooltip.hp, 9504);
assert.equal(tooltip.atk, 1013);
assert.equal(tooltip.multiplicadorQualidade, 1.78);
assert.equal(projected.poder, 9824);
assert.deepEqual(projected.ivs, inferred.ivs);
assert.equal(
  reader.calculate({ bases, pokemon: { ...pokemon, atk: null } }, math, {})
    .erro,
  "missingConditions",
);
const state = session.createState(1000);
state.sock = { readyState: 1 };
state.api["/api/characters/me"] = {
  character: { id: "one", name: "Aurora", level: 500 },
};
session.reduce(state, { type: "field-init", slug: "gastly" }, 2000);
session.reduce(
  state,
  {
    type: "pokes",
    list: [
      {
        id: "existing",
        name: "Pupitar",
        team: true,
        leader: true,
        level: 15,
        quality: 1.33,
        ivTotal: 176,
        hp: 202,
        maxHp: 312,
        stats: { atk: 23, def: 25, spAtk: 24, spDef: 25 },
      },
    ],
  },
  2001,
);
session.reduce(
  state,
  {
    type: "field",
    hits: [
      { slot: 0, amount: 10, move: "Bite" },
      { slot: 0, amount: 12, move: "Bite" },
    ],
  },
  4000,
);
session.reduce(
  state,
  {
    type: "field-kill",
    xpGained: 68,
    loot: [{ itemId: 1, name: "Loot", qty: 2 }],
  },
  5000,
);
const snapshot = session.snapshot(state, 7000);
assert.equal(snapshot.a.kills, 1);
assert.equal(snapshot.a.xpg, 68);
assert.equal(snapshot.a.hits, 2);
assert.equal(snapshot.team[0].stats.spa, 24);
// Importing a Pokémon via the market is not counted as a capture.
session.reduce(
  state,
  { type: "poke-delta", poke: { id: "purchased", name: "Abra", ivTotal: 175 } },
  8000,
);
assert.equal(state.catchLog.length, 0);
session.reduce(state, { type: "catch-result", success: true }, 9000);
session.reduce(
  state,
  {
    type: "poke-delta",
    poke: {
      id: "caught",
      name: "Abra",
      ivTotal: 177,
      quality: 1.4,
      shiny: true,
      sellValue: 800,
    },
  },
  9500,
);
assert.equal(state.catchLog.length, 1);
assert.equal(state.sess.sellG, 800);
assert.equal(state.sess.shinyCapN, 1);
assert.equal(state.sess.shinyN, 1, "a captured shiny is also an encountered shiny");
session.reduce(state, { type: "poke-delta", poke: { id: "caught", shiny: true } }, 9600);
assert.equal(state.sess.shinyN, 1, "repeated inventory updates do not count another encounter");
session.reduce(state, { type: "field-kill", shiny: true, name: "Abra" }, 9700);
assert.equal(state.sess.shinyN, 2, "defeated and captured shinies both contribute to encounters");
assert.equal(state.sess.shinyCapN, 1);
session.reduce(state, { type: "field-init", slug: "slowpoke" }, 10000);
assert.equal(state.sess.kills, 0);
assert.equal(state.prev.kills, 2);
assert.notEqual(state.sess.epoch, state.prev.epoch);
session.reduce(
  state,
  {
    type: "analyzer",
    seconds: 300,
    kills: 20,
    xpGained: 1200,
    lootGold: 500,
    capturesGold: 800,
    supplyGold: 100,
    balance: 1200,
  },
  12000,
);
const measured = session.snapshot(state, 13000);
assert.equal(measured.a.xph, 14400);
assert.equal(measured.a.gph, 14400);
const creatures = [
  {
    pokeId: 92,
    name: "Gastly",
    baseHp: 30,
    baseAtk: 35,
    baseDef: 30,
    baseSpAtk: 100,
    baseSpDef: 35,
    baseSpeed: 80,
    huntLevel: 20,
    type1: "GHOST",
    type2: "POISON",
    experience: 68,
    sellValue: 400,
    attacks: [],
  },
  {
    pokeId: 13252,
    name: "Treecko",
    area: "orre",
    huntLevel: 500,
    orreXpMul: 2,
    experience: 100,
    sellValue: 1000,
    attacks: [],
  },
];
const maps = [
  { slug: "gastly", name: "Gastly", level: 20 },
  {
    slug: "orre-treecko",
    speciesId: 13252,
    name: "Treecko",
    area: "orre",
    level: 500,
  },
];
const result = catalog.assemble(creatures, maps, []);
assert.equal(result.h.length, 2);
assert.equal(result.h[1].pokeId, 13252);
assert.equal(result.h[1].xp, 200);
assert.equal(result.dex[13252], 252);
assert.deepEqual(result.bs.gastly, [30, 35, 30, 100, 35, 80]);
console.log(
  "Independent domain: " +
    checks +
    " IV interval cases and session/catalog regressions passed.",
);
