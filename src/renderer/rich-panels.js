(function (root) {
  "use strict";
  const display = value => root.QuadrymonNames?.display(value) || String(value ?? "").replace(/_/g, " ");
  function mount(c) {
    const { node: el, button, append, L } = c;
    const number = value => value == null || !Number.isFinite(Number(value)) ? "—" : c.format(Number(value));
    const compact = value => { if (value == null || !Number.isFinite(Number(value))) return "—"; const n = Number(value), size = Math.abs(n), scale = size >= 1e9 ? 1e9 : size >= 1e6 ? 1e6 : size >= 1e3 ? 1e3 : 1; return new Intl.NumberFormat(c.lang(), { maximumFractionDigits: scale === 1 ? 0 : 1 }).format(n / scale) + ({ 1e9: "B", 1e6: "M", 1e3: "K" }[scale] || ""); };
    const signed = value => value == null ? "—" : (value >= 0 ? "+" : "") + compact(value);
    const quality = value => value == null ? "—" : new Intl.NumberFormat(c.lang(), { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
    const duration = seconds => Number.isFinite(seconds) ? Math.floor(seconds / 3600) + "h " + Math.floor(seconds % 3600 / 60) + "m" : seconds === Infinity ? "∞" : "—";
    const sections = ["kpis", "session", "gold", "compare", "drops", "bag", "pinned", "target", "team"];
    const config = c.read("statsCfg", {});
    config.order = [...new Set([...(Array.isArray(config.order) ? config.order : []).filter(x => sections.includes(x)), ...sections])];
    config.hide = config.hide && typeof config.hide === "object" ? config.hide : {};
    config.pinned = (Array.isArray(config.pinned) ? config.pinned : []).filter(x => x && ["ball", "item"].includes(x.t)).slice(0, 40);
    let selected = null, captureFilter = "important", search = "", history = [];
    const catchFilters = { p: -1, per: 0, r: "", iv: 0, q: 0, sh: false, ...c.read("cdFC", {}) };
    captureFilter = catchFilters.mode === "all" ? "all" : "important"; search = String(catchFilters.n || "");
    function clearQualityFilters() { Object.assign(catchFilters, { iv: 0, q: 0, r: "", sh: false }); }
    function saveCatchFilters() { c.save("cdFC", JSON.stringify({ ...catchFilters, mode: captureFilter, n: search, allDefaultsVersion: 1 })); }
    // Older settings kept the important-capture threshold when switching to All.
    if (captureFilter === "all" && catchFilters.allDefaultsVersion !== 1) { clearQualityFilters(); saveCatchFilters(); }
    const summarySections = ["kpis", "table", "today", "catches", "pinned", "trend", "shinies", "shinyTried", "shared"];
    const summaryConfig = c.read("cardsCfg", {});
    summaryConfig.order = [...new Set([...(Array.isArray(summaryConfig.order) ? summaryConfig.order : summarySections).filter(x => summarySections.includes(x)), ...summarySections])];
    summaryConfig.hide = summaryConfig.hide || { trend: true, shinies: true, shinyTried: true, shared: true };
    summaryConfig.w ||= {}; summaryConfig.h ||= {};
    let summaryConfigOpen = false, dragging = null;
    const saveSummary = () => c.save("cardsCfg", JSON.stringify(summaryConfig));
    const daily = c.read("histDay", {}), goals = c.read("goals", {}), baselines = new Map();
    const dayKey = () => { const now = new Date(); return now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0"); };
    function observe(index, data) {
      if (!data?.ok || !data.a || !data.cid) return;
      const a = data.a, identity = data.cid + ":" + (a.epoch ?? data.hunt), current = { identity, g: a.balance, x: a.xpg, kl: a.kills, c: a.captures, sf: a.shinyFound, sc: a.shinyCap }, previous = baselines.get(index); baselines.set(index, current);
      if (!previous || previous.identity !== identity || current.kl < previous.kl || current.x < previous.x) return;
      const delta = Object.fromEntries(["g", "x", "kl", "c", "sf", "sc"].map(key => [key, Number.isFinite(current[key]) && Number.isFinite(previous[key]) ? current[key] - previous[key] : 0]));
      if (!Object.values(delta).some(value => value !== 0)) return;
      const date = dayKey(); daily[date] ||= {}; const total = daily[date][String(index)] ||= {};
      for (const key of Object.keys(delta)) total[key] = (Number(total[key]) || 0) + (key === "g" ? delta[key] : Math.max(0, delta[key]));
      const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 90); for (const key of Object.keys(daily)) if (new Date(key + "T23:59:59") < cutoff) delete daily[key];
      c.save("histDay", JSON.stringify(daily));
    }
    const save = () => c.save("statsCfg", JSON.stringify(config));
    const text = key => ({ kpis: L("Ritmo atual", "Current pace", "Ritmo actual"), session: L("Sessão da hunt", "Hunt session", "Sesión de hunt"), gold: L("Saldo da hunt", "Hunt balance", "Saldo de hunt"), compare: L("Hunt anterior", "Previous hunt", "Hunt anterior"), drops: "Loot", bag: "Bag", pinned: L("Itens fixados", "Pinned items", "Objetos fijados"), target: L("Alvo shiny", "Shiny target", "Objetivo shiny"), team: L("Equipe", "Team", "Equipo") })[key];
    function section(title, key) { const box = el("section", null, "restored-section"); if (key) box.dataset.panelSection = key; box.append(el("h3", title)); return box; }
    function kpi(label, value, cls = "") { return append(el("div", null, "restored-kpi " + cls), el("b", value), el("small", label)); }
    function row(label, value, cls = "") { return append(el("div", null, "restored-row " + cls), el("span", label), el("b", value)); }
    function action(label, type, index) { const b = button(label, () => {}); b.dataset.panelAction = type; if (index != null) b.dataset.account = index; return b; }
    function serializeControls(host) { for (const input of host.querySelectorAll("input")) { input.setAttribute("value", input.value); if (input.type === "checkbox") input.toggleAttribute("checked", input.checked); } for (const option of host.querySelectorAll("option")) option.toggleAttribute("selected", option.selected); return host; }
    function image(id, shiny, name) { const src = c.sprite(id, shiny, name); if (!src) return el("span", "◇", "restored-sprite-placeholder"); const img = el("img"); img.src = src; img.alt = ""; img.loading = "eager"; return img; }
    function captureRow(entry) { const line = el("div", null, "summary-capture"), account = entry.account || entry.acc || c.name(entry.p || 0); line.append(image(entry.sid || entry.speciesId, false, entry.n), el("b", (entry.sh ? "✨ " : "") + display(entry.n), "capture-name"), el("span", "IV " + number(entry.iv), "capture-iv"), el("span", "Q ×" + quality(entry.q), "capture-quality"), el("span", account, "capture-account")); return line; }
    function teamCard(p, index) {
      const box = el("article", null, "restored-pokemon" + (p.ld ? " leader" : ""));
      const details = el("div"); details.append(append(el("span", null, "team-line"), el("b", (p.ld ? "⭐ " : "") + (p.shiny ? "✨ " : "") + display(p.name) + " Lv" + number(p.level)), el("small", number(p.hp) + "/" + number(p.hm))));
      const hp = el("progress"); hp.max = Math.max(1, p.hm || 1); hp.value = p.hp || 0; hp.title = "HP " + number(p.hp) + "/" + number(p.hm);
      details.append(hp); if (Number.isFinite(p.xpp)) { const xp = el("progress"); xp.max = 100; xp.value = p.xpp; xp.className = "team-xp"; xp.title = "EXP " + number(p.xpp) + "%"; details.append(xp); }
      append(box, image(p.sid, false, p.name), details);
      box.dataset.panelAction = "pokemon"; box.dataset.account = index; box.dataset.pokemon = p.id; box.tabIndex = 0;
      return box;
    }
    function pinned(data) {
      const box = section(text("pinned"));
      for (const item of config.pinned) {
        const found = (item.t === "ball" ? data?.balls : data?.bag)?.find(x => Number(x.id) === Number(item.id));
        box.append(row(item.name, data ? found?.infinite ? "∞" : number(found?.quantity || 0) : "—"));
      }
      if (!config.pinned.length) box.append(el("p", L("Use a estrela na Bag para fixar itens.", "Use the star in Bag to pin items.", "Usa la estrella en Bag para fijar objetos."), "runtime-note"));
      return box;
    }
    function bag(data, index) {
      const box = section("Bag"), items = [...(data?.balls || []).map(x => ({ ...x, category: "Poké Balls", t: "ball" })), ...(data?.bag || []).map(x => ({ ...x, t: "item" }))];
      const categoryGrid = el("div", null, "analysis-bag-grid");
      for (const category of [...new Set(items.map(x => x.category || L("Outros", "Other", "Otros")))]) {
        const grouped = items.filter(x => (x.category || L("Outros", "Other", "Otros")) === category); categoryGrid.append(row(category, grouped.some(x => x.infinite) ? "∞" : number(grouped.reduce((n, x) => n + (Number(x.quantity) || 0), 0))));
        box.append(el("h4", category));
        for (const item of items.filter(x => (x.category || L("Outros", "Other", "Otros")) === category)) {
          const line = row(item.name, item.infinite ? "∞" : number(item.quantity));
          const pin = action(config.pinned.some(x => x.id === item.id && x.t === item.t) ? "★" : "☆", "pin", index);
          pin.dataset.item = item.id; pin.dataset.kind = item.t; pin.dataset.name = item.name; pin.title = text("pinned"); line.append(pin); box.append(line);
        }
      }
      box.insertBefore(categoryGrid, box.children[1] || null);
      if (!items.length) box.append(el("p", L("Aguardando inventário do jogo.", "Waiting for game inventory.", "Esperando inventario del juego."), "runtime-note"));
      return box;
    }
    function accountCard(index) {
      const data = c.data(index), state = c.summaryRow(index), health = root.PokeMuxSummary.health(state), copy = root.PokeMuxSummary.COPY[c.lang()], live = state.st === "on";
      const card = el("article", null, "runtime-card summary-account"); card.dataset.summaryKey = "account-" + index; card.style.setProperty("--account-color", c.colors[index]);
      append(card, append(el("header"), action(c.name(index), "focus", index), el("span", copy[health.status], "summary-status " + health.status)));
      const leader = data?.team?.find(x => x.ld) || data?.team?.[0];
      const pokemon = append(el("div", null, "summary-pokemon"), image(leader?.sid, false, leader?.name), append(el("div"), el("b", leader ? (leader.shiny ? "✨ " : "") + display(leader.name) : copy.noPokemon), el("small", leader ? "Lv " + number(leader.level) + " · IV " + number(leader.ivt) : "—"))); if (leader?.q != null) { const q = Number(leader.q), labels = [L("Fraca", "Weak", "Débil"), L("Comum", "Common", "Común"), L("Incomum", "Uncommon", "Poco común"), L("Rara", "Rare", "Rara"), L("Épica", "Epic", "Épica"), L("Lendária", "Legendary", "Legendaria"), L("Mítica", "Mythic", "Mítica"), L("Anciã", "Ancient", "Antigua"), L("Divina", "Divine", "Divina")], at = q >= 4 ? 8 : q >= 3 ? 7 : q >= 2 ? 6 : q >= 1.7 ? 5 : q >= 1.5 ? 4 : q >= 1.3 ? 3 : q >= 1.1 ? 2 : q >= 1 ? 1 : 0, rarity = el("strong", labels[at], "summary-rarity"); rarity.style.color = ["#829bb3", "#51ddae", "#79c0ff", "#c297ff", "#f4b942", "#ff9800", "#c297ff", "#f4b942", "#e5e7eb"][at]; rarity.title = "Q ×" + quality(q); pokemon.lastChild.append(rarity); } if (leader) { const details = pokemon.lastChild, title = el("div", null, "summary-leader-line"); title.append(details.firstChild, el("span", "IV " + number(leader.ivt), "capture-iv"), el("span", "Q ×" + quality(leader.q), "capture-quality")); details.prepend(title); details.querySelector("small").textContent = "Lv " + number(leader.level); } card.append(pokemon);
      card.append(el("p", display(data?.hunt) || copy.noHunt, "summary-hunt"));
      const pace = el("div", null, "summary-rate"); pace.append(kpi("XP/h", health.status === "hunting" ? compact(data.a?.xph) : "—", "xp"), kpi("$/h", health.status === "hunting" ? signed(data.a?.gph) : "—", "money")); card.append(pace);
      card.append(append(el("div", null, "summary-session"), el("span", copy.session + " " + (data?.a ? duration(data.a.seconds) : "—")), el("span", number(data?.a?.captures) + " " + copy.captures)));
      const supply = el("div", null, "summary-supply");
      for (const [label, stock, used, infinite, available] of [[copy.balls, state.balls, state.aBalls, state.infiniteBalls, state.hasBalls], [copy.potions, state.pots, state.aPots, false, state.hasInv]]) {
        const item = kpi(label, live && available ? infinite ? "∞" : number(stock) : "—");
        const estimate = root.PokeMuxSummary.duration(stock, used, state.secs, infinite);
        item.append(el("small", estimate == null ? copy.unknown : "≈ " + duration(estimate), "runtime-note")); supply.append(item);
      }
      card.append(supply);
      if (health.issues.length) card.append(el("p", health.issues.map(x => copy[x]).join(" · "), "summary-issues"));
      card.append(append(el("div", null, "summary-actions"), action(copy.open, "focus", index), action(L("Recomendar hunt", "Recommend hunt", "Recomendar hunt"), "recommend", index)));
      return card;
    }
    function summary() {
      const host = el("div", null, "restored-summary"), rows = Array.from({ length: c.count() }, (_, i) => c.data(i)), active = rows.filter((x, i) => x?.live && c.summaryRow(i).st === "on");
      host.append(append(el("div", null, "restored-heading"), el("h2", L("Resumo das contas", "Account summary", "Resumen de cuentas")), action(L("Histórico de capturas", "Capture history", "Historial de capturas"), "captures"), action(L("Zerar sessão", "Reset session", "Reiniciar sesión"), "reset")));
      const totals = section(L("Ritmo atual · por hora", "Current pace · per hour", "Ritmo actual · por hora")), values = el("div", null, "restored-kpis");
      for (const [label, key, cls] of [["XP/h", "xph", "xp"], ["$/h", "gph", "money"], [L("Abates/h", "Kills/h", "Bajas/h"), "kph", "" ]]) { const sum = active.filter(x => x.farm?.hunting).reduce((sum, x) => sum + (Number(x.a?.[key]) || 0), 0); values.append(kpi(label, key === "gph" ? signed(sum) : key === "xph" ? compact(sum) : number(sum), cls)); }
      values.append(kpi(L("Contas em farm", "Farming accounts", "Cuentas farmeando"), active.filter(x => x.farm?.hunting).length + "/" + c.count())); totals.append(values); host.append(totals);
      if (c.shinyLifetime) totals.append(el("p", "✨ " + L("Shinies encontrados · acumulado do app", "Shinies found · app lifetime", "Shinies encontrados · acumulado de la app") + ": " + number(c.shinyLifetime()), "summary-period"));
      totals.append(el("p", L("Sessão da hunt", "Hunt session", "Sesión de hunt") + " · " + number(rows.reduce((n, x) => n + (x?.a?.captures || 0), 0)) + " " + L("capturas", "catches", "capturas") + " · ✨ " + L("Encontrados", "Found", "Encontrados") + ": " + number(rows.reduce((n, x) => n + (x?.a?.shinyFound || 0), 0)) + " · " + L("Capturados", "Caught", "Capturados") + ": " + number(rows.reduce((n, x) => n + (x?.a?.shinyCap || 0), 0)), "summary-period"));
      const today = section(L("Hoje · acumulado", "Today · cumulative", "Hoy · acumulado") + " · " + dayKey()), day = Object.values(daily[dayKey()] || {}), dayGrid = el("div", null, "restored-kpis");
      for (const [label, key] of [["Gold", "g"], ["XP", "x"], [L("Abates", "Kills", "Bajas"), "kl"], [L("Capturas", "Captures", "Capturas"), "c"], ["Shiny", "sc"]]) dayGrid.append(kpi(label, key === "sc" ? number(day.reduce((n, x) => n + (x.sf || 0), 0)) + " / " + number(day.reduce((n, x) => n + (x.sc || 0), 0)) : number(day.reduce((sum, x) => sum + (Number(x[key]) || 0), 0)))); today.append(dayGrid);
      const goalControls = el("div", null, "restored-filters");
      for (const [key, label] of [["g", L("Meta de saldo", "Balance goal", "Meta de saldo")], ["c", L("Meta de capturas", "Capture goal", "Meta de capturas")]]) {
        const input = el("input"); input.type = "number"; input.min = 0; input.value = goals[key] || ""; input.dataset.panelGoal = key; const field = append(el("label", label), input); goalControls.append(field);
        if (goals[key] > 0) { const progress = el("progress"); progress.max = goals[key]; progress.value = Math.max(0, day.reduce((sum, x) => sum + (Number(x[key]) || 0), 0)); progress.className = "summary-goal"; progress.title = label + ": " + number(progress.value) + " / " + number(goals[key]); today.append(progress); }
      } goalControls.append(action("⬇ " + L("Dia", "Day", "Día"), "export-day"), action("⬇ Hunts", "export-hunts")); today.firstChild.append(goalControls); host.append(today);
      const periodTotals = el("div", null, "summary-period-totals");
      for (const [days, label] of [[7, L("Últimos 7 dias", "Last 7 days", "Últimos 7 días")], [0, L("Desde o início", "All time", "Desde el inicio")]]) { const cutoff = Date.now() - days * 86400000, entries = Object.entries(daily).filter(([date]) => !days || new Date(date + "T23:59:59").getTime() >= cutoff).flatMap(([, entries]) => Object.values(entries)); periodTotals.append(el("span", label + ": " + number(entries.reduce((s, x) => s + (x.g || 0), 0)) + " gold · " + compact(entries.reduce((s, x) => s + (x.x || 0), 0)) + " XP · " + number(entries.reduce((s, x) => s + (x.c || 0), 0)) + " " + L("capturas", "catches", "capturas"))); } today.append(periodTotals);
      const accounts = el("div", null, "summary-accounts"); accounts.style.setProperty("--summary-count", c.count()); for (let i = 0; i < c.count(); i++) accounts.append(accountCard(i)); host.append(accounts);
      const columns = el("div", null, "restored-columns");
      const session = section(text("session")), sessionValues = el("div", null, "restored-kpis");
      for (const [label, key] of [["XP", "xpg"], [L("Saldo", "Balance", "Saldo"), "balance"], [L("Abates", "Kills", "Bajas"), "kills"], [L("Capturas", "Captures", "Capturas"), "captures"]]) { const known = rows.map(x => x?.a?.[key]).filter(x => Number.isFinite(x)); sessionValues.append(kpi(label, known.length ? number(known.reduce((sum, x) => sum + x, 0)) : "—")); }
      session.append(sessionValues); columns.append(session);
      const trend = section(L("Tendência · sessão atual", "Trend · current session", "Tendencia · sesión actual"));
      const now = Date.now(), sample = { t: now, x: active.reduce((s, x) => s + (x.a?.xph || 0), 0), g: active.reduce((s, x) => s + (x.a?.gph || 0), 0) };
      if (!history.length || now - history.at(-1).t >= 5000) history.push(sample); if (history.length > 80) history.shift();
      for (const [label, key, color] of [["XP/h", "x", "#3882f6"], ["$/h", "g", "#22d3c5"]]) {
        trend.append(el("h4", label)); const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); svg.setAttribute("viewBox", "0 0 400 70"); svg.classList.add("restored-spark");
        const min = Math.min(0, ...history.map(x => x[key])), max = Math.max(1, ...history.map(x => x[key])); const line = document.createElementNS(svg.namespaceURI, "polyline"); line.setAttribute("points", history.map((x, i) => (i * 400 / Math.max(1, history.length - 1)) + "," + (65 - (x[key] - min) / Math.max(1, max - min) * 60)).join(" ")); line.setAttribute("stroke", color); line.setAttribute("fill", "none"); line.setAttribute("stroke-width", "2"); svg.append(line); trend.append(svg);
      } columns.append(trend);
      const teams = section(text("team")); for (let i = 0; i < c.count(); i++) { teams.append(el("h4", c.name(i))); for (const p of c.data(i)?.team || []) teams.append(teamCard(p, i)); } columns.append(teams);
      const captures = section(L("Capturas importantes", "Important catches", "Capturas importantes")), controls = el("div", null, "restored-filters"), mode = el("select"); mode.dataset.panelFilter = "mode";
      for (const [value, label] of [["important", L("Importantes", "Important", "Importantes")], ["all", L("Todas", "All", "Todas")]]) { const option = el("option", label); option.value = value; option.selected = captureFilter === value; mode.append(option); }
      const query = el("input"); query.type = "search"; query.placeholder = L("Buscar Pokémon", "Search Pokémon", "Buscar Pokémon"); query.value = search; query.dataset.panelFilter = "search"; controls.append(mode, query); captures.append(controls);
      const addSelect = (key, options) => { const select = el("select"); select.dataset.catchFilter = key; for (const [value, label] of options) { const option = el("option", label); option.value = value; option.selected = String(catchFilters[key]) === String(value); select.append(option); } controls.append(select); };
      addSelect("p", [[-1, L("Todas as contas", "All accounts", "Todas las cuentas")], ...rows.map((_, i) => [i, c.name(i)])]); addSelect("per", [[0, L("Todo o período", "All time", "Todo el período")], [1, "1h"], [6, "6h"], [24, "24h"]]); addSelect("r", [["", L("Raridade: todas", "Rarity: all", "Rareza: todas")], ...["weak", "common", "uncommon", "rare", "epic", "legendary", "mythic", "ancient", "divine"].map((key, i) => [key, ["Fraca", "Comum", "Incomum", "Rara", "Épica", "Lendária", "Mítica", "Anciã", "Divina"][i]])]);
      for (const [key, label] of [["iv", "IV ≥"], ["q", "Q ≥"]]) { const input = el("input"); input.type = "number"; input.min = 0; input.step = key === "q" ? .01 : 1; input.placeholder = label; input.value = catchFilters[key] || ""; input.dataset.catchFilter = key; controls.append(input); } const shinyOnly = el("input"); shinyOnly.type = "checkbox"; shinyOnly.checked = !!catchFilters.sh; shinyOnly.dataset.catchFilter = "sh"; controls.append(append(el("label", "✨"), shinyOnly));
      controls.append(action(L("Limpar filtros", "Clear filters", "Limpiar filtros"), "clear-capture-filters"));
      const filtered = root.PokeMuxCaptureFilters?.filterCaptures(c.captures(), { ...catchFilters, n: search }) || c.captures().filter(x => String(x.n).toLowerCase().includes(search.toLowerCase()));
      const caught = captureFilter === "all" ? filtered : root.PokeMuxSummary.prioritize(filtered.filter(root.PokeMuxSummary.important)), list = el("div", null, "cd-catches-list");
      captures.firstChild.textContent = captureFilter === "all" ? L("Todas as capturas", "All catches", "Todas las capturas") : L("Capturas importantes", "Important catches", "Capturas importantes");
      list.dataset.summaryKey = "captures-list"; list.tabIndex = 0; list.setAttribute("role", "region"); list.setAttribute("aria-label", captures.firstChild.textContent);
      for (const entry of caught) list.append(captureRow(entry)); captures.append(list);
      if (!caught.length) captures.append(el("p", L("Nenhuma captura neste filtro.", "No catches in this filter.", "No hay capturas en este filtro."), "runtime-note")); captures.append(action(L("Ver histórico completo", "Full history", "Historial completo"), "captures")); columns.append(captures);
      const stock = section(text("pinned")), fixed = el("div", null, "summary-pinned"); for (const item of config.pinned) { const quantities = rows.map(data => (item.t === "ball" ? data?.balls : data?.bag)?.find(x => Number(x.id) === Number(item.id))); const line = append(el("span"), document.createTextNode(item.name + " "), el("b", quantities.some(x => x?.infinite) ? "∞" : number(quantities.reduce((n, x) => n + (Number(x?.quantity) || 0), 0)))); line.title = quantities.map((x, i) => c.name(i) + ": " + (x?.infinite ? "∞" : number(x?.quantity || 0))).join(" · "); fixed.append(line); } stock.append(fixed); if (!config.pinned.length) stock.append(el("p", root.PokeMuxSummary.COPY[c.lang()].noPinned, "summary-period")); columns.append(stock);
      const hunts = section(L("Hunts e desempenho", "Hunts and performance", "Hunts y rendimiento")); for (let i = 0; i < c.count(); i++) hunts.append(row(c.name(i) + " · " + (c.data(i)?.hunt || "—"), number(c.data(i)?.a?.kph) + "/h")); columns.append(hunts);
      const shinyEntries = (c.shinies ? c.shinies().map(x => ({ ...x, sh: true })) : c.captures().filter(x => x.sh)).sort((a, b) => b.t - a.t); const shiny = section(L("Histórico de shinies", "Shiny history", "Historial de shinies") + " · " + number(shinyEntries.length)), shinyList = el("div", null, "cd-catches-list"); shinyList.dataset.summaryKey = "shiny-list"; for (const entry of shinyEntries) { const line = captureRow(entry); if (!entry.cap && c.shinies) { line.querySelector(".capture-iv").textContent = L("Derrotado", "Defeated", "Derrotado"); line.querySelector(".capture-quality").textContent = ""; } shinyList.append(line); } if (shinyEntries.length) shiny.append(shinyList);
      const attempts = section(L("Shinies tentados", "Shiny attempts", "Intentos shiny")); for (let i = 0; i < rows.length; i++) for (const entry of rows[i]?.usedList || []) if (entry.shiny && entry.attempts > 0) attempts.append(row(display(entry.name) + " · " + c.name(i), number(entry.attempts) + (entry.caught ? " ✓" : "")));
      const shares = section(L("Pokémon compartilhados", "Shared Pokémon", "Pokémon compartidos")); const shared = new Map(); for (const data of rows) for (const entry of data?.chatShares || []) shared.set([entry.fr, entry.n, entry.iv, entry.lv].join(":"), entry); for (const entry of [...shared.values()].sort((a, b) => b.t - a.t).slice(0, 8)) shares.append(row(display(entry.n) + " · " + entry.fr, "IV " + number(entry.iv) + " · Q ×" + quality(entry.q)));
      for (const box of [shiny, attempts, shares]) if (box.children.length === 1) box.append(el("p", L("Nenhum registro.", "No records.", "Sin registros."), "summary-period"));
      const blocks = { kpis: totals, table: accounts, today, catches: captures, pinned: stock, trend, shinies: shiny, shinyTried: attempts, shared: shares };
      const top = append(el("div", null, "cd-top"), el("span", L("Resumo das contas", "Account summary", "Resumen de cuentas"), "cd-tt"), action("⚙", "summary-config")); top.lastChild.title = L("Configurar resumo", "Configure summary", "Configurar resumen");
      host.replaceChildren(top);
      if (summaryConfigOpen) { const panel = el("div", null, "cd-cfg"); summarySettings(panel); host.append(panel); }
      const grid = el("div", null, "cd-cols restored-columns");
      for (const key of summaryConfig.order) if (!summaryConfig.hide[key]) { const tile = el("div", null, "cd-it"); tile.dataset.s = key; tile.dataset.summaryKey = "section:" + key; tile.style.gridColumn = "span " + Math.max(3, Math.min(12, summaryConfig.w[key] || ({ trend: 3, shinies: 4, shinyTried: 6, shared: 3 }[key] || 12)));
        const grip = el("span", "⋮⋮", "cd-mv"); grip.draggable = true; grip.title = L("Arraste para reordenar", "Drag to reorder", "Arrastra para reordenar");
        const resize = el("span", null, "cd-rz"); resize.dataset.summaryResize = "width"; resize.title = L("Ajustar largura", "Adjust width", "Ajustar ancho");
        const vertical = el("span", null, "cd-rz2"); vertical.dataset.summaryResize = "height"; vertical.title = L("Ajustar altura (duplo clique restaura)", "Adjust height (double click resets)", "Ajustar altura (doble clic restablece)");
        const block = blocks[key]; if (key !== "table") { block.classList.add("cd-sec"); block.firstChild?.classList.add("cd-h"); }
        if (summaryConfig.h[key]) { block.style.height = Math.max(100, Math.min(1200, Number(summaryConfig.h[key]))) + "px"; block.style.overflow = "auto"; }
        tile.append(grip, resize, vertical, block); grid.append(tile);
      } host.append(grid); return serializeControls(host);
    }
    function analysis() {
      const host = el("div", null, "restored-analysis"), index = Math.min(c.count() - 1, selected ?? c.focus()), data = index >= 0 ? c.data(index) : null, a = data?.a;
      const resize = el("span", null, "analysis-resize"); resize.id = "analysisResize"; resize.dataset.analysisResize = "1"; resize.tabIndex = 0; resize.setAttribute("role", "separator"); resize.setAttribute("aria-orientation", "vertical"); resize.title = L("Arraste para ajustar a largura", "Drag to resize", "Arrastra para cambiar el ancho"); host.append(resize);
      host.append(append(el("div", null, "st-head"), el("span", L("Análise da hunt", "Hunt analysis", "Análisis de hunt")), action("↻", "reset"), action("⚙", "analysis-config"), action("✕", "close")));
      const tabs = el("div", null, "restored-tabs st-tabs"), all = action("Σ", "account", -1); all.className = "st-tab st-all" + (index === -1 ? " active" : ""); all.title = L("Todas as contas", "All accounts", "Todas las cuentas"); tabs.append(all); for (let i = 0; i < c.count(); i++) { const tab = action(c.name(i), "account", i); tab.classList.add("st-tab"); tab.classList.toggle("active", i === index); tab.style.setProperty("--account-color", c.colors[i]); tabs.append(tab); } host.append(tabs);
      if (index === -1) {
        const body = el("div", null, "st-body"), sources = Array.from({ length: c.count() }, (_, i) => c.data(i)), known = sources.filter(x => x?.live && x.a), sum = key => known.length ? known.reduce((n, x) => n + (Number(x.a?.[key]) || 0), 0) : null;
        body.append(el("h3", L("Todas as contas", "All accounts", "Todas las cuentas"), "aggregate-title"));
        const pace = section(""), grid = el("div", null, "restored-kpis"); grid.append(kpi("Gold/h", signed(sum("gph")), "money"), kpi("XP/h", compact(sum("xph")), "xp"), kpi("Kills/h", number(sum("kph")))); pace.dataset.panelSection = "kpis"; pace.append(grid); body.append(pace);
        const session = section(L("Sessão", "Session", "Sesión")), counts = el("div", null, "analysis-session-grid"); for (const [label, key] of [[L("Derrotados", "Defeated", "Derrotados"), "kills"], [L("Capturas", "Catches", "Capturas"), "captures"], [L("Shinies encontrados", "Shinies found", "Shinies encontrados"), "shinyFound"], [L("Shinies capturados", "Shinies caught", "Shinies capturados"), "shinyCap"]]) counts.append(kpi(label, number(sum(key)))); session.append(counts); body.append(session);
        if (c.shinyLifetime) session.append(row(L("Shinies encontrados · acumulado do app", "Shinies found · app lifetime", "Shinies encontrados · acumulado de la app"), number(c.shinyLifetime())));
        const supplies = section(L("Suprimentos", "Supplies", "Suministros")); for (const [label, key] of [[L("Pokébolas", "Poké Balls", "Poké Balls"), "balls"], [L("Poções", "Potions", "Pociones"), "pots"]]) supplies.append(row(label, number(sources.reduce((n, x, i) => n + (x?.live ? Number(c.summaryRow(i)[key]) || 0 : 0), 0)))); body.append(supplies);
        const assets = section(L("Patrimônio", "Assets", "Patrimonio")); assets.append(row("$ total", number(sources.reduce((n, x) => n + (x?.live ? Number(x.gold) || 0 : 0), 0))), row("💎 total", number(sources.reduce((n, x) => n + (x?.live ? Number(x.diamonds) || 0 : 0), 0)))); body.append(assets);
        const accounts = section(L("Por conta", "Per account", "Por cuenta")); for (let i = 0; i < sources.length; i++) { const card = el("div", null, "analysis-account"); card.style.setProperty("--account-color", c.colors[i]); card.append(action(c.name(i), "focus", i), row("Hunt", display(sources[i]?.hunt) || "—"), row("XP/h", compact(sources[i]?.a?.xph)), row("Gold/h", signed(sources[i]?.a?.gph))); accounts.append(card); } body.append(accounts); host.append(body); return host;
      }
      const body = el("div", null, "st-body"), identity = el("div", null, "trainer-head"), avatar = append(el("span", null, "trainer-avatar"), el("span", "", "trainer-ball"), el("b", number(data?.level), "trainer-level"));
      const identityText = el("div", null, "trainer-info"), heading = append(el("div", null, "trainer-name"), el("b", c.name(index))); if (data?.vip) heading.append(el("span", "VIP", "trainer-vip"));
      const clan = typeof data?.clan === "string" ? data.clan : data?.clan?.slug || data?.clan?.name || data?.clan?.tag; if (clan) { const emblem = el("img"); emblem.src = "https://poke.idleworld.online/assets/clans/" + String(clan).toLowerCase().replace(/[^a-z0-9_-]/g, "") + ".png"; emblem.alt = String(clan); emblem.className = "trainer-clan"; heading.append(emblem); }
      identityText.append(heading, el("div", "⌖ " + (display(data?.hunt) || "—"), "trainer-location"), append(el("div", null, "trainer-wallet"), el("b", "🪙 $" + number(data?.gold)), el("span", "💎 " + number(data?.diamonds)))); identity.append(avatar, identityText); body.append(identity); host.append(body);
      const builders = {
        kpis: () => { const box = section(text("kpis")), grid = el("div", null, "restored-kpis"); for (const [label, key, cls] of [["$/h", "gph", "money"], ["XP/h", "xph", "xp"], [L("Abates/h", "Kills/h", "Bajas/h"), "kph", ""]]) grid.append(kpi(label, key === "gph" ? signed(a?.[key]) : key === "kph" ? number(a?.[key]) : compact(a?.[key]), cls)); box.append(grid); return box; },
        session: () => { const box = section(L("Sessão", "Session", "Sesión")), grid = el("div", null, "analysis-session-grid"); box.firstChild.append(el("small", a ? duration(a.seconds) : "—", "section-time")); for (const [label, key] of [[L("Derrotados", "Defeated", "Derrotados"), "kills"], [L("XP ganho", "XP gained", "XP ganado"), "xpg"], [L("Capturas", "Catches", "Capturas"), "captures"], [L("Shinies encontrados", "Shinies found", "Shinies encontrados"), "shinyFound"]]) grid.append(kpi(label, number(a?.[key]), key === "xpg" ? "xp" : "")); box.append(grid, row(L("Shinies capturados", "Shinies caught", "Shinies capturados"), "✨ " + number(a?.shinyCap)), row(L("Shinies encontrados (total)", "Shinies found (total)", "Shinies encontrados (total)"), "✨ " + number(data?.usedList?.reduce((n, x) => n + (x.shiny ? Number(x.attempts) || 0 : 0), 0)))); if (c.shinyLifetime) box.append(row(L("Shinies encontrados · acumulado do app", "Shinies found · app lifetime", "Shinies encontrados · acumulado de la app"), number(c.shinyLifetime(index)))); if (a?.lastCatchT) box.append(row(L("Última captura", "Last catch", "Última captura"), new Date(a.lastCatchT).toLocaleTimeString(c.lang(), { hour: "2-digit", minute: "2-digit" }) + " · " + number(a.sinceCatch))); return box; },
        gold: () => { const box = section(L("Gold da sessão", "Session gold", "Gold de sesión")); box.append(row("Loot", number(a?.lootGold), "money"), row(L("Venda das capturas", "Capture sales", "Venta de capturas"), number(a?.capturesGold), "money"), row(L("Suprimentos", "Supplies", "Suministros") + " (" + number(a?.ballsUsed) + " " + L("bolas", "balls", "bolas") + " · " + number(a?.potsUsed) + " " + L("poções", "potions", "pociones") + ")", a?.supplyGold == null ? "—" : number(-a.supplyGold), "expense"), row(L("Saldo", "Balance", "Saldo"), number(a?.balance), "balance" + (a?.balance < 0 ? " negative" : ""))); return box; },
        compare: () => { const box = section(text("compare")); if (data?.prev) { box.append(append(el("div", null, "analysis-compare heading"), el("span"), el("span", L("Anterior", "Previous", "Anterior")), el("span", L("Atual", "Current", "Actual")))); for (const [label, key] of [["Gold/h", "gph"], ["XP/h", "xph"], ["Kills/h", "kph"]]) { const before = data.prev[key], current = a?.[key]; box.append(append(el("div", null, "analysis-compare"), el("span", label), el("b", compact(before)), el("b", compact(current) + (current > before ? " ▲" : current < before ? " ▼" : ""), current > before ? "money" : current < before ? "expense" : ""))); } } else box.append(el("p", L("Aguardando uma sessão anterior.", "Waiting for a previous session.", "Esperando una sesión anterior."), "runtime-note")); return box; },
        drops: () => { const box = section("Loot"); for (const item of data?.drops || []) box.append(row(item.name + " ×" + number(item.qty), "$ " + number(item.gold))); if (!data?.drops?.length) box.append(el("p", L("Sem loot registrado nesta sessão.", "No loot recorded this session.", "Sin loot registrado en esta sesión."), "runtime-note")); return box; },
        bag: () => bag(data, index), pinned: () => pinned(data),
        target: () => { const target = config.shinyTarget, box = section("🎯 " + (display(target?.name) || text("target"))); if (!target) box.append(el("p", L("Escolha uma espécie na engrenagem acima em Alvo shiny. O painel acompanha encontros, captura e tentativas.", "Choose a species in Settings → Shiny target to track encounters, catches and attempts.", "Elige una especie en Ajustes → Objetivo shiny para seguir encuentros, capturas e intentos."), "runtime-note"));
          else { const found = data?.usedList?.find(x => x.shiny && Number(x.sid) === Number(target.id)), normal = data?.usedList?.find(x => !x.shiny && Number(x.sid) === Number(target.id)); box.append(row(L("Status", "Status", "Estado"), found ? found.caught ? "✓ " + L("Capturado", "Caught", "Capturado") : L("Encontrado, não capturado", "Found, not caught", "Encontrado, sin capturar") : L("Ainda não apareceu", "Not encountered yet", "Todavía no apareció"))); if (found) box.append(row(L("Tentativas shiny", "Shiny attempts", "Intentos shiny"), number(found.attempts))); if (normal) box.append(row(L("Farm normal", "Normal encounters", "Encuentros normales"), number(normal.total) + " · " + number(normal.attempts) + " " + L("tentativas", "attempts", "intentos"))); } return box; },
        team: () => { const box = section(text("team")); for (const p of data?.team || []) box.append(teamCard(p, index)); return box; },
      };
      for (const key of config.order) if (!config.hide[key]) { if (key === "compare" && !data?.prev || key === "drops" && !data?.drops?.length || key === "bag" && !data?.bag?.length && !data?.balls?.length || key === "team" && !data?.team?.length) continue; const box = builders[key](); box.dataset.panelSection = key; box.draggable = true; const controls = el("div", null, "restored-section-controls"); for (const [label, type] of [["↑", "up"], ["↓", "down"], ["✕", "hide"]]) { const control = action(label, type); control.dataset.section = key; controls.append(control); } box.firstChild.append(controls); body.append(box); }
      const restore = section(L("Seções ocultas", "Hidden sections", "Secciones ocultas")); for (const key of sections.filter(x => config.hide[x])) { const b = action(text(key), "restore"); b.dataset.section = key; restore.append(b); } if (restore.children.length > 1) body.append(restore);
      body.append(action(L("Histórico de capturas", "Capture history", "Historial de capturas"), "captures"), action(L("Exportar histórico", "Export history", "Exportar historial"), "export")); return host;
    }
    function handle(event) {
      const control = event.target.closest("[data-panel-action]"); if (!control) return false;
      const actionName = control.dataset.panelAction, index = Number(control.dataset.account);
      if (actionName === "focus") c.open(index); else if (actionName === "recommend") c.recommend(index); else if (actionName === "captures") c.openCaptures(); else if (actionName === "export") c.exportCaptures(); else if (actionName === "reset") c.reset(); else if (actionName === "close") c.closeAnalysis();
      else if (actionName === "pokemon") c.openPokemon(index, control.dataset.pokemon);
      else if (actionName === "account") { selected = index; c.refresh(); }
      else if (actionName === "clear-capture-filters") { Object.assign(catchFilters, { p: -1, per: 0 }); clearQualityFilters(); captureFilter = "all"; search = ""; saveCatchFilters(); c.refresh(); }
      else if (actionName === "summary-config") { summaryConfigOpen = !summaryConfigOpen; c.refresh(); }
      else if (actionName === "analysis-config") c.openSettings?.("analysis");
      else if (actionName === "export-day" || actionName === "export-hunts") {
        const entries = actionName === "export-day" ? Object.entries(daily).flatMap(([date, accounts]) => Object.entries(accounts).map(([account, values]) => ({ date, account: c.name(Number(account)), ...values }))) : c.read("huntLog", []);
        const fields = actionName === "export-day" ? ["date", "account", "g", "x", "kl", "c", "sf", "sc"] : ["acc", "hunt", "start", "end", "kills", "xp", "caps", "loot", "sell", "sup"];
        const csv = "\uFEFF" + [fields, ...entries.map(entry => fields.map(key => entry[key] ?? ""))].map(row => row.map(value => '"' + String(value).replace(/"/g, '""') + '"').join(";")).join("\r\n"), url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })), link = el("a"); link.href = url; link.download = "Quadrymon-" + (actionName === "export-day" ? "dias" : "hunts") + ".csv"; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
      else if (["summary-up", "summary-down"].includes(actionName)) { const at = summaryConfig.order.indexOf(control.dataset.section), to = at + (actionName === "summary-up" ? -1 : 1); if (to >= 0 && to < summaryConfig.order.length) [summaryConfig.order[at], summaryConfig.order[to]] = [summaryConfig.order[to], summaryConfig.order[at]]; saveSummary(); c.refresh(); }
      else if (["hide", "restore", "up", "down"].includes(actionName)) { const key = control.dataset.section, at = config.order.indexOf(key); if (actionName === "hide" || actionName === "restore") config.hide[key] = actionName === "hide"; else { const to = at + (actionName === "up" ? -1 : 1); if (to >= 0 && to < config.order.length) [config.order[at], config.order[to]] = [config.order[to], config.order[at]]; } save(); c.refresh(); }
      else if (actionName === "pin") { const id = Number(control.dataset.item), kind = control.dataset.kind, at = config.pinned.findIndex(x => x.id === id && x.t === kind); if (at >= 0) config.pinned.splice(at, 1); else config.pinned.push({ id, t: kind, name: control.dataset.name }); save(); c.refresh(); }
      return true;
    }
    function filter(event) { if (event.target.dataset.catchFilter) { const key = event.target.dataset.catchFilter; catchFilters[key] = key === "sh" ? event.target.checked : event.target.value; saveCatchFilters(); c.refresh(); return; } if (event.target.dataset.summarySection) { summaryConfig.hide[event.target.dataset.summarySection] = !event.target.checked; saveSummary(); c.refresh(); return; } if (event.target.dataset.panelTarget) { const select = event.target; config.shinyTarget = select.value ? { id: Number(select.value), name: select.selectedOptions[0].textContent } : null; save(); c.refresh(); return; } const goal = event.target.dataset.panelGoal; if (goal) { if (event.type === "input") return; goals[goal] = Math.max(0, Number(event.target.value) || 0); c.save("goals", JSON.stringify(goals)); c.refresh(); return; } const key = event.target.dataset.panelFilter; if (key === "mode") { captureFilter = event.target.value; if (captureFilter === "all") clearQualityFilters(); } else if (key === "search") search = event.target.value; else return; saveCatchFilters(); c.refresh(); }
    function settings(host) {
      host.replaceChildren(el("h4", L("Seções da análise", "Analysis sections", "Secciones del análisis")));
      for (const key of config.order) {
        const line = el("div", null, "settings-summary-row"), label = el("label"), input = el("input"); input.type = "checkbox"; input.checked = !config.hide[key]; input.onchange = () => { config.hide[key] = !input.checked; save(); c.refresh(); }; label.append(input, document.createTextNode(" " + text(key))); line.append(label);
        for (const [caption, direction] of [["↑", -1], ["↓", 1]]) line.append(button(caption, () => { const at = config.order.indexOf(key), to = at + direction; if (to < 0 || to >= config.order.length) return; [config.order[at], config.order[to]] = [config.order[to], config.order[at]]; save(); settings(host); c.refresh(); })); host.append(line);
      }
      host.append(el("h4", text("pinned")));
      for (const item of config.pinned) { const line = append(el("div", null, "settings-summary-row"), el("label", item.name), button("✕", () => { config.pinned = config.pinned.filter(x => x !== item); save(); settings(host); c.refresh(); })); host.append(line); }
      if (!config.pinned.length) host.append(el("small", L("Fixe itens pela estrela na Bag do painel Análise.", "Pin items with the star in the Analysis panel Bag.", "Fija objetos con la estrella en Bag del panel Análisis."), "runtime-note"));
      host.append(el("h4", text("target"))); const select = el("select"); select.dataset.panelTarget = "1"; const empty = el("option", L("Escolher Pokémon", "Choose Pokémon", "Elegir Pokémon")); empty.value = ""; select.append(empty); const catalog = new Map((c.catalog?.()?.entries || []).filter(x => x.kind === "pokemon" && x.speciesId > 0).map(x => [Number(x.speciesId), x])); if (config.shinyTarget && !catalog.has(Number(config.shinyTarget.id))) catalog.set(Number(config.shinyTarget.id), { name: config.shinyTarget.name, speciesId: config.shinyTarget.id }); for (const entry of [...catalog.values()].sort((a, b) => a.name.localeCompare(b.name))) { const option = el("option", display(entry.name)); option.value = entry.speciesId; option.selected = Number(config.shinyTarget?.id) === Number(entry.speciesId); select.append(option); } select.onchange = event => filter(event); host.append(select);
    }
    const summaryLabels = () => ({ kpis: text("kpis"), table: L("Contas em farm", "Farming accounts", "Cuentas farmeando"), today: L("Hoje · acumulado", "Today · cumulative", "Hoy · acumulado"), catches: L("Capturas importantes", "Important catches", "Capturas importantes"), pinned: text("pinned"), trend: L("Tendência", "Trend", "Tendencia"), shinies: L("Shinies capturados", "Shinies caught", "Shinies capturados"), shinyTried: L("Shinies tentados", "Shiny attempts", "Intentos shiny"), shared: L("Pokémon compartilhados", "Shared Pokémon", "Pokémon compartidos") });
    function summarySettings(host) {
      host.replaceChildren(el("h4", L("Seções do resumo", "Summary sections", "Secciones del resumen")));
      for (const key of summaryConfig.order) { const input = el("input"); input.type = "checkbox"; input.checked = !summaryConfig.hide[key]; input.dataset.summarySection = key; const line = append(el("div", null, "settings-summary-row"), append(el("label"), input, document.createTextNode(" " + summaryLabels()[key]))); input.onchange = () => { summaryConfig.hide[key] = !input.checked; saveSummary(); c.refresh(); };
        for (const [label, type] of [["↑", "summary-up"], ["↓", "summary-down"]]) { const control = action(label, type); control.dataset.section = key; control.onclick = event => { event.stopPropagation(); handle(event); if (!host.closest("#cards")) summarySettings(host); }; line.append(control); } host.append(line);
      }
    }
    function bindGestures(host) {
      host.addEventListener("dragstart", event => { const tile = event.target.closest(".cd-it,[data-panel-section]"); if (!tile || event.target.closest("button,input,select")) return; dragging = { summary: !!tile.dataset.s, key: tile.dataset.s || tile.dataset.panelSection }; event.dataTransfer?.setData("text/plain", dragging.key); });
      host.addEventListener("dragover", event => { if (dragging && event.target.closest(".cd-it,[data-panel-section]")) event.preventDefault(); });
      host.addEventListener("drop", event => { const tile = event.target.closest(".cd-it,[data-panel-section]"); if (!dragging || !tile || dragging.summary !== !!tile.dataset.s) return; event.preventDefault(); const order = dragging.summary ? summaryConfig.order : config.order, key = tile.dataset.s || tile.dataset.panelSection; if (key !== dragging.key) { order.splice(order.indexOf(dragging.key), 1); order.splice(order.indexOf(key), 0, dragging.key); dragging.summary ? saveSummary() : save(); } dragging = null; c.refresh(); });
      host.addEventListener("dragend", () => { dragging = null; });
      let resizing = null;
      host.addEventListener("pointerdown", event => { const handle = event.target.closest("[data-summary-resize]"); if (!handle) return; event.preventDefault(); const tile = handle.closest(".cd-it"), block = tile.lastChild; resizing = { key: tile.dataset.s, dimension: handle.dataset.summaryResize, x: event.clientX, y: event.clientY, width: tile.offsetWidth, height: block.offsetHeight, unit: tile.parentElement.offsetWidth / 12, tile, block }; host.setPointerCapture(event.pointerId); });
      host.addEventListener("pointermove", event => { if (!resizing) return; const r = resizing; if (r.dimension === "width") { summaryConfig.w[r.key] = Math.max(3, Math.min(12, Math.round((r.width + event.clientX - r.x) / r.unit))); r.tile.style.gridColumn = "span " + summaryConfig.w[r.key]; } else { summaryConfig.h[r.key] = Math.max(100, Math.min(1200, r.height + event.clientY - r.y)); r.block.style.height = summaryConfig.h[r.key] + "px"; r.block.style.overflow = "auto"; } });
      const finish = () => { if (resizing) { resizing = null; saveSummary(); c.refresh(); } }; host.addEventListener("pointerup", finish); host.addEventListener("lostpointercapture", finish);
      host.addEventListener("dblclick", event => { const handle = event.target.closest('[data-summary-resize="height"]'); if (handle) { delete summaryConfig.h[handle.closest(".cd-it").dataset.s]; saveSummary(); c.refresh(); } });
    }
    return { summary, analysis, handle, filter, settings, summarySettings, bindGestures, observe, select: index => { selected = index; } };
  }
  function iv(c) {
    const { data: d, node: el, append, button, L } = c, host = el("div", null, "restored-iv");
    const number = value => value == null || !Number.isFinite(Number(value)) ? "—" : c.format(Number(value));
    const header = el("div", null, "iv-hd");
    if (/^https:\/\/raw\.githubusercontent\.com\/PokeAPI\/sprites\/[a-z0-9/_.-]+$/i.test(d.sprite?.still || "")) { const image = el("img"); image.src = d.sprite.still; image.alt = ""; header.append(image); }
    append(header, append(el("div"), el("h3", (d.shiny ? "✨ " : "") + display(d.nome)), el("small", c.account)), button("✕", c.close)); host.append(header);
    if (d.erro) { host.append(el("p", L("Não foi possível calcular: ", "Unable to calculate: ", "No se pudo calcular: ") + d.erro)); return host; }
    const types = el("div", null, "iv-tipos"); for (const type of d.tipos || []) types.append(el("span", type, "iv-tp")); host.append(types);
    const top = el("div", null, "iv-top"); for (const [label, value] of [[L("Nível", "Level", "Nivel"), number(d.nivel)], [L("Qualidade", "Quality", "Calidad"), "×" + new Intl.NumberFormat(document.documentElement.lang || "pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(d.qualidade)], ["IV total", number(d.ivTotal) + "/" + (d.ivMax || 192)], [d.poderJogo > 0 ? L("Poder no jogo", "Game power", "Poder del juego") : L("Poder estimado", "Estimated power", "Poder estimado"), number(d.poderJogo > 0 ? d.poderJogo : d.poder)]]) top.append(append(el("div", null, "iv-kpi"), el("small", label), el("b", value))); host.append(top);
    const pct = Math.max(0, Math.min(100, Number(d.percentual) || 0)), potential = el("div", null, "iv-pot"), ring = el("div", null, "iv-ring"); ring.style.background = "conic-gradient(#22d3c5 " + pct + "%, #28415e 0)"; ring.append(el("span", Math.round(pct) + "%"));
    const grade = pct >= 90 ? L("Excelente", "Excellent", "Excelente") : pct >= 75 ? L("Ótimo", "Great", "Muy bueno") : pct >= 60 ? L("Bom", "Good", "Bueno") : L("Regular", "Fair", "Regular"); append(potential, ring, append(el("div"), el("b", L("Potencial de IV", "IV potential", "Potencial de IV") + " · " + grade), el("small", L("IV total informado pelo jogo.", "Total IV reported by the game.", "IV total informado por el juego.")))); host.append(potential);
    const aptitude = root.PokeMuxAptitude.analyze(d), profile = role => ({ physical: L("Físico", "Physical", "Físico"), special: L("Especial", "Special", "Especial"), balanced: L("Equilibrado", "Balanced", "Equilibrado"), unknown: L("Indeterminado", "Unknown", "Indeterminado") })[role];
    const apt = el("div", null, "iv-apt"); apt.append(el("b", L("Aptidão natural: ", "Natural aptitude: ", "Aptitud natural: ") + profile(aptitude.natural.role)), el("p", L("Perfil atual: ", "Current profile: ", "Perfil actual: ") + profile(aptitude.current.role)), el("small", L("Golpes alinhados: ", "Aligned moves: ", "Movimientos alineados: ") + aptitude.aligned + "/" + aptitude.usable)); host.append(apt);
    if (aptitude.lowLevel) host.append(el("p", L("Em níveis baixos, os arredondamentos deixam os IVs individuais menos precisos.", "At low levels, rounding makes individual IVs less precise.", "En niveles bajos, los redondeos reducen la precisión de los IV individuales."), "iv-warning"));
    host.append(el("h4", L("Atributos e IVs", "Stats and IVs", "Atributos e IVs")));
    const grid = el("div", null, "iv-grid"), keys = ["hp", "atk", "def", "spa", "spd", "vel"], bars = ["#22d3c5", "#f4b942", "#3882f6", "#d890fa", "#64c4ff", "#9dd86b"];
    for (const [i, key] of keys.entries()) {
      const box = el("div", null, "iv-st"), range = d.ivRanges?.[key === "vel" ? "speed" : key], value = d.ivs?.[key];
      const label = Array.isArray(range) && range[0] !== range[1] ? range[0] + "–" + range[1] : number(value);
      box.append(append(el("div", null, "iv-st-h"), el("b", key.toUpperCase()), el("b", label + "/" + (d.ivMaxInd || 32))));
      const progress = el("div", null, "iv-bar"), fill = el("i"); fill.style.width = Math.max(0, Math.min(100, Number(value) / (d.ivMaxInd || 32) * 100)) + "%"; fill.style.background = bars[i]; progress.append(fill); box.append(progress);
      box.append(el("small", L("Atual: ", "Current: ", "Actual: ") + number(d.atuais?.[key])), el("small", L("Base: ", "Base: ", "Base: ") + number(d.bases?.[key])));
      const projected = el("small", null, "iv-projected"); projected.dataset.projected = key; box.append(projected); grid.append(box);
    } host.append(grid, el("p", L("As faixas mostram a incerteza dos IVs individuais; o total vem do jogo.", "Ranges show uncertainty in individual IVs; the total comes from the game.", "Las franjas muestran la incertidumbre de IV individuales; el total viene del juego."), "runtime-note"));
    const controls = el("div", null, "iv-controls"), level = el("input"), quality = el("input"); level.type = quality.type = "number"; level.min = 1; level.max = 9999; level.value = d.nivel; quality.min = .01; quality.max = 10; quality.step = .01; quality.value = d.qualidade;
    const power = el("p", null, "iv-projection-power");
    const simulate = () => {
      const lv = Number(level.value), q = Number(quality.value); if (!level.checkValidity() || !quality.checkValidity() || !(lv > 0 && q > 0)) return;
      let sum = 0, complete = true;
      for (const key of keys) { const value = root.PokeMuxIvMath.projectStat(d.bases?.[key], d.ivs?.[key], lv, q, key === "vel" ? "speed" : key); complete &&= value != null; sum += value || 0; grid.querySelector('[data-projected="' + key + '"]').textContent = L("Simulado: ", "Projected: ", "Simulado: ") + number(value); }
      power.textContent = L("Poder estimado no nível ", "Estimated power at level ", "Poder estimado en el nivel ") + lv + ": " + (complete ? number(Math.round(sum * q)) : "—");
    };
    append(controls, append(el("label", L("Nível", "Level", "Nivel")), level), append(el("label", L("Qualidade", "Quality", "Calidad")), quality), button(L("Simular nível", "Simulate level", "Simular nivel"), simulate)); host.append(controls, power);
    const moves = el("div", null, "iv-moves"); moves.append(el("h4", L("Golpes", "Moves", "Movimientos")));
    for (const move of aptitude.moves) { const line = el("div", null, "iv-mv " + (move.available ? "on" : "off")); line.append(el("b", display(move.nome)), el("small", move.tipo + " · " + (move.categoria || "") + " · Lv" + number(move.nivel) + (move.tm ? " · " + move.tm : "")), el("span", L("Poder ", "Power ", "Poder ") + number(move.poder) + (move.available ? " ✓" : ""))); moves.append(line); } host.append(moves);
    return host;
  }
  root.QuadrymonRichPanels = { mount, iv };
})(globalThis);
