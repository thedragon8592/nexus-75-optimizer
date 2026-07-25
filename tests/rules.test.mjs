import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readRules = async (name) => JSON.parse(await readFile(
  new URL(`../extension/rules/${name}`, import.meta.url),
  "utf8"
));

test("lean rules never target game, matchmaking, ping-test or challenge hosts", async () => {
  const files = ["lean-survev.json", "lean-resurviv.json"];
  const blocked = new Set();
  for (const file of files) {
    for (const rule of await readRules(file)) {
      for (const domain of rule.condition.requestDomains) blocked.add(domain);
    }
  }

  for (const essential of [
    "survev.io",
    "resurviv.biz",
    "api.survev.io",
    "mathsiscoolfun.com",
    "challenges.cloudflare.com",
    "fundingchoicesmessages.google.com",
    "fonts.gstatic.com",
    "fonts.googleapis.com"
  ]) {
    assert.ok(!blocked.has(essential), `${essential} must remain reachable`);
  }

  assert.ok(blocked.has("nitropay.com"));
  assert.ok(blocked.has("googlesyndication.com"));
  assert.ok(blocked.has("doubleclick.net"));
});
