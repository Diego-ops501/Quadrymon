(async function startPokeMux() {
  "use strict";
  const ipc = window.pokeAPI,
    $ = (id) => document.getElementById(id);
  const load = (key) => {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    save = (key, value) => {
      try {
        localStorage.setItem(key, String(value));
        return true;
      } catch {
        return false;
      }
    };
  const readJson = (key, fallback) => {
    try {
      const value = JSON.parse(load(key));
      return Array.isArray(fallback)
        ? Array.isArray(value)
          ? value
          : fallback
        : fallback && typeof fallback === "object"
          ? value && typeof value === "object" && !Array.isArray(value)
            ? value
            : fallback
          : (value ?? fallback);
    } catch {
      return fallback;
    }
  };
  const num = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);
  const node = (tag, text, cls) => {
    const element = document.createElement(tag);
    if (text != null) element.textContent = String(text);
    if (cls) element.className = cls;
    return element;
  };
  const button = (text, click) => {
    const element = node("button", text);
    element.type = "button";
    element.onclick = click;
    return element;
  };
  const append = (parent, ...children) => {
    parent.append(...children);
    return parent;
  };
  const colors = ["#22d3c5", "#f4b942", "#3882f6", "#e5e7eb"];
  const options = {
    lang: ["pt", "en", "es"].includes(load("lang")) ? load("lang") : "pt",
    count: Math.max(1, Math.min(4, num(load("count")) || 4)),
    eco: load("eco") !== "0",
    muted: load("muted") === "1",
    alerts: load("alerts") !== "0",
    voice: load("voiceAlerts") === "1",
    shinySound: load("sndShiny") === "1",
    shinyShot: load("shotShiny") === "1",
    iv: load("ivHoverEnabled") !== "0",
    returnHunt: load("voltaHunt") === "1",
    awake: load("awake") === "1",
    minTray: load("minTray") !== "0",
    chat: load("chat") !== "0",
    dock: load("dock") !== "0",
    clean: load("cleanHud") === "1",
    guard: load("sellguard") !== "0",
  };
  let accounts = [];
  try {
    accounts = await ipc.loadCreds();
  } catch {}
  while (accounts.length < 4) accounts.push({ name: "", email: "", senha: "" });
  let mode = "grid",
    focus = 0,
    analysis = false,
    workspace,
    market,
    inventory,
    settings,
    gameCatalog = null,
    ivSource = null,
    messageTimer;
  const slots = Array.from({ length: 4 }, (_, index) => ({
    index,
    view: null,
    epoch: 0,
    off: false,
    data: null,
    at: 0,
    read: null,
    previous: readJson("marketReturn" + index, null),
    traveling: false,
    events: new Set(),
    lastKill: 0,
    lastReload: 0,
  }));
  const measurements = readJson("huntStats", {}),
    sampleContexts = [],
    captureLog = readJson("lifeCatch", []);
  const manualChoices = readJson("pokemux-notification-settings", {});
  const L = (pt, en, es) =>
    options.lang === "en" ? en || pt : options.lang === "es" ? es || pt : pt;
  function localize() {
    const labels = {
      statsBtn: ["Análise", "Analysis", "Análisis"],
      recommendTop: ["Hunt", "Hunt", "Hunt"],
      recommendBtn: ["Recomendar hunt", "Recommend hunt", "Recomendar hunt"],
      ivsBtn: ["IV", "IV", "IV"],
      menuBtn: ["Ajustes", "Settings", "Ajustes"],
      accounts: ["Contas", "Accounts", "Cuentas"],
      loginAll: ["Entrar nas contas", "Fill account login", "Completar acceso"],
      voltaHunt: ["Retornar à hunt", "Return to hunt", "Volver a la hunt"],
      propNat: [
        "Proporção do jogo",
        "Game aspect ratio",
        "Proporción del juego",
      ],
      dock: ["Menu do jogo", "Game menu", "Menú del juego"],
      chat: ["Chat", "Chat", "Chat"],
      cleanHud: ["Limpar HUD", "Hide HUD", "Ocultar HUD"],
      muteAll: ["Som", "Sound", "Sonido"],
      overlayBtn: ["Overlay", "Overlay", "Overlay"],
      eco: ["Eco", "Eco", "Eco"],
      awake: ["Impedir suspensão", "Keep awake", "Evitar suspensión"],
      minTray: [
        "Minimizar na bandeja",
        "Minimize to tray",
        "Minimizar en bandeja",
      ],
      autoStart: [
        "Iniciar com Windows",
        "Start with Windows",
        "Iniciar con Windows",
      ],
      alerts: ["Alertas", "Alerts", "Avisos"],
      sndShiny: ["Som de shiny", "Shiny sound", "Sonido shiny"],
      voiceAlerts: ["Voz dos alertas", "Spoken alerts", "Avisos de voz"],
      shotShiny: ["Print de shiny", "Shiny screenshot", "Captura de shiny"],
      sellguard: ["Venda protegida", "Protected sale", "Venta protegida"],
      hunt: ["Análise da hunt", "Hunt analysis", "Análisis de hunt"],
      tierBtn: ["Tierlist", "Tier list", "Lista de niveles"],
      dittoBtn: ["Ditto", "Ditto", "Ditto"],
      bkExp: ["Exportar configurações", "Export settings", "Exportar ajustes"],
      bkImp: ["Importar configurações", "Import settings", "Importar ajustes"],
      updateBtn: [
        "Verificar atualização",
        "Check updates",
        "Buscar actualización",
      ],
      manBtn: ["Manual", "Manual", "Manual"],
      faqBtn: ["FAQ", "FAQ", "FAQ"],
      errlogBtn: ["Relatório de erros", "Error report", "Informe de errores"],
      donTop: ["Ajude o projeto", "Support project", "Apoyar proyecto"],
      captureCsv: ["Exportar CSV", "Export CSV", "Exportar CSV"],
    };
    for (const [id, values] of Object.entries(labels)) {
      const element = $(id);
      if (element) {
        element.textContent = L(...values);
        element.title = L(...values);
      }
    }
    for (const [selector, values] of [
      ["#accountEditor h2", ["Contas", "Accounts", "Cuentas"]],
      [
        "#huntRecommend h2",
        ["Recomendar hunt", "Recommend hunt", "Recomendar hunt"],
      ],
      [
        "#captureHistory h2",
        ["Histórico de capturas", "Capture history", "Historial de capturas"],
      ],
      [
        "#accountForm button[type=submit]",
        ["Salvar contas", "Save accounts", "Guardar cuentas"],
      ],
    ])
      document.querySelector(selector).textContent = L(...values);
    $("captureSearch").placeholder = L(
      "Nome do Pokémon",
      "Pokémon name",
      "Nombre del Pokémon",
    );
    $("captureIv").placeholder = L("IV mínimo", "Minimum IV", "IV mínimo");
    document.documentElement.lang = options.lang;
  }
  const format = (value) =>
    value == null
      ? "—"
      : new Intl.NumberFormat(options.lang === "pt" ? "pt-BR" : options.lang, {
          maximumFractionDigits: 1,
        }).format(Number(value));
  function message(text) {
    $("appMessage").textContent = text;
    $("appMessage").hidden = false;
    clearTimeout(messageTimer);
    messageTimer = setTimeout(() => ($("appMessage").hidden = true), 8000);
  }
  const name = (index) =>
    slots[index].data?.name ||
    accounts[index]?.name ||
    L("Conta ", "Account ", "Cuenta ") + (index + 1);
  const playable = (view) => {
    try {
      const url = new URL(view.getURL());
      return (
        url.origin === "https://poke.idleworld.online" &&
        url.pathname === "/play"
      );
    } catch {
      return false;
    }
  };
  const slot = (index) => ({
    view: slots[index].view,
    email: accounts[index]?.email || "",
    epoch: slots[index].epoch,
    cid: slots[index].data?.cid || "",
    off: slots[index].off || !playable(slots[index].view),
  });
  async function execute(index, script) {
    const current = slots[index],
      view = current?.view,
      epoch = current?.epoch;
    if (!view || current.off || !playable(view))
      return { ok: false, reason: "offline" };
    const result = await view.executeJavaScript(script);
    return current.view === view && current.epoch === epoch && !current.off
      ? result
      : { ok: false, reason: "changed" };
  }
  let runtimeCode;
  try {
    runtimeCode = await ipc.readRuntime();
  } catch (error) {
    message(
      L(
        "Não foi possível carregar o runtime.",
        "Runtime could not be loaded.",
        "No se pudo cargar el runtime.",
      ),
    );
    return;
  }
  const stateScript =
    "window.PokeMuxSession && window.__poke ? window.PokeMuxSession.snapshot(window.__poke) : ({ok:false})";
  async function readState(index) {
    const current = slots[index];
    if (current.read) return current.read;
    current.read = execute(index, stateScript)
      .then((data) => {
        if (data?.ok) {
          if (current.data?.cid && data.cid !== current.data.cid) {
            current.events.clear();
            current.previous = null;
            current.epoch++;
            sampleContexts[index] = null;
          }
          current.data = data;
          current.at = Date.now();
          record(index, data);
        }
        return data;
      })
      .finally(() => {
        current.read = null;
      });
    return current.read;
  }
  function speak(text) {
    if (!options.voice || !window.speechSynthesis) return;
    if (speechSynthesis.pending) return;
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang =
      options.lang === "pt"
        ? "pt-BR"
        : options.lang === "es"
          ? "es-ES"
          : "en-US";
    speech.rate = 1.04;
    speechSynthesis.speak(speech);
  }
  function notify(text, voice = true) {
    if (!options.alerts) return;
    void ipc.notify("Quadrymon", text);
    if (voice) speak(text);
    const configured = readJson("webhook", {});
    if (configured.url) void ipc.webhook(configured.url, text);
  }
  function sound() {
    if (!options.shinySound) return;
    try {
      const context = new AudioContext(),
        gain = context.createGain();
      gain.connect(context.destination);
      gain.gain.value = 0.1;
      for (const [at, hz] of [
        [0, 523.25],
        [0.17, 659.25],
        [0.34, 783.99],
      ]) {
        const oscillator = context.createOscillator();
        oscillator.frequency.value = hz;
        oscillator.connect(gain);
        oscillator.start(context.currentTime + at);
        oscillator.stop(context.currentTime + at + 0.16);
      }
      setTimeout(() => context.close(), 1000);
    } catch {}
  }
  function record(index, data) {
    const current = slots[index],
      leader = data.team?.find((row) => row.ld);
    const sample = window.PokeMuxHuntMeasurements.isolateSample(
      sampleContexts,
      index,
      data.cid,
      data.hunt,
      leader,
      data.a,
      Date.now(),
    );
    if (
      sample &&
      window.PokeMuxHuntMeasurements.recordMeasurement(measurements, sample)
    )
      save("huntStats", JSON.stringify(measurements));
    for (const capture of data.captures || []) {
      const key = "capture:" + data.cid + ":" + capture.id + ":" + capture.t;
      if (current.events.has(key)) continue;
      current.events.add(key);
      if (
        captureLog.some(
          (row) =>
            row.cid === data.cid &&
            String(row.id) === String(capture.id) &&
            row.t === capture.t,
        )
      )
        continue;
      const entry = {
        ...capture,
        p: index,
        cid: data.cid,
        account: name(index),
      };
      captureLog.push(entry);
      if (captureLog.length > 3000) captureLog.shift();
      save("lifeCatch", JSON.stringify(captureLog));
      const important = window.PokeMuxSummary.important(entry);
      if (important && Date.now() - capture.t < 15000) {
        notify(
          name(index) +
            ": " +
            capture.n +
            ", IV " +
            format(capture.iv) +
            (capture.sh
              ? L(", shiny capturado", ", shiny caught", ", shiny capturado")
              : ""),
        );
        if (capture.sh && options.shinyShot)
          void ipc.captureShiny(current.view.getWebContentsId(), {
            name: capture.n,
          });
      }
    }
    for (const shiny of data.shinies || []) {
      const key = "shiny:" + data.cid + ":" + shiny.t;
      if (current.events.has(key)) continue;
      current.events.add(key);
      if (Date.now() - shiny.t < 15000) {
        sound();
        if (shiny.cap) continue;
      }
    }
    if (current.events.size > 5000)
      current.events = new Set([...current.events].slice(-3000));
    if (data.farm?.hunting && !current.lastKillAt)
      current.lastKillAt = Date.now();
    if (data.a?.kills > current.lastKill) {
      current.lastKill = data.a.kills;
      current.lastKillAt = Date.now();
    }
    if (data.farm?.hunting && data.hunt && !current.previous) {
      current.previous = {
        slug: data.hunt,
        name: data.hunt.replace(/[_-]/g, " "),
      };
      save("marketReturn" + index, JSON.stringify(current.previous));
    }
    const health = window.PokeMuxSummary.health(summaryRow(index, data));
    for (const issue of health.issues) {
      const key = "issue:" + issue;
      if (!current.events.has(key) && manualChoices[issue] !== false) {
        current.events.add(key);
        notify(
          name(index) +
            ": " +
            (window.PokeMuxSummary.COPY[options.lang]?.[issue] || issue),
        );
      }
    }
    for (const key of [...current.events].filter((key) =>
      key.startsWith("issue:"),
    ))
      if (!health.issues.includes(key.slice(6))) current.events.delete(key);
  }
  function zoom(index, delta) {
    const view = slots[index].view,
      current = num(load("zoom" + index)) || 1,
      next = Math.min(
        2,
        Math.max(0.5, Math.round((current + delta) * 10) / 10),
      );
    save("zoom" + index, next);
    if (view)
      try {
        view.setZoomFactor(next);
      } catch {}
    const label = $("grid").children[index]?.querySelector(".zpct");
    if (label) label.textContent = Math.round(next * 100) + "%";
  }
  async function inject(index) {
    const current = slots[index];
    if (!playable(current.view)) return;
    try {
      await execute(index, runtimeCode);
      await ipc.hydrateGame(current.view.getWebContentsId());
      await execute(index, "window.__pgIvHoverEnabled=" + options.iv);
      await applyGamePreferences(index);
      await readState(index);
    } catch (error) {
      void ipc.logError("runtime", error.message);
    }
  }
  function build() {
    const grid = $("grid");
    grid.dataset.count = String(options.count);
    for (let index = 0; index < 4; index++) {
      const current = slots[index];
      if (index >= options.count) {
        current.epoch++;
        current.panel?.remove();
        current.panel = null;
        current.view = null;
        current.data = null;
        sampleContexts[index] = null;
        continue;
      }
      if (current.panel?.isConnected) continue;
      const panel = node("section", null, "panel");
      current.panel = panel;
      const header = node("header", null, "panel-header");
      panel.style.setProperty("--account-color", colors[index]);
      append(
        header,
        node("span", null, "dot"),
        node("span", name(index), "name"),
        node("span", L("Aguardando", "Waiting", "Esperando"), "status"),
      );
      append(
        header,
        button("−", () => zoom(index, -0.1)),
        node(
          "span",
          Math.round((num(load("zoom" + index)) || 1) * 100) + "%",
          "zpct",
        ),
        button("+", () => zoom(index, 0.1)),
        button("⟳", () => reload(index)),
        button("🎯", () => openRecommendations(index)),
        button("⛶", () =>
          setMode(
            mode === "focus" && focus === index ? "grid" : "focus",
            index,
          ),
        ),
      );
      const power = button("⏻", () => {
        current.off = !current.off;
        if (current.off) {
          current.view?.remove();
          current.view = null;
          panel.append(
            node(
              "div",
              L("Conta desligada", "Account off", "Cuenta apagada"),
              "panel-off",
            ),
          );
        } else attachView(index, panel);
        workspace?.refresh();
      });
      header.append(power);
      panel.append(header);
      grid.insertBefore(panel, grid.children[index] || null);
      if (current.off) {
        panel.append(
          node(
            "div",
            L("Conta desligada", "Account off", "Cuenta apagada"),
            "panel-off",
          ),
        );
        continue;
      }
      attachView(index, panel);
    }
    setMode(mode, Math.min(focus, options.count - 1));
    workspace?.refresh();
  }
  function attachView(index, panel) {
    const current = slots[index];
    current.epoch++;
    current.data = null;
    sampleContexts[index] = null;
    panel.querySelector(".panel-off")?.remove();
    const view = document.createElement("webview");
    current.view = view;
    view.setAttribute("partition", "persist:conta" + (index + 1));
    view.setAttribute(
      "webpreferences",
      "contextIsolation=yes,sandbox=yes,nodeIntegration=no,backgroundThrottling=no",
    );
    view.addEventListener("dom-ready", () => {
      try {
        view.setAudioMuted(options.muted || mode === "summary");
        view.setZoomFactor(num(load("zoom" + index)) || 1);
      } catch {}
      void inject(index);
    });
    view.addEventListener("did-navigate-in-page", () => void inject(index));
    view.addEventListener("did-start-navigation", (event) => {
      if (event.isMainFrame && !event.isInPlace) {
        current.epoch++;
        current.data = null;
        sampleContexts[index] = null;
        hideIv();
      }
    });
    view.addEventListener("console-message", (event) => {
      const text = event.message;
      if (text.startsWith("__PGIVH__") && text.length < 2000) {
        try {
          const point = JSON.parse(text.slice(9));
          if (!point.ativo) {
            if (ivSource?.index === index && !ivSource.market) hideIv();
            return;
          }
          if (!options.iv || ivSource?.market) return;
          const bounds = view.getBoundingClientRect();
          ivSource = {
            index,
            hoverId: point.id,
            point: {
              x: bounds.left + (point.x * bounds.width) / point.width,
              y: bounds.top + (point.y * bounds.height) / point.height,
            },
          };
          positionIv(ivSource.point);
        } catch {}
      }
      if (text.startsWith("__PGIV__") && text.length < 100000) {
        try {
          const data = JSON.parse(text.slice(8));
          if (
            ivSource?.index === index &&
            ivSource.hoverId === data.hoverId &&
            !ivSource.market
          )
            showIv(index, data, ivSource.point, false);
        } catch {}
      }
    });
    panel.insertBefore(view, panel.querySelector(".panel-metrics"));
    setTimeout(() => {
      if (current.view === view && !current.off)
        view.setAttribute(
          "src",
          "https://poke.idleworld.online/login?ref=2G9B4BV",
        );
    }, index * 3000);
  }
  function reload(index) {
    const current = slots[index];
    if (current?.view && !current.off) {
      current.epoch++;
      current.data = null;
      sampleContexts[index] = null;
      try {
        current.view.reload();
      } catch {}
    }
  }
  function setMode(next, index = focus) {
    mode = next;
    focus = index;
    document.body.classList.toggle("cards-on", mode === "summary");
    $("cards").hidden = mode !== "summary";
    $("grid").hidden = mode === "summary";
    [...$("grid").children].forEach((panel, i) =>
      panel.classList.toggle("expanded", mode === "focus" && i === focus),
    );
    applyPerformance();
    workspace?.refresh();
    if (mode === "summary") renderSummary();
  }
  function toggleAnalysis() {
    analysis = !analysis;
    document.body.classList.toggle("stats-open", analysis);
    workspace?.refresh();
    renderAnalysis();
  }
  function summaryRow(index, data = slots[index].data) {
    const balls = data?.balls || [],
      bag = data?.bag || [],
      heals = bag.filter((row) => ["heal", "potion"].includes(row.category));
    return {
      st: slots[index].off ? "off" : data?.live ? "on" : "down",
      farm: data?.farm,
      lead: data?.team?.find((row) => row.ld),
      hasBalls: !!balls.length,
      balls: balls.reduce((sum, row) => sum + row.quantity, 0),
      infiniteBalls: balls.some((row) => row.infinite && row.quantity > 0),
      hasInv: !!bag.length,
      pots: heals.reduce((sum, row) => sum + row.quantity, 0),
      aPots: data?.a?.potsUsed || 0,
      aBalls: data?.a?.ballsUsed || 0,
      secs: data?.a?.seconds || 0,
    };
  }
  function metricsCard(index) {
    const data = slots[index].data,
      card = node("article", null, "runtime-card");
    card.dataset.summaryKey = "account-" + index;
    card.append(node("h3", name(index)));
    const status = window.PokeMuxSummary.health(summaryRow(index));
    card.append(
      node(
        "p",
        window.PokeMuxSummary.COPY[options.lang][status.status] ||
          status.status,
        "runtime-note",
      ),
    );
    const dl = node("dl");
    for (const [label, value] of [
      ["Hunt", data?.hunt],
      ["XP/h", data?.a?.xph],
      ["$/h", data?.a?.gph],
      [L("Capturas", "Captures", "Capturas"), data?.a?.captures],
      [L("Abates/h", "Kills/h", "Bajas/h"), data?.a?.kph],
    ])
      append(
        dl,
        node("dt", label),
        node("dd", typeof value === "string" ? value : format(value)),
      );
    card.append(dl);
    const leader = data?.team?.find((row) => row.ld);
    if (leader)
      card.append(
        node(
          "p",
          leader.name +
            " Lv" +
            leader.level +
            " · IV " +
            format(leader.ivt) +
            " · Q " +
            format(leader.q) +
            " · HP " +
            format(leader.hp) +
            "/" +
            format(leader.hm),
        ),
      );
    const buttons = node("div", null, "buttons");
    append(
      buttons,
      button(L("Abrir conta", "Open account", "Abrir cuenta"), () =>
        setMode("focus", index),
      ),
      button(L("Recomendar hunt", "Recommend hunt", "Recomendar hunt"), () =>
        openRecommendations(index),
      ),
    );
    card.append(buttons);
    buttons.children[0].dataset.summaryAction = "account";
    buttons.children[1].dataset.summaryAction = "recommend";
    for (const control of buttons.children)
      control.dataset.account = String(index);
    return card;
  }
  function renderSummary() {
    if (mode !== "summary") return;
    const container = node("div");
    container.append(
      node(
        "h2",
        L("Resumo das contas", "Account summary", "Resumen de cuentas"),
      ),
    );
    const groups = node("div", null, "summary-accounts");
    for (let i = 0; i < options.count; i++) groups.append(metricsCard(i));
    const captures = button(
        L("Histórico de capturas", "Capture history", "Historial de capturas"),
        openCaptures,
      ),
      reset = button(
        L("Zerar sessão", "Reset session", "Reiniciar sesión"),
        resetSessions,
      );
    captures.dataset.summaryAction = "captures";
    reset.dataset.summaryAction = "reset";
    container.append(groups, captures, reset);
    window.PokeMuxSummary.patch($("cards"), container.innerHTML);
  }
  $("cards").onclick = (event) => {
    const control = event.target.closest("[data-summary-action]");
    if (!control) return;
    const index = Number(control.dataset.account);
    if (control.dataset.summaryAction === "account") {
      setMode("focus", index);
      if (!analysis) toggleAnalysis();
    } else if (control.dataset.summaryAction === "recommend")
      void openRecommendations(index);
    else if (control.dataset.summaryAction === "captures") openCaptures();
    else if (control.dataset.summaryAction === "reset") resetSessions();
  };
  function renderAnalysis() {
    if (!analysis) return;
    const host = $("stats");
    host.replaceChildren(
      append(
        node("div", null, "dialog-head"),
        node("h2", L("Análise", "Analysis", "Análisis")),
        button("✕", toggleAnalysis),
      ),
    );
    for (let i = 0; i < options.count; i++) host.append(metricsCard(i));
    host.append(
      button(
        L("Histórico de capturas", "Capture history", "Historial de capturas"),
        openCaptures,
      ),
      button(
        L("Exportar histórico", "Export history", "Exportar historial"),
        exportCaptures,
      ),
    );
  }
  function workspaceState() {
    return {
      lang: options.lang,
      summary: mode === "summary",
      stats: analysis,
      eco: options.eco,
      accounts: slots.slice(0, options.count).map((current, index) => ({
        name: name(index),
        off: current.off,
        live: !!current.data?.live && Date.now() - current.at < 30000,
        color: colors[index],
        focused: mode === "focus" && focus === index,
        hunt: current.data?.hunt || "",
        metrics: current.data?.a,
        marketTravel: {
          busy: current.traveling,
          outsideHunt: current.data?.farm?.hunting === false,
          previous: current.previous,
        },
      })),
    };
  }
  async function travel(index) {
    const current = slots[index];
    if (current.traveling) return;
    current.traveling = true;
    workspace.refresh();
    try {
      const data = await readState(index);
      if (!data?.live)
        throw Error(
          L("Conta desconectada.", "Account offline.", "Cuenta desconectada."),
        );
      const result = await execute(
        index,
        window.PokeMuxMarketTravel.script(data.cid, current.previous),
      );
      if (result.returnHunt) {
        current.previous = result.returnHunt;
        save("marketReturn" + index, JSON.stringify(current.previous));
      }
      if (!result.ok)
        message(
          L(
            "Viagem não confirmada: ",
            "Travel not confirmed: ",
            "Viaje no confirmado: ",
          ) + result.reason,
        );
      await readState(index);
    } catch (error) {
      message(error.message);
    } finally {
      current.traveling = false;
      workspace.refresh();
    }
  }
  function applyPerformance() {
    for (const current of slots) {
      if (!current.view || current.off) continue;
      try {
        current.view.setAudioMuted(options.muted || mode === "summary");
      } catch {}
      void applyGamePreferences(current.index).catch(() => {});
    }
  }
  async function applyGamePreferences(index) {
    const value = {
      chat: options.chat,
      dock: options.dock,
      clean: options.clean,
      guard: options.guard,
      lockedItems: readJson("sellLock", []),
      summary: mode === "summary",
      fps: window.PokeMuxWorkspace.frameRate({
        summary: mode === "summary",
        eco: options.eco,
        focused: mode === "focus" ? focus : -1,
        account: index,
      }),
    };
    return execute(
      index,
      "window.PokeMuxGamePreferences?.configure(" + JSON.stringify(value) + ")",
    );
  }
  async function login(index) {
    const account = accounts[index],
      current = slots[index];
    if (!current.view || current.off || !account.email) return;
    const input = JSON.stringify({
      email: account.email,
      password: account.senha,
    });
    try {
      await current.view.executeJavaScript(
        '(()=>{if(location.origin!=="https://poke.idleworld.online"||location.pathname!=="/login")return false;const fields=' +
          input +
          ';const email=document.querySelector("input[type=email],input[name=email]");const password=document.querySelector("input[type=password]");if(!email||!password)return false;const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set;for(const [element,value]of [[email,fields.email],[password,fields.password]]){setter.call(element,value);element.dispatchEvent(new Event("input",{bubbles:true}));}password.scrollIntoView({block:"center"});return true;})()',
      );
    } catch {}
  }
  function openAccounts() {
    const host = $("accountFields");
    host.replaceChildren();
    for (let index = 0; index < 4; index++) {
      const row = node("div", null, "account-fields");
      row.append(node("b", index + 1));
      for (const [field, type, placeholder] of [
        ["name", "text", "Nome"],
        ["email", "text", L("E-mail ou usuário", "Email or username", "Correo o usuario")],
        ["senha", "password", "Senha"],
      ]) {
        const input = node("input");
        input.type = type;
        input.value = accounts[index][field] || "";
        input.name = field + index;
        input.placeholder = placeholder;
        input.autocomplete = "off";
        row.append(input);
      }
      row.append(
        button(L("Limpar dados", "Clear data", "Borrar datos"), async () => {
          if (
            !confirm(
              L(
                "Limpar cookies e dados desta conta?",
                "Clear cookies and data for this account?",
                "¿Borrar cookies y datos de esta cuenta?",
              ),
            )
          )
            return;
          await ipc.clearAccount(index);
          reload(index);
        }),
      );
      host.append(row);
    }
    $("accountEditor").showModal();
  }
  $("accountForm").onsubmit = async (event) => {
    event.preventDefault();
    const fields = new FormData(event.target),
      next = Array.from({ length: 4 }, (_, index) =>
        Object.fromEntries(
          ["name", "email", "senha"].map((field) => [
            field,
            String(fields.get(field + index) || ""),
          ]),
        ),
      );
    if (!(await ipc.saveCreds(next))) {
      message(
        L(
          "Não foi possível salvar as contas.",
          "Accounts could not be saved.",
          "No se pudieron guardar las cuentas.",
        ),
      );
      return;
    }
    for (let index = 0; index < 4; index++)
      if (accounts[index].email !== next[index].email) {
        slots[index].panel?.remove();
        slots[index].panel = null;
        slots[index].view = null;
        slots[index].previous = null;
      }
    accounts = next;
    $("accountEditor").close();
    build();
  };
  function positionIv(point) {
    const card = $("ivCard");
    if (!point) return;
    const width = card.offsetWidth || 360,
      height = card.offsetHeight || 400;
    card.style.left =
      Math.max(10, Math.min(innerWidth - width - 10, point.x + 16)) + "px";
    card.style.top =
      Math.max(10, Math.min(innerHeight - height - 10, point.y + 14)) + "px";
  }
  function hideIv() {
    ivSource = null;
    $("ivCard").hidden = true;
  }
  function showIv(index, result, point, market = true) {
    if (!options.iv || !result) return;
    ivSource = { index, point, market, result, hoverId: result.hoverId };
    const card = $("ivCard");
    card.replaceChildren();
    card.hidden = false;
    append(card, button("✕", hideIv), node("h3", result.nome || ""));
    if (result.erro) {
      card.append(
        node(
          "p",
          L(
            "Não foi possível calcular: ",
            "Unable to calculate: ",
            "No se pudo calcular: ",
          ) + result.erro,
        ),
      );
      positionIv(point);
      return;
    }
    if (
      /^https:\/\/raw\.githubusercontent\.com\/PokeAPI\/sprites\/[a-z0-9/_.-]+$/i.test(
        result.sprite?.still || "",
      )
    ) {
      const image = node("img");
      image.src = result.sprite.still;
      image.alt = "";
      card.append(image);
    }
    card.append(
      node(
        "p",
        "Lv" +
          result.nivel +
          " · IV " +
          format(result.ivTotal) +
          "/192 · Q " +
          format(result.qualidade),
      ),
      node("p", result.tipos?.join(" / ") || ""),
    );
    const table = node("table"),
      head = node("tr");
    for (const label of ["Stat", "Base", "Atual", "IV"])
      head.append(node("th", label));
    table.append(head);
    for (const key of ["hp", "atk", "def", "spa", "spd", "vel"]) {
      const row = node("tr");
      for (const value of [
        key.toUpperCase(),
        result.bases?.[key],
        result.atuais?.[key],
        result.ivs?.[key],
      ])
        row.append(
          node("td", typeof value === "string" ? value : format(value)),
        );
      table.append(row);
    }
    card.append(
      table,
      node(
        "p",
        L(
          "IVs individuais estimados; o IV total é o informado pelo jogo.",
          "Individual IVs are estimated; total IV comes from the game.",
          "IV individuales estimados; el IV total viene del juego.",
        ),
        "runtime-note",
      ),
    );
    const controls = node("div", null, "iv-controls"),
      level = node("input");
    level.type = "number";
    level.min = 1;
    level.value = result.nivel;
    append(
      controls,
      level,
      button(
        L("Simular nível", "Simulate level", "Simular nivel"),
        async () => {
          const data = await execute(
            index,
            "window.__pokemuxIv.calc(" +
              JSON.stringify({
                pokemon: result.pokemon,
                bases: result.bases,
                nivel: Number(level.value),
              }) +
              ")",
          );
          if (ivSource?.index === index) showIv(index, data, point, market);
        },
      ),
    );
    card.append(controls);
    const aptitude = window.PokeMuxAptitude.analyze(result);
    for (const move of aptitude.moves) {
      card.append(
        node(
          "p",
          move.nome +
            " · " +
            move.tipo +
            " · " +
            move.poder +
            " · Lv" +
            move.nivel +
            (move.tm ? " · " + move.tm : "") +
            (move.available ? " ✓" : ""),
        ),
      );
    }
    positionIv(point);
  }
  const ivBridge = {
    isIvEnabled: () => options.iv,
    calculateIv: async (index, pokemon, cid) =>
      execute(index, window.PokeMuxGlobalMarket.ivScript(pokemon, cid)),
    showIv: (index, data, point) => showIv(index, data, point, true),
    hideIv,
  };
  function sprite(id, shiny) {
    const value =
      gameCatalog?.dex?.[id] ||
      (+id >= 13000 && +id < 14000 ? +id - 13000 : +id);
    return value > 0 && value < 10000
      ? "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/" +
          (shiny ? "shiny/" : "") +
          value +
          ".png"
      : "";
  }
  market = window.PokeMuxMarketUI.mount({
    language: () => options.lang,
    load,
    save,
    loadSearchCatalog: () => ipc.loadGameCatalog(),
    ...ivBridge,
    notifyMarket: (text, desktop, voice) => {
      if (!options.alerts) return;
      if (desktop) void ipc.notify("Quadrymon · Mercado", text);
      if (voice) speak(text);
    },
    rememberFocus: () => {},
    openAccount: (index) => setMode("focus", index),
    preferred: () => focus,
    accounts: async () => {
      await Promise.all(
        slots
          .slice(0, options.count)
          .map((current) =>
            readState(current.index).catch(() => ({ ok: false })),
          ),
      );
      return workspaceState().accounts.map((row, index) => ({
        ...row,
        cid: slots[index].data?.cid || "",
      }));
    },
    read: execute,
    sprite,
  });
  inventory = window.PokeMuxInventory.mount({
    language: () => options.lang,
    itemPrices: () => market.itemPrices(),
    ...ivBridge,
    ivElement: $("ivCard"),
    sprite,
    safeIcon: window.PokeMuxGlobalMarket.safeIcon,
    accounts: () => workspaceState().accounts,
    slot,
    read: execute,
    receive: window.PokeMuxPokemonState.receive,
    focus: (index) => setMode("focus", index),
    rarity: window.PokeMuxGlobalMarket.rarity,
    grades: window.PokeMuxGlobalMarket.GRADES,
  });
  $("version").textContent = "v" + ipc.appVersion;
  $("reloadAll").onclick = () =>
    slots.slice(0, options.count).forEach((current) => reload(current.index));
  $("statsBtn").onclick = toggleAnalysis;
  $("recommendTop").onclick = $("recommendBtn").onclick = async () => {
    await Promise.all(
      slots
        .slice(0, options.count)
        .map((current) => readState(current.index).catch(() => null)),
    );
    const chosen = window.PokeMuxHuntRecommendations.selectAccount({
      accounts: workspaceState().accounts,
      focused: mode === "focus" ? focus : undefined,
      preferred: focus,
    });
    return openRecommendations(chosen < 0 ? focus : chosen);
  };
  $("ivsBtn").onclick = () => {
    options.iv = !options.iv;
    save("ivHoverEnabled", options.iv ? "1" : "0");
    hideIv();
    for (const current of slots)
      void execute(
        current.index,
        "window.__pokemuxIv?.setEnabled(" + options.iv + ")",
      ).catch(() => {});
    $("ivsBtn").classList.toggle("on", options.iv);
  };
  $("ivsBtn").classList.toggle("on", options.iv);
  for (const dialog of document.querySelectorAll("dialog"))
    dialog
      .querySelectorAll("[data-close]")
      .forEach((close) => (close.onclick = () => dialog.close()));
  const count = $("panelCount");
  for (let i = 1; i <= 4; i++) count.add(new Option(String(i), String(i)));
  count.value = String(options.count);
  count.onchange = () => {
    options.count = Number(count.value);
    save("count", options.count);
    build();
  };
  $("donTop").onclick = () =>
    window.open("https://link.mercadopago.com.br/POKEmux");
  $("refBtn").onclick = () =>
    navigator.clipboard
      .writeText("https://poke.idleworld.online/?ref=2G9B4BV")
      .then(() =>
        message(
          L(
            "Link de indicação copiado.",
            "Referral link copied.",
            "Enlace de referido copiado.",
          ),
        ),
      );
  $("propNat").onclick = () => {
    document.body.classList.toggle("native-ratio");
    $("propNat").classList.toggle(
      "on",
      document.body.classList.contains("native-ratio"),
    );
  };
  $("accounts").onclick = openAccounts;
  $("loginAll").onclick = () =>
    slots
      .slice(0, options.count)
      .forEach((current) => void login(current.index));
  $("overlayBtn").onclick = () => ipc.toggleOverlay();
  $("errlogBtn").onclick = () => ipc.openErrorLog();
  $("manBtn").onclick = () =>
    window.open("https://github.com/Diego-ops501/Quadrymon/blob/main/MANUAL.md");
  $("faqBtn").onclick = () =>
    window.open("https://github.com/Diego-ops501/Quadrymon/blob/main/FAQ.md");
  $("hunt").onclick = toggleAnalysis;
  const bindings = [
    ["eco", "eco", "eco"],
    ["muteAll", "muted", "muted"],
    ["alerts", "alerts", "alerts"],
    ["voiceAlerts", "voice", "voiceAlerts"],
    ["sndShiny", "shinySound", "sndShiny"],
    ["shotShiny", "shinyShot", "shotShiny"],
    ["voltaHunt", "returnHunt", "voltaHunt"],
    ["awake", "awake", "awake"],
    ["minTray", "minTray", "minTray"],
    ["chat", "chat", "chat"],
    ["dock", "dock", "dock"],
    ["cleanHud", "clean", "cleanHud"],
    ["sellguard", "guard", "sellguard"],
  ];
  for (const [id, option, key] of bindings) {
    const element = $(id);
    element.classList.toggle("on", options[option]);
    element.onclick = () => {
      options[option] = !options[option];
      save(key, options[option] ? "1" : "0");
      element.classList.toggle("on", options[option]);
      applyPerformance();
      void ipc.setAwake(options.awake);
      void ipc.setMinToTray(options.minTray);
      for (const current of slots)
        void applyGamePreferences(current.index).catch(() => {});
    };
  }
  $("autoStart").onclick = async () => {
    const current = await ipc.getAutoStart();
    const on = await ipc.setAutoStart(!current.on);
    $("autoStart").classList.toggle("on", on);
  };
  void ipc
    .getAutoStart()
    .then((result) => $("autoStart").classList.toggle("on", result.on));
  $("langRow").onclick = (event) => {
    if (!event.target.dataset.lang) return;
    options.lang = event.target.dataset.lang;
    save("lang", options.lang);
    localize();
    market.updateLanguage();
    workspace.refresh();
    renderSummary();
    renderAnalysis();
  };
  settings = window.PokeMuxSettings.mount({
    lang: () => options.lang,
    menu: $("menu"),
    close: () => {
      $("menu").close();
      $("menu").classList.remove("show");
    },
    panel: $("analysisSettings"),
    renderPanel: () => {
      $("analysisSettings").replaceChildren(
        button(
          L(
            "Histórico de capturas",
            "Capture history",
            "Historial de capturas",
          ),
          openCaptures,
        ),
      );
    },
    notifications: (host) => {
      host.replaceChildren();
      for (const issue of [
        "faint",
        "lowBalls",
        "emptyBalls",
        "lowPotions",
        "emptyPotions",
        "stalled",
        "down",
      ]) {
        const label = node("label", null, "settings-check"),
          input = node("input");
        input.type = "checkbox";
        input.checked = manualChoices[issue] !== false;
        input.onchange = () => {
          manualChoices[issue] = input.checked;
          save("pokemux-notification-settings", JSON.stringify(manualChoices));
        };
        append(
          label,
          input,
          document.createTextNode(
            window.PokeMuxSummary.COPY[options.lang][issue] || issue,
          ),
        );
        host.append(label);
      }
      const webhook = node("input");
      webhook.type = "password";
      webhook.placeholder = "Discord webhook";
      const configured = readJson("webhook", {});
      webhook.value = configured.url || "";
      webhook.onchange = () =>
        save("webhook", JSON.stringify({ ...configured, url: webhook.value }));
      host.append(webhook);
    },
    summary: (host) =>
      host.replaceChildren(
        button(L("Ver resumo", "Show summary", "Ver resumen"), () =>
          setMode("summary"),
        ),
      ),
  });
  localize();
  build();
  workspace = window.PokeMuxWorkspace.mount({
    state: workspaceState,
    resize: () => {},
    focus: (index) => setMode("focus", index),
    mode: (value, index) => setMode(value, index),
    travelMarket: travel,
    inventory: () => inventory.open(),
    market: (tab) => market.open(tab),
  });
  ipc.onHotkey((key) => {
    if (key === "mute") $("muteAll").click();
    else if (key === "collapse") {
      hideIv();
      setMode("grid");
    } else if (key.startsWith("expand")) setMode("focus", Number(key.slice(6)));
    else if (key.startsWith("ctx")) {
      const index = slots.findIndex((current) => {
        try {
          return current.view?.getWebContentsId() === Number(key.slice(3));
        } catch {
          return false;
        }
      });
      if (index >= 0)
        setMode(mode === "focus" && index === focus ? "grid" : "focus", index);
    }
  });
  void ipc.setAwake(options.awake);
  void ipc.setMinToTray(options.minTray);
  async function tick() {
    await Promise.all(
      slots.slice(0, options.count).map(async (current) => {
        try {
          await readState(current.index);
        } catch {}
        const data = current.data;
        if (
          data?.farm?.hunting &&
          current.lastKillAt &&
          Date.now() - current.lastKillAt > 600000 &&
          Date.now() - current.lastReload > 300000
        ) {
          current.lastReload = Date.now();
          reload(current.index);
        }
        if (
          options.returnHunt &&
          data?.live &&
          !data.farm?.hunting &&
          current.previous &&
          Date.now() - current.lastReload < 120000 &&
          !current.traveling
        )
          void travel(current.index);
      }),
    );
    workspace.refresh();
    renderSummary();
    renderAnalysis();
    const rows = workspaceState().accounts.map((row, index) => ({
      ...row,
      index,
      online: row.live,
      xph: row.metrics?.xph || 0,
      gph: row.metrics?.gph || 0,
    }));
    void ipc.sendOverlayState({
      accounts: rows,
      total: rows.reduce(
        (total, row) => ({
          xph: total.xph + row.xph,
          gph: total.gph + row.gph,
          shiny:
            total.shiny +
            (slots[row.index]?.data?.shinies?.filter((event) => event.cap)
              .length || 0),
        }),
        { xph: 0, gph: 0, shiny: 0 },
      ),
    });
  }
  const tickTimer = setInterval(() => void tick(), 5000);
  window.addEventListener("beforeunload", () => clearInterval(tickTimer));
  void tick();
  // Tool implementations below operate on the same guarded per-account reads.
  let recommendationRevision = 0,
    recommendationRows = [],
    recommendationContext = null;
  const strong = {
    NORMAL: ["ROCK STEEL", "GHOST", ""],
    FIRE: ["FIRE WATER ROCK DRAGON", "", "GRASS ICE BUG STEEL"],
    WATER: ["WATER GRASS DRAGON", "", "FIRE GROUND ROCK"],
    ELECTRIC: ["ELECTRIC GRASS DRAGON", "GROUND", "WATER FLYING"],
    GRASS: [
      "FIRE GRASS POISON FLYING BUG DRAGON STEEL",
      "",
      "WATER GROUND ROCK",
    ],
    ICE: ["FIRE WATER ICE STEEL", "", "GRASS GROUND FLYING DRAGON"],
    FIGHTING: [
      "POISON FLYING PSYCHIC BUG FAIRY",
      "GHOST",
      "NORMAL ICE ROCK DARK STEEL",
    ],
    POISON: ["POISON GROUND ROCK GHOST", "STEEL", "GRASS FAIRY"],
    GROUND: ["GRASS BUG", "FLYING", "FIRE ELECTRIC POISON ROCK STEEL"],
    FLYING: ["ELECTRIC ROCK STEEL", "", "GRASS FIGHTING BUG"],
    PSYCHIC: ["PSYCHIC STEEL", "DARK", "FIGHTING POISON"],
    BUG: [
      "FIRE FIGHTING POISON FLYING GHOST STEEL FAIRY",
      "",
      "GRASS PSYCHIC DARK",
    ],
    ROCK: ["FIGHTING GROUND STEEL", "", "FIRE ICE FLYING BUG"],
    GHOST: ["DARK", "NORMAL", "PSYCHIC GHOST"],
    DRAGON: ["STEEL", "FAIRY", "DRAGON"],
    DARK: ["FIGHTING DARK FAIRY", "", "PSYCHIC GHOST"],
    STEEL: ["FIRE WATER ELECTRIC STEEL", "", "ICE ROCK FAIRY"],
    FAIRY: ["FIRE POISON STEEL", "", "FIGHTING DRAGON DARK"],
  };
  function effectiveness(type, ...targets) {
    const [resistant, immune, weak] = strong[String(type).toUpperCase()] || [
      "",
      "",
      "",
    ];
    return [
      ...new Set(
        targets.filter(Boolean).map((value) => String(value).toUpperCase()),
      ),
    ].reduce(
      (value, target) =>
        immune.split(" ").includes(target)
          ? 0
          : value *
            (weak.split(" ").includes(target)
              ? 2
              : resistant.split(" ").includes(target)
                ? 0.5
                : 1),
      1,
    );
  }
  function project(species, level, quality, total) {
    const base = gameCatalog?.bs[species];
    if (!base) return null;
    return window.PokeMuxIvMath.projectPokemon(
      {
        quality: quality || 1,
        ivTotal: total || 96,
        species: {
          baseStats: Object.fromEntries(
            window.PokeMuxIvMath.STAT_KEYS.map((key, index) => [
              key,
              base[index],
            ]),
          ),
        },
      },
      level,
    ).stats;
  }
  function offense(attacker, hunt) {
    const own = {
        ...project(attacker.sp, attacker.level, attacker.q, attacker.ivt),
        ...attacker.stats,
      },
      wild = { ...project(hunt.sp, hunt.level, 1, 96), ...hunt.combatStats };
    return window.PokeMuxHuntCombatModel.attack(
      attacker,
      {
        ...hunt,
        combatHp: hunt.combatHp || Math.max(24, Math.round(wild.hp * 7)) * 5,
        combatStats: wild,
      },
      own,
      { moves: gameCatalog?.mv },
      effectiveness,
    );
  }
  async function catalog(index) {
    const data = await execute(
      index,
      "(" + window.PokeMuxHuntCatalog.read.toString() + ")()",
    );
    if (!data?.creatures)
      throw Error(
        L(
          "Catálogo indisponível",
          "Catalog unavailable",
          "Catálogo no disponible",
        ),
      );
    gameCatalog = window.PokeMuxHuntCatalog.assemble(
      data.creatures,
      data.markers,
      data.items,
    );
    gameCatalog.combat = data.combat;
    return gameCatalog;
  }
  async function openRecommendations(index = focus) {
    const dialog = $("huntRecommend");
    if (!dialog.open) dialog.showModal();
    $("hrAccount").replaceChildren(
      ...slots
        .slice(0, options.count)
        .map((current, i) => new Option(name(i), String(i))),
    );
    $("hrAccount").value = String(index);
    await refreshRecommendations();
  }
  async function refreshRecommendations() {
    const revision = ++recommendationRevision,
      index = Number($("hrAccount").value);
    recommendationRows = [];
    recommendationContext = null;
    $("hrBody").textContent = L("Calculando…", "Calculating…", "Calculando…");
    $("hrStatus").textContent = "";
    try {
      const [data, definitions] = await Promise.all([
        readState(index),
        catalog(index),
      ]);
      if (revision !== recommendationRevision || !$("huntRecommend").open)
        return;
      const pokemon = data?.team?.find((row) => row.ld);
      if (!data?.live || !pokemon)
        throw Error(
          L(
            "Conecte a conta e selecione um líder.",
            "Connect the account and select a leader.",
            "Conecta la cuenta y selecciona un líder.",
          ),
        );
      if (!pokemon.hp)
        throw Error(
          L(
            "O líder está sem HP.",
            "The leader has no HP.",
            "El líder no tiene HP.",
          ),
        );
      const attacker = {
        sp: pokemon.name
          .toLowerCase()
          .replace(/\bshiny\b/g, "")
          .trim(),
        level: pokemon.level,
        q: pokemon.q,
        ivt: pokemon.ivt,
        tlv: data.level,
        t1: pokemon.t1.toUpperCase(),
        t2: pokemon.t2.toUpperCase(),
        tms: pokemon.tms,
        stats: { ...pokemon.stats, hp: pokemon.hm },
      };
      const engine = window.PokeMuxHuntRecommendations,
        day = engine.dayBonus(data.events),
        cached = engine.combatCache(
          readJson("huntCombatCacheV1", null),
          definitions,
        );
      save("huntCombatCacheV1", JSON.stringify(cached));
      const combatStats = Object.fromEntries(
          definitions.h.map((hunt) => [
            hunt.sl,
            engine.cachedCombat(cached, hunt, definitions.bs),
          ]),
        ),
        selection = $("hrPotion").value;
      const potion =
        selection === "observed"
          ? undefined
          : selection === "none"
            ? null
            : definitions.items.find((row) => String(row.id) === selection);
      const rows = engine.rank({
        attacker,
        hunts: definitions.h.map((hunt) => ({
          ...hunt,
          lootValue: engine.lootValue(hunt.drops, definitions.items),
        })),
        offense,
        project,
        moves: (species) => definitions.mv[species]?.a || [],
        effectiveness,
        combatStats,
        simulation: {
          bases: definitions.bs,
          moves: definitions.mv,
          items: definitions.items,
          model: "local",
        },
        xpMultiplier: data.xpMultiplier || 1,
        measurements: window.PokeMuxHuntMeasurements.recommendationStatsFor(
          measurements,
          data.cid,
          pokemon,
        ),
        objective: $("hrFocus").value,
        day,
        potion: potion
          ? {
              heal: num(potion.healAmount || potion.heal),
              price: num(potion.priceGold || potion.npcPrice),
            }
          : potion,
        threshold: Number($("hrThreshold").value),
      });
      const viable = rows.filter((row) => row.viable && row.score != null);
      recommendationRows = viable.slice(0, 5);
      recommendationContext = {
        index,
        cid: data.cid,
        id: pokemon.id,
        level: pokemon.level,
      };
      const body = $("hrBody");
      body.replaceChildren(
        node(
          "p",
          name(index) +
            " · " +
            pokemon.name +
            " Lv" +
            pokemon.level +
            " · HP " +
            format(pokemon.hp) +
            "/" +
            format(pokemon.hm),
          "runtime-note",
        ),
      );
      const band = engine.progressionBand(attacker);
      body.append(
        node(
          "p",
          L("Faixa de hunts: ", "Hunt tier: ", "Franja de hunts: ") +
            band.min +
            "–" +
            band.max +
            (band.region ? " · " + band.region : ""),
        ),
      );
      if (day) {
        const section = node("section", null, "hr-day");
        append(
          section,
          node(
            "h3",
            L(
              "Melhor hunt do tipo do dia",
              "Best hunt of today’s type",
              "Mejor hunt del tipo del día",
            ) +
              " · " +
              day.label,
          ),
          node("p", "+" + day.xp + "% XP · +" + day.loot + "% loot"),
        );
        const best = engine.bestForDay(viable, day);
        if (best) section.append(recommendationCard(best));
        else
          section.append(
            node(
              "p",
              L(
                "Nenhuma hunt segura deste tipo.",
                "No safe hunt of this type.",
                "No hay hunt segura de este tipo.",
              ),
            ),
          );
        body.append(section);
      }
      if (!recommendationRows.length)
        body.append(
          node(
            "p",
            L(
              "Não há dados suficientes para uma recomendação segura.",
              "Insufficient data for a safe recommendation.",
              "No hay datos suficientes para una recomendación segura.",
            ),
          ),
        );
      recommendationRows.forEach((row, i) =>
        body.append(recommendationCard(row, i === 0)),
      );
      body.append(
        node(
          "p",
          L(
            "Simulações são estimativas; medições reais da conta têm prioridade.",
            "Simulations are estimates; actual account measurements take priority.",
            "Las simulaciones son estimaciones; las mediciones reales tienen prioridad.",
          ),
          "runtime-note",
        ),
      );
      for (const row of definitions.items.filter((row) =>
        ["heal", "potion"].includes(row.category),
      )) {
        if (
          ![...$("hrPotion").options].some(
            (option) => option.value === String(row.id),
          )
        )
          $("hrPotion").add(new Option(row.name, String(row.id)));
      }
    } catch (error) {
      if (revision === recommendationRevision)
        $("hrBody").textContent = error.message;
    }
  }
  function recommendationCard(row, best) {
    const card = node(
      "article",
      null,
      "runtime-card" + (best ? " runtime-best" : ""),
    );
    append(
      card,
      node("h3", (best ? "★ " : "") + row.hunt.name + " · Lv" + row.hunt.level),
      node(
        "p",
        row.attack.nome +
          " · ×" +
          row.attack.eff.toFixed(2) +
          " · ≈" +
          (row.observedHits || row.simulation?.meanHits || 0).toFixed(1) +
          " " +
          L("golpes/abate", "hits/kill", "golpes/baja"),
      ),
      node("p", L("Risco: ", "Risk: ", "Riesgo: ") + row.risk),
      node(
        "p",
        "XP / abate: " +
          format(row.hunt.xp) +
          " · " +
          L("Venda: ", "Sale: ", "Venta: ") +
          format(row.hunt.sv),
      ),
      node(
        "p",
        ($("hrFocus").value === "gold" ? "$/h: " : "XP/h: ") +
          format($("hrFocus").value === "gold" ? row.gph : row.xph) +
          " · " +
          (row.kphSource === "measured"
            ? L("medido", "measured", "medido")
            : L("estimado", "estimated", "estimado")),
      ),
      button(L("Ir para esta hunt", "Go to this hunt", "Ir a esta hunt"), () =>
        travelRecommendation(row),
      ),
    );
    return card;
  }
  async function travelRecommendation(row) {
    const expected = recommendationContext;
    if (!expected) return;
    const data = await readState(expected.index),
      leader = data.team?.find((pokemon) => pokemon.ld);
    if (
      data.cid !== expected.cid ||
      leader?.id !== expected.id ||
      leader.level !== expected.level
    ) {
      message(
        L(
          "O Pokémon mudou; atualize a recomendação.",
          "The Pokémon changed; refresh recommendations.",
          "El Pokémon cambió; actualiza la recomendación.",
        ),
      );
      return;
    }
    const script = window.PokeMuxHuntRecommendations.travelScript(
      expected,
      row.hunt,
    );
    if (!script) return;
    const result = await execute(expected.index, script);
    if (result?.ok) {
      $("hrStatus").textContent =
        L("Viagem confirmada: ", "Travel confirmed: ", "Viaje confirmado: ") +
        row.hunt.name;
      sampleContexts[expected.index] = null;
    } else
      message(
        L(
          "Viagem não confirmada: ",
          "Travel not confirmed: ",
          "Viaje no confirmado: ",
        ) + result.reason,
      );
  }
  $("hrAccount").onchange = refreshRecommendations;
  $("hrRefresh").onclick = refreshRecommendations;
  for (const id of ["hrFocus", "hrPotion", "hrThreshold"])
    $(id).onchange = refreshRecommendations;
  function openCaptures() {
    const select = $("captureAccount");
    select.replaceChildren(
      new Option(L("Todas as contas", "All accounts", "Todas las cuentas"), ""),
      ...slots
        .slice(0, options.count)
        .map((current, index) => new Option(name(index), String(index))),
    );
    if (
      !$("captureRarity").options.length ||
      $("captureRarity").options.length === 1
    )
      for (const grade of window.PokeMuxGlobalMarket.GRADES)
        $("captureRarity").add(new Option(grade, grade));
    renderCaptures();
    $("captureHistory").showModal();
  }
  function filteredCaptures() {
    return captureLog
      .filter(
        (row) =>
          (!$("captureSearch").value ||
            String(row.n)
              .toLowerCase()
              .includes($("captureSearch").value.toLowerCase())) &&
          ($("captureAccount").value === "" ||
            Number(row.p) === Number($("captureAccount").value)) &&
          (!$("captureRarity").value ||
            window.PokeMuxGlobalMarket.rarity(row.q) ===
              $("captureRarity").value) &&
          (!$("captureIv").value || num(row.iv) >= num($("captureIv").value)) &&
          (!$("captureShiny").checked || row.sh),
      )
      .sort((a, b) => b.t - a.t);
  }
  function renderCaptures() {
    const table = node("table", null, "capture-table"),
      head = node("tr");
    for (const label of [
      L("Data", "Date", "Fecha"),
      L("Conta", "Account", "Cuenta"),
      "Pokémon",
      "IV",
      "Q",
    ])
      head.append(node("th", label));
    table.append(head);
    for (const row of filteredCaptures().slice(0, 500)) {
      const tr = node("tr");
      for (const value of [
        new Date(row.t).toLocaleString(),
        row.account || name(row.p),
        row.n + (row.sh ? " ✨" : ""),
        row.iv,
        row.q,
      ])
        tr.append(node("td", value));
      table.append(tr);
    }
    $("captureRows").replaceChildren(table);
  }
  for (const id of [
    "captureSearch",
    "captureAccount",
    "captureRarity",
    "captureIv",
    "captureShiny",
  ])
    $(id).oninput = renderCaptures;
  function download(filename, contents, type = "text/plain") {
    const blob = new Blob([contents], { type }),
      url = URL.createObjectURL(blob),
      link = node("a");
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }
  function exportCaptures() {
    const cell = (value) =>
      '"' +
      String(value ?? "")
        .replace(/^[=+@-]/, "'")
        .replace(/"/g, '""') +
      '"';
    const records = [
      ["Data", "Conta", "Pokémon", "IV", "Qualidade", "Shiny"],
      ...filteredCaptures().map((row) => [
        new Date(row.t).toISOString(),
        row.account || name(row.p),
        row.n,
        row.iv,
        row.q,
        row.sh,
      ]),
    ];
    download(
      "quadrymon-capturas.csv",
      "\uFEFF" + records.map((row) => row.map(cell).join(";")).join("\r\n"),
      "text/csv;charset=utf-8",
    );
  }
  $("captureCsv").onclick = exportCaptures;
  function resetSessions() {
    for (const current of slots)
      void execute(
        current.index,
        "(()=>{const state=window.__poke;if(!state)return false;state.sess=window.PokeMuxSession.createState().sess;state.sess.slug=state.lastSlug;state.analyzerBase=state.ws.analyzer?{...state.ws.analyzer}:null;return true;})()",
      );
    for (let i = 0; i < 4; i++) sampleContexts[i] = null;
  }
  $("bkExp").onclick = () => {
    const entries = {};
    for (let index = 0; index < localStorage.length; index++) {
      const key = localStorage.key(index);
      if (!/token|password|senha|webhook|userScripts|scriptsOn/i.test(key))
        entries[key] = load(key);
    }
    download(
      "quadrymon-config.json",
      JSON.stringify(entries, null, 2),
      "application/json",
    );
  };
  $("bkImp").onclick = () => {
    const input = node("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async () => {
      const file = input.files[0];
      if (!file || file.size > 2000000) return;
      try {
        const parsed = JSON.parse(await file.text());
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
          throw Error("invalid");
        if (
          !confirm(
            L(
              "Importar configurações e histórico?",
              "Import settings and history?",
              "¿Importar ajustes e historial?",
            ),
          )
        )
          return;
        const current = JSON.stringify(
          Object.fromEntries(
            Object.keys(localStorage).map((key) => [key, load(key)]),
          ),
        );
        if (
          !(await ipc.saveBackup(
            "config-before-import-" + Date.now() + ".json",
            current,
            "",
          ))
        )
          throw Error(
            L(
              "Não foi possível criar o backup.",
              "Could not create a backup.",
              "No se pudo crear una copia.",
            ),
          );
        for (const [key, value] of Object.entries(parsed))
          if (
            typeof value === "string" &&
            !/token|password|senha|webhook|userScripts|scriptsOn/i.test(key)
          )
            save(key, value);
        location.reload();
      } catch (error) {
        message(error.message);
      }
    };
    input.click();
  };
  $("updateBtn").onclick = () => ipc.checkUpdate();
  ipc.onUpdateStatus((state) => {
    if (
      state.status === "available" &&
      confirm(
        L(
          "Uma atualização está disponível. Baixar?",
          "An update is available. Download?",
          "Hay una actualización disponible. ¿Descargar?",
        ),
      )
    )
      void ipc.downloadUpdate();
    else if (
      state.status === "downloaded" &&
      confirm(
        L(
          "Instalar atualização e reiniciar?",
          "Install update and restart?",
          "¿Instalar y reiniciar?",
        ),
      )
    )
      void ipc.installUpdate();
    else if (state.status === "error") message(state.message || "Update error");
  });
  $("tierBtn").onclick = () => openSpeciesTools(false);
  $("dittoBtn").onclick = () => openSpeciesTools(true);
  async function openSpeciesTools(ditto) {
    const body = $("toolsBody");
    body.textContent = L(
      "Carregando catálogo…",
      "Loading catalog…",
      "Cargando catálogo…",
    );
    $("toolsTitle").textContent = ditto ? "Ditto" : "Tierlist";
    $("toolsDialog").showModal();
    try {
      await catalog(focus);
      const targetLevel = node("input");
      targetLevel.type = "number";
      targetLevel.min = 1;
      targetLevel.value =
        slots[focus].data?.team?.find((row) => row.ld)?.level || 100;
      const type = node("select");
      type.add(
        new Option(L("Todos os tipos", "All types", "Todos los tipos"), ""),
      );
      for (const value of window.PokeMuxGlobalMarket.TYPES)
        type.add(new Option(value, value));
      const rows = node("div", null, "runtime-list");
      const draw = () => {
        rows.replaceChildren();
        const result = Object.keys(gameCatalog.mv)
          .map((species) => {
            const own = project(species, Number(targetLevel.value), 1, 96),
              moves = gameCatalog.mv[species];
            const usable = moves.a.filter(
              (move) => move[5] <= targetLevel.value && !move[6],
            );
            return {
              species,
              own,
              moves,
              score: usable.reduce(
                (sum, move) =>
                  sum +
                  ((move[3] === "P" ? own.atk : own.spa) * move[1]) /
                    Math.max(1, move[4]),
                0,
              ),
            };
          })
          .filter((row) => !type.value || row.moves.t.includes(type.value))
          .sort((a, b) => b.score - a.score)
          .slice(0, 100);
        for (const row of result) {
          const card = node("article", null, "runtime-card");
          append(
            card,
            node("h3", row.species + " · " + format(row.score)),
            node("p", row.moves.t.filter(Boolean).join(" / ")),
            node(
              "p",
              "Atk " +
                format(row.own.atk) +
                " · SpA " +
                format(row.own.spa) +
                " · Def " +
                format(row.own.def) +
                " · HP " +
                format(row.own.hp),
            ),
          );
          if (ditto)
            card.append(
              node(
                "p",
                L(
                  "Atributos projetados da espécie copiada; confirme transformação e desbloqueio no jogo.",
                  "Projected copied-species stats; confirm transformation and unlock in game.",
                  "Atributos proyectados de la especie copiada; confirma transformación y desbloqueo en el juego.",
                ),
              ),
            );
          rows.append(card);
        }
      };
      body.replaceChildren(
        append(node("div", null, "hr-controls"), targetLevel, type),
        node(
          "p",
          L(
            "Ordenação por potência dos golpes aprendidos no nível escolhido; não é uma recomendação de hunt.",
            "Sorted by learned-move power at the selected level; this is not a hunt recommendation.",
            "Orden por potencia de movimientos aprendidos; no es una recomendación de hunt.",
          ),
          "runtime-note",
        ),
        rows,
      );
      targetLevel.oninput = draw;
      type.onchange = draw;
      draw();
    } catch (error) {
      body.textContent = error.message;
    }
  }
  window.PokeMuxRuntime = {
    state: workspaceState,
    readState,
    openRecommendations,
    openCaptures,
    slot,
    execute,
  };
  window.addEventListener(
    "error",
    (event) => void ipc.logError("ui", event.message),
  );
  window.addEventListener(
    "unhandledrejection",
    (event) =>
      void ipc.logError("ui-promise", event.reason?.message || event.reason),
  );
})().catch((error) => {
  console.error(error);
  window.pokeAPI?.logError("ui-boot", error.stack || error);
});
