"use strict";
const { app, BrowserWindow, ipcMain } = require("electron");
const fs = require("node:fs"),
  path = require("node:path"),
  os = require("node:os");
const directory = path.resolve(__dirname, "..");
app.setPath(
  "userData",
  path.join(os.tmpdir(), "pokemux-independent-test-" + process.pid),
);
const runtime = [
  "src/domain/pokemon-state.js",
  "src/game/session.js",
  "src/domain/iv-math.js",
  "src/game/iv-reader.js",
]
  .map((file) => fs.readFileSync(path.join(directory, file), "utf8"))
  .join("\n");
const fixtures = {
  "creds:load": () => [
    { name: "Aurora", email: "one", senha: "" },
    { name: "Boreal", email: "two", senha: "" },
    { name: "Citrino", email: "three", senha: "" },
    { name: "Dourado", email: "four", senha: "" },
  ],
  "game-runtime:read": () => runtime,
  "game-catalog:load": () => ({
    version: 1,
    at: Date.now(),
    entries: [{ kind: "pokemon", name: "Dratini", speciesId: 147 }],
  }),
  "autostart:get": () => ({ on: false, suportado: true }),
};
let savedAccounts;
ipcMain.handle("creds:save", (_event, value) => {
  savedAccounts = value;
  return true;
});
for (const channel of [
  "creds:load",
  "game-runtime:read",
  "game-catalog:load",
  "game:performance",
  "awake:set",
  "mintray:set",
  "autostart:get",
  "log:write",
  "errlog:write",
  "notify",
  "overlay:state",
])
  ipcMain.handle(channel, () => fixtures[channel]?.() ?? false);
ipcMain.on("app:version", (event) => {
  event.returnValue = "independent-test";
});
app.on("web-contents-created", (_event, contents) => {
  contents.session.webRequest.onBeforeRequest(
    { urls: ["https://*/*", "http://*/*"] },
    (_details, callback) => callback({ cancel: true }),
  );
  contents.on("will-attach-webview", (_event, _preferences, parameters) => {
    parameters.src = "about:blank";
  });
});
app.whenReady().then(async () => {
  const win = new BrowserWindow({
    show: false,
    width: 1440,
    height: 950,
    useContentSize: true,
    webPreferences: {
      preload: path.join(directory, "preload.js"),
      contextIsolation: true,
      sandbox: true,
      webviewTag: true,
    },
  });
  try {
    await win.loadFile(path.join(directory, "index.html"));
    const output = await win.webContents.executeJavaScript(`(async()=>{
      const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms)),check=(condition,label)=>{if(!condition)throw Error(label);};
      for(let i=0;i<100&&!window.PokeMuxRuntime;i++)await pause(50);
      check(window.PokeMuxRuntime,'new runtime boots');await pause(100);
      check(document.querySelectorAll('webview').length===4,'four game partitions');
      check(document.querySelector('#workspaceAccounts').textContent.includes('Aurora'),'saved names remain visible');
      const original=[...document.querySelectorAll('webview')];
      document.querySelector('#workspaceAccounts [data-account="1"]').click();await pause(50);
      check(document.body.dataset.workspaceMode==='focus','focus switches');
      document.querySelector('[data-mode="summary"]').click();await pause(50);
      check(document.querySelectorAll('#cards .runtime-card').length===4,'summary contains four cards');
      check(original.every((view,index)=>document.querySelectorAll('webview')[index]===view),'mode changes preserve live sessions');
      document.querySelector('[data-mode="grid"]').click();await pause(50);
      const count=document.querySelector('#panelCount');count.value='2';count.dispatchEvent(new Event('change'));await pause(50);
      check(document.querySelectorAll('webview').length===2,'panel count decreases');
      check(original[0]===document.querySelectorAll('webview')[0]&&original[1]===document.querySelectorAll('webview')[1],'remaining sessions survive a count change');
      count.value='4';count.dispatchEvent(new Event('change'));await pause(50);
      const untouched=document.querySelectorAll('webview')[1],power=document.querySelector('#grid .panel-header button:last-child');power.click();await pause(30);power.click();await pause(30);
      check(untouched===document.querySelectorAll('webview')[1],'turning one account back on preserves the other accounts');
      document.querySelector('#menuBtn').click();check(document.querySelector('#menu').open,'settings dialog opens');
      document.querySelector('#menu .settings-search').value='Eco';document.querySelector('#menu .settings-search').dispatchEvent(new Event('input'));
      check(!document.querySelector('[data-section="performance"].settings-section').hidden,'settings search works');
      document.querySelector('#menu header button').click();check(!document.querySelector('#menu').open,'settings dialog closes');
      document.querySelector('#accounts').click();
      document.querySelector('[name="email0"]').value='azuosd2';
      document.querySelector('[name="email1"]').value='fixture@example.invalid';
      const accountForm=document.querySelector('#accountForm');
      check(accountForm.checkValidity(),'account form accepts both username and email');
      accountForm.requestSubmit();await pause(150);
      check(!document.querySelector('#accountEditor').open,'native form submission saves usernames');
      document.querySelector('#accounts').click();
      check(document.querySelector('[name="email0"]').value==='azuosd2','username is retained');
      check(document.querySelector('[name="email1"]').value==='fixture@example.invalid','email is retained');
      document.querySelector('#accountEditor').close();
      document.querySelector('#inventoryBtn').click();await pause(100);check(document.querySelector('#inventoryDialog')?.open,'inventory opens');document.querySelector('#inventoryDialog').close();
      document.querySelector('#marketBtn').click();await pause(120);check(document.querySelector('#pmMarket').classList.contains('show'),'market opens without connected accounts');
      return {mode:document.body.dataset.workspaceMode,accounts:window.PokeMuxRuntime.state().accounts.length};
    })()`);
    console.log(
      "Independent Electron workspace passed: " + JSON.stringify(output),
    );
    await win.webContents.executeJavaScript(
      'document.querySelector("#mkClose")?.click()',
    );
    for (const width of [1440, 1100, 800]) {
      win.setContentSize(width, 950);
      await new Promise((resolve) => setTimeout(resolve, 100));
      const layout = await win.webContents.executeJavaScript(
        '({width:innerWidth,scroll:document.documentElement.scrollWidth,panels:document.querySelectorAll("#grid>.panel").length})',
      );
      if (layout.scroll > layout.width + 1)
        throw Error("Horizontal overflow at " + width);
      console.log("Layout " + width + " passed");
    }
    if (savedAccounts?.[0]?.email !== 'azuosd2' || savedAccounts?.[1]?.email !== 'fixture@example.invalid')
      throw Error('Both login formats must reach credential storage unchanged');
    win.setContentSize(1440, 950);
    await new Promise((resolve) => setTimeout(resolve, 100));
    fs.writeFileSync(
      path.join(os.tmpdir(), "pokemux-independent-preview.png"),
      (await win.webContents.capturePage()).toPNG(),
    );
    app.exit(0);
  } catch (error) {
    console.error(error.stack);
    app.exit(1);
  }
});
setTimeout(() => {
  console.error("Independent UI test timed out");
  app.exit(1);
}, 30000);
