"use strict";
const ORIGIN = "https://poke.idleworld.online";

function createGameAuth(getContents, getOwner) {
  const tokens = new Map();
  const owned = (id) => {
    if (!Number.isSafeInteger(Number(id)) || Number(id) <= 0) return null;
    const target = getContents(Number(id));
    if (
      !target ||
      target.isDestroyed() ||
      target.getType() !== "webview" ||
      target.hostWebContents?.id !== getOwner()
    )
      return null;
    return target;
  };
  function observe(details) {
    let address;
    try {
      address = new URL(details.url);
    } catch {
      return;
    }
    if (
      address.origin !== ORIGIN ||
      !address.pathname.startsWith("/api/") ||
      !owned(details.webContentsId)
    )
      return;
    const name = Object.keys(details.requestHeaders || {}).find(
      (key) => key.toLowerCase() === "authorization",
    );
    const value = name && details.requestHeaders[name];
    if (
      typeof value === "string" &&
      value.length <= 8192 &&
      !/[\r\n]/.test(value)
    )
      tokens.set(Number(details.webContentsId), value);
  }
  async function hydrate(id, senderId) {
    const target = owned(id),
      token = tokens.get(Number(id));
    if (!target || senderId !== getOwner() || !token) return false;
    let address;
    try {
      address = new URL(target.getURL());
    } catch {
      return false;
    }
    if (address.origin !== ORIGIN || address.pathname !== "/play") return false;
    return target.executeJavaScript(
      "(()=>{if(!window.__poke||window.__poke.runtimeVersion!==2)return false;window.__poke.auth=" +
        JSON.stringify(token) +
        ";void window.PokeMuxSession?.refresh?.();return true;})()",
    );
  }
  return { observe, hydrate, forget: (id) => tokens.delete(Number(id)) };
}
module.exports = { createGameAuth };
