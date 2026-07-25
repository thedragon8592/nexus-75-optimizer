import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
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
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 2
});
const userscriptSource = await readFile(
  resolve("userscript/Nexus-75-Optimizer.user.js"),
  "utf8"
);
await context.addInitScript({
  content: `
    try {
      if (sessionStorage.getItem("nxo:test-promo-seeded") !== "true") {
        localStorage.setItem("nxo:nexus-chat-visit-count:v1", "4");
        sessionStorage.setItem("nxo:test-promo-seeded", "true");
      }
    } catch {}
    ${userscriptSource}
  `
});
const page = await context.newPage();

await page.route("https://fixture.local/", (route) => route.fulfill({
  contentType: "text/html",
  body: `<!doctype html><html><head><title>Userscript fixture</title></head><body>
    <canvas id="cvs"></canvas>
    <div id="background"><video></video></div>
    <div id="start-menu-wrapper"><div id="start-overlay"></div></div>
    <div id="game-area-wrapper" style="display:none"></div>
  </body></html>`
}));
await page.goto("https://fixture.local/");

assert.equal(await page.locator("#nxo-userscript-root").count(), 1);
assert.equal(
  await page.locator("#nxo-userscript-root .panel").evaluate((panel) => panel.hidden),
  false
);
assert.equal(
  await page.locator("#nxo-userscript-root").evaluate((root) => root.hidden),
  true
);
assert.equal(await page.locator("#nxo-nexus-chat-promo").count(), 1);
assert.equal(
  await page.locator("#nxo-nexus-chat-promo .promo h2").textContent(),
  "The match ends.Your squad doesn't."
);

const early = await page.evaluate(() => ({
  dprBeforeCanvas: window.devicePixelRatio,
  config: JSON.parse(localStorage.getItem("surviv_config") || "{}")
}));
assert.equal(early.dprBeforeCanvas, 1);
assert.equal(early.config.highResTex, false);
await page.evaluate(() => document.querySelector("#cvs").getContext("2d"));
assert.equal(await page.evaluate(() => window.devicePixelRatio), 2);

assert.equal(await page.locator("#nxo-userscript-root [data-setting]").count(), 12);
assert.equal(await page.locator("#nxo-userscript-root details").getAttribute("open"), "");

await page.waitForTimeout(500);
await page.screenshot({
  path: "artifacts/nexus-chat-promo-preview.png",
  fullPage: true
});

await page.evaluate(() => {
  window.__nxoOpened = null;
  window.open = (url, target, features) => {
    window.__nxoOpened = { url, target, features };
    return null;
  };
});
await page.locator("#nxo-nexus-chat-promo .visit").click();
assert.deepEqual(await page.evaluate(() => window.__nxoOpened), {
  url: "https://wnexuschat.netlify.app/",
  target: "_blank",
  features: "noopener,noreferrer"
});
assert.equal(await page.locator("#nxo-nexus-chat-promo").count(), 0);
assert.equal(
  await page.evaluate(() => localStorage.getItem("nxo:nexus-chat-visit-count:v1")),
  "5"
);
assert.equal(
  await page.locator("#nxo-userscript-root").evaluate((root) => root.hidden),
  false
);
assert.equal(
  await page.locator("#nxo-userscript-root .section-title").first().textContent(),
  "Optimization mode"
);
await page.locator("#nxo-userscript-root #language").selectOption("es");
assert.equal(
  await page.locator("#nxo-userscript-root .section-title").first().textContent(),
  "Modo de optimización"
);
await page.keyboard.press("F8");
assert.equal(
  await page.locator("#nxo-userscript-root .panel").evaluate((panel) => panel.hidden),
  true
);
await page.keyboard.press("F8");
assert.equal(
  await page.locator("#nxo-userscript-root .panel").evaluate((panel) => panel.hidden),
  false
);

for (let opening = 1; opening <= 4; opening += 1) {
  await page.reload();
  assert.equal(await page.locator("#nxo-nexus-chat-promo").count(), 0);
  assert.equal(
    await page.evaluate(() => localStorage.getItem("nxo:nexus-chat-visit-count:v1")),
    String(opening)
  );
}
assert.equal(
  JSON.parse(await page.evaluate(() => localStorage.getItem("nxo:settings:v1"))).language,
  "es"
);

await page.setViewportSize({ width: 390, height: 844 });
await page.reload();
assert.equal(await page.locator("#nxo-nexus-chat-promo").count(), 1);
assert.equal(
  await page.locator("#nxo-nexus-chat-promo .promo h2").textContent(),
  "The match ends.Your squad doesn't."
);
assert.equal(
  await page.evaluate(() => localStorage.getItem("nxo:nexus-chat-visit-count:v1")),
  "5"
);
await page.waitForTimeout(500);
const mobileBox = await page.locator("#nxo-nexus-chat-promo .promo").boundingBox();
assert.ok(mobileBox);
assert.ok(mobileBox.x >= 0 && mobileBox.width <= 390);
assert.ok(mobileBox.y >= 0 && mobileBox.height <= 844);
await page.screenshot({
  path: "artifacts/nexus-chat-promo-mobile.png",
  fullPage: true
});

await browser.close();
console.log(JSON.stringify({
  optimizerLanguages: ["en", "es"],
  promoLanguage: "en",
  promoFrequency: 5,
  nexusChatUrl: "https://wnexuschat.netlify.app/",
  directDownload: false,
  dprRestored: true
}, null, 2));
