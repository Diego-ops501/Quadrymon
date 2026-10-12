(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PokeMuxWorkspace = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const COPY = {
    pt: { grid: 'Grade', focus: 'Foco', summary: 'Resumo', account: 'Conta', accounts: 'Contas', market: 'Mercado', inventory: 'Inventário', alerts: 'Alertas', panel: 'Análise', online: 'Online', waiting: 'Aguardando jogo', off: 'Desligada', stale: 'Dados desatualizados', captures: 'Capturas', analyze: 'Analisar hunt', eco: 'Eco ativo', full: 'Eco desligado', connected: 'contas conectadas', noData: 'Aguardando dados da hunt', other: 'Outras contas', tools: 'Ferramentas', summaryTitle: 'Resumo das contas' },
    en: { grid: 'Grid', focus: 'Focus', summary: 'Summary', account: 'Account', accounts: 'Accounts', market: 'Market', inventory: 'Inventory', alerts: 'Alerts', panel: 'Analysis', online: 'Online', waiting: 'Waiting for game', off: 'Off', stale: 'Outdated data', captures: 'Captures', analyze: 'Analyze hunt', eco: 'Eco on', full: 'Eco off', connected: 'accounts connected', noData: 'Waiting for hunt data', other: 'Other accounts', tools: 'Tools', summaryTitle: 'Account summary' },
    es: { grid: 'Cuadrícula', focus: 'Foco', summary: 'Resumen', account: 'Cuenta', accounts: 'Cuentas', market: 'Mercado', inventory: 'Inventario', alerts: 'Alertas', panel: 'Análisis', online: 'En línea', waiting: 'Esperando juego', off: 'Apagada', stale: 'Datos desactualizados', captures: 'Capturas', analyze: 'Analizar hunt', eco: 'Eco activo', full: 'Eco apagado', connected: 'cuentas conectadas', noData: 'Esperando datos de la hunt', other: 'Otras cuentas', tools: 'Herramientas', summaryTitle: 'Resumen de cuentas' }
  };
  Object.assign(COPY.pt, {goMarket:'Ir ao mercado',backHunt:'Voltar à hunt',traveling:'Viajando…',noPrevious:'Nenhuma hunt anterior foi guardada para esta conta.'});
  Object.assign(COPY.en, {goMarket:'Go to market',backHunt:'Return to hunt',traveling:'Traveling…',noPrevious:'No previous hunt has been saved for this account.'});
  Object.assign(COPY.es, {goMarket:'Ir al mercado',backHunt:'Volver a la hunt',traveling:'Viajando…',noPrevious:'No se guardó una hunt anterior para esta cuenta.'});
  function accountLabel(value, index, lang = 'pt') {
    const name = String(value || '').replace(/[\x00-\x1f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);
    return name || (COPY[lang] || COPY.pt).account + ' ' + (index + 1);
  }
  function frameRate({ summary, eco, focused, account }) {
    return summary ? 1 : !eco ? 0 : focused >= 0 && focused !== account ? 2 : 15;
  }
  function createStateReader(bridge) {
    const pending = new Map(), now = bridge.now || Date.now;
    const same = (a, b) => a && b && a.view === b.view && a.email === b.email && a.epoch === b.epoch && a.cid === b.cid && !b.off;
    return function read(index, fresh = false) {
      const slot = bridge.slot(index);
      if (!slot || slot.off || !slot.view) return Promise.resolve({ ok: false });
      const cached = bridge.cache(index);
      if (!fresh && cached && same(cached.slot, slot) && now() - cached.t < 10000 && cached.d?.ok && (!slot.cid || cached.d.cid === slot.cid)) return Promise.resolve(cached.d);
      const task = pending.get(index);
      if (task && same(task.slot, slot)) return task.promise;
      const entry = { slot };
      entry.promise = Promise.resolve().then(() => bridge.read(index)).then(data => {
        if (!same(slot, bridge.slot(index))) return { ok: false };
        if (data?.ok) bridge.publish(index, data, slot);
        return data;
      }).finally(() => { if (pending.get(index) === entry) pending.delete(index); });
      pending.set(index, entry);
      return entry.promise;
    };
  }
  function mount(bridge) {
    const nav = document.getElementById('workspaceAccounts');
    const modes = document.getElementById('workspaceModes');
    const grid = document.getElementById('grid');
    const rail = document.createElement('nav');
    rail.id = 'focusAccounts';
    grid.after(rail);
    const footer = document.createElement('footer');
    footer.id = 'workspaceFooter';
    const connection = document.createElement('span'), economy = document.createElement('span');
    footer.append(connection, economy);
    document.body.append(footer);
    let selected = 0, frame = null, destroyed = false;
    const chips = [], links = [], metrics = new Map();
    const text = (el, value) => { value = String(value); if (el.textContent !== value) el.textContent = value; };
    const compact = (value, lang) => Number.isFinite(Number(value)) ? new Intl.NumberFormat(lang === 'pt' ? 'pt-BR' : lang, { notation: 'compact', maximumFractionDigits: 1 }).format(Number(value)) : '—';
    function accountButton(index, destination) {
      const button = document.createElement('button');
      button.type = 'button'; button.className = destination === nav ? 'workspace-account' : 'focus-account';
      button.dataset.account = index;
      const badge = document.createElement('span'), name = document.createElement('span'), state = document.createElement('span');
      badge.className = 'account-number'; badge.textContent = index + 1;
      name.className = 'account-label'; state.className = 'account-state';
      button.append(badge, name, state);
      if (destination === rail) { const detail = document.createElement('span'); detail.className = 'account-detail'; button.append(detail); }
      button.addEventListener('click', () => { selected = index; bridge.focus(index); refresh(); });
      destination.append(button);
      return button;
    }
    function syncButtons(list, destination, count) {
      while (list.length > count) list.pop().remove();
      while (list.length < count) list.push(accountButton(list.length, destination));
    }
    function render() {
      frame = null;
      if (destroyed) return;
      const state = bridge.state(), copy = COPY[state.lang] || COPY.pt, accounts = state.accounts.slice(0, 4);
      const focused = accounts.findIndex(x => x.focused);
      if (focused >= 0) selected = focused;
      if (selected >= accounts.length) selected = 0;
      const mode = state.summary ? 'summary' : focused >= 0 ? 'focus' : 'grid';
      rail.hidden = accounts.length < 2;
      document.body.dataset.workspaceMode = mode;
      nav.setAttribute('aria-label', copy.accounts); rail.setAttribute('aria-label', copy.other);
      modes.setAttribute('aria-label', copy.tools);
      for (const button of modes.querySelectorAll('[data-mode]')) {
        const active = button.dataset.mode === mode;
        button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active));
        text(button.querySelector('span'), copy[button.dataset.mode]);
      }
      for (const [id, label] of [['marketBtn', 'market'], ['inventoryBtn', 'inventory']]) {
        const button = document.getElementById(id); text(button.querySelector('.tool-label'), copy[label]);
        button.title = copy[label]; button.setAttribute('aria-label', copy[label]);
      }
      document.getElementById('statsBtn').textContent = '▤ ' + copy.panel;
      document.getElementById('statsBtn').setAttribute('aria-pressed', String(!!state.stats));
      document.getElementById('cardsBtn').textContent = copy.summary;
      document.getElementById('cardsBtn').setAttribute('aria-pressed', String(!!state.summary));
      syncButtons(chips, nav, accounts.length); syncButtons(links, rail, accounts.length);
      let online = 0;
      accounts.forEach((account, index) => {
        const name = accountLabel(account.name, index, state.lang);
        const status = account.off ? copy.off : account.live ? copy.online : copy.waiting;
        if (account.live && !account.off) online++;
        for (const button of [chips[index], links[index]]) {
          button.style.setProperty('--account-color', account.color);
          text(button.querySelector('.account-label'), name);
          text(button.querySelector('.account-state'), status);
          button.classList.toggle('online', !!account.live && !account.off);
          button.classList.toggle('active', !state.summary && focused === index);
          button.setAttribute('aria-pressed', String(!state.summary && focused === index));
          button.title = name + ' · ' + status;
          button.setAttribute('aria-label', button.title);
        }
        links[index].hidden = focused === index;
        text(links[index].querySelector('.account-detail'), globalThis.QuadrymonNames?.display(account.hunt) || account.hunt || status);
        const panel = grid.children[index];
        if (!panel) return;
        const panelName = panel.querySelector('.name'); text(panelName, name);
        panel.style.setProperty('--account-color', account.color);
        let strip = metrics.get(panel);
        if (!strip) {
          strip = document.createElement('div'); strip.className = 'panel-metrics';
          for (const label of ['XP/h', '$/h', '']) { const item = document.createElement('span'); const caption = document.createElement('small'), value = document.createElement('b'); caption.textContent = label; item.append(caption, value); strip.append(item); }
          const travel = document.createElement('button'); travel.type = 'button'; travel.className = 'panel-travel';
          travel.addEventListener('click', () => bridge.travelMarket(index)); strip.append(travel); panel.append(strip); metrics.set(panel, strip);
        }
        const data = !account.off && account.live && account.metrics;
        const values = [data ? compact(data.xph, state.lang) : '—', data ? compact(data.gph, state.lang) : '—', data ? compact(data.captures, state.lang) : '—'];
        strip.querySelectorAll('b').forEach((el, i) => text(el, values[i]));
        text(strip.children[2].querySelector('small'), copy.captures);
        const trip = account.marketTravel || {}, travel = strip.querySelector('button');
        text(travel, trip.busy ? copy.traveling : trip.outsideHunt ? copy.backHunt : copy.goMarket);
        travel.disabled = !account.live || account.off || trip.busy || trip.outsideHunt && !trip.previous;
        travel.dataset.returning = String(!!trip.outsideHunt);
        travel.title = trip.outsideHunt ? trip.previous ? copy.backHunt + ' · ' + (globalThis.QuadrymonNames?.display(trip.previous.name) || trip.previous.name) : copy.noPrevious : copy.goMarket;
        travel.setAttribute('aria-label', travel.title);
        travel.setAttribute('aria-busy', String(!!trip.busy));
        strip.title = data ? globalThis.QuadrymonNames?.display(account.hunt) || account.hunt : account.live ? copy.stale : copy.noData;
        const statusEl = panel.querySelector('.status'); if (statusEl) text(statusEl, status);
      });
      for (const [panel, strip] of metrics) if (!panel.isConnected) { strip.remove(); metrics.delete(panel); }
      text(connection, online + '/' + accounts.length + ' ' + copy.connected);
      text(economy, state.eco || state.summary ? copy.eco : copy.full);
      footer.classList.toggle('online', online > 0);
      bridge.resize();
    }
    // Batch state events without relying on animation frames, which can stop in a hidden window.
    function refresh() { if (!destroyed && frame === null) frame = setTimeout(render, 0); }
    modes.addEventListener('click', event => { const button = event.target.closest('[data-mode]'); if (button) { bridge.mode(button.dataset.mode, selected); refresh(); } });
    document.getElementById('inventoryBtn').addEventListener('click', () => bridge.inventory());
    const observer = new ResizeObserver(() => {
      document.body.style.setProperty('--toolbar-height', document.getElementById('topbar').offsetHeight + 'px');
      document.body.style.setProperty('--footer-height', footer.offsetHeight + 'px');
      bridge.resize();
    });
    observer.observe(document.getElementById('topbar')); observer.observe(footer);
    refresh();
    return { refresh, destroy() { destroyed = true; if (frame !== null) clearTimeout(frame); observer.disconnect(); metrics.clear(); rail.remove(); footer.remove(); } };
  }
  function gameDimensions(width, height) {
    const scale = Math.min(Math.max(0, width) / 1600, Math.max(0, height) / 832);
    return { width: Math.floor(1600 * scale), height: Math.floor(832 * scale) };
  }
  return { mount, accountLabel, frameRate, createStateReader, gameDimensions };
});
