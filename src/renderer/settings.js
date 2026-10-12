(function () {
  const copy = {
    pt: ['Ajustes', 'Buscar configuração', 'Contas', 'Visual e jogo', 'Desempenho', 'Notificações do farm', 'Análise', 'Resumo', 'Ferramentas', 'Backup e suporte', 'As alterações são salvas automaticamente.'],
    en: ['Settings', 'Search settings', 'Accounts', 'Appearance and game', 'Performance', 'Farm notifications', 'Analysis', 'Summary', 'Tools', 'Backup and support', 'Changes are saved automatically.'],
    es: ['Ajustes', 'Buscar ajustes', 'Cuentas', 'Aspecto y juego', 'Rendimiento', 'Avisos del farm', 'Análisis', 'Resumen', 'Herramientas', 'Backup y soporte', 'Los cambios se guardan automáticamente.']
  };
  function mount(bridge) {
    const menu = bridge.menu, opener = document.getElementById('menuBtn');
    const el = (tag, cls) => { const node = document.createElement(tag); node.className = cls || ''; return node; };
    const panel = el('div', 'settings-panel'), header = el('header'), title = el('h2'), close = el('button');
    title.id = 'settingsTitle'; close.textContent = '✕'; close.setAttribute('aria-label', 'Fechar'); close.onclick = bridge.close;
    header.append(title, close);
    const search = el('input', 'settings-search'); search.type = 'search';
    const body = el('div', 'settings-body'), nav = el('nav', 'settings-nav'), content = el('div', 'settings-content'), footer = el('p', 'settings-foot');
    const groups = [
      ['accounts', 2, ['accounts', 'loginAll', 'count', 'voltaHunt']],
      ['appearance', 3, ['langRow', 'layout', 'propNat', 'dock', 'chat', 'hideGameNotices', 'cleanHud', 'muteAll', 'overlayBtn']],
      ['performance', 4, ['eco', 'awake', 'minTray', 'autoStart']],
      ['notifications', 5, ['alerts', 'sndShiny', 'voiceAlerts', 'shotShiny']],
      ['analysis', 6, ['sellguard']], ['summary', 7, []],
      ['tools', 8, ['recommendBtn', 'hunt', 'tierBtn', 'dittoBtn']],
      ['support', 9, ['bkExp', 'bkImp', 'updateBtn', 'manBtn', 'faqBtn', 'errlogBtn', 'supportLinks']]
    ];
    const sections = new Map(); let selected = 'accounts';
    for (const [key, index, ids] of groups) {
      const button = el('button'); button.dataset.section = key;
      const section = el('section', 'settings-section'); section.dataset.section = key;
      const heading = el('h3'); section.append(heading);
      const controls = el('div', 'settings-controls');
      for (const id of ids) {
        const control = document.getElementById(id);
        if (!control) continue;
        if (control.tagName === 'BUTTON') {
          const card = el('div', 'settings-control'), help = el('small');
          help.dataset.helpFor = id; card.append(control, help); controls.append(card);
        } else controls.append(control);
      }
      section.append(controls); content.append(section); nav.append(button);
      sections.set(key, { section, button, heading, index });
      button.onclick = () => { selected = key; search.value = ''; display(); };
    }
    const notificationHost = el('div', 'settings-advanced'), summaryHost = el('div', 'settings-advanced');
    sections.get('notifications').section.append(notificationHost);
    sections.get('summary').section.append(summaryHost);
    bridge.panel.style.display = 'block'; sections.get('analysis').section.append(bridge.panel);
    // The primary toolbar owns these modes. Keep their existing internal handlers out of the settings UI.
    const legacy = el('div'); legacy.hidden = true;
    for (const id of ['cardsBtn', 'layout']) { const node = document.getElementById(id); if (node) legacy.append(node); }
    document.body.append(legacy);
    body.append(nav, content); panel.append(header, search, body, footer); menu.replaceChildren(panel); document.body.append(menu);
    const fold = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    function display() {
      const query = fold(search.value.trim());
      for (const [key, item] of sections) {
        item.button.classList.toggle('active', !query && key === selected);
        item.button.setAttribute('aria-current', !query && key === selected ? 'true' : 'false');
        item.section.hidden = query ? !fold(item.section.textContent).includes(query) : key !== selected;
      }
      content.scrollTop = 0;
    }
    function open(key = selected) {
      const labels = copy[bridge.lang()] || copy.pt;
      close.setAttribute('aria-label',bridge.lang()==='en'?'Close':bridge.lang()==='es'?'Cerrar':'Fechar');
      title.textContent = labels[0]; search.placeholder = labels[1]; search.setAttribute('aria-label', labels[1]); footer.textContent = labels[10];
      for (const item of sections.values()) item.heading.textContent = item.button.textContent = labels[item.index];
      for (const help of menu.querySelectorAll('[data-help-for]')) {
        help.textContent = document.getElementById(help.dataset.helpFor).title;
        help.hidden = !help.textContent;
      }
      bridge.renderPanel(); bridge.notifications(notificationHost); bridge.summary(summaryHost);
      selected = sections.has(key) ? key : 'accounts'; search.value = ''; display();
      menu.classList.add('show'); if (!menu.open) menu.showModal(); opener.setAttribute('aria-expanded', 'true'); search.focus();
    }
    opener.setAttribute('aria-haspopup', 'dialog'); opener.onclick = () => open();
    menu.addEventListener('close', () => { if (!menu.open) { menu.classList.remove('show'); opener.setAttribute('aria-expanded', 'false'); } });
    menu.addEventListener('cancel', event => { event.preventDefault(); bridge.close(); });
    menu.addEventListener('click', event => { if (event.target === menu) bridge.close(); });
    search.oninput = display;
    document.getElementById('langRow').addEventListener('click', event => { if (event.target.dataset.lang) open(selected); });
    // Close before opening another tool so it can receive focus above the game.
    const destinations = new Set(['accounts', 'recommendBtn', 'hunt', 'tierBtn', 'dittoBtn', 'manBtn', 'faqBtn', 'donTop', 'overlayBtn']);
    menu.addEventListener('click', event => { if (destinations.has(event.target.closest('button')?.id)) bridge.close(); }, true);
    return { open, close: bridge.close };
  }
  window.PokeMuxSettings = { mount };
})();
