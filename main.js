"use strict";
const electron = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const https = require("node:https");
const { pathToFileURL } = require("node:url");
const {
  app,
  BrowserWindow,
  ipcMain,
  shell,
  session,
  safeStorage,
  Notification,
  Tray,
  Menu,
  powerSaveBlocker,
  webContents,
} = electron;
// Keep existing encrypted accounts and persistent game sessions after the visual rename.
if (app.getPath("userData") === path.join(app.getPath("appData"), app.getName())) {
  const profile = path.join(app.getPath("appData"), "pokemux");
  fs.mkdirSync(profile, { recursive: true });
  app.setPath("userData", profile);
  app.setPath("sessionData", profile);
}
app.setName("Quadrymon");
if (process.platform === "win32") app.setAppUserModelId("com.pokemux.desktop");
const GAME_ORIGIN = "https://poke.idleworld.online";
const home = () => app.getPath("userData");
const localFile = (name) => path.join(home(), name);
const appFile = (name) => path.join(__dirname, name);
let primary,
  overlay,
  tray,
  sleepBlocker,
  minimizeToTray = true,
  restoreMaximized = true;
const externalRequests = [];
const channels = new Map();
const gameAuth = require("./src/main/game-auth").createGameAuth(
  (id) => webContents.fromId(id),
  () => primary?.webContents.id,
);

function diagnostic(category, detail) {
  try {
    fs.mkdirSync(home(), { recursive: true });
    const file = localFile("relatorio-de-erros.log");
    if (fs.existsSync(file) && fs.statSync(file).size > 524288)
      fs.renameSync(file, localFile("relatorio-de-erros.antigo.log"));
    fs.appendFileSync(
      file,
      JSON.stringify({
        at: new Date().toISOString(),
        version: app.getVersion(),
        category: String(category).slice(0, 60),
        detail: String(detail).slice(0, 4000),
      }) + "\n",
    );
  } catch {}
}
function external(url) {
  try {
    const address = new URL(url);
    if (
      !["https:", "http:"].includes(address.protocol) ||
      address.username ||
      address.password
    )
      return;
    const threshold = Date.now() - 10000;
    while (externalRequests.length && externalRequests[0] < threshold)
      externalRequests.shift();
    if (externalRequests.length >= 3) return;
    externalRequests.push(Date.now());
    Promise.resolve(shell.openExternal(address.href)).catch((error) =>
      diagnostic("external", error.message),
    );
  } catch {}
}
function trusted(event) {
  const url = event?.senderFrame?.url;
  if (!url) return false;
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    parsed.search = "";
    return ["index.html", "overlay.html"].some(
      (file) => parsed.href === pathToFileURL(appFile(file)).href,
    );
  } catch {
    return false;
  }
}
function register(name, handler) {
  if (channels.has(name)) throw Error("Duplicate IPC: " + name);
  channels.set(name, handler);
  ipcMain.handle(name, (event, ...args) =>
    trusted(event) ? handler(event, ...args) : false,
  );
}
function accounts(value) {
  return (Array.isArray(value) ? value : []).slice(0, 4).map((row) => ({
    name: String(row?.name || "").slice(0, 40),
    email: String(row?.email || "").slice(0, 160),
    senha: String(row?.senha || "").slice(0, 512),
  }));
}
function atomic(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = file + ".tmp";
  fs.writeFileSync(temporary, data);
  fs.renameSync(temporary, file);
}
function loadAccounts() {
  const file = localFile("accounts.enc");
  if (!fs.existsSync(file) || !safeStorage.isEncryptionAvailable()) return [];
  try {
    if (fs.statSync(file).size > 1048576)
      throw Error("credential file too large");
    return accounts(
      JSON.parse(safeStorage.decryptString(fs.readFileSync(file))),
    );
  } catch {
    try {
      fs.copyFileSync(file, file + ".bak-" + Date.now());
    } catch {}
    diagnostic(
      "credentials",
      "Cannot decode local credentials; original preserved.",
    );
    return [];
  }
}
function saveAccounts(value) {
  if (!safeStorage.isEncryptionAvailable()) {
    diagnostic("credentials", "OS encryption unavailable");
    return false;
  }
  try {
    atomic(
      localFile("accounts.enc"),
      safeStorage.encryptString(JSON.stringify(accounts(value))),
    );
    return true;
  } catch {
    diagnostic("credentials", "Save failed");
    return false;
  }
}
function backup(name, contents, header = "") {
  if (
    typeof name !== "string" ||
    typeof contents !== "string" ||
    typeof header !== "string" ||
    !/^[a-z0-9_.-]{1,60}$/i.test(name) ||
    name === "." ||
    name === ".." ||
    Buffer.byteLength(contents + header) > 2000000
  )
    return false;
  const folder = localFile("backups"),
    destination = path.join(folder, name);
  if (path.dirname(destination) !== folder) return false;
  try {
    fs.mkdirSync(folder, { recursive: true });
    if (/\.(?:csv|log|txt)$/i.test(name) && fs.existsSync(destination))
      fs.appendFileSync(destination, contents);
    else atomic(destination, header + contents);
    const group = name.replace(/[0-9-]+\.[^.]+$/, "");
    const siblings = fs
      .readdirSync(folder)
      .filter((file) => file.startsWith(group) && !file.endsWith(".tmp"))
      .sort();
    for (const old of siblings.slice(0, Math.max(0, siblings.length - 12)))
      fs.unlinkSync(path.join(folder, old));
    return true;
  } catch {
    return false;
  }
}
const startupFile = () =>
  path.join(
    app.getPath("appData"),
    "Microsoft",
    "Windows",
    "Start Menu",
    "Programs",
    "Startup",
    "PokeMux.lnk",
  );
