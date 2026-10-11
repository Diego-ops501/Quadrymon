"use strict";
const assert = require("node:assert/strict"),
  vm = require("node:vm");
const { createGameAuth } = require("../src/main/game-auth");
const pages = new Map(),
  states = new Map();
for (const id of [1, 2]) {
  const state = {
    __poke: { runtimeVersion: 2 },
    PokeMuxSession: { refresh() {} },
  };
  states.set(id, state);
  pages.set(id, {
    id,
    hostWebContents: { id: 10 },
    isDestroyed: () => false,
    getType: () => "webview",
    getURL: () => "https://poke.idleworld.online/play",
    executeJavaScript: async (source) =>
      vm.runInNewContext(source, { window: state }),
  });
}
const auth = createGameAuth(
  (id) => pages.get(id),
  () => 10,
);
const request = (id, url, token) => ({
  webContentsId: id,
  url,
  requestHeaders: { Authorization: token },
});
(async () => {
  auth.observe(
    request(
      1,
      "https://poke.idleworld.online/api/characters/me",
      "Bearer fixture-one",
    ),
  );
  auth.observe(
    request(
      2,
      "https://poke.idleworld.online/api/characters/me",
      "Bearer fixture-two",
    ),
  );
  assert.equal(await auth.hydrate(1, 10), true);
  assert.equal(states.get(1).__poke.auth, "Bearer fixture-one");
  assert.equal(
    states.get(2).__poke.auth,
    undefined,
    "account tokens never cross partitions",
  );
  assert.equal(
    await auth.hydrate(2, 99),
    false,
    "an unrelated sender cannot bootstrap a guest",
  );
  auth.observe(
    request(1, "https://example.invalid/api/characters/me", "Bearer wrong"),
  );
  await auth.hydrate(1, 10);
  assert.equal(states.get(1).__poke.auth, "Bearer fixture-one");
  pages.get(1).getURL = () => "https://example.invalid/play";
  assert.equal(
    await auth.hydrate(1, 10),
    false,
    "navigation invalidates hydration",
  );
  auth.forget(2);
  assert.equal(
    await auth.hydrate(2, 10),
    false,
    "destroyed guest credentials are forgotten",
  );
  console.log(
    "Game auth: native request capture, account isolation, sender/origin guards and memory cleanup passed.",
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
