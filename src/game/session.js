(function publishSession(root) {
  "use strict";
  const finite = (value) =>
    Number.isFinite(Number(value)) ? Number(value) : 0;
  function newPeriod(slug, timestamp) {
    return {
      slug,
      start: timestamp,
      epoch: String(timestamp),
      kills: 0,
      xp: 0,
      hits: 0,
      captures: 0,
      shinyN: 0,
      shinyCapN: 0,
      sellG: 0,
      supGold: 0,
      balls: 0,
      drops: {},
      lastKillT: 0,
    };
  }
  function createState(now = Date.now()) {
    return {
      api: {},
      ws: {},
      sess: newPeriod("", now),
      prev: null,
      hunting: false,
      currentMap: "",
      lastSlug: "",
      fiT: 0,
      lastFieldT: 0,
      lastCombatT: 0,
      catchLog: [],
      shinyLog: [],
      knownIds: new Set(),
      bagInitialized: false,
      pendingCatch: 0,
      socketEpoch: 0,
    };
  }
  function reduce(state, message, timestamp = Date.now()) {
    if (!message || typeof message.type !== "string") return;
    const period = state.sess;
    switch (message.type) {
      case "field-init": {
        const slug = String(message.slug || "");
        if (slug !== state.lastSlug) {
          state.prev = { ...period, end: timestamp };
          state.sess = newPeriod(slug, timestamp);
          delete state.ws.analyzer;
          state.analyzerBase = null;
        }
        state.lastSlug = state.currentMap = slug;
        state.hunting = true;
        state.fiT = timestamp;
        break;
      }
      case "field": {
        state.lastFieldT = timestamp;
        const hits = (message.hits || []).filter(
          (hit) => hit && finite(hit.slot) >= 0 && finite(hit.amount) > 0,
        );
        const grouped = new Map();
        for (const hit of hits) {
          const slots = grouped.get(hit.move) || new Set();
          slots.add(hit.slot);
          grouped.set(hit.move, slots);
        }
        for (const hit of hits)
          if (!hit.move || grouped.get(hit.move).size === 1) period.hits++;
        if (hits.length) state.lastCombatT = timestamp;
        break;
      }
      case "field-kill": {
        period.kills++;
        period.xp += Math.max(0, finite(message.xpGained));
        period.lastKillT = state.lastCombatT = timestamp;
        if (message.shiny) {
          period.shinyN++;
          state.shinyLog.push({
            n: String(message.speciesName || message.name || ""),
            sid: finite(message.speciesId || message.pokeId),
            t: timestamp,
            def: 1,
          });
        }
        for (const item of message.loot || []) {
          const key = String(item.itemId);
          const row = (period.drops[key] ||= {
            name: String(item.name || "#" + key),
            qty: 0,
          });
          row.qty += Math.max(0, finite(item.qty));
        }
        break;
      }
      case "catch-result": {
        period.balls++;
        const ball = state.ws.balls?.catalog?.find(
          (row) => String(row.id) === String(message.ballId),
        );
        if (ball && !ball.infinite)
          period.supGold += Math.max(0, finite(ball.priceGold));
        if (message.success) {
          period.captures++;
          state.pendingCatch++;
        }
        break;
      }
      case "poke-delta": {
        const row = message.poke,
          list = state.ws.pokes?.list;
        if (row && Array.isArray(list)) {
          const old = list.find(
            (candidate) => String(candidate.id) === String(row.id),
          );
          if (old) Object.assign(old, row);
          else list.push(row);
        }
        if (row) observePokemon(state, [row], timestamp);
        break;
      }
      case "pokes":
        observePokemon(state, message.list || [], timestamp);
        state.bagInitialized = true;
        break;
      case "set-city":
      case "city":
      case "leave-hunt":
      case "exit-hunt":
      case "field-none":
      case "field-lost":
      case "field-teleport-city":
        state.hunting = false;
        state.huntLeftT = timestamp;
        if (message.slug) state.currentMap = message.slug;
        break;
    }
    state.ws[message.type] = message;
    if (state.catchLog.length > 500)
      state.catchLog.splice(0, state.catchLog.length - 500);
    if (state.shinyLog.length > 100)
      state.shinyLog.splice(0, state.shinyLog.length - 100);
  }
  function observePokemon(state, rows, at) {
    for (const row of rows) {
      const id = String(row.id);
      if (
        !state.knownIds.has(id) &&
        state.bagInitialized &&
        state.pendingCatch > 0
      ) {
        state.pendingCatch--;
        state.sess.sellG += Math.max(0, finite(row.sellValue));
        if (row.shiny) {
          state.sess.shinyCapN++;
          state.sess.shinyN++;
          state.shinyLog.push({
            n: String(row.name || ""),
            sid: finite(row.speciesId || row.pokeId),
            t: at,
            cap: 1,
          });
        }
        state.catchLog.push({
          n: String(row.name || ""),
          sid: finite(row.speciesId || row.pokeId),
          id,
          iv: finite(row.ivTotal),
          q: finite(row.quality),
          sh: !!row.shiny,
          t: at,
        });
      }
      state.knownIds.add(id);
    }
  }
  function snapshot(state, now = Date.now()) {
    const ch = state.api["/api/characters/me"]?.character;
    const items = new Map(
      (state.api["/game/items.json"]?.items || []).map((row) => [
        String(row.id),
        row,
      ]),
    );
    const period = state.sess,
      analyzer = state.ws.analyzer,
      useServer = analyzer && finite(analyzer.seconds) > 0 && state.hunting;
    if (
      state.analyzerBase &&
      analyzer &&
      (finite(analyzer.seconds) < finite(state.analyzerBase.seconds) ||
        finite(analyzer.kills) < finite(state.analyzerBase.kills))
    )
      state.analyzerBase = null;
    const delta = (field) =>
      finite(analyzer?.[field]) - finite(state.analyzerBase?.[field]);
    const elapsed = useServer
      ? Math.max(1, delta("seconds"))
      : Math.max(1, (now - period.start) / 1000);
    const kills = useServer ? Math.max(0, delta("kills")) : period.kills,
      xp = useServer ? Math.max(0, delta("xpGained")) : period.xp;
    const loot = useServer
      ? delta("lootGold")
      : Object.entries(period.drops).reduce(
          (sum, [id, row]) => sum + finite(items.get(id)?.npcPrice) * row.qty,
          0,
        );
    const captureGold = useServer ? delta("capturesGold") : period.sellG,
      supply = useServer ? delta("supplyGold") : period.supGold;
    const balance = useServer ? delta("balance") : loot + captureGold - supply,
      rate = (value) => Math.round((value * 3600) / elapsed);
    const team = (state.ws.pokes?.list || [])
      .filter((row) => row.team)
      .map((row) => ({
        id: String(row.id),
        name: String(row.name || ""),
        sid: finite(row.speciesId || row.pokeId),
        ld: !!row.leader,
        shiny: !!row.shiny,
        level: finite(row.level),
        q: finite(row.quality),
        ivt: finite(row.ivTotal),
        hp: finite(row.hp),
        hm: finite(row.maxHp || row.hpMax || row.totalHp),
        t1: row.type1 || "",
        t2: row.type2 || "",
        dt: !!row.isDitto,
        tms: row.tms || [],
        stats: {
          atk: finite(row.atk ?? row.stats?.atk),
          def: finite(row.def ?? row.stats?.def),
          spa: finite(
            row.spAtk ?? row.spa ?? row.stats?.spAtk ?? row.stats?.spa,
          ),
          spd: finite(
            row.spDef ?? row.spd ?? row.stats?.spDef ?? row.stats?.spd,
          ),
          speed: finite(row.speed ?? row.stats?.speed),
        },
      }));
    const live = !!ch?.id && state.sock?.readyState === 1;
    const parts = state.ws["field-kill"]?.xpParts;
    const base = finite(parts?.base),
      extras = ["vip", "streak", "boost", "event", "gym"].reduce(
        (sum, key) => sum + Math.max(0, finite(parts?.[key])),
        0,
      );
    const total = finite(parts?.total ?? parts?.final);
    const xpMultiplier =
      base > 0 ? (total >= base ? total / base : 1 + extras / base) : 1;
    const bag = [];
    for (const item of state.ws.inventory?.items || []) {
      const definition = items.get(String(item.itemId)) || {};
      if (item.quantity > 0)
        bag.push({
          id: item.itemId,
          name: definition.name || "#" + item.itemId,
          category: definition.category || "",
          quantity: item.quantity,
        });
    }
    const balls = (state.ws.balls?.catalog || []).map((ball) => ({
      ...ball,
      quantity: finite(state.ws.balls.counts?.[ball.id]),
    }));
    return {
      ok: !!ch?.id,
      live,
      cid: String(ch?.id || ""),
      name: String(ch?.name || ""),
      level: finite(ch?.level),
      gold: finite(ch?.gold),
      diamonds: finite(ch?.diamonds),
      vip: !!ch?.vip,
      clan: ch?.clan || null,
      xpMultiplier,
      hunt: state.lastSlug,
      currentMap: state.currentMap,
      farm: { hunting: state.hunting, lastCombatT: state.lastCombatT },
      team,
      bag,
      balls,
      drops: Object.entries(period.drops).map(([id, row]) => ({ name: row.name || items.get(id)?.name || "#" + id, qty: row.qty, gold: finite(items.get(id)?.npcPrice) * row.qty })),
      prev: state.prev ? (() => {
        const previous = state.prev, seconds = Math.max(1, (previous.end - previous.start) / 1000);
        const loot = Object.entries(previous.drops || {}).reduce((sum, [id, row]) => sum + finite(items.get(id)?.npcPrice) * row.qty, 0);
        return { hunt: previous.slug, seconds, xph: Math.round(previous.xp * 3600 / seconds), gph: Math.round((loot + previous.sellG - previous.supGold) * 3600 / seconds), kph: Math.round(previous.kills * 3600 / seconds) };
      })() : null,
      usedList: state.api["/api/game/used-balls"]?.pokemons?.map(x => ({ sid: x.speciesId, name: x.name, shiny: !!x.shiny, attempts: finite(x.attempts), total: finite(x.total), caught: !!x.caught })) || [],
      events:
        state.api["/api/game/events"]?.events ||
        state.api["/api/game/events"] ||
        [],
      captures: state.catchLog.slice(),
      shinies: state.shinyLog.slice(),
      a: {
        seconds: elapsed,
        kills,
        xpg: xp,
        hits: period.hits,
        epoch: period.epoch,
        xph: rate(xp),
        gph: rate(balance),
        kph: rate(kills),
        hpk: kills ? period.hits / kills : 0,
        captures: useServer ? Math.max(0, delta("captures")) : period.captures,
        shinyFound: period.shinyN,
        shinyCap: period.shinyCapN,
        lootGold: loot,
        capturesGold: captureGold,
        supplyGold: supply,
        balance,
        ballsUsed: useServer ? Math.max(0, delta("ballsUsed")) : period.balls,
        potsUsed: Math.max(0, delta("potionsUsed")),
      },
    };
  }
  const api = { createState, reduce, snapshot };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
    return;
  }
  root.PokeMuxSession = api;
  if (
    location.origin !== "https://poke.idleworld.online" ||
    location.pathname !== "/play" ||
    root.__poke?.runtimeVersion === 2
  )
    return;
  const state = createState();
  state.runtimeVersion = 2;
  root.__poke = state;
  try {
    const saved = JSON.parse(sessionStorage.getItem("pokemux-observation-v2"));
    if (saved && Date.now() - saved.at < 600000) {
      state.sess = { ...state.sess, ...saved.period };
      if (saved.shinyCountersVersion !== 1) state.sess.shinyN += state.sess.shinyCapN;
      state.lastSlug = String(saved.slug || "");
      state.knownIds = new Set((saved.ids || []).map(String));
      state.bagInitialized = state.knownIds.size > 0;
      state.catchLog = (saved.captures || []).slice(-500);
      state.shinyLog = (saved.shinies || []).slice(-100);
      state.analyzerBase = saved.baseline || null;
      state.observedCid = saved.cid || "";
    }
  } catch {}
  const NativeSocket = root.WebSocket,
    nativeFetch = root.fetch.bind(root),
    attached = new WeakSet();
  function connect(socket) {
    if (attached.has(socket)) return;
    attached.add(socket);
    state.sock = socket;
    state.socketEpoch++;
    state.pokeChunks = null;
    state.pokeGeneration = null;
    socket.addEventListener("message", (event) => {
      try {
        if (typeof event.data === "string" && event.data.length < 12000000) {
          const message = root.PokeMuxPokemonState.receive(
            state,
            JSON.parse(event.data),
          );
          if (message) reduce(state, message);
        }
      } catch {}
    });
    const nativeSend = socket.send.bind(socket);
    socket.send = function (payload) {
      try {
        const command = JSON.parse(payload);
        if (["set-city", "leave-hunt", "exit-hunt"].includes(command.type)) {
          state.hunting = false;
          if (command.slug) state.currentMap = command.slug;
        }
      } catch {}
      return nativeSend(payload);
    };
    const request = () => {
      if (socket.readyState === 1)
        for (const type of [
          "pokes-get",
          "inv-get",
          "balls-get",
          "analyzer-get",
        ])
          socket.send(JSON.stringify({ type }));
    };
    if (socket.readyState === 1) request();
    else socket.addEventListener("open", request, { once: true });
  }
  root.WebSocket = new Proxy(NativeSocket, {
    construct(target, args, newTarget) {
      const socket = Reflect.construct(target, args, newTarget);
      connect(socket);
      return socket;
    },
  });
  root.fetch = function (resource, options) {
    const address = new URL(
      typeof resource === "string"
        ? resource
        : resource?.url || String(resource),
      location.href,
    );
    const local = address.origin === location.origin;
    if (local) {
      try {
        const auth = new Headers(options?.headers || resource?.headers).get(
          "authorization",
        );
        if (auth) state.auth = auth;
      } catch {}
    }
    const result = nativeFetch(resource, options);
    if (
      local &&
      (/^\/api\//.test(address.pathname) || /^\/game\//.test(address.pathname))
    )
      result
        .then((response) => {
          if (response.ok)
            return response
              .clone()
              .json()
              .then((data) => {
                if (address.pathname === "/api/characters/me") {
                  const before =
                      state.api[address.pathname]?.character?.id ||
                      state.observedCid,
                    after = data?.character?.id;
                  if (before && after && String(before) !== String(after)) {
                    const replacement = createState();
                    Object.assign(state, replacement);
                    state.runtimeVersion = 2;
                  }
                }
                state.api[address.pathname] = data;
              });
        })
        .catch(() => {});
    return result;
  };
  // A socket can already exist when the game finishes loading. Discover references
  // through mounted component state without reading credential storage.
  function discoverSocket() {
    if (state.sock?.readyState === 1) return;
    const visited = new WeakSet(),
      queue = [];
    for (const element of document.querySelectorAll("#root *")) {
      const key = Object.keys(element).find((name) =>
        name.startsWith("__reactFiber$"),
      );
      if (key) queue.push(element[key]);
      if (queue.length > 30) break;
    }
    let remaining = 6000;
    while (queue.length && remaining-- > 0) {
      const value = queue.shift();
      if (!value || typeof value !== "object" || visited.has(value)) continue;
      visited.add(value);
      if (value instanceof NativeSocket) {
        connect(value);
        return;
      }
      if (value instanceof Node) continue;
      for (const key of [
        "child",
        "sibling",
        "return",
        "memoizedProps",
        "memoizedState",
        "baseState",
        "next",
        "queue",
        "current",
        "value",
        "state",
        "socket",
        "ws",
        "children",
      ]) {
        const child = value[key];
        if (child && typeof child === "object")
          Array.isArray(child)
            ? queue.push(...child.slice(0, 20))
            : queue.push(child);
      }
    }
  }
  const poll = async () => {
    discoverSocket();
    const headers = state.auth ? { Authorization: state.auth } : undefined;
    for (const address of [
      "/api/characters/me",
      "/api/game/events",
      "/api/game/used-balls",
      "/game/items.json",
    ])
      if (address.startsWith("/api/") || !state.api[address])
        void root.fetch(address, { headers }).catch(() => {});
    if (state.sock?.readyState === 1)
      for (const type of ["pokes-get", "analyzer-get"])
        state.sock.send(JSON.stringify({ type }));
  };
  const timer = setInterval(poll, 30000);
  root.addEventListener(
    "pagehide",
    () => {
      clearInterval(timer);
      try {
        sessionStorage.setItem(
          "pokemux-observation-v2",
          JSON.stringify({
            at: Date.now(),
            period: state.sess,
            shinyCountersVersion: 1,
            cid: state.api["/api/characters/me"]?.character?.id,
            slug: state.lastSlug,
            ids: [...state.knownIds].slice(-50000),
            captures: state.catchLog,
            shinies: state.shinyLog,
            baseline: state.analyzerBase,
          }),
        );
      } catch {}
    },
    { once: true },
  );
  api.refresh = poll;
  void poll();
})(globalThis);
