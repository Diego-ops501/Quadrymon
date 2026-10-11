/* PokeMux IV engine: interval inversion and bounded sum reachability. */
(function publish(scope) {
  "use strict";
  const keys = Object.freeze(["hp", "atk", "def", "spa", "spd", "speed"]);
  const exponents = Object.freeze(
    Object.fromEntries(
      keys.map((k) => [k, k === "hp" || k === "speed" ? 0.95 : 0.8]),
    ),
  );
  const numeric = (input) =>
    input !== null &&
    input !== undefined &&
    input !== "" &&
    Number.isFinite(Number(input))
      ? Number(input)
      : null;
  const table = (entries) => Object.fromEntries(entries);
  function projectStat(base, iv, level, quality, stat) {
    const args = [base, iv, level, quality].map(numeric);
    if (args.some((x) => x === null) || args[2] <= 0 || args[3] <= 0)
      return null;
    const scale = (args[2] * Math.pow(args[3], exponents[stat] ?? 0.8)) / 100;
    return Math.round(scale * (args[0] + args[1] * 2));
  }
  function inferCandidates(stat, base, level, quality, key) {
    const observed = numeric(stat),
      b = numeric(base),
      lv = numeric(level),
      q = numeric(quality);
    if (observed === null || b === null || !(lv > 0) || !(q > 0)) return [];
    const coefficient = (lv / 100) * Math.pow(q, exponents[key] ?? 0.8);
    // The rounded observation defines a half-open interval of integer IVs.
    const lower = Math.max(
      1,
      Math.ceil(((observed - 0.5) / coefficient - b) / 2 - 1e-10),
    );
    const upper = Math.min(
      32,
      Math.ceil(((observed + 0.5) / coefficient - b) / 2 + 1e-10),
    );
    return Array.from(
      { length: Math.max(0, upper - lower + 1) },
      (_, offset) => lower + offset,
    ).filter((iv) => projectStat(b, iv, lv, q, key) === observed);
  }
  function reachability(domains) {
    let bits = 1n;
    for (const domain of domains) {
      let next = 0n;
      for (const candidate of domain) next |= bits << BigInt(candidate);
      bits = next;
    }
    return bits;
  }
  function narrowed(domains, total) {
    if (!Number.isInteger(total) || total < 6 || total > 192) return domains;
    const all = reachability(domains);
    if (!(all & (1n << BigInt(total)))) return domains;
    return domains.map((domain, excluded) => {
      const others = reachability(domains.filter((_, at) => at !== excluded));
      return domain.filter(
        (iv) => total >= iv && Boolean(others & (1n << BigInt(total - iv))),
      );
    });
  }
  function fromTotal(total) {
    const number = numeric(total);
    if (!(number > 0))
      return {
        values: table(keys.map((k) => [k, 0])),
        ranges: table(keys.map((k) => [k, null])),
        source: "unknown",
        exact: false,
      };
    const sum = Math.min(192, Math.max(6, Math.round(number)));
    const quotient = Math.floor(sum / keys.length),
      remainder = sum % keys.length;
    const bounds = [Math.max(1, sum - 160), Math.min(32, sum - 5)];
    return {
      values: table(
        keys.map((k, at) => [k, quotient + Number(at < remainder)]),
      ),
      ranges: table(keys.map((k) => [k, bounds.slice()])),
      source: "total-scenario",
      exact: false,
    };
  }
  function normalizeIvs(input = {}) {
    if (keys.every((k) => numeric(input.ivs?.[k]) !== null)) {
      const values = table(
        keys.map((k) => [k, Math.min(32, Math.max(0, Number(input.ivs[k])))]),
      );
      return {
        values,
        ranges: table(keys.map((k) => [k, [values[k], values[k]]])),
        source: "individual",
        exact: true,
      };
    }
    const base = input.species?.baseStats;
    if (!base || !input.observedStats) return fromTotal(input.ivTotal);
    const groups = keys.map((k) =>
      inferCandidates(
        input.observedStats[k],
        base[k],
        input.level,
        input.quality,
        k,
      ),
    );
    if (groups.some((group) => !group.length)) return fromTotal(input.ivTotal);
    const domains = narrowed(groups, numeric(input.ivTotal));
    const exact = domains.every((domain) => domain.length === 1);
    return {
      values: table(
        keys.map((k, at) => [
          k,
          Math.round((domains[at][0] + domains[at].at(-1)) / 2),
        ]),
      ),
      ranges: table(
        keys.map((k, at) => [k, [domains[at][0], domains[at].at(-1)]]),
      ),
      source: exact ? "observed-exact" : "observed-range",
      exact,
    };
  }
  function projectPokemon(input = {}, level) {
    const iv = normalizeIvs(input),
      quality = Math.max(0.01, numeric(input.quality) || 1);
    const stats = table(
      keys.map((k) => [
        k,
        projectStat(
          input.species?.baseStats?.[k],
          iv.values[k],
          level,
          quality,
          k,
        ),
      ]),
    );
    const power = Object.values(stats).some((n) => n === null)
      ? null
      : Math.round(Object.values(stats).reduce((a, b) => a + b, 0) * quality);
    return {
      stats,
      power,
      ivs: iv.values,
      ivRanges: iv.ranges,
      ivSource: iv.source,
      ivExact: iv.exact,
    };
  }
  const api = Object.freeze({
    STAT_KEYS: keys,
    EXPONENTS: exponents,
    projectStat,
    inferCandidates,
    normalizeIvs,
    projectPokemon,
  });
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else scope.PokeMuxIvMath = api;
})(globalThis);
