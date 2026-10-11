"use strict";
const { app, BrowserWindow, session } = require("electron");
const fs = require("node:fs"),
  path = require("node:path"),
  os = require("node:os"),
  assert = require("node:assert/strict");
app.setPath(
  "userData",
  path.join(os.tmpdir(), "pokemux-game-fixture-" + process.pid),
);
const fixture = `<!doctype html><html><head></head><body><div id="root"><div id="fixture"></div></div><script>
class FixtureSocket extends EventTarget { constructor(){super();this.readyState=1;this.sent=[];}send(text){this.sent.push(JSON.parse(text));}receive(data){this.dispatchEvent(new MessageEvent('message',{data:JSON.stringify(data)}));}}
window.WebSocket=FixtureSocket;window.fixtureSocket=new WebSocket();document.getElementById('fixture').__reactFiber$fixture={memoizedState:{memoizedState:{current:fixtureSocket}}};
</script></body></html>`;
app.whenReady().then(async () => {
  session.defaultSession.protocol.handle("https", (request) => {
    const url = new URL(request.url);
    if (url.origin !== "https://poke.idleworld.online")
      return new Response("", { status: 403 });
    if (url.pathname === "/play")
      return new Response(fixture, {
        headers: { "Content-Type": "text/html" },
      });
    const data =
      url.pathname === "/api/characters/me"
        ? { character: { id: "fixture-account", name: "Fixture", level: 569 } }
        : url.pathname === "/game/items.json"
          ? { items: [] }
          : { events: [] };
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
  });
  const win = new BrowserWindow({
    show: false,
    webPreferences: { sandbox: true, contextIsolation: true },
  });
  try {
    await win.loadURL("https://poke.idleworld.online/play");
    const source = [
      "src/domain/pokemon-state.js",
      "src/game/session.js",
      "src/domain/iv-math.js",
      "src/game/iv-reader.js",
      "src/game/preferences.js",
    ]
      .map((file) =>
        fs.readFileSync(path.resolve(__dirname, "..", file), "utf8"),
      )
      .join("\n");
    await win.webContents.executeJavaScript(source);
    await new Promise((resolve) => setTimeout(resolve, 100));
    const result = await win.webContents.executeJavaScript(`(()=>{
      fixtureSocket.receive({type:'pokes',list:[{id:'leader',name:'Pupitar',team:true,leader:true,level:15,hp:202,maxHp:312,quality:1.33,ivTotal:176,stats:{atk:23,def:25,spAtk:24,spDef:25}}]});
      fixtureSocket.receive({type:'field-init',slug:'abra'});fixtureSocket.receive({type:'field-kill',xpGained:102,xpParts:{base:68,vip:34}});
      fixtureSocket.receive({type:'analyzer',seconds:300,kills:20,xpGained:2040,balance:100,lootGold:100,capturesGold:0,supplyGold:0});
      const before=PokeMuxSession.snapshot(__poke);__poke.analyzerBase={...__poke.ws.analyzer};
      fixtureSocket.receive({type:'analyzer',seconds:360,kills:25,xpGained:2550,balance:150,lootGold:150,capturesGold:0,supplyGold:0});
      const after=PokeMuxSession.snapshot(__poke);return {connected:__poke.sock===fixtureSocket,before,after,sent:fixtureSocket.sent};
    })()`);
    assert(
      result.connected,
      "discover an existing native socket through mounted component state",
    );
    assert(result.before.live);
    assert.equal(result.before.xpMultiplier, 1.5);
    assert.equal(result.before.a.xph, 24480);
    assert.equal(result.after.a.seconds, 60);
    assert.equal(result.after.a.kills, 5);
    assert.equal(result.after.a.xph, 30600);
    assert.equal(result.after.a.gph, 3000);
    assert.equal(result.before.team[0].stats.spa, 24);
    assert(result.sent.some((command) => command.type === "pokes-get"));
    assert(
      !result.sent.some((command) => /hunt|catch|sell/.test(command.type)),
      "observation never starts gameplay actions",
    );
    console.log(
      "Game adapter fixture: existing socket discovery, official XP parts, hourly rates and reset baselines passed.",
    );
    app.exit(0);
  } catch (error) {
    console.error(error.stack);
    app.exit(1);
  }
});
setTimeout(() => app.exit(1), 20000);
