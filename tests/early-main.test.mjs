import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const source = await readFile(
  new URL("../extension/src/early-main.js", import.meta.url),
  "utf8"
);

class StorageMock {
  #values = new Map();

  constructor(seed = {}) {
    for (const [key, value] of Object.entries(seed)) this.setItem(key, value);
  }

  getItem(key) {
    return this.#values.has(key) ? this.#values.get(key) : null;
  }

  setItem(key, value) {
    this.#values.set(key, String(value));
  }

  removeItem(key) {
    this.#values.delete(key);
  }
}

function runEarly({ settings, gameConfig, baseline, regionLease, dpr = 2 } = {}) {
  const seed = {};
  if (settings) seed["nxo:settings:v1"] = JSON.stringify(settings);
  if (gameConfig) seed.surviv_config = JSON.stringify(gameConfig);
  if (baseline) seed["nxo:baseline:v1"] = JSON.stringify(baseline);
  if (regionLease) seed["nxo:region-lease:v1"] = JSON.stringify(regionLease);

  const localStorage = new StorageMock(seed);
  const messages = [];
  const listeners = new Map();
  class HTMLCanvasElementMock {
    constructor(id = "") {
      this.id = id;
    }

    getContext() {
      return { kind: "mock-context" };
    }
  }
  const window = {
    devicePixelRatio: dpr,
    addEventListener(type, callback) {
      listeners.set(type, callback);
    },
    postMessage(message, targetOrigin) {
      messages.push({ message, targetOrigin });
    },
    setTimeout() {
      return 1;
    }
  };
  const document = {
    readyState: "complete",
    addEventListener() {}
  };

  const context = vm.createContext({
    window,
    document,
    localStorage,
    location: { origin: "https://survev.io" },
    HTMLCanvasElement: HTMLCanvasElementMock,
    navigator: {
      connection: {
        type: "wifi",
        effectiveType: "4g",
        addEventListener() {}
      }
    },
    console
  });
  vm.runInContext(source, context, { filename: "early-main.js" });

  return {
    window,
    listeners,
    messages,
    createCanvas: (id = "cvs") => new HTMLCanvasElementMock(id),
    gameConfig: JSON.parse(localStorage.getItem("surviv_config")),
    baseline: JSON.parse(localStorage.getItem("nxo:baseline:v1"))
  };
}

test("balanced defaults apply only confirmed game settings", () => {
  const result = runEarly({
    gameConfig: {
      highResTex: true,
      interpolation: false,
      screenShake: true,
      muteAudio: false,
      playerName: "Player"
    }
  });

  assert.equal(result.gameConfig.highResTex, false);
  assert.equal(result.gameConfig.interpolation, true);
  assert.equal(result.gameConfig.screenShake, false);
  assert.equal(result.gameConfig.muteAudio, false);
  assert.equal(result.gameConfig.playerName, "Player");
  assert.equal(result.window.devicePixelRatio, 1);
  assert.equal(result.messages[0].message.applied.renderAt1x, true);
  assert.deepEqual(result.createCanvas().getContext("webgl"), {
    kind: "mock-context"
  });
  assert.equal(result.window.devicePixelRatio, 2);
});

test("disabled optimizer restores captured baseline", () => {
  const baseline = {
    capturedAt: "2026-07-18T00:00:00.000Z",
    values: {
      highResTex: true,
      interpolation: false,
      screenShake: true,
      muteAudio: false
    }
  };
  const result = runEarly({
    settings: { enabled: false, renderAt1x: false },
    gameConfig: {
      highResTex: false,
      interpolation: true,
      screenShake: false,
      muteAudio: true
    },
    baseline
  });

  assert.deepEqual(result.gameConfig, {
    ...baseline.values,
    regionSelected: false
  });
  assert.equal(result.window.devicePixelRatio, 2);
});

test("native DPR is restored immediately after Pixi startup window", () => {
  const result = runEarly({ gameConfig: {}, dpr: 2.5 });
  assert.equal(result.window.devicePixelRatio, 1);
  result.createCanvas().getContext("webgl");
  assert.equal(result.window.devicePixelRatio, 2.5);
  assert.equal(result.messages.at(-1).message.nativeDpr, 2.5);
});

test("region lock only activates when a saved region exists", () => {
  const locked = runEarly({
    settings: { lockSelectedRegion: true, renderAt1x: false },
    gameConfig: { region: "sa", regionSelected: false }
  });
  assert.equal(locked.gameConfig.regionSelected, true);
  assert.equal(locked.messages.at(-1).message.applied.regionLocked, true);

  const fresh = runEarly({
    settings: { lockSelectedRegion: true, renderAt1x: false },
    gameConfig: {}
  });
  assert.equal(fresh.gameConfig.regionSelected, undefined);
});

test("smart region reuses only a valid lease for the current network", () => {
  const lease = {
    region: "sa",
    networkFingerprint: "wifi|4g",
    expiresAt: Date.now() + 60_000
  };
  const locked = runEarly({
    settings: { smartRegion: true, renderAt1x: false },
    gameConfig: { region: "sa", regionSelected: false },
    regionLease: lease
  });
  assert.equal(locked.gameConfig.regionSelected, true);
  assert.equal(locked.messages.at(-1).message.applied.regionMode, "smart-locked");

  const expired = runEarly({
    settings: { smartRegion: true, renderAt1x: false },
    gameConfig: { region: "sa", regionSelected: true },
    regionLease: { ...lease, expiresAt: Date.now() - 1 }
  });
  assert.equal(expired.gameConfig.regionSelected, false);
  assert.equal(expired.messages.at(-1).message.applied.regionMode, "smart-probe");
});
