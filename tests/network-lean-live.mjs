import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const modules = process.env.CODEX_NODE_MODULES;
if (!modules) throw new Error("CODEX_NODE_MODULES is required");

const { chromium } = require(resolve(modules, "playwright"));
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROMIUM_EXECUTABLE
});

const cases = [
  ["https://survev.io/", "lean-survev.json"],
  ["https://resurviv.biz/", "lean-resurviv.json"]
];
const reports = [];

for (const [url, rulesFile] of cases) {
  const rules = JSON.parse(await readFile(
    new URL(`../extension/rules/${rulesFile}`, import.meta.url),
    "utf8"
  ));
  const blockedDomains = rules.flatMap((rule) => rule.condition.requestDomains);
  const blocked = new Map();
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.route("**/*", async (route) => {
    let host;
    try {
      host = new URL(route.request().url()).hostname;
    } catch {
      return route.continue();
    }
    const matched = blockedDomains.find(
      (domain) => host === domain || host.endsWith(`.${domain}`)
    );
    if (!matched) return route.continue();
    blocked.set(host, (blocked.get(host) || 0) + 1);
    return route.abort("blockedbyclient");
  });

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector("#cvs", { timeout: 30000 });
  await page.waitForTimeout(5000);
  reports.push({
    host: new URL(url).hostname,
    canvas: await page.locator("#cvs").isVisible(),
    blockedRequests: [...blocked.values()].reduce((sum, count) => sum + count, 0),
    blockedHosts: Object.fromEntries(blocked),
    pageErrors
  });
  await context.close();
}

await browser.close();
console.log(JSON.stringify(reports, null, 2));
if (reports.some((report) => !report.canvas || report.blockedRequests === 0)) {
  process.exitCode = 1;
}
