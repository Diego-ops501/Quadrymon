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
  Object.assign(COPY.pt, { gold: 'Dólares da conta', diamonds: 'Diamantes', balls: 'Pokébolas', heals: 'Cura', kills: 'Abates/h', notifications: 'Notificações', unread: 'não lidas' });
  Object.assign(COPY.en, { gold: 'Account dollars', diamonds: 'Diamonds', balls: 'Poké Balls', heals: 'Healing', kills: 'Kills/h', notifications: 'Notifications', unread: 'unread' });
  Object.assign(COPY.es, { gold: 'Dólares de la cuenta', diamonds: 'Diamantes', balls: 'Poké Balls', heals: 'Curación', kills: 'Bajas/h', notifications: 'Notificaciones', unread: 'sin leer' });
  Object.assign(COPY.pt, { hidePreviews: 'Ocultar miniaturas', showPreviews: 'Mostrar miniaturas' });
  Object.assign(COPY.en, { hidePreviews: 'Hide previews', showPreviews: 'Show previews' });
  Object.assign(COPY.es, { hidePreviews: 'Ocultar miniaturas', showPreviews: 'Mostrar miniaturas' });
  function accountLabel(value, index, lang = 'pt') {
    const name = String(value || '').replace(/[\x00-\x1f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);
    return name || (COPY[lang] || COPY.pt).account + ' ' + (index + 1);
  }
  function frameRate({ summary, eco, focused, account }) {
    return summary ? 1 : !eco ? 0 : focused >= 0 && focused !== account ? 8 : 15;
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
    const previewToggle = document.createElement('button');
    previewToggle.id = 'focusPreviewToggle'; previewToggle.type = 'button'; previewToggle.hidden = true;
    previewToggle.setAttribute('aria-controls', 'grid'); grid.after(previewToggle);
    let previewsHidden = bridge.load?.('focusPreviewsHidden') === '1';
    previewToggle.addEventListener('click', () => {
      previewsHidden = !previewsHidden;
      bridge.save?.('focusPreviewsHidden', previewsHidden ? '1' : '0');
      refresh();
    });
    const footer = document.createElement('footer');
    footer.id = 'workspaceFooter';
    const connection = document.createElement('span'), economy = document.createElement('span');
    footer.append(connection, economy);
    document.body.append(footer);
    let selected = 0, frame = null, destroyed = false;
    const chips = [], metrics = new Map();
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
      document.body.dataset.workspaceMode = mode;
      previewToggle.hidden = mode !== 'focus' || accounts.length < 2;
      document.body.classList.toggle('focus-previews-hidden', mode === 'focus' && accounts.length > 1 && previewsHidden);
      text(previewToggle, previewsHidden ? '‹' : '›');
      previewToggle.title = previewsHidden ? copy.showPreviews : copy.hidePreviews;
      previewToggle.setAttribute('aria-label', previewToggle.title);
      previewToggle.setAttribute('aria-expanded', String(!previewsHidden));
      grid.style.setProperty('--preview-count', Math.max(1, accounts.length - 1));
      nav.setAttribute('aria-label', copy.accounts);
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
      document.getElementById('cardsBtn').textContent = copy.summary;
      document.getElementById('cardsBtn').setAttribute('aria-pressed', String(!!state.summary));
      syncButtons(chips, nav, accounts.length);
      let online = 0;
      accounts.forEach((account, index) => {
        const name = accountLabel(account.name, index, state.lang);
        const status = account.off ? copy.off : account.live ? copy.online : copy.waiting;
        if (account.live && !account.off) online++;
        for (const button of [chips[index]]) {
          button.style.setProperty('--account-color', account.color);
          text(button.querySelector('.account-label'), name);
          text(button.querySelector('.account-state'), status);
          button.classList.toggle('online', !!account.live && !account.off);
          button.classList.toggle('active', !state.summary && focused === index);
          button.setAttribute('aria-pressed', String(!state.summary && focused === index));
          button.title = name + ' · ' + status;
          button.setAttribute('aria-label', button.title);
        }
        const panel = grid.children[index];
        if (!panel) return;
        panel.style.setProperty('--preview-row', index < focused ? index + 1 : index);
        const panelName = panel.querySelector('.name'); text(panelName, name);
        let leader = panel.querySelector('.panel-leader');
        if (!leader) {
          leader = document.createElement('span'); leader.className = 'panel-leader';
          const image = document.createElement('img'); image.width = 28; image.height = 28;
          image.addEventListener('error', () => { image.hidden = true; });
          leader.append(image); panelName.after(leader);
        }
        const pokemon = account.leader, image = leader.firstChild;
        const pokemonName = globalThis.QuadrymonNames?.display(pokemon?.name) || pokemon?.name || '';
        const source = pokemon ? bridge.sprite?.(pokemon.sid, pokemon.shiny, pokemon.name) : '';
        leader.hidden = !pokemon || !source;
        leader.title = pokemonName + (pokemon?.level ? ' · Lv ' + pokemon.level : '');
        image.alt = pokemonName;
        if (source && image.getAttribute('src') !== source) { image.hidden = false; image.src = source; }
        if (!source) image.removeAttribute('src');
        panel.style.setProperty('--account-color', account.color);
        let strip = metrics.get(panel);
        if (!strip) {
          strip = document.createElement('div'); strip.className = 'panel-metrics';
          for (const label of ['XP/h', '$/h', '', '']) { const item = document.createElement('span'); const caption = document.createElement('small'), value = document.createElement('b'); caption.textContent = label; item.append(caption, value); strip.append(item); }
          const travel = document.createElement('button'); travel.type = 'button'; travel.className = 'panel-travel';
          travel.addEventListener('click', () => bridge.travelMarket(index)); strip.append(travel); panel.append(strip); metrics.set(panel, strip);
          const notice = document.createElement('button'); notice.type = 'button'; notice.className = 'panel-notifications';
          notice.setAttribute('aria-haspopup', 'dialog');
          const icon = document.createElement('span'); icon.className = 'notification-icon'; icon.setAttribute('aria-hidden', 'true');
          const count = document.createElement('span'); count.className = 'notification-count';
          notice.append(icon, count); notice.addEventListener('click', () => bridge.notifications(index)); strip.append(notice);
          const resources = document.createElement('div'); resources.className = 'panel-resources';
          const header = panel.querySelector('.panel-header'); header.insertBefore(resources, header.querySelector('button'));
          const preview = document.createElement('button'); preview.type = 'button'; preview.className = 'panel-preview-focus';
          preview.addEventListener('click', () => { selected = index; bridge.focus(index); refresh(); }); panel.append(preview);
        }
        const preview = panel.querySelector('.panel-preview-focus');
        preview.title = copy.focus + ' · ' + name;
        preview.setAttribute('aria-label', preview.title);
        preview.tabIndex = mode === 'focus' && focused !== index ? 0 : -1;
        const data = !account.off && account.live && account.metrics;
        const values = [data ? compact(data.xph, state.lang) : '—', data ? compact(data.gph, state.lang) : '—', data ? compact(data.captures, state.lang) : '—', data ? compact(data.kph, state.lang) : '—'];
        strip.querySelectorAll(':scope > span > b').forEach((el, i) => text(el, values[i]));
        text(strip.children[2].querySelector('small'), copy.captures);
        text(strip.children[3].querySelector('small'), copy.kills);
        const notice = strip.querySelector('.panel-notifications'), unread = account.notifications || 0;
        text(notice.querySelector('.notification-count'), unread);
        notice.classList.toggle('has-unread', unread > 0);
        notice.title = copy.notifications + ' · ' + name + ' · ' + unread + ' ' + copy.unread;
        notice.setAttribute('aria-label', notice.title);
        const resources = panel.querySelector('.panel-resources'), stock = account.live && !account.off ? account.resources : null;
        const compactHeader = panel.clientWidth < 650;
        const signature = JSON.stringify([stock, state.lang, compactHeader]);
        if (resources.dataset.signature !== signature) {
          resources.dataset.signature = signature; resources.replaceChildren();
          const number = value => value == null || !Number.isFinite(Number(value)) ? '—' : new Intl.NumberFormat(state.lang === 'pt' ? 'pt-BR' : state.lang).format(Number(value));
          const resource = (icon, value, title, cls, fullValue = value) => {
            const item = document.createElement('span'); item.className = 'panel-resource ' + cls; item.title = title;
            const art = document.createElement('span'); art.textContent = icon;
            art.setAttribute('aria-hidden', 'true');
            const count = document.createElement('b'); count.textContent = value; item.append(art, count); item.title = title + ': ' + fullValue; item.setAttribute('aria-label', item.title); resources.append(item);
          };
          const shown = value => {
            if (!compactHeader || value == null || !Number.isFinite(Number(value))) return number(value);
            const n = Number(value), size = Math.abs(n), scale = size >= 1e9 ? 1e9 : size >= 1e6 ? 1e6 : size >= 1e3 ? 1e3 : 1;
            return new Intl.NumberFormat(state.lang === 'pt' ? 'pt-BR' : state.lang, { maximumFractionDigits: scale === 1 ? 0 : 1 }).format(n / scale) + ({ 1e3: 'K', 1e6: 'M', 1e9: 'B' }[scale] || '');
          };
          resource('💎', shown(stock?.diamonds), copy.diamonds, 'resource-diamonds', number(stock?.diamonds));
          resource('$', shown(stock?.gold), copy.gold, 'resource-gold', number(stock?.gold));
          for (const [rows, caption, icon, cls] of [[stock?.balls, copy.balls, '◉', 'resource-ball'], [stock?.heals, copy.heals, '🧪', 'resource-heal']]) {
            const available = stock && Array.isArray(rows);
            const total = available ? rows.reduce((sum, row) => sum + (row.infinite ? 0 : Math.max(0, Number(row.quantity) || 0)), 0) : null;
            const infinite = available && rows.some(row => row.infinite && row.quantity > 0);
            const suffix = infinite ? total > 0 ? ' + ∞' : '∞' : '';
            resource(icon, infinite && !total ? suffix : shown(total) + suffix, caption, cls, infinite && !total ? suffix : number(total) + suffix);
          }
        }
        const trip = account.marketTravel || {}, travel = strip.querySelector('.panel-travel');
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
      refresh();
    });
    observer.observe(document.getElementById('topbar')); observer.observe(footer); observer.observe(grid);
    refresh();
    return { refresh, destroy() { destroyed = true; if (frame !== null) clearTimeout(frame); observer.disconnect(); metrics.clear(); previewToggle.remove(); document.body.classList.remove('focus-previews-hidden'); footer.remove(); } };
  }
  function gameDimensions(width, height) {
    const scale = Math.min(Math.max(0, width) / 1600, Math.max(0, height) / 832);
    return { width: Math.floor(1600 * scale), height: Math.floor(832 * scale) };
  }
  return { mount, accountLabel, frameRate, createStateReader, gameDimensions };
});
