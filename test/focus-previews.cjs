'use strict';
const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const root = path.resolve(__dirname, '..');
app.setPath('userData', path.join(os.tmpdir(), 'quadrymon-live-focus-' + process.pid));
const fixtures = {
  'creds:load': () => ['Aurora', 'Boreal', 'Citrino', 'Dourado'].map(name => ({ name, email: '', senha: '' })),
  'game-runtime:read': () => '',
  'game-catalog:load': () => ({ version: 1, entries: [] }),
  'autostart:get': () => ({ on: false, suportado: true }),
};
for (const channel of ['creds:load', 'creds:save', 'game-runtime:read', 'game-runtime:hydrate', 'game-catalog:load', 'autostart:get', 'awake:set', 'mintray:set', 'overlay:state', 'errlog:write'])
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
    await run('window.testPreferencesSource = ' + JSON.stringify(fs.readFileSync(path.join(root, 'src/game/preferences.js'), 'utf8')) + '; void 0;');
    await run(`(async () => {
      const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
      for (let i = 0; i < 100 && !window.PokeMuxRuntime; i++) await pause(50);
      window.liveViews = [...document.querySelectorAll('webview')];
      for (const [i, view] of liveViews.entries()) {
        const set = view.setAttribute.bind(view);
        view.setAttribute = (name, value) => { if (name !== 'src') set(name, value); };
        set('src', 'about:blank');
        const source = '(' + function (index) {
          document.body.style.cssText = 'margin:0;background:#0b1220;overflow:hidden';
          const canvas = document.createElement('canvas'); canvas.width = 1600; canvas.height = 832;
          canvas.style.cssText = 'width:100vw;height:100vh;object-fit:contain'; document.body.replaceChildren(canvas);
          const ctx = canvas.getContext('2d'), colors = ['#256d49', '#9a7838', '#3f6289', '#67578c'];
          window.liveFrames = 0;
          setInterval(() => {
            window.liveFrames++;
            ctx.fillStyle = colors[index]; ctx.fillRect(0, 0, 1600, 832);
            ctx.fillStyle = '#ffffff28';
            for (let x = 0; x < 1600; x += 80) for (let y = 0; y < 832; y += 80) ctx.strokeRect(x, y, 80, 80);
            ctx.fillStyle = '#ffe174'; ctx.beginPath(); ctx.arc((window.liveFrames * 8) % 1500 + 50, 430, 35, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#fff'; ctx.font = 'bold 50px Segoe UI'; ctx.fillText(['Aurora', 'Boreal', 'Citrino', 'Dourado'][index], 50, 100);
            ctx.font = '28px Segoe UI'; ctx.fillText('Live frame ' + window.liveFrames, 50, 150);
          }, 50);
        }.toString() + ')(' + i + ')';
        for (let attempt = 0; ; attempt++) {
          try { await view.executeJavaScript(source); break; }
          catch (error) { if (attempt > 100) throw error; await pause(50); }
        }
        await view.executeJavaScript('const menu = document.createElement("nav"); menu.className = "game-dock"; menu.textContent = "Game menu"; menu.style.cssText = "position:absolute;top:0;color:white"; document.body.append(menu); void 0;');
        await view.executeJavaScript(testPreferencesSource);
        view.getURL = () => 'https://poke.idleworld.online/play';
      }
      document.querySelector('#workspaceAccounts [data-account="1"]').click();
      await pause(200);
      const menus = await Promise.all(liveViews.map(view => view.executeJavaScript('getComputedStyle(document.querySelector(".game-dock")).display')));
      if (menus.some((display, i) => i === 1 ? display === 'none' : display !== 'none')) throw Error('only preview accounts should hide the game menu');
      window.beforeFrames = await Promise.all(liveViews.map(view => view.executeJavaScript('window.liveFrames')));
      await pause(500);
      const after = await Promise.all(liveViews.map(view => view.executeJavaScript('window.liveFrames')));
      if (after.some((value, i) => !(value > beforeFrames[i]))) throw Error('all four webviews must keep rendering in focus');
    })()`);
    for (const width of [1920, 1440, 1100, 800]) {
      win.setContentSize(width, 950);
      await new Promise(resolve => setTimeout(resolve, 150));
      await run(`(async () => { for (let i = 0; i < 100 && innerWidth !== ${width}; i++) await new Promise(resolve => setTimeout(resolve, 50)); if (innerWidth !== ${width}) throw Error('viewport resize did not settle'); })()`);
      await run(`(() => {
        const focused = document.querySelector('#grid .expanded'), main = focused.getBoundingClientRect();
        const previews = [...document.querySelectorAll('#grid .panel:not(.expanded)')];
        if (previews.length !== 3) throw Error('three previews must be present');
        let bottom = 0;
        for (const panel of previews) {
          const rect = panel.getBoundingClientRect(), view = panel.querySelector('webview').getBoundingClientRect();
          if (rect.left < main.right || rect.top < bottom - 1 || rect.right > innerWidth || view.width < 100 || view.height < 80 || getComputedStyle(panel).visibility !== 'visible') throw Error('invalid right column at ${width}');
          if (view.top < panel.querySelector('.panel-header').getBoundingClientRect().bottom - 1 || view.bottom > panel.querySelector('.panel-metrics').getBoundingClientRect().top + 1) throw Error('preview borders overlap the live game');
          bottom = rect.bottom;
        }
        if (!liveViews.every((view, i) => document.querySelectorAll('webview')[i] === view)) throw Error('focus changed guest identities');
        const toggle = document.querySelector('#focusPreviewToggle'), rect = toggle.getBoundingClientRect(), firstPreview = previews[0].getBoundingClientRect();
        if (toggle.hidden || Math.abs((rect.top + rect.bottom) / 2 - (main.top + main.bottom) / 2) > 2 || (rect.left + rect.right) / 2 < main.right || (rect.left + rect.right) / 2 > firstPreview.left) throw Error('toggle must be centered on the divider at ${width}');
      })()`);
      await run(`(async () => {
        const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
        const toggle = document.querySelector('#focusPreviewToggle'), original = document.querySelector('#grid .expanded').getBoundingClientRect().width;
        toggle.click(); await pause(100);
        if (toggle.getAttribute('aria-expanded') !== 'false' || localStorage.getItem('focusPreviewsHidden') !== '1') throw Error('collapse state must be accessible and persistent');
        if ([...document.querySelectorAll('#grid .panel:not(.expanded)')].some(panel => getComputedStyle(panel).display !== 'none')) throw Error('collapse must hide all previews');
        const main = document.querySelector('#grid .expanded').getBoundingClientRect();
        if (main.width <= original || main.width < innerWidth - 45) throw Error('main account must use the available width');
        const before = await Promise.all(liveViews.map(view => view.executeJavaScript('window.liveFrames'))); await pause(200);
        const after = await Promise.all(liveViews.map(view => view.executeJavaScript('window.liveFrames')));
        if (after.some((value, i) => !(value > before[i]))) throw Error('collapsed accounts must keep running');
        if (!liveViews.every((view, i) => document.querySelectorAll('webview')[i] === view)) throw Error('collapse must preserve the guests');
        toggle.click(); await pause(100);
        if (toggle.getAttribute('aria-expanded') !== 'true' || localStorage.getItem('focusPreviewsHidden') !== '0' || Math.abs(document.querySelector('#grid .expanded').getBoundingClientRect().width - original) > 1) throw Error('second click must restore the preview column: ' + JSON.stringify({ expanded: toggle.getAttribute('aria-expanded'), saved: localStorage.getItem('focusPreviewsHidden'), original, current: document.querySelector('#grid .expanded').getBoundingClientRect().width, viewport: innerWidth, grid: document.querySelector('#grid').getBoundingClientRect().width, columns: getComputedStyle(document.querySelector('#grid')).gridTemplateColumns, classes: document.body.className }));
      })()`);
    }
    win.setContentSize(1440, 950);
    await new Promise(resolve => setTimeout(resolve, 150));
    const preview = path.join(os.tmpdir(), 'quadrymon-live-focus.png');
    fs.writeFileSync(preview, (await win.webContents.capturePage()).toPNG());
    await run(`(async () => {
      document.querySelector('#grid .panel:not(.expanded) .panel-preview-focus').click();
      await new Promise(resolve => setTimeout(resolve, 100));
      if (!document.querySelector('#grid .expanded').contains(liveViews[0])) throw Error('preview click did not promote the account');
      if (!liveViews.every((view, i) => document.querySelectorAll('webview')[i] === view)) throw Error('preview click recreated guests');
      const menus = await Promise.all(liveViews.map(view => view.executeJavaScript('getComputedStyle(document.querySelector(".game-dock")).display')));
      if (menus.some((display, i) => i === 0 ? display === 'none' : display !== 'none')) throw Error('switching focus must restore the new main menu and hide the former main menu');
      document.querySelector('[data-mode="grid"]').click(); await new Promise(resolve => setTimeout(resolve, 100));
      const gridMenus = await Promise.all(liveViews.map(view => view.executeJavaScript('getComputedStyle(document.querySelector(".game-dock")).display')));
      if (gridMenus.some(display => display === 'none')) throw Error('grid must restore all normal menus');
      document.querySelector('[data-mode="focus"]').click(); await new Promise(resolve => setTimeout(resolve, 100));
      const count = document.querySelector('#panelCount');
      for (const value of ['3', '2', '1']) {
        count.value = value; count.dispatchEvent(new Event('change')); await new Promise(resolve => setTimeout(resolve, 100));
        if (document.querySelectorAll('#grid .panel:not(.expanded)').length !== Number(value) - 1) throw Error('focus preview count mismatch');
        const main = document.querySelector('#grid .expanded').getBoundingClientRect();
        if (value === '1' && (main.width < innerWidth - 25 || !document.querySelector('#focusPreviewToggle').hidden)) throw Error('single account should fill the workspace without a preview toggle');
      }
    })()`);
    console.log('Live focus: animated guests, right previews, centered collapse/restore button, full width, persistent state, running hidden accounts, four viewport sizes and 1–4 accounts passed. Preview: ' + preview);
    app.exit(0);
  } catch (error) { console.error(error.stack); app.exit(1); }
});
setTimeout(() => { console.error('Live focus test timed out'); app.exit(1); }, 30000);
