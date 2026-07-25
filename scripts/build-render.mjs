import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = resolve(root, "userscript", "Nexus-75-Optimizer.user.js");
const outputDir = resolve(root, "dist");
const outputPath = resolve(outputDir, "Nexus-75-Optimizer.user.js");

const source = await readFile(sourcePath, "utf8");
const version = source.match(/^\/\/ @version\s+([^\s]+)$/m)?.[1];
if (!version) throw new Error("Userscript metadata version was not found.");

const sha256 = createHash("sha256").update(source).digest("hex");
const versionInfo = {
  name: "Nexus 75 Optimizer",
  version,
  file: "/Nexus-75-Optimizer.user.js",
  sha256,
  generatedAt: new Date().toISOString()
};

const index = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Official Nexus 75 Optimizer release endpoint.">
  <title>Nexus 75 Optimizer ${version}</title>
  <style>
    :root { color-scheme: dark; font-family: Inter, system-ui, sans-serif; }
    body { min-height: 100vh; margin: 0; display: grid; place-items: center; color: #eaf8ff; background: radial-gradient(circle at 20% 10%, #0b6d9944, transparent 38%), radial-gradient(circle at 85% 85%, #7448d944, transparent 40%), #030811; }
    main { width: min(680px, calc(100% - 40px)); padding: 38px; border: 1px solid #47cfff66; border-radius: 24px; background: #081522ee; box-shadow: 0 30px 100px #000a; }
    small { color: #54dfff; font-weight: 800; letter-spacing: .12em; }
    h1 { margin: 12px 0 10px; font-size: clamp(34px, 7vw, 58px); letter-spacing: -.045em; }
    p { color: #9fb5c4; line-height: 1.65; }
    .actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 28px; }
    a { padding: 13px 17px; border-radius: 11px; color: #05131b; background: linear-gradient(135deg, #52e5ff, #8b91ff); font-weight: 850; text-decoration: none; }
    a.secondary { color: #ccefff; background: #102333; border: 1px solid #31566b; }
    code { color: #b8efff; }
  </style>
</head>
<body>
  <main>
    <small>OFFICIAL RELEASE ENDPOINT</small>
    <h1>Nexus 75 Optimizer</h1>
    <p>Safe, measurable optimization for Survev.io and Resurviv.biz. Current userscript version: <strong>${version}</strong>.</p>
    <p>SHA-256: <code>${sha256}</code></p>
    <div class="actions">
      <a href="/Nexus-75-Optimizer.user.js">Install or update</a>
      <a class="secondary" href="https://wnexuschat.netlify.app/">Explore Nexus Chat</a>
    </div>
  </main>
</body>
</html>`;

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });
await writeFile(outputPath, source, "utf8");
await writeFile(
  resolve(outputDir, "version.json"),
  `${JSON.stringify(versionInfo, null, 2)}\n`,
  "utf8"
);
await writeFile(resolve(outputDir, "index.html"), index, "utf8");

console.log(JSON.stringify(versionInfo, null, 2));
