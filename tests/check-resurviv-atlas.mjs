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
for (const lowRes of [false, true]) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  if (lowRes) {
    await context.addInitScript(() => {
      if (window.top !== window.self || location.origin === "null") return;
      const config = JSON.parse(localStorage.getItem("surviv_config") || "{}");
      config.highResTex = false;
      localStorage.setItem("surviv_config", JSON.stringify(config));
    });
  }
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("https://resurviv.biz/", {
    waitUntil: "domcontentloaded",
    timeout: 60000
  });
  await page.waitForSelector("#cvs", { timeout: 30000 });
  await page.waitForTimeout(5000);

  results.push({
    lowRes,
    configuredHighRes: await page.evaluate(() =>
      JSON.parse(localStorage.getItem("surviv_config") || "{}").highResTex
    ),
    errors
  });
  await context.close();
}

await browser.close();
console.log(JSON.stringify(results, null, 2));
