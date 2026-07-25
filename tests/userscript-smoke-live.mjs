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
const userscriptSource = await readFile(
  resolve("userscript/Nexus-75-Optimizer.user.js"),
  "utf8"
);

const results = [];
for (const url of ["https://survev.io/", "https://resurviv.biz/"]) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 2
  });
  await context.addInitScript({
    content: `
      try {
        localStorage.setItem("nxo:nexus-chat-visit-count:v1", "4");
      } catch {}
      ${userscriptSource}
    `
  });
  const page = await context.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForSelector("#cvs", { timeout: 30000 });
    const panelConfiguredOpen = await page
      .locator("#nxo-userscript-root .panel")
      .evaluate((panel) => !panel.hidden);
    const promoVisible = await page.locator("#nxo-nexus-chat-promo").count() === 1;
    await page.waitForSelector("#nxo-userscript-root", {
      state: "attached",
      timeout: 10000
    });
    await page.locator("#nxo-nexus-chat-promo .close").click();
    const panelVisibleAfterPromo = await page
      .locator("#nxo-userscript-root .panel")
      .isVisible();
    await page.waitForTimeout(1200);
    results.push(await page.evaluate(({ panelConfiguredOpen, panelVisibleAfterPromo, promoVisible }) => {
      const canvas = document.querySelector("#cvs");
      const root = document.querySelector("#nxo-userscript-root");
      const config = JSON.parse(localStorage.getItem("surviv_config") || "{}");
      return {
        host: location.hostname,
        canvas: Boolean(canvas),
        canvasWidth: canvas?.width ?? 0,
        cssWidth: canvas?.clientWidth ?? 0,
        panelConfiguredOpen,
        panelVisibleAfterPromo,
        promoVisible,
        bilingualControl: Boolean(root?.shadowRoot?.querySelector("#language")),
        highResTex: config.highResTex,
        interpolation: config.interpolation,
        screenShake: config.screenShake,
        restoredDpr: window.devicePixelRatio
      };
    }, { panelConfiguredOpen, panelVisibleAfterPromo, promoVisible }));
  } catch (error) {
    results.push({ host: new URL(url).hostname, smokeError: error.message });
  }
  if (pageErrors.length) results.at(-1).pageErrors = pageErrors;
  await context.close();
}

await browser.close();
console.log(JSON.stringify(results, null, 2));
if (results.some((result) => (
  result.smokeError
  || !result.canvas
  || !result.panelConfiguredOpen
  || !result.panelVisibleAfterPromo
  || !result.promoVisible
  || !result.bilingualControl
  || result.highResTex !== false
  || result.interpolation !== true
  || result.screenShake !== false
  || result.restoredDpr !== 2
))) process.exitCode = 1;
