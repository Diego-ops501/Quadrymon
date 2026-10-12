(function installIvReader(root) {
  "use strict";
  const labels = ["hp", "atk", "def", "spa", "spd", "vel"];
  const statFields = [
    "baseHp",
    "baseAtk",
    "baseDef",
    "baseSpAtk",
    "baseSpDef",
    "baseSpeed",
  ];
  const cleanName = (value) =>
    String(value || "")
      .replace(/\bshiny\b/gi, "")
      .replace(/[✨⭐]/g, "")
      .replace(/_+/g, " ")
      .replace(/\b(?:lv|lvl|nv|nível|level)[.\s]*\d+.*$/i, "")
      .trim()
      .toLowerCase();
  const number = (value) => {
    if (value == null || value === "") return null;
    const match = String(value).match(/-?\d+(?:[.,]\d+)?/);
    return match ? Number(match[0].replace(",", ".")) : null;
  };
  const statNumber = (value) =>
    number(String(value ?? "").replace(/[.,](?=\d{3}(?:\D|$))/g, ""));
  function parseTooltip(element) {
    const text = String(element?.innerText || element?.textContent || "");
    const level = text.match(/(?:\bLv(?:l)?\.?|\bNv\.?|Nível|Level)\s*(\d+)/i);
    const quality = text.match(
      /(?:[×x]|Quality\s*:?|Qualidade\s*:?)\s*(\d+[.,]\d+)/i,
    );
    if (!level || !quality) return null;
    const lines = text
      .split(/\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    const stats = {};
    const cells = [
      ...element.querySelectorAll(".statcell, .inv-stat, [data-stat], .mkt2-statcell"),
    ];
    if (cells.length >= 6)
      labels.forEach((key, index) => {
        const numbers = String(
          cells[index].innerText || cells[index].textContent,
        ).match(/\d+(?:[.,]\d+)*/g);
        stats[key] = numbers?.length ? statNumber(numbers.at(-1)) : null;
      });
    const patterns = {
      hp: /(?:\bHP|Vida)\s*:?\s*(\d+)(?:\s*\/\s*(\d+))?/i,
      atk: /(?:\bAtk|\bAtaque|\bAttack)\s*:?\s*(\d+)/i,
      def: /(?:\bDef|\bDefesa|\bDefense)\s*:?\s*(\d+)/i,
      spa: /(?:\bSpA|\bSpAtk|Ataque especial|Special attack)\s*:?\s*(\d+)/i,
      spd: /(?:\bSpD|\bSpDef|Defesa especial|Special defense)\s*:?\s*(\d+)/i,
      vel: /(?:\bVel|\bSpe|\bSpeed|Velocidade)\s*:?\s*(\d+)/i,
    };
    for (const key of labels)
      if (stats[key] == null) {
        const groupedText = text.replace(/(\d)[.,](?=\d{3}(?:\D|$))/g, "$1");
        const match = groupedText.match(patterns[key]);
        stats[key] = match
          ? statNumber(key === "hp" && match[2] ? match[2] : match[1])
          : null;
      }
    if (labels.some((key) => stats[key] == null)) return null;
    const heading = element.querySelector?.(".mkt2-details-name, .mkt2-card-name, .inv-tip-name");
    const headingName = heading && [...(heading.childNodes || [])].filter(node => node.nodeType === 3).map(node => node.textContent).join("").trim();
    return {
      nome: String(headingName || heading?.textContent || lines[0]).replace(/\s*(?:Lv|Nv)\.?\s*\d+.*$/i, "").replace(/[✨⭐]/g, "").trim(),
      nivel: Number(level[1]),
      multiplicadorQualidade: number(quality[1]),
      ivAtual: number(text.match(/\bIV(?:\s*total)?\s*:?\s*(\d+)/i)?.[1]),
      shiny: /✨|\bshiny\b/i.test(text),
      poder: number(text.match(/(?:Poder|Power)\D*(\d+)/i)?.[1]),
      ...stats,
    };
  }
  function calculate(input, math, species) {
    const pokemon = input?.pokemon;
    if (!pokemon) return null;
    const bases =
      input.bases ||
      (species &&
        Object.fromEntries(
          labels.map((key, index) => [key, Number(species[statFields[index]])]),
        ));
    if (!bases) return { erro: "noSpecies", nome: pokemon.nome };
    const quality = number(input.qualidade ?? pokemon.multiplicadorQualidade);
    const actualLevel = number(pokemon.nivel),
      level = number(input.nivel ?? actualLevel);
    const observation = input.atuais || pokemon;
    if (
      !(actualLevel > 0 && level > 0 && quality > 0) ||
      labels.some(
        (key) => number(bases[key]) == null || number(observation[key]) == null,
      )
    )
      return { erro: "missingConditions", nome: pokemon.nome };
    const keys = math.STAT_KEYS;
    const source = {
      level: actualLevel,
      quality,
      ivTotal: pokemon.ivAtual,
      species: {
        baseStats: Object.fromEntries(
          keys.map((key, index) => [key, bases[labels[index]]]),
        ),
      },
      observedStats: Object.fromEntries(
        keys.map((key, index) => [key, number(observation[labels[index]])]),
      ),
    };
    const normalized = math.normalizeIvs(source),
      projected = math.projectPokemon(
        { ...source, ivs: normalized.values },
        level,
      );
    const ivs = Object.fromEntries(
      labels.map((key, index) => [key, normalized.values[keys[index]]]),
    );
    const total =
      number(pokemon.ivAtual) ??
      Object.values(ivs).reduce((sum, n) => sum + n, 0);
    const learned = Array.isArray(pokemon.tms)
      ? new Set(pokemon.tms.map((tm) => String(tm).toUpperCase()))
      : null;
    const shiny = !!pokemon.shiny || /\bshiny\b/i.test(pokemon.nome);
    let id = Number(species?.pokeId || 0);
    if (id >= 13000 && id < 14000) id -= 13000;
    const still =
      id > 0 && id < 10000
        ? "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/" +
          (shiny ? "shiny/" : "") +
          id +
          ".png"
        : "";
    return {
      nome: pokemon.nome,
      nivel: level,
      qualidade: quality,
      tipos: bases.tipos || [species?.type1, species?.type2].filter(Boolean),
      shiny,
      bases,
      atuais: Object.fromEntries(
        labels.map((key) => [key, number(observation[key])]),
      ),
      ivs,
      ivRanges: normalized.ranges,
      ivExact: normalized.exact,
      ivTotal: total,
      ivMax: 192,
      ivMaxInd: 32,
      percentual: (total / 192) * 100,
      poder: projected.power,
      poderJogo: pokemon.poder || 0,
      sprite: still ? { still, anim: still } : null,
      pokemon: { ...pokemon },
      golpes: (species?.attacks || [])
        .slice(0, 64)
        .map((move) => ({
          nome: move.name,
          tipo: move.type,
          categoria: move.category,
          poder: move.power,
          nivel: move.learnLevel,
          tm: move.tm || "",
          tmAprendida:
            move.tm && learned
              ? learned.has(String(move.tm).toUpperCase())
              : null,
          dano: 0,
          eff: 0,
          ativo: false,
        })),
      classificacao: {
        texto: normalized.exact
          ? "IV individual confirmado"
          : "IV individual estimado",
        descricao: "Faixas obtidas dos atributos observados no nível atual.",
        cor: normalized.exact ? "#3fb950" : "#e9bf67",
      },
    };
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { parseTooltip, calculate, cleanName };
    return;
  }
  if (root.__pokemuxIv) return;
  let catalogJob,
    serial = 0,
    selected = null,
    point = null,
    scheduled = null,
    currentTarget = null;
  const active = () => root.__pgIvHoverEnabled !== false;
  async function catalog() {
    const state = root.__poke;
    if (Array.isArray(state?.api?.["/game/creatures.json"]?.creatures))
      return state.api["/game/creatures.json"].creatures;
    if (!catalogJob)
      catalogJob = fetch("/game/creatures.json", {
        signal: AbortSignal.timeout(12000),
      })
        .then((response) => {
          if (!response.ok) throw Error("catalog");
          return response.json();
        })
        .then((data) => {
          if (!Array.isArray(data.creatures)) throw Error("catalog");
          if (state?.api) state.api["/game/creatures.json"] = data;
          return data.creatures;
        })
        .catch((error) => {
          catalogJob = null;
          throw error;
        });
    return catalogJob;
  }
  const sendPosition = (on) =>
    console.log(
      "__PGIVH__" +
        JSON.stringify({
          ativo: on,
          id: serial,
          x: point?.x || 0,
          y: point?.y || 0,
          width: innerWidth,
          height: innerHeight,
        }),
    );
  function hide() {
    serial++;
    selected = null;
    currentTarget?.removeAttribute("data-pg-iv-replaced");
    currentTarget = null;
    sendPosition(false);
  }
  async function calc(input) {
    try {
      const pokemon = input?.pokemon || selected;
      if (!pokemon) return null;
      const definitions = await catalog();
      const species =
        definitions.find(
          (candidate) =>
            pokemon.speciesId &&
            Number(candidate.pokeId) === Number(pokemon.speciesId),
        ) ||
        definitions.find(
          (candidate) => cleanName(candidate.name) === cleanName(pokemon.nome),
        );
      return calculate({ ...input, pokemon }, root.PokeMuxIvMath, species);
    } catch {
      return {
        erro: "catalogUnavailable",
        nome: input?.pokemon?.nome || selected?.nome,
      };
    }
  }
  async function inspect() {
    scheduled = null;
    if (!active() || !point) return;
    const hovered = document.elementFromPoint(point.x, point.y)?.closest(".mkt2-card, .mkt2-trow, .mkt2-details");
    const targets = [
      ...document.querySelectorAll(".inv-tip, .market-details"),
    ];
    if (hovered?.matches(".mkt2-card")) targets.unshift(hovered);
    if (hovered?.matches(".mkt2-details") || hovered?.classList.contains("sel")) targets.push(...document.querySelectorAll(".mkt2-details"));
    let target, pokemon;
    for (const element of targets) {
      if (!element.getClientRects().length || getComputedStyle(element).visibility === "hidden") continue;
      const parsed = parseTooltip(element);
      if (parsed) { target = element; pokemon = parsed; break; }
    }
    if (!pokemon) {
      if (selected) hide();
      return;
    }
    const fingerprint = JSON.stringify(pokemon);
    if (fingerprint === selected?.fingerprint) {
      sendPosition(true);
      return;
    }
    hide();
    selected = { ...pokemon, fingerprint };
    currentTarget = target;
    const token = serial;
    sendPosition(true);
    const result = await calc({ pokemon });
    if (
      token !== serial ||
      !active() ||
      !target.isConnected ||
      !target.getClientRects().length
    )
      return;
    if (result && !result.erro) target.setAttribute("data-pg-iv-replaced", "");
    console.log("__PGIV__" + JSON.stringify({ ...result, hoverId: token }));
  }
  const api = Object.freeze({
    calc,
    setEnabled(on) {
      root.__pgIvHoverEnabled = !!on;
      hide();
    },
    reportar: inspect,
  });
  root.__pokemuxIv = api;
  root.__pgIv = api; // Existing app protocol; compatibility name contains no external implementation.
  const schedule = () => {
    if (scheduled === null) scheduled = setTimeout(inspect, 60);
  };
  document.addEventListener(
    "mousemove",
    (event) => {
      point = { x: event.clientX, y: event.clientY };
      if (selected) sendPosition(true);
      schedule();
    },
    true,
  );
  document.addEventListener("click", schedule, true);
  document.documentElement.addEventListener("mouseleave", hide);
  root.addEventListener("blur", hide);
  root.addEventListener("pagehide", hide);
  new MutationObserver(schedule).observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true,
  });
})(globalThis);
