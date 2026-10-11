"use strict";
const { contextBridge, ipcRenderer } = require("electron");
const calls = {
  loadCreds: "creds:load",
  saveCreds: "creds:save",
  loadGameCatalog: "game-catalog:load",
  hydrateGame: "game-runtime:hydrate",
  setAwake: "awake:set",
  setMinToTray: "mintray:set",
  webhook: "webhook:send",
  getAutoStart: "autostart:get",
  setAutoStart: "autostart:set",
  notify: "notify",
  readIvHelper: "iv-helper:read",
  logError: "errlog:write",
  openErrorLog: "errlog:open",
  saveBackup: "backup:save",
  clearAccount: "conta:limpar",
  toggleOverlay: "overlay:toggle",
  sendOverlayState: "overlay:state",
  closeOverlay: "overlay:close",
  captureShiny: "shiny:capture",
  checkUpdate: "update:check",
  downloadUpdate: "update:download",
  installUpdate: "update:install",
};
const subscriptions = {
  onAutoStart: "autostart",
  onHotkey: "hotkey",
  onOverlayData: "overlay:data",
  onUpdateStatus: "update:status",
};
const bridge = {};
bridge.readRuntime = () => ipcRenderer.invoke("game-runtime:read");
for (const [method, channel] of Object.entries(calls))
  bridge[method] = (...args) => ipcRenderer.invoke(channel, ...args);
for (const [method, channel] of Object.entries(subscriptions))
  bridge[method] = (callback) => {
    if (typeof callback !== "function")
      throw TypeError("Expected event callback");
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on(channel, listener);
    return () => ipcRenderer.removeListener(channel, listener);
  };
try {
  bridge.appVersion = ipcRenderer.sendSync("app:version");
} catch {
  bridge.appVersion = "";
}
contextBridge.exposeInMainWorld("pokeAPI", Object.freeze(bridge));
