(function publish(root) {
  "use strict";
  const key = (name) =>
    String(name || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/female|♀/g, "fe")
      .replace(/male|♂/g, "ma")
      .replace(/[^a-z0-9]/g, "");
  const region = (row) =>
    row.area ||
    (Number(row.pokeId) >= 10000 && Number(row.pokeId) < 11000
      ? "outland"
      : "");
  function assemble(creatures, markers, items) {
    const species = (creatures || []).filter(
        (row) => row && row.name && row.pokeId,
      ),
      bases = {},
      moves = {},
      byId = {},
      dex = {};
    for (const row of species) {
      const name = String(row.name).toLowerCase().trim(),
        id = Number(row.pokeId);
      byId[id] = row.name;
      if (!bases[name] || id < 10000) {
        bases[name] = [
          "baseHp",
          "baseAtk",
          "baseDef",
          "baseSpAtk",
          "baseSpDef",
          "baseSpeed",
        ].map((field) => Number(row[field]) || 0);
        moves[name] = {
          id,
          hl: Number(row.huntLevel) || 0,
          t: [
            String(row.type1 || "").toUpperCase(),
            String(row.type2 || "").toUpperCase(),
          ],
          a: (row.attacks || []).map((move) => [
            String(move.name || ""),
            Number(move.power) || 0,
            String(move.type || "").toUpperCase(),
            String(move.category).toUpperCase() === "PHYSICAL" ? "P" : "S",
            Number(move.cooldownMs) || 0,
            Number(move.learnLevel) || 0,
            String(move.tm || "").toUpperCase(),
          ]),
        };
      }
      if (id >= 13000 && id < 14000) dex[id] = id - 13000;
    }
    const normal = species.filter((row) => Number(row.pokeId) < 10000);
    for (const row of species.filter(
      (row) => Number(row.pokeId) >= 10000 && !dex[row.pokeId],
    )) {
      const suffix = key(row.name),
        match = normal
          .filter((candidate) => suffix.includes(key(candidate.name)))
          .sort((a, b) => b.name.length - a.name.length)[0];
      if (match) dex[row.pokeId] = Number(match.pokeId);
      else {
        const special = {
          castformfire: 351,
          nightmaregalariandarumaka: 554,
          nightmaregalariandarmanitan: 555,
          nightmarepyroarfe: 668,
        };
        if (special[suffix]) dex[row.pokeId] = special[suffix];
      }
    }
    const list = Array.isArray(markers)
      ? markers
      : markers?.markers || markers?.hunts || [];
    const hunts = [];
    for (const marker of list) {
      const label = String(
        marker.hunt || marker.name || marker.title || marker.slug || "",
      );
      const named = key(label),
        areaHint = marker.area === "kanto" ? "" : String(marker.area || ""),
        matched =
          species.find(
            (row) =>
              Number(marker.speciesId || marker.pokeId) === Number(row.pokeId),
          ) ||
          species
            .filter(
              (row) =>
                named.includes(key(row.name)) &&
                (!marker.area || region(row) === areaHint),
            )
            .sort(
              (a, b) =>
                named.indexOf(key(a.name)) - named.indexOf(key(b.name)) ||
                b.name.length - a.name.length,
            )[0];
      if (!matched || !marker.slug) continue;
      const area = String(
          marker.area === "kanto" ? "" : marker.area || region(matched),
        ),
        xp = Number(matched.experience ?? matched.xp) || 0;
      hunts.push({
        sl: String(marker.slug),
        name: label.replace(/[_-]/g, " "),
        sp: String(matched.name).toLowerCase().trim(),
        pokeId: Number(matched.pokeId),
        level:
          Number(
            marker.level || marker.lvl || marker.minLevel || matched.huntLevel,
          ) || 0,
        blocked:
          marker.locked === true ||
          marker.unlocked === false ||
          marker.available === false ||
          marker.disabled === true,
        t1: String(matched.type1 || "").toUpperCase(),
        t2: String(matched.type2 || "").toUpperCase(),
        ar: area,
        spawnDelayMs: Math.max(0, Number(marker.spawnDelayMs) || 0),
        xp: Math.round(
          xp *
            (area === "orre" && Number(matched.orreXpMul) > 0
              ? Number(matched.orreXpMul)
              : 1),
        ),
        sv: Number(matched.sellValue ?? matched.priceNpc) || 0,
        drops: matched.loot || [],
        loot: (matched.loot || []).map((drop) => drop.name || drop),
      });
    }
    return { h: hunts, bs: bases, mv: moves, byId, dex, items: items || [] };
  }
  async function read() {
    const state = window.__poke;
    const load = async (name) => {
      const path = "/game/" + name + ".json",
        cached = state?.api?.[path];
      if (Array.isArray(cached?.[name])) return cached[name];
      const storageKey = "pokemux-official-hunts-v2-" + name;
      let disk;
      try {
        disk = JSON.parse(localStorage.getItem(storageKey));
      } catch {}
      if (Array.isArray(disk?.data) && Date.now() - disk.at < 86400000) {
        if (state?.api) state.api[path] = { [name]: disk.data };
        return disk.data;
      }
      try {
        const response = await fetch(path, {
          signal: AbortSignal.timeout(12000),
        });
        if (!response.ok) throw Error("catalog");
        const data = await response.json();
        if (!Array.isArray(data[name])) throw Error("catalog");
        if (state?.api) state.api[path] = data;
        try {
          localStorage.setItem(
            storageKey,
            JSON.stringify({ at: Date.now(), data: data[name] }),
          );
        } catch {}
        return data[name];
      } catch (error) {
        if (Array.isArray(disk?.data)) {
          if (state?.api) state.api[path] = { [name]: disk.data };
          return disk.data;
        }
        throw error;
      }
    };
    const [creatures, items, response] = await Promise.all([
      load("creatures"),
      load("items"),
      fetch("/api/game/map-markers", {
        headers: state?.auth ? { Authorization: state.auth } : undefined,
        signal: AbortSignal.timeout(12000),
      }),
    ]);
    if (!response.ok) throw Error("maps");
    const mobs = (state?.ws?.field?.mobs || []).map((row) => ({
      ...row,
      stats: {
        ...row.stats,
        spa: row.stats?.spa ?? row.stats?.spAtk,
        spd: row.stats?.spd ?? row.stats?.spDef,
      },
    }));
    return {
      creatures,
      items,
      markers: await response.json(),
      combat: { slug: state?.hunting ? state.currentMap : "", mobs },
    };
  }
  const api = { assemble, read };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.PokeMuxHuntCatalog = api;
})(globalThis);
