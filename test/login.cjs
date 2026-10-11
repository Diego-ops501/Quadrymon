"use strict";
const { app, BrowserWindow, session } = require("electron");
const assert = require("node:assert/strict");
const login = require("../src/game/login");
const path = require("node:path"), os = require("node:os");
app.setPath("userData", path.join(os.tmpdir(), "quadrymon-login-test-" + process.pid));
const html = `<!doctype html><html><body><script>
window.attempts=0;window.changes=0;
function mount(){
 const form=document.createElement('form');form.className='auth-card';
 form.innerHTML='<input placeholder="Email or username" autocomplete="username"><input type="password" autocomplete="current-password"><button type="button" aria-label="Show password">eye</button><button disabled aria-label="Log in">Log in</button>';
 document.body.append(form);
 form.addEventListener('input',()=>{window.changes++;setTimeout(()=>{form.querySelector('[aria-label="Log in"]').disabled=![...form.querySelectorAll('input')].every(x=>x.value)},100)});
 form.addEventListener('submit',event=>{event.preventDefault();window.attempts++});
}
setTimeout(mount,300);
</script></body></html>`;
const windows = [];
app.whenReady().then(async () => {
  try {
    await session.defaultSession.protocol.handle("https", () => new Response(html, { headers: { "content-type": "text/html" } }));
    for (let i = 0; i < 4; i++) {
      const win = new BrowserWindow({ show: false, webPreferences: { sandbox: true, contextIsolation: true } });
      windows.push(win);
      await win.loadURL("https://poke.idleworld.online/login");
    }
    const identifiers = ["azuosd2", "fixture@example.invalid", "azuosd1", "azuosphp"];
    const results = await Promise.all(windows.map((win, i) => win.webContents.executeJavaScript(login.source(identifiers[i], "fixture-only-" + i))));
    assert.deepEqual(results, ["filled", "filled", "filled", "filled"]);
    for (let i = 0; i < 4; i++) {
      const state = await windows[i].webContents.executeJavaScript('({values:[...document.querySelectorAll("input")].map(x=>x.value),attempts:window.attempts,changes:window.changes})');
      assert.deepEqual(state.values, [identifiers[i], "fixture-only-" + i]);
      assert.equal(state.attempts, 0, "automatic filling must not submit without the account button");
      assert.equal(state.changes, 2);
    }
    assert.deepEqual(await Promise.all(windows.map((win, i) => win.webContents.executeJavaScript(login.source(identifiers[i], "fixture-only-" + i, true)))), ["submitted", "submitted", "submitted", "submitted"]);
    for (const win of windows) assert.equal(await win.webContents.executeJavaScript("window.attempts"), 1);
    await windows[0].webContents.executeJavaScript(`document.querySelector('form').insertAdjacentHTML('beforeend','<input type="hidden" name="cf-turnstile-response" value="">')`);
    assert.equal(await windows[0].webContents.executeJavaScript(login.source("fixture", "fixture-only", true)), "challenge");
    assert.equal(await windows[0].webContents.executeJavaScript("window.attempts"), 1);
    await windows[0].loadURL("https://example.invalid/login");
    assert.equal(await windows[0].webContents.executeJavaScript(login.source("fixture", "fixture-only", true)), "wrong-page");
    await windows[0].loadURL("https://poke.idleworld.online/reset-password");
    assert.equal(await windows[0].webContents.executeJavaScript(login.source("fixture", "fixture-only", true)), "wrong-page");
    console.log("Login: delayed game form, four isolated accounts, username/email, input events, submission and CAPTCHA/origin/route guards passed.");
    app.exit(0);
  } catch (error) { console.error(error.stack); app.exit(1); }
});
setTimeout(() => { console.error("Login test timed out"); app.exit(1); }, 30000);
