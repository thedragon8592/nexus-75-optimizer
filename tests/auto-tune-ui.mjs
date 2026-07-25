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
  body: `<!doctype html><html><head></head><body>
    <div id="background"></div>
    <div id="start-menu-wrapper"><div id="start-overlay"></div></div>
    <div id="game-area-wrapper" style="display:none"></div>
  </body></html>`
}));
await page.goto("https://fixture.local/");
await page.addScriptTag({ path: resolve("extension/src/content.js") });

assert.equal(await page.locator("#nxo-extension-root").count(), 0);
await page.waitForTimeout(4600);

const result = await page.evaluate(() => ({
  uiCount: document.querySelectorAll("#nxo-extension-root").length,
  report: JSON.parse(localStorage.getItem("nxo:auto-tune:v1") || "null"),
  settings: JSON.parse(localStorage.getItem("nxo:settings:v1") || "null")
}));
assert.equal(result.uiCount, 0);
assert.ok(result.report?.measuredAt > 0);
assert.ok([60, 75].includes(result.report.displayHz));
assert.ok(["balanced", "performance"].includes(result.report.recommended));
assert.ok(result.settings.targetFps > 0 && result.settings.targetFps <= 75);
assert.equal(result.settings.autoTune, true);

await browser.close();
console.log(JSON.stringify(result, null, 2));
