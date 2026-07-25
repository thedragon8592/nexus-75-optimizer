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

const results = [];
for (const url of ["https://survev.io/", "https://resurviv.biz/"]) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 2
  });
  await context.addInitScript({ path: resolve("extension/src/early-main.js") });
  await context.addInitScript({ path: resolve("extension/src/content.js") });
  const page = await context.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForSelector("#cvs", { timeout: 30000 });
    const lazyUi = await page.locator("#nxo-extension-root").count() === 0;
    await page.keyboard.press("F8");
    await page.waitForSelector("#nxo-extension-root", {
      state: "attached",
      timeout: 30000
    });
    await page.waitForTimeout(2500);

    results.push(
      await page.evaluate((lazyUi) => {
        const canvas = document.querySelector("#cvs");
        const root = document.querySelector("#nxo-extension-root");
        const config = JSON.parse(localStorage.getItem("surviv_config") || "{}");
        return {
          host: location.hostname,
          title: document.title,
          canvas: Boolean(canvas),
          canvasWidth: canvas?.width ?? 0,
          cssWidth: canvas?.clientWidth ?? 0,
          optimizerUi: Boolean(root?.shadowRoot),
          lazyUi,
          highResTex: config.highResTex,
          interpolation: config.interpolation,
          screenShake: config.screenShake,
          restoredDpr: window.devicePixelRatio
        };
      }, lazyUi)
    );
  } catch (error) {
    results.push({ host: new URL(url).hostname, smokeError: error.message });
  }

  if (pageErrors.length) results.at(-1).pageErrors = pageErrors;
  await context.close();
}

await browser.close();
console.log(JSON.stringify(results, null, 2));
