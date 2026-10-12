"use strict";
const fs = require("node:fs"),
  path = require("node:path"),
  { spawnSync } = require("node:child_process");
const root = path.resolve(__dirname, "..");
const tests = [
  "display-name.test.js",
  "health-alerts.test.js",
  "shiny-history.test.js",
  "game-auth.test.js",
  "independent-domain.test.js",
  "independent-model.test.js",
  "independent-recommendations.test.js",
  "capture-filters.test.js",
  "hunt-measurements.test.js",
  "market-price-page.test.js",
  "market-snapshot.test.js",
  "global-market.test.js",
  "market-alerts.test.js",
  "market-comparison.test.js",
  "workspace.test.js",
  "inventory.test.js",
  "summary.test.js",
  "market-travel.test.js",
  "game-catalog.test.js",
];
const browser = [
  "game-preferences.cjs",
  "rich-panels.cjs",
  "iv-native-market.cjs",
  "login.cjs",
  "independent-game.cjs",
  "independent-main.cjs",
  "independent-workspace.cjs",
  "market-evolutions.cjs",
  "market-cold-start.cjs",
  "market-refresh.cjs",
  "inventory.cjs",
];
const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;
let count = 0;
function run(binary, file) {
  if (!fs.existsSync(path.join(root, "test", file)))
    throw Error("Missing test: " + file);
  const result = spawnSync(binary, [path.join(root, "test", file)], {
    cwd: root,
    env,
    stdio: "inherit",
    windowsHide: true,
    timeout: 90000,
  });
  if (result.status !== 0)
    throw Error(file + " failed: " + (result.error?.message || result.status));
  count++;
}
try {
  for (const file of tests) run(process.execPath, file);
  for (const file of browser) run(require("electron"), file);
  console.log(count + " suites passed for the independent runtime.");
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
