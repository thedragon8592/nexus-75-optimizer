import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const modules = process.env.CODEX_NODE_MODULES;
if (!modules) throw new Error("CODEX_NODE_MODULES is required");

const { chromium } = require(resolve(modules, "playwright"));
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROMIUM_EXECUTABLE
});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

await page.route("https://fixture.local/", (route) => route.fulfill({
  contentType: "text/html",
  body: `
  <!doctype html>
  <html>
    <head><title>Competitive mode fixture</title></head>
    <body>
      <canvas id="cvs"></canvas>
      <div id="background"></div>
      <div id="start-menu-wrapper"><div id="start-overlay"></div></div>
      <div id="game-area-wrapper" style="display:none"></div>
    </body>
  </html>
`
}));
await page.goto("https://fixture.local/");
await page.evaluate(() => {
  localStorage.setItem("nxo:settings:v1", JSON.stringify({
    enabled: true,
    preset: "competitive",
    competitiveMode: true,
    lowResTextures: true,
    renderAt1x: true,
    keepInterpolation: true,
    disableScreenShake: true,
    muteAudio: false,
    reduceLobbyMotion: true,
    quietGameplay: true,
    showMonitor: false,
    autoTune: false
  }));
});
await page.addScriptTag({ path: resolve("extension/src/content.js") });

assert.equal(await page.locator("#nxo-extension-root").count(), 0);
await page.keyboard.press("F8");

const initial = await page.evaluate(() => {
  const root = document.querySelector("#nxo-extension-root").shadowRoot;
  return {
    presetCount: root.querySelectorAll("[data-preset]").length,
    competitiveActive: root.querySelector('[data-preset="competitive"]').classList.contains("active"),
    panelHidden: root.querySelector(".panel").hidden,
    competitiveFlag: document.documentElement.dataset.nxoCompetitive
  };
});
assert.deepEqual(initial, {
  presetCount: 6,
  competitiveActive: true,
  panelHidden: false,
  competitiveFlag: "true"
});

await page.evaluate(() => {
  document.querySelector("#game-area-wrapper").style.display = "block";
});
await page.waitForTimeout(50);
const dormant = await page.evaluate(() => {
  const root = document.querySelector("#nxo-extension-root").shadowRoot;
  return {
    panelHidden: root.querySelector(".panel").hidden,
    launcherHidden: root.querySelector(".launcher").hidden
  };
});
assert.deepEqual(dormant, { panelHidden: true, launcherHidden: true });

await page.keyboard.press("F8");
await page.mouse.click(100, 100);
await page.waitForTimeout(2100);
const metric = await page.evaluate(() => {
  const root = document.querySelector("#nxo-extension-root").shadowRoot;
  return {
    label: root.querySelector("#aux-label").textContent,
    value: root.querySelector("#aux").textContent,
    panelHidden: root.querySelector(".panel").hidden
  };
});
assert.equal(metric.label, "input→frame p95");
assert.match(metric.value, /^\d+\.\d ms$/);
assert.equal(metric.panelHidden, false);

await browser.close();
console.log(JSON.stringify({ initial, dormant, metric }, null, 2));
