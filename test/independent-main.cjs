"use strict";
const { app, BrowserWindow } = require("electron");
const path = require("node:path"),
  os = require("node:os"),
  fs = require("node:fs"),
  assert = require("node:assert/strict");
const directory = path.join(os.tmpdir(), "pokemux-main-test-" + process.pid);
fs.mkdirSync(directory, { recursive: true });
app.setPath("userData", directory);

global.fetch = async () => ({ ok: false });
app.on("web-contents-created", (_event, contents) => {
  contents.session.webRequest.onBeforeRequest(
    { urls: ["http://*/*", "https://*/*"] },
    (_details, callback) => callback({ cancel: true }),
  );
  contents.on("will-attach-webview", (_event, _preferences, parameters) => {
    parameters.src = "about:blank";
  });
});
require("../main");
app.whenReady().then(async () => {
  try {
    const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    let win;
    for (let index = 0; index < 80; index++) {
      win = BrowserWindow.getAllWindows().find(
        (candidate) => !candidate.isDestroyed(),
      );
      if (win && !win.webContents.isLoading()) {
        const ready = await win.webContents
          .executeJavaScript("!!window.PokeMuxRuntime")
          .catch(() => false);
        if (ready) break;
      }
      await pause(100);
    }
    assert(win);
    assert(await win.webContents.executeJavaScript("!!window.PokeMuxRuntime"));
    const result = await win.webContents.executeJavaScript(`(async()=>{
      const initial=await pokeAPI.loadCreds();
      const saved=await pokeAPI.saveCreds([{name:'Fixture',email:'fixture@example.invalid',senha:'test-only'}]);
      const loaded=await pokeAPI.loadCreds();
      const backup=await pokeAPI.saveBackup('config-test.json','{"test":true}','');
      const invalid=await pokeAPI.saveBackup('../escape.json','invalid','');
      const source=await pokeAPI.readRuntime();
      return {initial,saved,loaded,backup,invalid,source:source.includes('PokeMuxSession'),accounts:PokeMuxRuntime.state().accounts.length};
    })()`);
    assert.equal(result.accounts, 4);
    assert.equal(result.initial.length, 0);
    assert.equal(result.saved, true);
    assert.equal(result.loaded[0].name, "Fixture");
    assert.equal(result.loaded[0].senha, "test-only");
    assert(result.backup);
    assert(!result.invalid);
    assert(result.source);
    assert(
      !fs
        .readFileSync(path.join(directory, "accounts.enc"))
        .includes(Buffer.from("test-only")),
      "password never written as plaintext",
    );
    const untrusted = new BrowserWindow({
      show: false,
      webPreferences: {
        preload: path.resolve(__dirname, "../preload.js"),
        sandbox: true,
        contextIsolation: true,
      },
    });
    await untrusted.loadURL("about:blank");
    const denied = await untrusted.webContents.executeJavaScript(
      'pokeAPI.saveCreds([{email:"attacker",senha:"wrong"}])',
    );
    assert.equal(denied, false);
    assert.equal(
      await untrusted.webContents.executeJavaScript("pokeAPI.checkUpdate()"),
      false,
      "updates use the same exact-origin IPC guard",
    );
    console.log(
      "Independent main passed: actual boot, encrypted credential round trip, backup boundary and rejected untrusted IPC.",
    );
    app.exit(0);
  } catch (error) {
    console.error(error.stack);
    app.exit(1);
  }
});
setTimeout(() => {
  console.error("Main test timed out");
  app.exit(1);
}, 30000);
