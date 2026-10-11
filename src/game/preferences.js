(function publishPreferences(root) {
  "use strict";
  function protectedSale(command, state, lockedItems = []) {
    const rows = state?.ws?.pokes?.list || [];
    const protectedPokemon = (command?.pokeIds || [])
      .map((id) => rows.find((row) => String(row.id) === String(id)))
      .filter((row) => row && (row.shiny || Number(row.quality) >= 1.7));
    const catalog = state?.api?.["/game/items.json"]?.items || [];
    const protectedNames = new Set(
      [
        "strange pheromone",
        "rare pokémon picture",
        "rare pokemon picture",
        ...lockedItems,
      ].map((value) => String(value).toLowerCase()),
    );
    const ids = [
      command?.itemId,
      ...(Array.isArray(command?.itemIds) ? command.itemIds : []),
    ].filter((value) => value != null);
    const protectedItems = ids
      .map((id) => catalog.find((row) => Number(row.id) === Number(id)))
      .filter(
        (row) => row && protectedNames.has(String(row.name).toLowerCase()),
      );
    return [...protectedPokemon, ...protectedItems].map((row) =>
      String(row.name || "#" + row.id),
    );
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { protectedSale };
    return;
  }
  if (root.PokeMuxGamePreferences) return;
  let options = {},
    sheet,
    lastFrame = 0,
    acceptedFrame = -1,
    frameId = 0;
  const nativeFrame = root.requestAnimationFrame.bind(root),
    nativeCancel = root.cancelAnimationFrame.bind(root),
    frames = new Map();
  root.requestAnimationFrame = function (callback) {
    const id = ++frameId;
    const deliver = (timestamp) => {
      const rate = Number(options.fps) || 0;
      if (
        rate > 0 &&
        timestamp !== acceptedFrame &&
        timestamp - lastFrame < 1000 / rate
      ) {
        frames.set(id, nativeFrame(deliver));
        return;
      }
      frames.delete(id);
      lastFrame = timestamp;
      acceptedFrame = timestamp;
      callback(timestamp);
    };
    frames.set(id, nativeFrame(deliver));
    return id;
  };
  root.cancelAnimationFrame = (id) => {
    if (frames.has(id)) {
      nativeCancel(frames.get(id));
      frames.delete(id);
    }
  };
  function configure(value) {
    options = { ...value };
    if (!sheet) {
      sheet = document.createElement("style");
      sheet.id = "pokemux-game-preferences";
      document.head.append(sheet);
    }
    const rules = [];
    if (options.summary)
      rules.push(
        "canvas,video{visibility:hidden!important}*{animation:none!important;transition:none!important}",
      );
    if (options.chat === false)
      rules.push(
        '.chat-float,.chat-panel,[data-guide="chat"]{display:none!important}',
      );
    if (options.dock === false)
      rules.push(
        '.dock,.game-dock,[data-guide="dock"]{opacity:0;pointer-events:none}',
      );
    if (options.clean)
      rules.push(
        ".auto-helper,.autohelper,.capture-popup,.game-hud{opacity:0!important}",
      );
    sheet.textContent = rules.join("\n");
  }
  const original = root.fetch.bind(root);
  root.fetch = async function (resource, init) {
    const url = new URL(
      typeof resource === "string"
        ? resource
        : resource?.url || String(resource),
      location.href,
    );
    const method = String(
      init?.method || resource?.method || "GET",
    ).toUpperCase();
    if (
      options.guard &&
      url.origin === location.origin &&
      method === "POST" &&
      /^\/api\/game\/(?:pokemon|item|items)\/sell(?:\/|$)/.test(url.pathname)
    ) {
      try {
        const text =
          typeof init?.body === "string"
            ? init.body
            : resource instanceof Request
              ? await resource.clone().text()
              : "";
        const names = protectedSale(
          JSON.parse(text),
          root.__poke,
          options.lockedItems || [],
        );
        if (
          names.length &&
          !confirm(
            "PokeMux: confirmar venda de " + names.slice(0, 8).join(", ") + "?",
          )
        )
          return new Response(
            JSON.stringify({ error: "Venda cancelada pelo usuário." }),
            { status: 409, headers: { "Content-Type": "application/json" } },
          );
      } catch (error) {
        if (error instanceof SyntaxError) {
        } else throw error;
      }
    }
    return original(resource, init);
  };
  root.PokeMuxGamePreferences = { configure };
})(globalThis);