function autoStartEnabled() {
  return process.platform === "win32" && fs.existsSync(startupFile());
}
function autoStart(enabled) {
  if (process.platform !== "win32") return false;
  try {
    if (enabled)
      shell.writeShortcutLink(startupFile(), "create", {
        target: process.execPath,
        args: app.isPackaged ? "" : '"' + app.getAppPath() + '"',
        description: "Quadrymon",
        appUserModelId: "com.pokemux.desktop",
      });
    else if (fs.existsSync(startupFile())) fs.unlinkSync(startupFile());
  } catch (error) {
    diagnostic("startup", error.message);
  }
  return autoStartEnabled();
}
function webhook(url, text) {
  let address;
  try {
    address = new URL(url);
  } catch {
    return false;
  }
  if (
    address.protocol !== "https:" ||
    !["discord.com", "discordapp.com"].includes(address.hostname) ||
    !/^\/api\/webhooks\/\d+\/[^/]+$/.test(address.pathname)
  )
    return false;
  const content = String(text).slice(0, 1900);
  const users = [...content.matchAll(/<@(\d{5,20})>/g)]
    .slice(0, 5)
    .map((match) => match[1]);
  const body = JSON.stringify({
    content,
    allowed_mentions: { parse: [], users },
  });
  return new Promise((resolve) => {
    const request = https.request(
      address,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (response) => {
        response.resume();
        resolve(response.statusCode >= 200 && response.statusCode < 300);
      },
    );
    request.once("error", () => resolve(false));
    request.setTimeout(8000, () => {
      request.destroy();
      resolve(false);
    });
    request.end(body);
  });
}
const securePreferences = () => ({
  preload: appFile("preload.js"),
  sandbox: true,
  contextIsolation: true,
  nodeIntegration: false,
});
function restore() {
  if (!primary || primary.isDestroyed()) return;
  if (primary.isMinimized()) primary.restore();
  primary.show();
  if (restoreMaximized) primary.maximize();
  primary.focus();
}
function overlayToggle() {
  if (overlay && !overlay.isDestroyed()) {
    overlay.close();
    return false;
  }
  overlay = new BrowserWindow({
    width: 430,
    height: 310,
    minWidth: 340,
    minHeight: 190,
    alwaysOnTop: true,
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    webPreferences: securePreferences(),
  });
  overlay.loadFile(appFile("overlay.html"));
  overlay.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  overlay.webContents.on("will-navigate", (event) => event.preventDefault());
  overlay.on("closed", () => {
    overlay = null;
  });
  return true;
}
register("creds:load", loadAccounts);
register("creds:save", (_event, value) => saveAccounts(value));
register("backup:save", (_event, ...args) => backup(...args));
register("errlog:write", (_event, kind, text) => diagnostic(kind, text));
register("errlog:open", () => {
  try {
    if (!fs.existsSync(localFile("relatorio-de-erros.log")))
      atomic(localFile("relatorio-de-erros.log"), "");
    shell.showItemInFolder(localFile("relatorio-de-erros.log"));
  } catch {}
});
register("notify", (_event, title, body) => {
  if (Notification.isSupported())
    new Notification({
      title: String(title).slice(0, 120),
      body: String(body).slice(0, 2000),
    }).show();
});
register("awake:set", (_event, on) => {
  if (on && sleepBlocker == null)
    sleepBlocker = powerSaveBlocker.start("prevent-app-suspension");
  if (!on && sleepBlocker != null) {
    powerSaveBlocker.stop(sleepBlocker);
    sleepBlocker = null;
  }
  return sleepBlocker != null;
});
register("mintray:set", (_event, on) => (minimizeToTray = !!on));
register("autostart:get", () => ({
  on: autoStartEnabled(),
  suportado: process.platform === "win32",
}));
register("autostart:set", (_event, on) => autoStart(!!on));
register("webhook:send", (_event, url, text) => webhook(url, text));
register("iv-helper:read", () =>
  ["src/domain/iv-math.js", "src/game/iv-reader.js"]
    .map((file) => fs.readFileSync(appFile(file), "utf8"))
    .join("\n"),
);
register("game-runtime:read", () =>
  [
    "src/domain/pokemon-state.js",
    "src/game/session.js",
    "src/domain/iv-math.js",
    "src/game/iv-reader.js",
    "src/game/preferences.js",
  ]
    .map((file) => fs.readFileSync(appFile(file), "utf8"))
    .join("\n"),
);
register("game-runtime:hydrate", (event, id) =>
  gameAuth.hydrate(id, event.sender.id),
);
register("conta:limpar", async (_event, index) => {
  if (!Number.isInteger(index) || index < 0 || index > 3) return false;
  try {
    const target = session.fromPartition("persist:conta" + (index + 1));
    await target.clearStorageData();
    await target.clearCache();
    return true;
  } catch {
    return false;
  }
});
register("overlay:toggle", overlayToggle);
register("overlay:close", () => {
  overlay?.close();
  return true;
});
register("overlay:state", (_event, data) => {
  if (!overlay || overlay.isDestroyed()) return false;
  overlay.webContents.send("overlay:data", data);
  return true;
});
register("shiny:capture", async (_event, id, meta) => {
  const target = webContents.fromId(Number(id));
  try {
    if (
      !target ||
      target.isDestroyed() ||
      target.getType() !== "webview" ||
      new URL(target.getURL()).origin !== GAME_ORIGIN
    )
      return { ok: false };
    const image = await target.capturePage(),
      folder = localFile("shinies");
    fs.mkdirSync(folder, { recursive: true });
    const label = String(meta?.name || "shiny")
      .normalize("NFKD")
      .replace(/[^a-z0-9_-]/gi, "-")
      .slice(0, 40);
    const file = path.join(folder, Date.now() + "-" + label + ".png");
    fs.writeFileSync(file, image.toPNG());
    return { ok: true, file };
  } catch {
    return { ok: false };
  }
});
ipcMain.on("app:version", (event) => {
  event.returnValue = trusted(event) ? app.getVersion() : "";
});
const catalog = require("./src/main/game-catalog").createGameCatalog(home());
register("game-catalog:load", () => catalog.load());

