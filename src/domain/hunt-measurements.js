(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PokeMuxHuntMeasurements = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
  const finite = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };
  const textKey = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
  const huntKey = (value) => String(value || '').toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);

  function pokemonIdentity(pokemon) {
    if (!pokemon || typeof pokemon !== 'object') return '';
    const id = textKey(pokemon.id);
    const species = Math.trunc(finite(pokemon.sid));
    const name = textKey(pokemon.name);
    if (!id && !species && !name) return '';
    return id || [species || name, pokemon.shiny ? 's' : 'n', finite(pokemon.ivt), finite(pokemon.q)].join(':');
  }

  function pokemonLevel(pokemon) {
    return Math.max(1, Math.trunc(finite(pokemon && pokemon.level)));
  }

  function pokemonKey(pokemon) {
    const identity = pokemonIdentity(pokemon);
    return identity ? identity + '@lv' + pokemonLevel(pokemon) : '';
  }

  function statsFor(store, accountId, pokemon) {
    const account = String(accountId || '');
    const key = pokemonKey(pokemon);
    if (!account || !key || !store || typeof store !== 'object' || !own(store, account)) return {};
    const byPokemon = store[account];
    return byPokemon && typeof byPokemon === 'object' && own(byPokemon, key) && byPokemon[key] && typeof byPokemon[key] === 'object'
      ? byPokemon[key] : {};
  }

  // O nível continua gravado em cada amostra. Para recomendações, porém, uma subida de nível
  // não apaga o conhecimento do mesmo Pokémon: hunts ausentes no nível atual usam o nível mais
  // próximo (até 5 níveis). Uma hunt medida nos dois níveis ajusta o XP/h antigo ao ritmo atual.
  function recommendationStatsFor(store, accountId, pokemon, maxLevelDistance) {
    const account = String(accountId || '');
    const identity = pokemonIdentity(pokemon);
    const level = pokemonLevel(pokemon);
    const limit = maxLevelDistance == null ? 5 : Math.max(0, Math.trunc(finite(maxLevelDistance)));
    if (!account || !identity || !store || typeof store !== 'object' || !own(store, account)) return {};
    const byPokemon = store[account];
    if (!byPokemon || typeof byPokemon !== 'object') return {};
    const prefix = identity + '@lv';
    const exact = byPokemon[prefix + level];
    const result = exact && typeof exact === 'object' ? Object.fromEntries(Object.entries(exact).map(([hunt,stat])=>[hunt,
      stat && stat.metricVersion === 2 ? stat : {...stat,estimated:true,legacy:true}])) : {};
    const chosen = {};

    Object.keys(byPokemon).forEach(key => {
      if (!key.startsWith(prefix)) return;
      const sourceLevel = Math.trunc(finite(key.slice(prefix.length)));
      const distance = Math.abs(sourceLevel - level);
      const group = byPokemon[key];
      if (!sourceLevel || !distance || distance > limit || !group || typeof group !== 'object') return;

      const ratios = [];
      if (exact && typeof exact === 'object') Object.keys(exact).forEach(hunt => {
        const here = exact[hunt], there = group[hunt];
        if (here && there && finite(here.xph) > 0 && finite(there.xph) > 0) ratios.push(finite(here.xph) / finite(there.xph));
      });
      ratios.sort((a, b) => a - b);
      const ratio = ratios.length ? Math.max(0.5, Math.min(2, ratios[Math.floor(ratios.length / 2)])) : 1;

      Object.keys(group).forEach(hunt => {
        if (exact && own(exact, hunt)) return;
        const stat = group[hunt];
        if (!stat || typeof stat !== 'object') return;
        const previous = chosen[hunt];
        if (previous && (previous.distance < distance || (previous.distance === distance && finite(previous.t) >= finite(stat.t)))) return;
        chosen[hunt] = { distance, t: stat.t };
        result[hunt] = {
          ...stat,
          xph: Math.round(finite(stat.xph) * ratio),
          sourceLevel,
          levelDistance: distance,
          estimated: true,
          legacy: stat.metricVersion !== 2,
          normalized: ratio !== 1
        };
      });
    });
    return result;
  }

  function totals(metrics) {
    const seconds = Math.max(0, finite(metrics && metrics.seconds));
    return {
      seconds,
      gold: finite(metrics && metrics.gph) * seconds / 3600,
      xp: metrics && metrics.xpg != null ? finite(metrics.xpg) : finite(metrics && metrics.xph) * seconds / 3600,
      kills: metrics && metrics.kills != null ? finite(metrics.kills) : finite(metrics && metrics.kph) * seconds / 3600,
      hits: metrics && metrics.hits != null ? finite(metrics.hits) : null,
      epoch: metrics && metrics.epoch != null ? String(metrics.epoch) : '',
      captures: Math.max(0, finite(metrics && metrics.captures)),
      lootGold: metrics && metrics.lootGold != null ? finite(metrics.lootGold) : null,
      capturesGold: metrics && metrics.capturesGold != null ? finite(metrics.capturesGold) : null,
      supplyGold: metrics && metrics.supplyGold != null ? finite(metrics.supplyGold) : null
    };
  }

  function isolateSample(contexts, panelIndex, accountId, hunt, pokemon, metrics, now, minimumSeconds) {
    const account = String(accountId || '');
    const hKey = huntKey(hunt);
    const pKey = pokemonKey(pokemon);
    if (!Array.isArray(contexts) || !account || !hKey || !pKey || !metrics) return null;
    const current = totals(metrics);
    const contextKey = account + '|' + pKey + '|' + hKey;
    const previous = contexts[panelIndex];
    if (!previous || previous.key !== contextKey || current.epoch !== previous.base.epoch || current.seconds < previous.base.seconds || current.xp < previous.base.xp || current.kills < previous.base.kills) {
      contexts[panelIndex] = { key: contextKey, base: current };
      return null;
    }
    const elapsed = current.seconds - previous.base.seconds;
    if (elapsed < (minimumSeconds == null ? 300 : Math.max(1, finite(minimumSeconds)))) return null;
    const perHour = (value) => Math.round(value / elapsed * 3600);
    const kills = current.kills - previous.base.kills;
    const perKill = key => kills > 0 && current[key] != null && previous.base[key] != null
      ? Math.max(0, current[key] - previous.base[key]) / kills : null;
    const sample = {
      account, pokemonKey: pKey, huntKey: hKey,
      metrics: {
        seconds: elapsed,
        gph: perHour(current.gold - previous.base.gold),
        xph: perHour(current.xp - previous.base.xp),
        kph: perHour(current.kills - previous.base.kills),
        cph: Math.max(0, current.captures - previous.base.captures) / elapsed * 3600,
        hpk: current.hits != null && previous.base.hits != null && kills > 0
          ? Math.max(0,current.hits-previous.base.hits)/kills : Math.max(0, finite(metrics.hpk)),
        metricVersion: metrics.xpg != null && metrics.kills != null ? 2 : 1,
        lootPerKill: perKill('lootGold'),
        capturePerKill: perKill('capturesGold'),
        supplyPerKill: perKill('supplyGold')
      },
      now: Number.isFinite(Number(now)) ? Number(now) : Date.now()
    };
    // Each period is sampled once; repeated polling must not average the same
    // cumulative period again or retain the previous leader's hit count.
    contexts[panelIndex] = {key:contextKey,base:current};
    return sample;
  }

  function recordMeasurement(store, sample) {
    if (!store || typeof store !== 'object' || !sample) return false;
    const byAccount = store[sample.account] || (store[sample.account] = {});
    const byPokemon = byAccount[sample.pokemonKey] || (byAccount[sample.pokemonKey] = {});
    const m = sample.metrics, stored = byPokemon[sample.huntKey], old = stored?.metricVersion === m.metricVersion ? stored : null;
    const previousSeconds = finite(old?.sampleSeconds);
    const weight = old ? m.seconds / Math.max(1,Math.min(900,previousSeconds)+m.seconds) : 1;
    byPokemon[sample.huntKey] = old
      ? {
          gph: Math.round(finite(old.gph) * (1 - weight) + m.gph * weight),
          xph: Math.round(finite(old.xph) * (1 - weight) + m.xph * weight),
          cph: finite(old.cph) * (1 - weight) + m.cph * weight,
          kph: Math.round(finite(old.kph) * (1 - weight) + m.kph * weight),
          hpk: m.hpk > 0 ? Math.round(((finite(old.hpk) || m.hpk) * (1 - weight) + m.hpk * weight) * 10) / 10 : finite(old.hpk),
          n: Math.max(0, Math.trunc(finite(old.n))) + 1,
          t: sample.now
        }
      : { gph: m.gph, xph: m.xph, cph: m.cph, kph: m.kph, hpk: m.hpk, n: 1, t: sample.now };
    byPokemon[sample.huntKey].metricVersion=m.metricVersion;
    byPokemon[sample.huntKey].sampleSeconds=Math.min(900,previousSeconds)+m.seconds;
    for (const key of ['lootPerKill', 'capturePerKill', 'supplyPerKill']) {
      if (m[key] == null || !Number.isFinite(Number(m[key]))) continue;
      byPokemon[sample.huntKey][key] = old && old[key] != null
        ? finite(old[key]) * (1 - weight) + Number(m[key]) * weight : Number(m[key]);
    }

    const keys = Object.keys(byAccount);
    if (keys.length > 120) {
      keys.sort((a, b) => {
        const newest = (group) => Math.max(0, ...Object.values(group || {}).map(x => finite(x && x.t)));
        return newest(byAccount[a]) - newest(byAccount[b]);
      }).slice(0, keys.length - 120).forEach(key => { delete byAccount[key]; });
    }
    return true;
  }

  return { pokemonIdentity, pokemonLevel, pokemonKey, huntKey, statsFor, recommendationStatsFor, isolateSample, recordMeasurement };
});
