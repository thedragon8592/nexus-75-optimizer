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

const reports = [];
for (const url of ["https://survev.io/", "https://resurviv.biz/"]) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    serviceWorkers: "block"
  });
  const page = await context.newPage();
  const domains = new Map();
  const pageErrors = [];

  page.on("request", (request) => {
    let host;
    try {
      host = new URL(request.url()).hostname;
    } catch {
      return;
    }
    const item = domains.get(host) || { count: 0, types: {} };
    item.count += 1;
    item.types[request.resourceType()] = (item.types[request.resourceType()] || 0) + 1;
    domains.set(host, item);
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(10000);
  const passiveNetwork = await page.evaluate(() => {
    const navigation = performance.getEntriesByType("navigation")[0];
    const connection = navigator.connection;
    return {
      navigationConnectMs: navigation
        ? Math.max(0, navigation.connectEnd - navigation.connectStart)
        : null,
      navigationTtfbMs: navigation
        ? Math.max(0, navigation.responseStart - navigation.requestStart)
        : null,
      effectiveType: connection?.effectiveType ?? null,
      estimatedRttMs: connection?.rtt ?? null,
      downlinkMbps: connection?.downlink ?? null
    };
  });

  reports.push({
    host: new URL(url).hostname,
    passiveNetwork,
    domains: [...domains.entries()]
      .map(([host, data]) => ({ host, ...data }))
      .sort((a, b) => b.count - a.count),
    pageErrors
  });
  await context.close();
}

await browser.close();
console.log(JSON.stringify(reports, null, 2));