app.commandLine.appendSwitch("log-level", "3");
app.on("web-contents-created", (_event, contents) => {
  if (contents.getType() !== "webview") return;
  const guestId = contents.id;
  contents.once("destroyed", () => gameAuth.forget(guestId));
  contents.setWindowOpenHandler(({ url }) => {
    external(url);
    return { action: "deny" };
  });
  const restrict = (event, url) => {
    try {
      if (url === "about:blank" || new URL(url).origin === GAME_ORIGIN) return;
    } catch {}
    event.preventDefault();
    external(url);
  };
  contents.on("will-navigate", restrict);
  contents.on("will-redirect", restrict);
  let stalled;
  contents.on("unresponsive", () => {
    clearTimeout(stalled);
    stalled = setTimeout(() => {
      if (!contents.isDestroyed()) contents.forcefullyCrashRenderer();
    }, 20000);
  });
  contents.on("responsive", () => clearTimeout(stalled));
  contents.on("destroyed", () => clearTimeout(stalled));
  contents.on("render-process-gone", (_event, reason) => {
    diagnostic("game", reason.reason);
    if (reason.reason !== "clean-exit")
      setTimeout(() => {
        if (!contents.isDestroyed()) contents.reload();
      }, 1500);
  });
  const hotkey = (key) => contents.hostWebContents?.send("hotkey", key);
  contents.on("before-input-event", (_event, input) => {
    if (
      input.type === "keyDown" &&
      input.key === "Escape" &&
      !input.isAutoRepeat
    )
      hotkey("collapse");
  });
  contents.on("context-menu", (_event, params) => {
    if (!params.isEditable) hotkey("ctx" + contents.id);
  });
});
process.on("uncaughtException", (error) => {
  diagnostic("uncaught", error.stack || error);
  restore();
});
process.on("unhandledRejection", (error) =>
  diagnostic("promise", error?.stack || error),
);
app.on("child-process-gone", (_event, info) => {
  if (info.reason !== "clean-exit") diagnostic(info.type, info.reason);
});
app.on("second-instance", restore);
app.on("window-all-closed", () => app.quit());
function openWindow() {
  app.setAppUserModelId("com.pokemux.desktop");
  for (let index = 1; index <= 4; index++) {
    const partition = session.fromPartition("persist:conta" + index);
    partition.setPermissionRequestHandler((_contents, _permission, respond) =>
      respond(false),
    );
    partition.webRequest.onBeforeSendHeaders(
      { urls: [GAME_ORIGIN + "/api/*"] },
      (details, callback) => {
        gameAuth.observe(details);
        callback({ requestHeaders: details.requestHeaders });
      },
    );
  }
  primary = new BrowserWindow({
    width: 1600,
    height: 900,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: "#0b1220",
    icon: appFile(process.platform === "win32" ? "quadrymon-icon.ico" : "quadrymon-icon.png"),
    webPreferences: {
      ...securePreferences(),
      webviewTag: true,
      backgroundThrottling: false,
    },
  });
  primary.webContents.on(
    "will-attach-webview",
    (event, preferences, params) => {
      try {
        if (
          params.src !== "about:blank" &&
          new URL(params.src).origin !== GAME_ORIGIN
        ) {
          event.preventDefault();
          return;
        }
      } catch {
        event.preventDefault();
        return;
      }
      delete preferences.preload;
      preferences.nodeIntegration = false;
      preferences.contextIsolation = true;
      preferences.sandbox = true;
    },
  );
  primary.webContents.on("will-navigate", (event) => event.preventDefault());
  primary.webContents.setWindowOpenHandler(({ url }) => {
    external(url);
    return { action: "deny" };
  });
  primary.on("maximize", () => {
    restoreMaximized = true;
  });
  primary.on("unmaximize", () => {
    restoreMaximized = false;
  });
  primary.on("minimize", () => {
    if (minimizeToTray && tray) primary.hide();
  });
  primary.once("ready-to-show", () => {
    if (!process.argv.includes("--hidden")) restore();
  });
  setTimeout(() => {
    if (
      primary &&
      !primary.isDestroyed() &&
      !primary.isVisible() &&
      !process.argv.includes("--hidden")
    )
      restore();
  }, 8000);
  primary.loadFile(appFile("index.html"));
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      {
        label: "Quadrymon",
        submenu: [
          ...[0, 1, 2, 3].map((index) => ({
            label: "Conta " + (index + 1),
            accelerator: "CmdOrCtrl+" + (index + 1),
            click: () => primary.webContents.send("hotkey", "expand" + index),
          })),
          {
            label: "Mudo",
            accelerator: "CmdOrCtrl+M",
            click: () => primary.webContents.send("hotkey", "mute"),
          },
        ],
      },
    ]),
  );
  setTimeout(() => {
    try {
      tray = new Tray(appFile("tray.png"));
      tray.setToolTip("Quadrymon");
      tray.setContextMenu(
        Menu.buildFromTemplate([
          { label: "Mostrar", click: restore },
          { label: "Sair", click: () => app.quit() },
        ]),
      );
      tray.on("click", restore);
    } catch (error) {
      diagnostic("tray", error.message);
      if (process.argv.includes("--hidden")) restore();
    }
    try {
      if (autoStartEnabled()) autoStart(true);
    } catch {}
  }, 1500);
  void catalog.load();
  try {
    const updates = require("./src/main/update-manager").createUpdateManager({
      app,
      ipcMain: { handle: (channel, handler) => register(channel, handler) },
      getWindow: () => primary,
      log: diagnostic,
    });
    if (updates.supported) setTimeout(() => updates.checkAutomatic(), 8000);
  } catch (error) {
    diagnostic("update", error.message);
  }
}
if (app.requestSingleInstanceLock())
  app
    .whenReady()
    .then(openWindow)
    .catch((error) => {
      diagnostic("startup", error.stack || error);
      restore();
    });
else app.quit();
