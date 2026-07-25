import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const source = await readFile(
  new URL("../extension/src/background.js", import.meta.url),
  "utf8"
);

const loadBackground = (initial = []) => {
  let listener;
  let enabled = [...initial];
  const updates = [];
  const chrome = {
    runtime: {
      onMessage: {
        addListener(callback) {
          listener = callback;
        }
      }
    },
    declarativeNetRequest: {
      getEnabledRulesets: async () => [...enabled],
      updateEnabledRulesets: async (change) => {
        updates.push(change);
        enabled = enabled
          .filter((id) => !change.disableRulesetIds.includes(id))
          .concat(change.enableRulesetIds);
      }
    }
  };
  vm.runInContext(source, vm.createContext({ chrome }), {
    filename: "background.js"
  });
  return { listener, updates, enabled: () => enabled };
};

const send = (listener, message) => new Promise((resolve) => {
  const keepOpen = listener(message, {}, resolve);
  assert.equal(keepOpen, true);
});

test("enables only the ruleset for the requesting game", async () => {
  const background = loadBackground();
  const response = await send(background.listener, {
    type: "nxo:set-network-quiet",
    host: "play.survev.io",
    enabled: true
  });
  assert.equal(response.ok, true);
  assert.deepEqual(background.enabled(), ["lean_survev"]);
  assert.deepEqual(JSON.parse(JSON.stringify(background.updates[0])), {
    enableRulesetIds: ["lean_survev"],
    disableRulesetIds: []
  });
});

test("disables a previously enabled site ruleset", async () => {
  const background = loadBackground(["lean_resurviv"]);
  const response = await send(background.listener, {
    type: "nxo:set-network-quiet",
    host: "resurviv.biz",
    enabled: false
  });
  assert.equal(response.ok, true);
  assert.deepEqual(background.enabled(), []);
});
