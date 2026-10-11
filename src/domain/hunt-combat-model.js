(function publishCombat(root) {
  "use strict";
  const positive = (value) =>
    Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value) : 0;
  function damage(power, attack, defense, effectiveness, wild = false) {
    const values = [power, attack, defense, effectiveness].map(positive);
    return values.some((value) => !value)
      ? 0
      : ((values[0] * values[1] * values[3]) / (30 * (1 + values[2] / 100))) *
          (wild ? 1.8 : 1);
  }
  function attack(attacker, hunt, stats, catalog, effectiveness) {
    const options = [];
    for (const move of catalog.moves?.[attacker.sp]?.a || []) {
      if (
        move[5] > attacker.level ||
        !positive(move[1]) ||
        !positive(move[4]) ||
        (move[6] && !(attacker.tms === true || attacker.tms?.includes(move[6])))
      )
        continue;
      const advantage = effectiveness(move[2], hunt.t1, hunt.t2),
        eff =
          advantage > 1
            ? 1 + (advantage - 1) * 1.5
            : advantage < 1
              ? advantage / 1.5
              : 1;
      const fis = move[3] === "P";
      const amount = damage(
        move[1],
        fis ? stats.atk : stats.spa,
        fis ? hunt.combatStats?.def : hunt.combatStats?.spd,
        eff,
      );
      if (!positive(hunt.combatHp) || !positive(amount)) continue;
      const fraction = amount / hunt.combatHp;
      options.push({
        nome: move[0],
        fis,
        eff,
        tm: move[6] || "",
        mg: fraction,
        damage: amount,
        ritmo: Math.min(1, fraction),
        xph: Math.min(1, fraction) * positive(hunt.xp),
        cooldownMs: Number(move[4]),
      });
    }
    return options.sort((a, b) => b.damage - a.damage)[0] || null;
  }
  function throughput(timing, counts) {
    const interval = positive(timing?.hitIntervalMs),
      spawn = positive(timing?.spawnDelayMs);
    if (
      !interval ||
      !Array.isArray(counts) ||
      !counts.length ||
      counts.some((value) => !Number.isFinite(value) || value < 1)
    )
      return null;
    const expectedMilliseconds =
      counts.reduce((sum, value) => sum + value * interval + spawn, 0) /
      counts.length;
    return expectedMilliseconds > 0 ? 3600000 / expectedMilliseconds : null;
  }
  function capture(sale, items) {
    if (!(sale > 0))
      return { perKill: 0, ballCost: 0, probability: 0, ball: "" };
    const options = (items || [])
      .filter(
        (item) =>
          item.captureProbability != null &&
          Number.isFinite(Number(item.captureProbability)) &&
          Number(item.captureProbability) >= 0 &&
          Number(item.captureProbability) <= 1 &&
          positive(item.npcPrice),
      )
      .map((item) => ({
        perKill: sale * Number(item.captureProbability),
        ballCost: Number(item.npcPrice),
        probability: Number(item.captureProbability),
        ball: String(item.name || ""),
      }));
    return (
      options.sort(
        (a, b) => b.perKill - b.ballCost - (a.perKill - a.ballCost),
      )[0] || null
    );
  }
  const api = {
    damage,
    attack,
    throughput,
    capture,
    source: "official-move-cadence-and-account-measurements",
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.PokeMuxHuntCombatModel = api;
})(globalThis);
