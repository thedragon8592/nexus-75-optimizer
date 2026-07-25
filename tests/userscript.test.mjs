import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(
  new URL("../userscript/Nexus-75-Optimizer.user.js", import.meta.url),
  "utf8"
);

test("Tampermonkey metadata targets both games at document-start", () => {
  assert.match(source, /@version\s+1\.3\.0/);
  assert.match(source, /@match\s+https:\/\/survev\.io\/\*/);
  assert.match(source, /@match\s+https:\/\/resurviv\.biz\/\*/);
  assert.match(source, /@run-at\s+document-start/);
  assert.match(source, /@inject-into\s+page/);
  assert.match(source, /@grant\s+none/);
  assert.match(source, /@description:es\s+Optimización segura y medible/);
  assert.match(source, /@supportURL\s+https:\/\/discord\.gg\/rDJhfCTDqR/);
  assert.match(source, /@license\s+MIT/);
  assert.match(source, /@antifeature\s+ads/);
  assert.doesNotMatch(source, /@updateURL|@downloadURL/);
});

test("userscript keeps a bilingual optimizer and an English-only website promotion", () => {
  assert.match(source, /const NEXUS_CHAT_URL = "https:\/\/wnexuschat\.netlify\.app\/"/);
  assert.doesNotMatch(source, /NEXUS_CHAT_DOWNLOAD_URL/);
  assert.doesNotMatch(source, /NexusChatExtension-v3\.7\.0\.zip/);
  assert.match(source, /en:\s*\{/);
  assert.match(source, /es:\s*\{/);
  assert.match(source, /The match ends\./);
  assert.doesNotMatch(source, /La partida termina\./);
  assert.match(source, /PROMO_VISIT_KEY/);
  assert.match(source, /PROMO_DISABLED_KEY/);
  assert.match(source, /const PROMO_INTERVAL = 5/);
  assert.match(source, /const text = TEXT\.en/);
  assert.match(source, /Don't show again/);
});

test("userscript does not hook gameplay networking", () => {
  assert.doesNotMatch(source, /WebSocket\.prototype/);
  assert.doesNotMatch(source, /XMLHttpRequest\.prototype/);
  assert.doesNotMatch(source, /chrome\.runtime/);
  assert.doesNotMatch(source, /setTimeout\s*\(\s*1\s*\)/);
  assert.doesNotMatch(source, /\beval\s*\(|new Function\s*\(/);
});

test("v1.3 community tools stay local and portable", () => {
  assert.match(source, /Community Hub/);
  assert.match(source, /Centro de comunidad/);
  assert.match(source, /NX75-/);
  assert.match(source, /profileCodeFor/);
  assert.match(source, /parseProfileCode/);
  assert.match(source, /Copy performance result/);
  assert.match(source, /Copy diagnostics/);
  assert.match(source, /GREASY_FORK_FEEDBACK_URL/);
  assert.match(source, /Manual releases only/);
});
