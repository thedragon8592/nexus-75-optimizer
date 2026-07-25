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

await page.setContent(`
  <!doctype html>
  <html>
    <head><title>Optimizer UI fixture</title></head>
    <body style="margin:0;background:#173b27;color:white;font-family:system-ui">
      <canvas id="cvs" style="position:fixed;inset:0;width:100%;height:100%;background:linear-gradient(135deg,#315f3c,#183223)"></canvas>
      <div id="background"></div>
      <div id="start-menu-wrapper"><div id="start-overlay"></div></div>
      <div id="game-area-wrapper" style="display:block"></div>
    </body>
  </html>
`);
await page.addScriptTag({ path: resolve("extension/src/content.js") });
await page.keyboard.press("F8");
await page.waitForTimeout(1400);
await page.screenshot({ path: "artifacts/ui-preview.png", fullPage: true });
await browser.close();
