(() => {
  "use strict";

  if (window.top !== window.self) return;

  const SETTINGS_KEY = "nxo:settings:v1";
  const BASELINE_KEY = "nxo:baseline:v1";
  const GAME_CONFIG_KEY = "surviv_config";
  const AUTO_TUNE_KEY = "nxo:auto-tune:v1";

  const DEFAULTS = {
    enabled: true,
    preset: "balanced",
    targetFps: 75,
    lowResTextures: true,
    renderAt1x: true,
    keepInterpolation: true,
    disableScreenShake: true,
    muteAudio: false,
    reduceLobbyMotion: true,
    quietGameplay: true,
    competitiveMode: false,
    lockSelectedRegion: false,
    smartRegion: true,
    regionLeaseHours: 72,
    autoTune: true,
    blockThirdParty: false,
    sleepMonitorInGame: true,
    showMonitor: false
  };

  const PRESETS = {
    quality: {
      enabled: true,
      competitiveMode: false,
      lockSelectedRegion: false,
      smartRegion: true,
      autoTune: true,
      blockThirdParty: false,
      sleepMonitorInGame: true,
      lowResTextures: false,
      renderAt1x: false,
      keepInterpolation: true,
      disableScreenShake: false,
      muteAudio: false,
      reduceLobbyMotion: true,
      quietGameplay: false
    },
    balanced: {
      enabled: true,
      competitiveMode: false,
      lockSelectedRegion: false,
      smartRegion: true,
      autoTune: true,
      blockThirdParty: false,
      sleepMonitorInGame: true,
      lowResTextures: true,
      renderAt1x: true,
      keepInterpolation: true,
      disableScreenShake: true,
      muteAudio: false,
      reduceLobbyMotion: true,
      quietGameplay: true
    },
    performance: {
      enabled: true,
      competitiveMode: false,
      lockSelectedRegion: false,
      smartRegion: true,
      autoTune: true,
      blockThirdParty: false,
      sleepMonitorInGame: true,
      lowResTextures: true,
      renderAt1x: true,
      keepInterpolation: true,
      disableScreenShake: true,
      muteAudio: false,
      reduceLobbyMotion: true,
      quietGameplay: true
    },
    competitive: {
      enabled: true,
      competitiveMode: true,
      lockSelectedRegion: false,
      smartRegion: true,
      autoTune: true,
      blockThirdParty: false,
      sleepMonitorInGame: true,
      lowResTextures: true,
      renderAt1x: true,
      keepInterpolation: true,
      disableScreenShake: true,
      muteAudio: false,
      reduceLobbyMotion: true,
      quietGameplay: true,
      showMonitor: false
    },
    extreme: {
      enabled: true,
      competitiveMode: false,
      lockSelectedRegion: false,
      smartRegion: true,
      autoTune: true,
      blockThirdParty: false,
      sleepMonitorInGame: true,
      lowResTextures: true,
      renderAt1x: true,
      keepInterpolation: false,
      disableScreenShake: true,
      muteAudio: true,
      reduceLobbyMotion: true,
      quietGameplay: true
    },
    original: {
      enabled: false,
      competitiveMode: false,
      lockSelectedRegion: false,
      smartRegion: false,
      autoTune: false,
      blockThirdParty: false,
      sleepMonitorInGame: false,
      lowResTextures: false,
      renderAt1x: false,
      keepInterpolation: true,
      disableScreenShake: false,
      muteAudio: false,
      reduceLobbyMotion: false,
      quietGameplay: false
    }
  };

  const readJson = (key, fallback) => {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "null");
      return value && typeof value === "object" ? value : fallback;
    } catch {
      return fallback;
    }
  };

  let saved = { ...DEFAULTS, ...readJson(SETTINGS_KEY, {}) };
  let draft = { ...saved };
  let earlyDiagnostics = null;
  const deviceSignature = [
    navigator.hardwareConcurrency || 0,
    navigator.deviceMemory || 0,
    `${screen.width}x${screen.height}`,
    window.devicePixelRatio || 1
  ].join("|");
  let autoTuneReport = readJson(AUTO_TUNE_KEY, null);
  let autoTunePending = Boolean(
    saved.enabled
    && saved.autoTune
    && (
      !autoTuneReport
      || autoTuneReport.deviceSignature !== deviceSignature
      || Date.now() - Number(autoTuneReport.measuredAt || 0) > 7 * 24 * 60 * 60 * 1000
    )
  );
  let autoTuneTimer = 0;

  window.addEventListener("message", (event) => {
    if (
      event.source === window &&
      event.origin === location.origin &&
      event.data?.source === "nxo:early"
    ) {
      earlyDiagnostics = event.data;
      renderDiagnostics();
    }
  });

  const PAGE_STYLE = `
    html[data-nxo-motion="reduced"] #start-menu-wrapper *,
    html[data-nxo-motion="reduced"] #background,
    html[data-nxo-motion="reduced"] #start-overlay {
      animation-duration: 0.001ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.001ms !important;
      scroll-behavior: auto !important;
    }

    html[data-nxo-playing="true"][data-nxo-quiet="true"] #background,
    html[data-nxo-playing="true"][data-nxo-quiet="true"] #start-overlay,
    html[data-nxo-playing="true"][data-nxo-quiet="true"] .ad-block-header,
    html[data-nxo-playing="true"][data-nxo-quiet="true"] .ad-block-left-center,
    html[data-nxo-playing="true"][data-nxo-quiet="true"] .ad-block-right-center,
    html[data-nxo-playing="true"][data-nxo-quiet="true"] .ad-block-leaderboard-bottom,
    html[data-nxo-playing="true"][data-nxo-quiet="true"] #ad-rail-left,
    html[data-nxo-playing="true"][data-nxo-quiet="true"] #ad-rail-right {
      content-visibility: hidden !important;
      visibility: hidden !important;
    }
  `;

  const applyPageFlags = () => {
    const root = document.documentElement;
    if (!root) return;
    root.dataset.nxoMotion = saved.enabled && saved.reduceLobbyMotion
      ? "reduced"
      : "normal";
    root.dataset.nxoQuiet = saved.enabled && saved.quietGameplay ? "true" : "false";
    root.dataset.nxoCompetitive = saved.enabled && saved.competitiveMode
      ? "true"
      : "false";
  };

  const pauseLobbyMedia = () => {
    document.querySelectorAll(
      "#background video, #start-menu-wrapper video, #start-overlay video"
    ).forEach((video) => {
      if (!video.paused) video.pause();
    });
  };

  let currentPlaying = false;
  const detectPlaying = () => {
    const game = document.getElementById("game-area-wrapper");
    const playing = Boolean(game && getComputedStyle(game).display !== "none");
    document.documentElement.dataset.nxoPlaying = String(playing);
    if (playing && !currentPlaying) pauseLobbyMedia();
    if (playing && !currentPlaying && saved.enabled && saved.competitiveMode && panel) {
      togglePanel(false);
    }
    currentPlaying = playing;
    if (panel) syncMetricCollection();
    scheduleAutoTune();
  };

  const installPageStyle = () => {
    if (!document.getElementById("nxo-page-style")) {
      const style = document.createElement("style");
      style.id = "nxo-page-style";
      style.textContent = PAGE_STYLE;
      (document.head || document.documentElement).appendChild(style);
    }
    applyPageFlags();
    detectPlaying();

    const game = document.getElementById("game-area-wrapper");
    if (game) {
      new MutationObserver(detectPlaying).observe(game, {
        attributes: true,
        attributeFilter: ["class", "style"]
      });
    }
  };

  const metrics = {
    frames: [],
    fps: 0,
    onePercentLow: 0,
    p95: 0,
    longTasks: 0,
    longTaskMs: 0,
    peakFps: 0,
    inputToFrame: []
  };

  let frameRequest = 0;
  let metricsTimer = 0;
  let longTaskObserver = null;
  let metricsActive = false;

  const frameSample = (now) => {
    metrics.frames.push(now);
    const cutoff = now - 5000;
    while (metrics.frames.length && metrics.frames[0] < cutoff) {
      metrics.frames.shift();
    }
    frameRequest = requestAnimationFrame(frameSample);
  };

  const startLongTaskObserver = () => {
    try {
      longTaskObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        metrics.longTasks += 1;
        metrics.longTaskMs += entry.duration;
      }
      });
      longTaskObserver.observe({ entryTypes: ["longtask"] });
    } catch {
      longTaskObserver = null;
    }
  };

  const percentile = (values, fraction) => {
    if (!values.length) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.min(sorted.length - 1, Math.ceil(sorted.length * fraction) - 1);
    return sorted[Math.max(0, index)];
  };

  const updateMetrics = () => {
    const now = performance.now();
    const recent = metrics.frames.filter((time) => time >= now - 1000);
    metrics.fps = recent.length;
    metrics.peakFps = Math.max(metrics.peakFps, metrics.fps);

    const intervals = [];
    for (let i = 1; i < metrics.frames.length; i += 1) {
      intervals.push(metrics.frames[i] - metrics.frames[i - 1]);
    }
    metrics.p95 = percentile(intervals, 0.95);
    const p99 = percentile(intervals, 0.99);
    metrics.onePercentLow = p99 > 0 ? 1000 / p99 : 0;
    renderMetrics();
  };

  const sampleCompetitiveInput = (event) => {
    if (!metricsActive || !saved.enabled || !saved.competitiveMode) return;
    if (event.type === "keydown" && (event.repeat || event.key === "F8")) return;
    const inputAt = performance.now();
    requestAnimationFrame((frameAt) => {
      metrics.inputToFrame.push(Math.max(0, frameAt - inputAt));
      if (metrics.inputToFrame.length > 120) metrics.inputToFrame.shift();
    });
  };

  const finishAutoTune = () => {
    autoTuneTimer = 0;
    if (!autoTunePending || currentPlaying || !metricsActive) return;
    updateMetrics();

    const intervals = [];
    for (let i = 1; i < metrics.frames.length; i += 1) {
      const interval = metrics.frames[i] - metrics.frames[i - 1];
      if (interval > 0 && interval < 100) intervals.push(interval);
    }
    const medianInterval = percentile(intervals, 0.5);
    const rawRefresh = medianInterval ? 1000 / medianInterval : metrics.peakFps;
    const refreshRates = [60, 75, 90, 120, 144, 165, 240];
    const displayHz = refreshRates.reduce((best, rate) => (
      Math.abs(rate - rawRefresh) < Math.abs(best - rawRefresh) ? rate : best
    ), 60);
    const effectiveTarget = Math.min(75, displayHz);
    const frameBudget = 1000 / Math.max(1, effectiveTarget);
    const stressed = metrics.p95 > frameBudget * 1.2
      || (metrics.onePercentLow > 0 && metrics.onePercentLow < effectiveTarget * 0.8)
      || metrics.longTasks > 0
      || (navigator.deviceMemory && navigator.deviceMemory <= 4)
      || navigator.hardwareConcurrency <= 4;
    const recommended = stressed ? "performance" : "balanced";
    const canAutoSelect = ["balanced", "performance"].includes(saved.preset);

    autoTuneReport = {
      measuredAt: Date.now(),
      deviceSignature,
      displayHz,
      fps: metrics.fps,
      onePercentLow: Number(metrics.onePercentLow.toFixed(1)),
      p95: Number(metrics.p95.toFixed(2)),
      longTasks: metrics.longTasks,
      recommended
    };
    autoTunePending = false;
    saved = {
      ...saved,
      ...(canAutoSelect ? PRESETS[recommended] : {}),
      preset: canAutoSelect ? recommended : saved.preset,
      targetFps: effectiveTarget,
      autoTune: true
    };
    draft = { ...saved };
    try {
      localStorage.setItem(AUTO_TUNE_KEY, JSON.stringify(autoTuneReport));
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(saved));
    } catch {
      // Calibration remains valid for this page even without persistence.
    }
    applyPageFlags();
    renderDraft();
    renderDiagnostics();
    syncMetricCollection();
  };

  const scheduleAutoTune = () => {
    clearTimeout(autoTuneTimer);
    autoTuneTimer = 0;
    if (!autoTunePending || currentPlaying) return;
    autoTuneTimer = window.setTimeout(finishAutoTune, 4000);
  };

  let shadow;
  let panel;
  let launcher;

  const shouldCollectMetrics = () => Boolean(
    (panel && !panel.hidden)
    || (autoTunePending && !currentPlaying)
  );

  const startMetricCollection = () => {
    if (metricsActive) return;
    metricsActive = true;
    metrics.frames.length = 0;
    frameRequest = requestAnimationFrame(frameSample);
    startLongTaskObserver();
    metricsTimer = window.setInterval(
      updateMetrics,
      saved.enabled && saved.competitiveMode ? 2000 : 1000
    );
    if (saved.enabled && saved.competitiveMode && panel && !panel.hidden) {
      document.addEventListener("pointerdown", sampleCompetitiveInput, true);
      document.addEventListener("keydown", sampleCompetitiveInput, true);
    }
  };

  const stopMetricCollection = () => {
    if (!metricsActive) return;
    metricsActive = false;
    cancelAnimationFrame(frameRequest);
    frameRequest = 0;
    clearInterval(metricsTimer);
    metricsTimer = 0;
    longTaskObserver?.disconnect();
    longTaskObserver = null;
    document.removeEventListener("pointerdown", sampleCompetitiveInput, true);
    document.removeEventListener("keydown", sampleCompetitiveInput, true);
  };

  const syncMetricCollection = () => {
    const shouldCollect = shouldCollectMetrics();
    if (shouldCollect) startMetricCollection();
    else stopMetricCollection();
    if (launcher) {
      launcher.hidden = Boolean(
        currentPlaying
        && saved.enabled
        && saved.sleepMonitorInGame
        && panel?.hidden
      );
      if (!shouldCollect) launcher.textContent = "N·ECO";
    }
  };

  const UI_STYLE = `
    :host { all: initial; }
    * { box-sizing: border-box; }
    button, input { font: inherit; }
    .launcher {
      position: fixed; right: 16px; top: 16px; z-index: 2147483647;
      width: 54px; height: 34px; border: 1px solid #36e8ff;
      border-radius: 9px; color: #dffcff; background: #071018;
      box-shadow: 0 0 0 1px #091f2b, 0 5px 20px #0009;
      font: 800 12px/1 system-ui, sans-serif; letter-spacing: .08em;
      cursor: pointer;
    }
    .launcher[data-health="good"] { border-color: #56f3a7; color: #56f3a7; }
    .launcher[data-health="warn"] { border-color: #ffcc66; color: #ffcc66; }
    .launcher[hidden] { display: none; }
    .panel {
      position: fixed; z-index: 2147483646; right: 16px; top: 58px;
      width: min(390px, calc(100vw - 24px)); max-height: calc(100vh - 74px);
      overflow: auto; color: #dcecf5; background: #071018;
      border: 1px solid #1e6073; border-radius: 14px;
      box-shadow: 0 18px 60px #000c; font: 13px/1.4 system-ui, sans-serif;
    }
    .panel[hidden] { display: none; }
    .header { padding: 16px; border-bottom: 1px solid #153642; background: #091721; }
    .eyebrow { color: #36e8ff; font-size: 10px; font-weight: 800; letter-spacing: .18em; }
    h1 { margin: 4px 0 0; color: #f4fbff; font-size: 18px; line-height: 1.1; }
    .site { margin-top: 5px; color: #7795a3; font-size: 11px; }
    .body { padding: 14px; }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 7px; }
    .stat { min-width: 0; padding: 9px 6px; border: 1px solid #173b49; border-radius: 9px; background: #0a1720; text-align: center; }
    .stat b { display: block; color: #fff; font-size: 15px; }
    .stat span { color: #7693a1; font-size: 9px; text-transform: uppercase; letter-spacing: .08em; }
    .status { margin: 9px 0 14px; padding: 8px 10px; border-left: 2px solid #36e8ff; color: #99b8c5; background: #0a1720; font-size: 11px; }
    .section-title { margin: 14px 0 7px; color: #7d9daa; font-size: 10px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
    .presets { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px; }
    .preset { min-width: 0; padding: 8px 3px; border: 1px solid #214653; border-radius: 8px; color: #94afba; background: #0a1720; font-size: 9px; cursor: pointer; }
    .preset.active { border-color: #36e8ff; color: #e7fcff; background: #0d2631; }
    .option { display: grid; grid-template-columns: 1fr auto; gap: 6px 12px; padding: 10px 0; border-bottom: 1px solid #102c37; }
    .option:last-child { border-bottom: 0; }
    .option strong { color: #e6f4fa; font-size: 12px; }
    .option small { display: block; grid-column: 1; color: #78939e; font-size: 10px; }
    .switch { grid-column: 2; grid-row: 1 / span 2; align-self: center; position: relative; width: 38px; height: 22px; }
    .switch input { position: absolute; opacity: 0; pointer-events: none; }
    .track { position: absolute; inset: 0; border: 1px solid #31515d; border-radius: 999px; background: #111f26; cursor: pointer; }
    .track::after { content: ""; position: absolute; width: 14px; height: 14px; left: 3px; top: 3px; border-radius: 50%; background: #718b95; }
    input:checked + .track { border-color: #26cbe0; background: #0c3a46; }
    input:checked + .track::after { left: 19px; background: #55edff; }
    .actions { display: grid; grid-template-columns: 1fr auto auto; gap: 8px; margin-top: 14px; }
    .apply, .tune, .restore { border-radius: 9px; padding: 10px 12px; cursor: pointer; }
    .apply { border: 1px solid #36e8ff; color: #041217; background: #36e8ff; font-weight: 800; }
    .tune { border: 1px solid #24798b; color: #9ceeff; background: #0a2029; }
    .restore { border: 1px solid #314d58; color: #9bb0b8; background: #0a1720; }
    .diagnostics { margin-top: 10px; color: #688691; font: 10px/1.5 ui-monospace, SFMono-Regular, Consolas, monospace; }
    .note { margin-top: 10px; color: #718c97; font-size: 10px; }
    @media (max-width: 520px) { .panel { right: 6px; top: 50px; } .launcher { right: 6px; top: 8px; } }
  `;

  const OPTION_DEFS = [
    ["lowResTextures", "Texturas ligeras", "Usa los atlas low que ya incluye el juego. Reduce VRAM y carga; requiere recarga."],
    ["renderAt1x", "Render 1x en HiDPI", "Frente al 2x del juego dibuja hasta 4 veces menos píxeles. Mayor ganancia GPU; requiere recarga."],
    ["keepInterpolation", "Movimiento interpolado", "Recomendado. Apagarlo ahorra algo de CPU, pero el movimiento puede verse brusco."],
    ["disableScreenShake", "Sin sacudida de cámara", "Evita cálculos y movimiento visual no esencial; impacto pequeño."],
    ["reduceLobbyMotion", "Lobby sin animaciones", "Reduce transiciones y animaciones CSS del menú; no toca el HUD de partida."],
    ["quietGameplay", "Lobby en reposo al jugar", "Oculta composición del fondo y anuncios del lobby solo durante la partida."],
    ["competitiveMode", "Modo competitivo limpio", "Mantiene audio e interpolación, duerme el panel al entrar en partida y mide entrada a siguiente frame. No altera red ni mecánicas."],
    ["sleepMonitorInGame", "Monitor dormido en partida", "Detiene el RAF, observer, intervalos y muestreo del optimizador mientras el panel está cerrado."],
    ["autoTune", "Auto-tuner de lobby", "Calibra durante 4 segundos fuera de partida, elige Balance/FPS y luego se apaga por 7 días. Nunca calibra jugando."],
    ["smartRegion", "Región inteligente (72 h)", "Reutiliza la región oficial elegida por el juego y la renueva al caducar o cambiar de red. No genera pings extra."],
    ["lockSelectedRegion", "Fijar región elegida", "Usa regionSelected del juego para probar solo la región guardada. Reduce conexiones de arranque; una región incorrecta puede subir el ping."],
    ["blockThirdParty", "Red ligera de terceros", "Bloquea publicidad y analytics observados, nunca matchmaking, /play, /ptc ni Cloudflare. Puede desactivar anuncios con recompensa; requiere recarga."],
    ["muteAudio", "Audio desactivado", "Ahorro extremo y opcional. El sonido aporta información; no se activa fuera de Extremo."]
  ];

  const togglePanel = (force) => {
    if (!panel) {
      if (force === false) return;
      buildUi(true);
      return;
    }
    const shouldOpen = force ?? panel.hidden;
    panel.hidden = !shouldOpen;
    syncMetricCollection();
  };

  const syncNetworkRules = (settings = saved) => {
    const sendMessage = globalThis.chrome?.runtime?.sendMessage;
    if (typeof sendMessage !== "function") return Promise.resolve(null);
    try {
      return Promise.resolve(sendMessage.call(globalThis.chrome.runtime, {
        type: "nxo:set-network-quiet",
        host: location.hostname,
        enabled: Boolean(settings.enabled && settings.blockThirdParty)
      })).catch(() => null);
    } catch {
      return Promise.resolve(null);
    }
  };

  const createOption = ([key, title, description]) => {
    const row = document.createElement("label");
    row.className = "option";
    row.innerHTML = `
      <strong>${title}</strong>
      <small>${description}</small>
      <span class="switch">
        <input type="checkbox" data-setting="${key}">
        <span class="track"></span>
      </span>
    `;
    const input = row.querySelector("input");
    input.checked = Boolean(draft[key]);
    input.addEventListener("change", () => {
      draft[key] = input.checked;
      draft.preset = "custom";
      renderDraft();
    });
    return row;
  };

  const renderDraft = () => {
    if (!shadow) return;
    shadow.querySelectorAll("[data-setting]").forEach((input) => {
      input.checked = Boolean(draft[input.dataset.setting]);
    });
    shadow.querySelectorAll("[data-preset]").forEach((button) => {
      button.classList.toggle("active", button.dataset.preset === draft.preset);
    });
  };

  const renderDiagnostics = () => {
    if (!shadow) return;
    const target = shadow.getElementById("diagnostics");
    if (!target) return;
    const parts = [];
    if (earlyDiagnostics) {
      const applied = earlyDiagnostics.applied;
      const regionMode = {
        manual: "manual",
        "smart-locked": "lease activa",
        "smart-probe": "medición oficial",
        automatic: "automática"
      }[applied.regionMode] || "automática";
      parts.push(
        `DPR nativo: ${earlyDiagnostics.nativeDpr}`,
        `Texturas low: ${applied.lowResTextures ? "sí" : "no"}`,
        `Render 1x: ${applied.renderAt1x ? "sí" : "no"}`,
        `Interpolación: ${applied.interpolation ? "sí" : "no"}`,
        `Región: ${regionMode}`
      );
    } else {
      parts.push("Diagnóstico de arranque pendiente");
    }
    if (autoTuneReport) {
      parts.push(`Auto: ${autoTuneReport.recommended} · ${autoTuneReport.displayHz} Hz`);
    } else if (autoTunePending) {
      parts.push("Auto: calibrando en lobby");
    } else {
      parts.push(`Auto: ${saved.autoTune ? "al día" : "apagado"}`);
    }
    parts.push(`Terceros: ${saved.enabled && saved.blockThirdParty ? "bloqueados" : "normales"}`);
    target.textContent = parts.join("  ·  ");
  };

  const renderMetrics = () => {
    if (!shadow) return;
    const set = (id, value) => {
      const element = shadow.getElementById(id);
      if (element) element.textContent = value;
    };
    set("fps", String(metrics.fps));
    set("low", metrics.onePercentLow ? metrics.onePercentLow.toFixed(0) : "—");
    set("p95", metrics.p95 ? `${metrics.p95.toFixed(1)} ms` : "—");
    const inputP95 = percentile(metrics.inputToFrame, 0.95);
    set("aux", saved.competitiveMode
      ? (inputP95 ? `${inputP95.toFixed(1)} ms` : "—")
      : String(metrics.longTasks));
    set("aux-label", saved.competitiveMode ? "input→frame p95" : "long tasks");

    const effectiveTarget = saved.targetFps || 75;
    const healthy = metrics.fps >= effectiveTarget * 0.94;
    const probable60Hz = metrics.peakFps >= 55 && metrics.peakFps <= 65;
    const status = shadow.getElementById("status");
    const passiveRtt = Number(navigator.connection?.rtt) || 0;
    const networkHint = passiveRtt
      ? ` · RTT estimado ${passiveRtt} ms (no es ping del juego)`
      : "";
    if (status) {
      status.textContent = saved.enabled && saved.competitiveMode
        ? `Competitivo limpio · objetivo ${effectiveTarget} · panel en reposo al jugar${networkHint}.`
        : healthy
        ? `Objetivo ${effectiveTarget}: estable.`
        : probable60Hz
          ? "El refresco parece cercano a 60 Hz; 75 FPS visibles no son posibles en este monitor."
          : `Objetivo ${effectiveTarget}: midiendo. Prioriza estabilidad y p95 bajo.`;
    }
    if (launcher) {
      launcher.dataset.health = healthy ? "good" : "warn";
      launcher.textContent = metrics.fps ? `N·${metrics.fps}` : "N·75";
    }
  };

  const restoreBaselineNow = () => {
    const baseline = readJson(BASELINE_KEY, null);
    const config = readJson(GAME_CONFIG_KEY, {});
    if (baseline?.values) {
      Object.assign(config, baseline.values);
      localStorage.setItem(GAME_CONFIG_KEY, JSON.stringify(config));
    }
  };

  const buildUi = (open = true) => {
    if (panel) {
      panel.hidden = !open;
      syncMetricCollection();
      return;
    }
    const host = document.createElement("div");
    host.id = "nxo-extension-root";
    (document.body || document.documentElement).appendChild(host);
    shadow = host.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = UI_STYLE;
    shadow.appendChild(style);

    launcher = document.createElement("button");
    launcher.className = "launcher";
    launcher.type = "button";
    launcher.title = "Nexus 75 Optimizer (F8)";
    launcher.textContent = "N·75";
    launcher.addEventListener("click", () => togglePanel());
    shadow.appendChild(launcher);

    panel = document.createElement("section");
    panel.className = "panel";
    panel.hidden = !open;
    panel.innerHTML = `
      <header class="header">
        <div class="eyebrow">PERFORMANCE LAYER // V0.4</div>
        <h1>Nexus 75 Optimizer</h1>
        <div class="site">${location.hostname} · F8 abre/cierra este panel</div>
      </header>
      <div class="body">
        <div class="stats">
          <div class="stat"><b id="fps">0</b><span>FPS</span></div>
          <div class="stat"><b id="low">—</b><span>1% low</span></div>
          <div class="stat"><b id="p95">—</b><span>p95 frame</span></div>
          <div class="stat"><b id="aux">0</b><span id="aux-label">long tasks</span></div>
        </div>
        <div class="status" id="status">Midiéndolo sin alterar el reloj del juego…</div>
        <div class="section-title">Modo</div>
        <div class="presets" id="presets"></div>
        <div class="section-title">Controles y motivo</div>
        <div id="options"></div>
        <div class="actions">
          <button class="apply" id="apply">Aplicar y recargar</button>
          <button class="tune" id="retune">Calibrar</button>
          <button class="restore" id="restore">Original</button>
        </div>
        <div class="diagnostics" id="diagnostics">Esperando diagnóstico de arranque…</div>
        <div class="note">La red ligera solo corta terceros observados. No altera paquetes, WebSocket del juego, puntería ni visibilidad. 75 FPS depende de un monitor de al menos 75 Hz.</div>
      </div>
    `;
    shadow.appendChild(panel);

    const names = {
      quality: "Calidad",
      balanced: "Balance",
      performance: "FPS",
      competitive: "Competitivo",
      extreme: "Extremo",
      original: "Original"
    };
    const presets = shadow.getElementById("presets");
    Object.keys(names).forEach((name) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "preset";
      button.dataset.preset = name;
      button.textContent = names[name];
      button.addEventListener("click", () => {
        draft = { ...draft, ...PRESETS[name], preset: name };
        renderDraft();
      });
      presets.appendChild(button);
    });

    const options = shadow.getElementById("options");
    OPTION_DEFS.forEach((definition) => options.appendChild(createOption(definition)));

    shadow.getElementById("apply").addEventListener("click", () => {
      saved = { ...DEFAULTS, ...draft };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(saved));
      if (!saved.enabled) restoreBaselineNow();
      syncNetworkRules(saved).finally(() => location.reload());
    });

    shadow.getElementById("restore").addEventListener("click", () => {
      draft = { ...draft, ...PRESETS.original, preset: "original" };
      saved = { ...DEFAULTS, ...draft };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(saved));
      restoreBaselineNow();
      syncNetworkRules(saved).finally(() => location.reload());
    });

    shadow.getElementById("retune").addEventListener("click", () => {
      draft = { ...draft, enabled: true, autoTune: true };
      saved = { ...DEFAULTS, ...draft };
      localStorage.removeItem(AUTO_TUNE_KEY);
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(saved));
      syncNetworkRules(saved).finally(() => location.reload());
    });

    renderDraft();
    renderDiagnostics();
    renderMetrics();
    syncMetricCollection();
  };

  const init = () => {
    installPageStyle();
    syncNetworkRules();
    syncMetricCollection();
    scheduleAutoTune();
    document.addEventListener(
      "keydown",
      (event) => {
        if (event.key === "F8" && !event.repeat) {
          event.preventDefault();
          event.stopPropagation();
          togglePanel();
        }
      },
      true
    );
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
