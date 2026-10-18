'use strict';
const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const root = path.resolve(__dirname, '..');
app.setPath('userData', path.join(os.tmpdir(), 'quadrymon-borders-' + process.pid));
const fixtures = {
  'creds:load': () => ['Aurora', 'Boreal', 'Citrino', 'Dourado'].map(name => ({ name, email: '', senha: '' })),
  'game-runtime:read': () => '',
  'game-catalog:load': () => ({ version: 1, entries: [] }),
  'autostart:get': () => ({ on: false, suportado: true }),
};
for (const channel of ['creds:load', 'creds:save', 'game-runtime:read', 'game-runtime:hydrate', 'game-catalog:load', 'autostart:get', 'awake:set', 'mintray:set', 'overlay:state', 'notify', 'errlog:write'])
  ipcMain.handle(channel, () => fixtures[channel]?.() ?? true);
ipcMain.on('app:version', event => { event.returnValue = 'test'; });
app.on('web-contents-created', (_, contents) => {
  contents.session.webRequest.onBeforeRequest({ urls: ['http://*/*', 'https://*/*'] }, (_, callback) => callback({ cancel: true }));
  contents.on('will-attach-webview', (_, __, parameters) => { parameters.src = 'about:blank'; });
});
app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false, width: 1440, height: 950, useContentSize: true, webPreferences: { preload: path.join(root, 'preload.js'), sandbox: true, contextIsolation: true, webviewTag: true, backgroundThrottling: false } });
  const run = code => win.webContents.executeJavaScript(code);
  try {
    await win.loadFile(path.join(root, 'index.html'));
    await run(`(async () => {
      const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
      const check = (value, label) => { if (!value) throw Error(label); };
      for (let i = 0; i < 100 && !window.PokeMuxRuntime; i++) await pause(50);
      check(window.PokeMuxRuntime, 'runtime boots without analysis');
      window.testStates = ['Aurora', 'Boreal', 'Citrino', 'Dourado'].map((name, i) => ({ ok: true, live: true, cid: 'demo' + i, name, gold: 223289129 + i, diamonds: 357 + i, hunt: 'test_hunt', farm: { hunting: true }, team: [], captures: [], shinies: [], drops: [], balls: [{ id: 1, name: 'Poke Ball', quantity: 36292 }, { id: 2, name: 'Infinite Ball', quantity: 1, infinite: true }], bag: [{ id: 3, name: 'Potion', category: 'potion', quantity: 69 }], a: { epoch: 'hunt1', seconds: 3600, kills: 721, kph: 721, xph: 15000000, gph: 249500, captures: 96 } }));
      [...document.querySelectorAll('webview')].forEach((view, i) => {
        view.getURL = () => 'https://poke.idleworld.online/play';
        view.executeJavaScript = async script => script.includes('PokeMuxSession.snapshot') ? testStates[i] : true;
      });
      for (let i = 0; i < 4; i++) await PokeMuxRuntime.readState(i);
      testStates[0].team = [{ id: 'other', name: 'Exeggcute', sid: 102, level: 12, ld: false }, { id: 'leader', name: 'Pinsir', sid: 127, level: 468, ld: true }];
      testStates[0].balls.push({ id: 3, name: 'Ultra Ball', quantity: 200 });
      testStates[0].bag.push({ id: 4, name: 'Super Potion', category: 'heal', quantity: 31 });
      testStates[2].balls = [{ id: 1, name: 'Poke Ball', quantity: 200 }, { id: 2, name: 'Ultra Ball', quantity: 300 }, { id: 3, name: 'Unowned Infinite Ball', quantity: 0, infinite: true }];
      testStates[2].bag = [];
      testStates[0].captures.push({ id: 'dratini', t: Date.now(), n: 'Dratini', iv: 178, q: 1.78 });
      testStates[0].drops = [{ name: 'Boss Token', qty: 2 }, { name: 'Strange Pheromone', qty: 1 }, { name: 'Common Item', qty: 5 }];
      testStates[1].drops = [{ name: 'Boss Token', qty: 1 }];
      await PokeMuxRuntime.readState(0); await PokeMuxRuntime.readState(1);
      for (let i = 0; i < 130 && document.querySelector('.notification-count')?.textContent !== '3'; i++) await pause(50);
      const panels = [...document.querySelectorAll('#grid > .panel')];
      const leader = panels[0].querySelector('.panel-leader');
      check(leader && !leader.hidden && leader.querySelector('img').alt === 'Pinsir' && leader.title === 'Pinsir · Lv 468', 'header shows the active leader image and its name/level tooltip');
      check(panels[0].querySelector('.name').nextElementSibling === leader && leader.querySelector('img').getAttribute('src').endsWith('/127.png'), 'leader image sits next to the account name and uses the correct species');
      check(panels[1].querySelector('.panel-leader').hidden, 'account without a leader does not show a different account Pokemon');
      check(!document.querySelector('#stats, #statsBtn'), 'analysis UI is absent');
      check(panels[0].querySelector('.resource-gold b').textContent === '223.289.129', 'total account dollars are shown without abbreviation');
      check(panels[0].querySelector('.resource-diamonds b').textContent === '357', 'diamonds are shown');
      check(panels[0].querySelectorAll('.resource-ball').length === 1 && panels[0].querySelector('.resource-ball b').textContent === '36.492 + ∞', 'balls show one combined finite total and preserve owned infinite balls');
      check(panels[0].querySelectorAll('.resource-heal').length === 1 && panels[0].querySelector('.resource-heal b').textContent === '100', 'all healing supplies are added to one total');
      check(panels[2].querySelector('.resource-ball b').textContent === '500' && panels[2].querySelector('.resource-heal b').textContent === '0', 'finite stocks sum correctly and unowned infinite balls do not affect totals');
      check(panels[0].querySelector('.panel-header .panel-resources') && !panels[0].querySelector(':scope > .panel-resources'), 'resources live inside the account header without a separate strip');
      check([...panels[0].querySelector('.panel-resources').children].map(item=>item.className.split(' ').pop()).join(',') === 'resource-diamonds,resource-gold,resource-ball,resource-heal', 'header resource order is diamonds, dollars, balls, healing');
      check(panels[0].querySelector('.panel-metrics').textContent.includes('Abates/h721'), 'kills per hour use the measured account value');
      check(panels[0].querySelector('.panel-notifications').classList.contains('has-unread'), 'unread notification button blinks');
      check(matchMedia('(prefers-reduced-motion: reduce)').matches || getComputedStyle(panels[0].querySelector('.panel-notifications')).animationName === 'notification-pulse', 'notification pulse is applied unless the system requests reduced motion');
      panels[0].querySelector('.panel-notifications').click(); await pause(100);
      check(document.querySelector('#accountNotifications').open && document.querySelectorAll('.notification-entry').length === 3, 'button opens the account event list');
      check(document.querySelector('#accountNotifications').textContent.includes('Boss Token ×2'), 'rare drops show newly received quantities');
      check(panels[0].querySelector('.notification-count').textContent === '0' && !panels[0].querySelector('.has-unread'), 'reading clears the badge and blinking');
      check(panels[1].querySelector('.notification-count').textContent === '1', 'reading preserves other account notifications');
      document.querySelector('#accountNotifications .dialog-head button').click();
      testStates[0].drops[0].qty = 3; await PokeMuxRuntime.readState(0);
      await pause(5200);
      check(panels[0].querySelector('.notification-count').textContent === '1', 'new drop after reading triggers another notification');
      document.querySelector('#workspaceAccounts [data-account="1"]').click(); await pause(100);
      check(document.body.dataset.workspaceMode === 'focus' && !document.body.classList.contains('stats-open'), 'focus keeps the full width');
      document.querySelector('[data-mode="grid"]').click();
      document.querySelector('#menuBtn').click(); document.querySelector('#menu [data-section="notifications"]').click();
      check(document.querySelector('#rareDropItems').value === 'Strange Pheromone\\nBoss Token', 'requested rare item defaults are configurable');
      document.querySelector('#menu header button').click();
    })()`);
    for (const width of [1440, 1100, 800]) {
      win.setContentSize(width, 950);
      await new Promise(resolve => setTimeout(resolve, 150));
      await run(`(async () => { for (let i=0;i<100 && innerWidth!==${width};i++) await new Promise(resolve=>setTimeout(resolve,50)); if(innerWidth!==${width})throw Error('viewport resize did not settle'); })()`);
      await run(`(() => {
        if (document.documentElement.scrollWidth > innerWidth) throw Error('horizontal page overflow at ${width}');
        for (const panel of document.querySelectorAll('#grid > .panel')) {
          const resources = panel.querySelector('.panel-resources'), metrics = panel.querySelector('.panel-metrics');
          if (resources.scrollWidth > resources.clientWidth + 1 || metrics.scrollWidth > metrics.clientWidth + 1) throw Error('account borders overflow at ${width}');
          const view = panel.querySelector('webview').getBoundingClientRect();
          const header=panel.querySelector('.panel-header');
          if (header.scrollWidth > header.clientWidth + 1) throw Error('account header overflows at ${width}');
          if (view.top < header.getBoundingClientRect().bottom - 1 || view.bottom > metrics.getBoundingClientRect().top + 1) throw Error('game overlaps account borders at ${width}');
        }
      })()`);
      await run(`(async () => {
        document.querySelector('[data-mode="focus"]').click(); await new Promise(resolve=>setTimeout(resolve,100));
        for(const panel of document.querySelectorAll('#grid > .panel')) {
          const header=panel.querySelector('.panel-header');
          if(header.scrollWidth>header.clientWidth+1)throw Error('focus header overflows at ${width}');
        }
        document.querySelector('[data-mode="grid"]').click(); await new Promise(resolve=>setTimeout(resolve,100));
      })()`);
    }
    win.setContentSize(1440, 950);
    await new Promise(resolve => setTimeout(resolve, 150));
    await run(`(async () => { for (let i=0;i<100 && (innerWidth!==1440 || JSON.parse(document.querySelector('.panel-resources').dataset.signature)[2]);i++) await new Promise(resolve=>setTimeout(resolve,50)); })()`);
    const preview = path.join(os.tmpdir(), 'quadrymon-account-borders.png');
    fs.writeFileSync(preview, (await win.webContents.capturePage()).toPNG());
    await run("document.querySelectorAll('.panel-notifications')[1].click()");
    await new Promise(resolve => setTimeout(resolve, 100));
    fs.writeFileSync(path.join(os.tmpdir(), 'quadrymon-account-notifications.png'), (await win.webContents.capturePage()).toPNG());
    console.log('Account borders Electron: resources, kills/h, blinking counts, event lists, read isolation, focus, settings and 3 viewport sizes passed. Preview: ' + preview);
    app.exit(0);
  } catch (error) { console.error(error.stack); app.exit(1); }
});
setTimeout(() => { console.error('Account borders timed out'); app.exit(1); }, 30000);
