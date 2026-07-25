// ==UserScript==
// @name         Nexus 75 Optimizer
// @namespace    https://wnexuschat.netlify.app/
// @version      1.3.0
// @description  Safe, measurable performance optimization for survev.io and resurviv.biz.
// @description:es Optimización segura y medible de rendimiento para survev.io y resurviv.biz.
// @author       Nexus
// @homepageURL  https://wnexuschat.netlify.app/
// @supportURL   https://discord.gg/rDJhfCTDqR
// @license      MIT
// @antifeature  ads
// @match        https://survev.io/*
// @match        https://*.survev.io/*
// @match        https://resurviv.biz/*
// @match        https://*.resurviv.biz/*
// @run-at       document-start
// @inject-into  page
// @noframes
// @grant        none
// ==/UserScript==

(() => {
  "use strict";

  if (window.top !== window.self) return;

  const VERSION = "1.3.0";
  const NEXUS_CHAT_URL = "https://wnexuschat.netlify.app/";
  const DISCORD_URL = "https://discord.gg/rDJhfCTDqR";
  const REPOSITORY_URL = "https://github.com/thedragon8592/nexus-75-optimizer";
  const BUG_REPORT_URL = `${REPOSITORY_URL}/issues/new?labels=bug`;
  const FEATURE_REQUEST_URL = `${REPOSITORY_URL}/issues/new?labels=enhancement`;
  const CHANGELOG_URL = `${REPOSITORY_URL}/blob/main/CHANGELOG.md`;
  const GREASY_FORK_FEEDBACK_URL = "https://greasyfork.org/scripts/586802-nexus-75-optimizer/feedback";
  const SETTINGS_KEY = "nxo:settings:v1";
  const BASELINE_KEY = "nxo:baseline:v1";
  const GAME_CONFIG_KEY = "surviv_config";
  const REGION_LEASE_KEY = "nxo:region-lease:v1";
  const AUTO_TUNE_KEY = "nxo:auto-tune:v1";
  const COMMUNITY_KEY = "nxo:community:v1";
  const PROMO_VISIT_KEY = "nxo:nexus-chat-visit-count:v1";
  const PROMO_DISABLED_KEY = "nxo:nexus-chat-promo-disabled:v1";
  const PROMO_INTERVAL = 5;
  const PROFILE_CODE_VERSION = 1;
  const COMMUNITY_SUCCESS_THRESHOLD = 3;

  const shouldShowPromoThisVisit = () => {
    try {
      if (localStorage.getItem(PROMO_DISABLED_KEY) === "true") return false;
      const stored = Number.parseInt(localStorage.getItem(PROMO_VISIT_KEY) || "0", 10);
      const previous = Number.isInteger(stored) && stored >= 0 ? stored : 0;
      const current = (previous % PROMO_INTERVAL) + 1;
      localStorage.setItem(PROMO_VISIT_KEY, String(current));
      return current === PROMO_INTERVAL;
    } catch {
      return false;
    }
  };

  const promoDueThisVisit = shouldShowPromoThisVisit();

  const DEFAULTS = {
    enabled: true,
    preset: "balanced",
    language: "en",
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
    sleepMonitorInGame: true
  };

  const PRESETS = {
    quality: {
      enabled: true,
      competitiveMode: false,
      lockSelectedRegion: false,
      smartRegion: true,
      autoTune: true,
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
      sleepMonitorInGame: true,
      lowResTextures: true,
      renderAt1x: true,
      keepInterpolation: true,
      disableScreenShake: true,
      muteAudio: false,
      reduceLobbyMotion: true,
      quietGameplay: true
    },
    extreme: {
      enabled: true,
      competitiveMode: false,
      lockSelectedRegion: false,
      smartRegion: true,
      autoTune: true,
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

  const TEXT = {
    en: {
      panelHint: "F8 opens/closes this panel",
      language: "Language",
      mode: "Optimization mode",
      controls: "Controls and impact",
      howTitle: "How it works",
      apply: "Apply & reload",
      calibrate: "Calibrate",
      original: "Original",
      measuring: "Measuring without changing the game's clock…",
      stats: ["FPS", "1% low", "p95 frame", "long tasks"],
      inputFrame: "input→frame p95",
      presetNames: {
        quality: "Quality",
        balanced: "Balanced",
        performance: "FPS",
        competitive: "Competitive",
        extreme: "Extreme",
        original: "Original"
      },
      options: {
        lowResTextures: ["Light textures", "Uses the low-resolution atlases already shipped by the game. Reduces downloads, decoding and VRAM; reload required."],
        renderAt1x: ["1x rendering on HiDPI", "Draws up to four times fewer pixels than the game's 2x mode. Largest safe GPU saving; reload required."],
        keepInterpolation: ["Interpolated movement", "Recommended. Turning it off saves a little CPU but may make movement look rough."],
        disableScreenShake: ["Disable screen shake", "Avoids nonessential camera motion and a small amount of per-frame work."],
        reduceLobbyMotion: ["Reduce lobby motion", "Shortens menu animations and transitions without touching the in-game HUD."],
        quietGameplay: ["Sleep the lobby while playing", "Stops hidden lobby backgrounds and ad containers from being composited during a match."],
        competitiveMode: ["Clean competitive mode", "Preserves audio and interpolation, closes the panel in-game and can measure local input-to-next-frame delay. It never changes mechanics."],
        sleepMonitorInGame: ["Sleep monitor in-game", "Stops this script's RAF, observer, timers and input sampling while its panel is closed."],
        autoTune: ["Lobby auto-tuner", "Measures four visible lobby seconds, selects Balanced/FPS and then sleeps for seven days. It never calibrates during a match or hidden tab."],
        smartRegion: ["Smart region (72 h)", "Reuses the game's official region choice, then lets the official test run again after expiry or a network change. Adds no pings."],
        lockSelectedRegion: ["Manually lock saved region", "Always asks the game to use its saved region. It can reduce startup probes, but a stale region may increase real ping."],
        muteAudio: ["Disable audio", "Optional extreme saving. Sound carries useful information, so only Extreme enables this automatically."]
      },
      how: [
        ["Before rendering", "At document-start the script writes only confirmed game settings. It selects the built-in low atlas and briefly exposes DPR 1 so Pixi creates a 1x canvas."],
        ["During a match", "Hidden lobby visuals are suppressed. The panel opens automatically and F8 can hide it; once closed, its monitor sleeps."],
        ["Network latency", "Smart Region caches the region selected by the game's own /ptc tests. The script never wraps WebSocket, changes packets or creates fake ping requests."],
        ["Safety and rollback", "Every startup setting is persisted and reversible. Original restores the captured baseline. Display refresh still limits visible FPS."]
      ],
      note: "Tampermonkey edition: no request interception or extension-only DNR filtering. Gameplay WebSocket, matchmaking, aiming and visibility remain untouched.",
      diagPending: "Startup diagnostics pending",
      autoCalibrating: "Auto: calibrating in lobby",
      autoCurrent: "Auto: current",
      autoOff: "Auto: off",
      nativeDpr: "Native DPR",
      textures: "Low textures",
      render: "1x render",
      interpolation: "Interpolation",
      region: "Region",
      yes: "yes",
      no: "no",
      regionModes: {
        manual: "manual",
        "smart-locked": "smart lease",
        "smart-probe": "official test",
        automatic: "automatic"
      },
      stable: (target) => `Target ${target}: stable.`,
      measuringTarget: (target) => `Target ${target}: measuring. Stability and low p95 come first.`,
      sixtyHz: "Display refresh appears close to 60 Hz; 75 visible FPS is not possible on this monitor.",
      competitiveStatus: (target, rtt) => `Clean competitive · target ${target} · monitor sleeps in-game${rtt}.`,
      rtt: (value) => ` · estimated RTT ${value} ms (not game ping)`,
      communityTitle: "Community Hub",
      communityIntro: "Share honest results, exchange local profiles and help improve Nexus 75. Nothing here uploads data automatically.",
      exploreNexus: "Explore Nexus Chat",
      joinDiscord: "Join Discord",
      reportBug: "Report a bug",
      requestFeature: "Request a feature",
      viewChangelog: "View changelog",
      copyResult: "Copy performance result",
      copyDiagnostics: "Copy diagnostics",
      copyProfile: "Copy profile code",
      importProfile: "Import profile",
      profileCode: "Community profile code",
      profileHint: "Import only changes the draft. Review it, then use Apply & reload.",
      manualUpdates: "Manual releases only: this script never downloads or executes remote updates.",
      copiedResult: "Performance result copied.",
      copiedDiagnostics: "Diagnostics copied. Review them before sharing.",
      copiedProfile: "Profile code copied.",
      importedProfile: "Profile imported. Review it before applying.",
      invalidProfile: "That Nexus 75 profile code is invalid.",
      copyFailed: "Clipboard access failed. Select and copy the text manually.",
      promoEnable: "Enable Nexus welcome",
      promoDisable: "Disable Nexus welcome",
      promoEnabled: "The Nexus Chat welcome can appear every fifth launch.",
      promoDisabled: "The Nexus Chat welcome is disabled on this device.",
      changelogTitle: "Nexus 75 v1.3",
      changelogItems: [
        "Community Hub and honest shareable diagnostics",
        "Portable local profile codes",
        "Lower-pressure feedback and Nexus Chat invitations"
      ],
      changelogDismiss: "Got it",
      feedbackTitle: "Has Nexus 75 helped your game?",
      feedbackBody: "After several stable sessions, honest feedback helps the community choose safe settings.",
      leaveFeedback: "Leave feedback",
      feedbackNotNow: "Not now",
      nexusUtilityTitle: "Result copied. Keep the squad together?",
      nexusUtilityBody: "Nexus Chat adds match rooms, Global, friends and private conversations across both games.",
      customProfile: "Custom",
      profileNames: {
        quality: "Quality",
        balanced: "Balanced",
        performance: "FPS",
        competitive: "Competitive",
        extreme: "Extreme",
        original: "Original",
        custom: "Custom"
      },
      reportLabels: {
        title: "Nexus 75 Performance Result",
        game: "Game",
        profile: "Profile",
        target: "Target",
        fps: "FPS",
        low: "1% low",
        p95: "p95 frame",
        rendering: "Rendering",
        textures: "Textures",
        communityProfile: "Community profile",
        unavailable: "measuring"
      },
      promoEyebrow: "NEXUS CHAT · BUILT FOR SURVEV & RESURVIV",
      promoTitle: "The match ends.",
      promoAccent: "Your squad doesn't.",
      promoBody: "Match rooms, Global, friends and private conversations — inside one floating command center that follows you across both games.",
      promoBenefits: [
        "Automatic match rooms",
        "Persistent Nexus ID",
        "Global + private chat"
      ],
      promoTrust: "v3.7.0 · Chrome / Edge · Open source · No password required",
      promoAction: "Explore Nexus Chat",
      promoDismiss: "Not now",
      promoNever: "Don't show again",
      promoClose: "Dismiss Nexus Chat promotion",
      promoPreview: {
        match: "Match chat",
        global: "Global",
        friends: "FRIENDS",
        room: "Room sa-17",
        online: "12 online",
        player: "You",
        first: "@You squad on the bridge. Rotate north.",
        second: "Copy. Moving now.",
        placeholder: "Message your match…"
      }
    },
    es: {
      panelHint: "F8 abre/cierra este panel",
      language: "Idioma",
      mode: "Modo de optimización",
      controls: "Controles e impacto",
      howTitle: "Cómo funciona",
      apply: "Aplicar y recargar",
      calibrate: "Calibrar",
      original: "Original",
      measuring: "Midiendo sin alterar el reloj del juego…",
      stats: ["FPS", "1% low", "p95 frame", "tareas largas"],
      inputFrame: "entrada→frame p95",
      presetNames: {
        quality: "Calidad",
        balanced: "Balance",
        performance: "FPS",
        competitive: "Competitivo",
        extreme: "Extremo",
        original: "Original"
      },
      options: {
        lowResTextures: ["Texturas ligeras", "Usa los atlas de baja resolución que ya incluye el juego. Reduce descarga, decodificación y VRAM; requiere recarga."],
        renderAt1x: ["Render 1x en HiDPI", "Dibuja hasta cuatro veces menos píxeles que el modo 2x del juego. Es el mayor ahorro GPU seguro; requiere recarga."],
        keepInterpolation: ["Movimiento interpolado", "Recomendado. Apagarlo ahorra algo de CPU, pero el movimiento puede verse brusco."],
        disableScreenShake: ["Sin sacudida de cámara", "Evita movimiento visual no esencial y una pequeña cantidad de trabajo por frame."],
        reduceLobbyMotion: ["Reducir movimiento del lobby", "Acorta animaciones y transiciones del menú sin tocar el HUD de partida."],
        quietGameplay: ["Dormir el lobby al jugar", "Evita componer fondos y contenedores publicitarios ocultos durante una partida."],
        competitiveMode: ["Modo competitivo limpio", "Conserva audio e interpolación, cierra el panel al jugar y puede medir entrada local al siguiente frame. Nunca cambia mecánicas."],
        sleepMonitorInGame: ["Dormir monitor en partida", "Detiene el RAF, observer, temporizadores y muestreo de entrada del script mientras el panel está cerrado."],
        autoTune: ["Auto-tuner de lobby", "Mide cuatro segundos visibles en el lobby, elige Balance/FPS y duerme siete días. Nunca calibra jugando ni con la pestaña oculta."],
        smartRegion: ["Región inteligente (72 h)", "Reutiliza la región elegida oficialmente por el juego y permite repetir la prueba al caducar o cambiar de red. No añade pings."],
        lockSelectedRegion: ["Fijar región guardada", "Siempre pide al juego usar su región guardada. Puede reducir pruebas iniciales, pero una región antigua puede aumentar el ping real."],
        muteAudio: ["Desactivar audio", "Ahorro extremo opcional. El sonido aporta información, por eso solo Extremo lo activa automáticamente."]
      },
      how: [
        ["Antes del render", "En document-start el script escribe únicamente configuraciones confirmadas. Elige el atlas low integrado y expone brevemente DPR 1 para que Pixi cree un canvas 1x."],
        ["Durante la partida", "Se suprimen elementos ocultos del lobby. El panel se abre automáticamente y F8 puede ocultarlo; al cerrarlo, su monitor duerme."],
        ["Latencia de red", "Región Inteligente guarda la región elegida por las pruebas /ptc del juego. El script nunca envuelve WebSocket, cambia paquetes ni genera pings falsos."],
        ["Seguridad y restauración", "Cada ajuste de arranque es persistente y reversible. Original recupera la base capturada. La frecuencia de pantalla sigue limitando los FPS visibles."]
      ],
      note: "Edición Tampermonkey: sin interceptar solicitudes ni imitar el DNR exclusivo de extensiones. WebSocket, matchmaking, puntería y visibilidad quedan intactos.",
      diagPending: "Diagnóstico de arranque pendiente",
      autoCalibrating: "Auto: calibrando en lobby",
      autoCurrent: "Auto: al día",
      autoOff: "Auto: apagado",
      nativeDpr: "DPR nativo",
      textures: "Texturas low",
      render: "Render 1x",
      interpolation: "Interpolación",
      region: "Región",
      yes: "sí",
      no: "no",
      regionModes: {
        manual: "manual",
        "smart-locked": "lease inteligente",
        "smart-probe": "prueba oficial",
        automatic: "automática"
      },
      stable: (target) => `Objetivo ${target}: estable.`,
      measuringTarget: (target) => `Objetivo ${target}: midiendo. La estabilidad y un p95 bajo son prioridad.`,
      sixtyHz: "El refresco parece cercano a 60 Hz; 75 FPS visibles no son posibles en este monitor.",
      competitiveStatus: (target, rtt) => `Competitivo limpio · objetivo ${target} · monitor dormido al jugar${rtt}.`,
      rtt: (value) => ` · RTT estimado ${value} ms (no es ping del juego)`,
      communityTitle: "Centro de comunidad",
      communityIntro: "Comparte resultados honestos, intercambia perfiles locales y ayuda a mejorar Nexus 75. Nada se envía automáticamente.",
      exploreNexus: "Explorar Nexus Chat",
      joinDiscord: "Unirse a Discord",
      reportBug: "Reportar un problema",
      requestFeature: "Sugerir una función",
      viewChangelog: "Ver cambios",
      copyResult: "Copiar resultado de rendimiento",
      copyDiagnostics: "Copiar diagnóstico",
      copyProfile: "Copiar código de perfil",
      importProfile: "Importar perfil",
      profileCode: "Código de perfil comunitario",
      profileHint: "Importar solo cambia el borrador. Revísalo y luego pulsa Aplicar y recargar.",
      manualUpdates: "Solo versiones manuales: este script nunca descarga ni ejecuta actualizaciones remotas.",
      copiedResult: "Resultado de rendimiento copiado.",
      copiedDiagnostics: "Diagnóstico copiado. Revísalo antes de compartir.",
      copiedProfile: "Código de perfil copiado.",
      importedProfile: "Perfil importado. Revísalo antes de aplicarlo.",
      invalidProfile: "Ese código de perfil de Nexus 75 no es válido.",
      copyFailed: "No se pudo acceder al portapapeles. Selecciona y copia el texto manualmente.",
      promoEnable: "Activar bienvenida de Nexus",
      promoDisable: "Desactivar bienvenida de Nexus",
      promoEnabled: "La bienvenida de Nexus Chat puede aparecer cada quinta apertura.",
      promoDisabled: "La bienvenida de Nexus Chat está desactivada en este dispositivo.",
      changelogTitle: "Nexus 75 v1.3",
      changelogItems: [
        "Centro comunitario y diagnósticos honestos para compartir",
        "Códigos portátiles de perfiles locales",
        "Invitaciones menos invasivas para feedback y Nexus Chat"
      ],
      changelogDismiss: "Entendido",
      feedbackTitle: "¿Nexus 75 mejoró tu juego?",
      feedbackBody: "Después de varias sesiones estables, una opinión honesta ayuda a la comunidad a elegir ajustes seguros.",
      leaveFeedback: "Dejar una opinión",
      feedbackNotNow: "Ahora no",
      nexusUtilityTitle: "Resultado copiado. ¿Mantener unido al equipo?",
      nexusUtilityBody: "Nexus Chat añade salas de partida, Global, amigos y conversaciones privadas en ambos juegos.",
      customProfile: "Personalizado",
      profileNames: {
        quality: "Calidad",
        balanced: "Balance",
        performance: "FPS",
        competitive: "Competitivo",
        extreme: "Extremo",
        original: "Original",
        custom: "Personalizado"
      },
      reportLabels: {
        title: "Resultado de rendimiento Nexus 75",
        game: "Juego",
        profile: "Perfil",
        target: "Objetivo",
        fps: "FPS",
        low: "1% low",
        p95: "frame p95",
        rendering: "Render",
        textures: "Texturas",
        communityProfile: "Perfil comunitario",
        unavailable: "midiendo"
      }
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

  const writeJson = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  };

  const isPromoDisabled = () => {
    try {
      return localStorage.getItem(PROMO_DISABLED_KEY) === "true";
    } catch {
      return false;
    }
  };

  const setPromoDisabled = (disabled) => {
    try {
      if (disabled) localStorage.setItem(PROMO_DISABLED_KEY, "true");
      else localStorage.removeItem(PROMO_DISABLED_KEY);
      return true;
    } catch {
      return false;
    }
  };

  let saved = { ...DEFAULTS, ...readJson(SETTINGS_KEY, {}) };
  if (!Object.hasOwn(TEXT, saved.language)) saved.language = "en";
  let draft = { ...saved };
  const copy = () => TEXT[saved.language] || TEXT.en;
  const PROFILE_KEYS = [
    "enabled",
    "lowResTextures",
    "renderAt1x",
    "keepInterpolation",
    "disableScreenShake",
    "muteAudio",
    "reduceLobbyMotion",
    "quietGameplay",
    "competitiveMode",
    "lockSelectedRegion",
    "smartRegion",
    "autoTune",
    "sleepMonitorInGame"
  ];
  const PROFILE_TOKENS = {
    quality: "QUALITY",
    balanced: "BAL",
    performance: "FPS",
    competitive: "COMP",
    extreme: "EXT",
    original: "ORIG",
    custom: "CUSTOM"
  };
  const TOKEN_PROFILES = Object.fromEntries(
    Object.entries(PROFILE_TOKENS).map(([profile, token]) => [token, profile])
  );
  const communityDefaults = {
    successfulSessions: 0,
    feedbackAsked: false,
    changelogSeen: ""
  };
  let community = {
    ...communityDefaults,
    ...readJson(COMMUNITY_KEY, {})
  };
  let feedbackPromptVisible = false;
  let nexusUtilityVisible = false;
  let successfulSessionCounted = false;
  let changelogVisible = community.changelogSeen !== VERSION;
  if (changelogVisible) {
    community.changelogSeen = VERSION;
    writeJson(COMMUNITY_KEY, community);
  }

  const profileMaskFor = (settings) => PROFILE_KEYS.reduce(
    (mask, key, index) => mask | (settings[key] ? 2 ** index : 0),
    0
  );

  const profileCodeFor = (settings) => {
    const profile = Object.hasOwn(PROFILE_TOKENS, settings.preset)
      ? settings.preset
      : "custom";
    const token = PROFILE_TOKENS[profile];
    const target = Math.min(75, Math.max(30, Number(settings.targetFps) || 75));
    return [
      "NX75",
      PROFILE_CODE_VERSION,
      token,
      target,
      profileMaskFor(settings).toString(36).toUpperCase()
    ].join("-");
  };

  const parseProfileCode = (rawCode) => {
    const normalized = String(rawCode || "").trim().toUpperCase();
    const match = normalized.match(/^NX75-(\d+)-(QUALITY|BAL|FPS|COMP|EXT|ORIG|CUSTOM)-(\d{2})-([0-9A-Z]+)$/);
    if (!match || Number(match[1]) !== PROFILE_CODE_VERSION) return null;
    const targetFps = Number(match[3]);
    const mask = Number.parseInt(match[4], 36);
    if (
      !Number.isInteger(targetFps)
      || targetFps < 30
      || targetFps > 75
      || !Number.isSafeInteger(mask)
      || mask < 0
      || mask >= 2 ** PROFILE_KEYS.length
    ) return null;
    const values = Object.fromEntries(
      PROFILE_KEYS.map((key, index) => [key, Boolean(mask & (2 ** index))])
    );
    const requestedPreset = TOKEN_PROFILES[match[2]] || "custom";
    const presetDefinition = PRESETS[requestedPreset];
    const matchesPreset = presetDefinition && PROFILE_KEYS.every((key) => (
      !Object.hasOwn(presetDefinition, key)
      || Boolean(presetDefinition[key]) === values[key]
    ));
    return {
      ...values,
      preset: matchesPreset ? requestedPreset : "custom",
      targetFps,
      code: normalized
    };
  };

  const GAME_DEFAULTS = {
    highResTex: true,
    interpolation: true,
    screenShake: true,
    muteAudio: false,
    regionSelected: false
  };

  const gameConfig = readJson(GAME_CONFIG_KEY, {});
  let baseline = readJson(BASELINE_KEY, null);
  if (!baseline?.values) {
    baseline = {
      capturedAt: new Date().toISOString(),
      values: Object.fromEntries(
        Object.keys(GAME_DEFAULTS).map((key) => [
          key,
          Object.hasOwn(gameConfig, key) ? gameConfig[key] : GAME_DEFAULTS[key]
        ])
      )
    };
    writeJson(BASELINE_KEY, baseline);
  }

  const startupAt = Date.now();
  const nativeDpr = window.devicePixelRatio || 1;
  const connection = navigator.connection;
  const networkFingerprint = [
    connection?.type || "unknown",
    connection?.effectiveType || "unknown"
  ].join("|");
  const original = { ...GAME_DEFAULTS, ...baseline.values };
  const regionLease = readJson(REGION_LEASE_KEY, null);
  const leaseDurationMs = Math.max(1, Number(saved.regionLeaseHours) || 72)
    * 60 * 60 * 1000;
  let regionMode = "automatic";

  if (saved.enabled) {
    gameConfig.highResTex = saved.lowResTextures ? false : original.highResTex;
    gameConfig.interpolation = saved.keepInterpolation;
    gameConfig.screenShake = saved.disableScreenShake ? false : original.screenShake;
    gameConfig.muteAudio = saved.muteAudio ? true : original.muteAudio;
    if (saved.lockSelectedRegion && gameConfig.region) {
      gameConfig.regionSelected = true;
      regionMode = "manual";
    } else if (saved.smartRegion && gameConfig.region) {
      const leaseValid = regionLease
        && regionLease.region === gameConfig.region
        && regionLease.networkFingerprint === networkFingerprint
        && Number(regionLease.expiresAt) > startupAt;
      gameConfig.regionSelected = Boolean(leaseValid);
      regionMode = leaseValid ? "smart-locked" : "smart-probe";
    }
  } else {
    Object.assign(gameConfig, original);
  }
  writeJson(GAME_CONFIG_KEY, gameConfig);

  let dprOverrideApplied = false;
  let ownDprDescriptor;
  let restoreCanvasHook = () => {};

  const restoreDprGetter = () => {
    if (!dprOverrideApplied) return;
    try {
      if (ownDprDescriptor) {
        Object.defineProperty(window, "devicePixelRatio", ownDprDescriptor);
      } else {
        delete window.devicePixelRatio;
      }
    } catch {
      // The override is scoped to this tab and has a timed fallback below.
    }
  };

  if (saved.enabled && saved.renderAt1x && nativeDpr > 1) {
    try {
      ownDprDescriptor = Object.getOwnPropertyDescriptor(window, "devicePixelRatio");
      Object.defineProperty(window, "devicePixelRatio", {
        configurable: true,
        enumerable: true,
        get: () => 1
      });
      dprOverrideApplied = window.devicePixelRatio === 1;
    } catch {
      dprOverrideApplied = false;
    }
  }

  if (dprOverrideApplied) {
    try {
      const originalGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (...args) {
        const context = Reflect.apply(originalGetContext, this, args);
        if (this.id === "cvs") {
          restoreDprGetter();
          restoreCanvasHook();
        }
        return context;
      };
      restoreCanvasHook = () => {
        HTMLCanvasElement.prototype.getContext = originalGetContext;
        restoreCanvasHook = () => {};
      };
    } catch {
      // The timed fallback restores the DPR even if the hook is unavailable.
    }
  }

  const earlyDiagnostics = {
    nativeDpr,
    applied: {
      enabled: saved.enabled,
      lowResTextures: saved.enabled && saved.lowResTextures,
      renderAt1x: dprOverrideApplied,
      interpolation: gameConfig.interpolation,
      screenShake: gameConfig.screenShake,
      muteAudio: gameConfig.muteAudio,
      regionLocked: Boolean(gameConfig.regionSelected),
      regionMode
    }
  };

  const persistRegionLease = () => {
    if (
      !saved.enabled
      || !saved.smartRegion
      || regionMode === "smart-locked"
      || regionMode === "manual"
      || Date.now() - startupAt < 5000
    ) return;
    const latestConfig = readJson(GAME_CONFIG_KEY, {});
    if (!latestConfig.region) return;
    writeJson(REGION_LEASE_KEY, {
      region: latestConfig.region,
      networkFingerprint,
      measuredAt: new Date().toISOString(),
      expiresAt: Date.now() + leaseDurationMs
    });
  };

  window.addEventListener("pagehide", () => {
    persistRegionLease();
    restoreDprGetter();
    restoreCanvasHook();
  }, { once: true });
  window.setTimeout(() => {
    restoreDprGetter();
    restoreCanvasHook();
  }, 30000);
  connection?.addEventListener?.("change", () => {
    try {
      localStorage.removeItem(REGION_LEASE_KEY);
    } catch {
      // Missing storage already causes a safe official region test next load.
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

  const UI_STYLE = `
    :host { all: initial; color-scheme: dark; }
    * { box-sizing: border-box; }
    button, input, select { font: inherit; }
    .launcher {
      position: fixed; right: 16px; top: 16px; z-index: 2147483647;
      width: 58px; height: 36px; border: 1px solid #38e7ff;
      border-radius: 10px; color: #e1fbff; background: #061019;
      box-shadow: 0 0 0 1px #092532, 0 8px 26px #000a;
      font: 800 12px/1 system-ui, sans-serif; letter-spacing: .07em;
      cursor: pointer;
    }
    .launcher[data-health="good"] { border-color: #54efa5; color: #54efa5; }
    .launcher[data-health="warn"] { border-color: #ffcb66; color: #ffcb66; }
    .launcher[hidden], .panel[hidden] { display: none; }
    .panel {
      position: fixed; z-index: 2147483646; right: 16px; top: 60px;
      width: min(410px, calc(100vw - 24px)); max-height: calc(100vh - 76px);
      overflow: auto; color: #dcecf5; background: #061019f7;
      border: 1px solid #1d6175; border-radius: 15px;
      box-shadow: 0 22px 72px #000d; font: 13px/1.45 system-ui, sans-serif;
      scrollbar-color: #246579 #07151f;
    }
    .header {
      padding: 16px; border-bottom: 1px solid #143845;
      background: linear-gradient(135deg, #091923, #082735);
    }
    .header-line { display: flex; align-items: start; justify-content: space-between; gap: 12px; }
    .eyebrow { color: #39e7ff; font-size: 10px; font-weight: 900; letter-spacing: .17em; }
    h1 { margin: 4px 0 0; color: #f6fcff; font-size: 19px; line-height: 1.1; }
    .site { margin-top: 6px; color: #7f9ca8; font-size: 11px; }
    .language {
      padding: 5px 7px; border: 1px solid #2a6677; border-radius: 7px;
      color: #c8f7ff; background: #071720; cursor: pointer; font-size: 10px;
    }
    .body { padding: 14px; }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 7px; }
    .stat { min-width: 0; padding: 9px 5px; border: 1px solid #173e4b; border-radius: 9px; background: #091821; text-align: center; }
    .stat b { display: block; color: #fff; font-size: 15px; }
    .stat span { color: #7795a2; font-size: 8px; text-transform: uppercase; letter-spacing: .07em; }
    .status { margin: 9px 0 14px; padding: 8px 10px; border-left: 2px solid #37e5fc; color: #a1beca; background: #091821; font-size: 11px; }
    .section-title { margin: 14px 0 7px; color: #86a6b2; font-size: 10px; font-weight: 900; letter-spacing: .12em; text-transform: uppercase; }
    .presets { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px; }
    .preset { min-width: 0; padding: 8px 3px; border: 1px solid #214a58; border-radius: 8px; color: #9ab6c0; background: #091821; font-size: 9px; cursor: pointer; }
    .preset.active { border-color: #38e7ff; color: #ecfdff; background: #0c2a36; box-shadow: inset 0 0 12px #1dc9e018; }
    .option { display: grid; grid-template-columns: 1fr auto; gap: 6px 12px; padding: 10px 0; border-bottom: 1px solid #102f3a; }
    .option strong { color: #e8f6fb; font-size: 12px; }
    .option small { display: block; grid-column: 1; color: #7c98a3; font-size: 10px; }
    .switch { grid-column: 2; grid-row: 1 / span 2; align-self: center; position: relative; width: 38px; height: 22px; }
    .switch input { position: absolute; opacity: 0; pointer-events: none; }
    .track { position: absolute; inset: 0; border: 1px solid #315763; border-radius: 999px; background: #111f26; cursor: pointer; }
    .track::after { content: ""; position: absolute; width: 14px; height: 14px; left: 3px; top: 3px; border-radius: 50%; background: #718b95; transition: left .12s ease; }
    input:checked + .track { border-color: #27cee3; background: #0b3d49; }
    input:checked + .track::after { left: 19px; background: #57efff; }
    details { margin-top: 14px; border: 1px solid #173e4b; border-radius: 10px; background: #08151e; }
    summary { padding: 10px 12px; color: #a9eefa; cursor: pointer; font-weight: 800; }
    .how-grid { display: grid; gap: 7px; padding: 0 10px 10px; }
    .how-card { padding: 9px; border-left: 2px solid #22697b; background: #0a1b25; }
    .how-card strong { display: block; color: #eaf9fd; font-size: 11px; }
    .how-card span { color: #7f9ca7; font-size: 10px; }
    .actions { display: grid; grid-template-columns: 1fr auto auto; gap: 7px; margin-top: 14px; }
    .apply, .tune, .restore { border-radius: 9px; padding: 10px 11px; cursor: pointer; }
    .apply { border: 1px solid #38e7ff; color: #041217; background: #38e7ff; font-weight: 900; }
    .tune { border: 1px solid #24798b; color: #a1efff; background: #09232d; }
    .restore { border: 1px solid #32515d; color: #9db3bb; background: #091821; }
    .community-body { display: grid; gap: 9px; padding: 0 10px 10px; }
    .community-intro, .profile-hint, .manual-updates { margin: 0; color: #7f9ca7; font-size: 10px; }
    .community-links, .community-tools { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; }
    .community-button {
      min-width: 0; padding: 8px; border: 1px solid #24576a; border-radius: 8px;
      color: #b9eef7; background: #09202a; cursor: pointer; font-size: 10px;
    }
    .community-button.primary { border-color: #38e7ff; color: #041217; background: #38e7ff; font-weight: 900; }
    .profile-box { padding: 9px; border: 1px solid #173e4b; border-radius: 9px; background: #07131b; }
    .profile-box label { display: block; margin-bottom: 6px; color: #a9eefa; font-size: 10px; font-weight: 800; }
    .profile-input {
      width: 100%; padding: 8px; border: 1px solid #285667; border-radius: 7px;
      color: #dffbff; background: #050e14; font: 10px/1.2 ui-monospace, SFMono-Regular, Consolas, monospace;
      text-transform: uppercase;
    }
    .profile-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 6px; }
    .community-card, .release-note, .feedback-card {
      margin-top: 10px; padding: 10px; border: 1px solid #1e5262;
      border-radius: 10px; background: linear-gradient(135deg, #081a24, #0a222d);
    }
    .community-card[hidden], .release-note[hidden], .feedback-card[hidden], .toast[hidden] { display: none; }
    .community-card strong, .release-note strong, .feedback-card strong { display: block; color: #eafbff; font-size: 11px; }
    .community-card p, .feedback-card p { margin: 5px 0 8px; color: #84a2ad; font-size: 10px; }
    .release-note ul { margin: 6px 0 9px; padding-left: 18px; color: #84a2ad; font-size: 10px; }
    .inline-actions { display: flex; flex-wrap: wrap; gap: 6px; }
    .toast {
      position: sticky; bottom: 4px; z-index: 3; margin-top: 9px; padding: 8px 10px;
      border: 1px solid #35cfe3; border-radius: 8px; color: #dffbff; background: #072630;
      box-shadow: 0 8px 24px #000a; font-size: 10px;
    }
    .toast[data-tone="error"] { border-color: #ff7a8f; color: #ffd8df; background: #32131b; }
    .diagnostics { margin-top: 11px; color: #6d8d99; font: 10px/1.55 ui-monospace, SFMono-Regular, Consolas, monospace; }
    .note { margin-top: 10px; color: #718d98; font-size: 10px; }
    @media (max-width: 520px) {
      .panel { right: 6px; top: 51px; max-height: calc(100vh - 58px); }
      .launcher { right: 6px; top: 8px; }
    }
  `;

  const PROMO_STYLE = `
    :host { all: initial; color-scheme: dark; }
    * { box-sizing: border-box; }
    button { font: inherit; }
    .backdrop {
      position: fixed; inset: 0; z-index: 2147483647;
      display: grid; place-items: center; padding: 22px;
      background:
        radial-gradient(circle at 18% 10%, #055b8a55, transparent 34%),
        radial-gradient(circle at 82% 88%, #7a32ff4d, transparent 37%),
        #02050bd9;
      backdrop-filter: blur(7px);
      font: 14px/1.5 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .promo {
      position: relative; width: min(980px, 100%); max-height: calc(100vh - 44px);
      overflow: auto; display: grid; grid-template-columns: 1.02fr .98fr;
      border: 1px solid #3198c5aa; border-radius: 24px; color: #ecf8ff;
      background: linear-gradient(145deg, #07111cfb, #081626fb 55%, #110d27fb);
      box-shadow: 0 35px 120px #000e, 0 0 60px #155d8c29, inset 0 1px #ffffff13;
      animation: nxo-promo-enter .38s cubic-bezier(.2,.8,.2,1) both;
    }
    .promo::before {
      content: ""; position: absolute; inset: 0; pointer-events: none; opacity: .14;
      background-image:
        linear-gradient(#3da5ce22 1px, transparent 1px),
        linear-gradient(90deg, #3da5ce22 1px, transparent 1px);
      background-size: 34px 34px;
      mask-image: linear-gradient(110deg, #000, transparent 68%);
    }
    .close {
      position: absolute; z-index: 3; right: 14px; top: 14px;
      width: 36px; height: 36px; border: 1px solid #ffffff19;
      border-radius: 10px; color: #b8c7d7; background: #ffffff0a;
      cursor: pointer; font: 700 20px/1 system-ui, sans-serif;
    }
    .close:hover { color: #fff; border-color: #7adfff66; background: #ffffff12; }
    .copy { position: relative; z-index: 1; padding: 45px 38px 36px; }
    .brand-row { display: flex; align-items: center; gap: 10px; margin-bottom: 32px; }
    .brand-mark {
      width: 38px; height: 38px; display: grid; place-items: center;
      border: 1px solid #41dfff; border-radius: 11px; color: #fff;
      background: linear-gradient(145deg, #0a73a3, #5632ba);
      box-shadow: 0 0 24px #3dcfff3b; font-weight: 950; font-size: 18px;
    }
    .brand-name { color: #f5fbff; font-size: 15px; font-weight: 900; letter-spacing: .03em; }
    .eyebrow { color: #58ddff; font-size: 9px; font-weight: 950; letter-spacing: .17em; }
    h2 { margin: 9px 0 13px; color: #fff; font-size: clamp(32px, 4vw, 51px); line-height: .98; letter-spacing: -.045em; }
    h2 span {
      display: block; margin-top: 7px; color: transparent;
      background: linear-gradient(90deg, #48dcff, #9d7aff 78%);
      background-clip: text; -webkit-background-clip: text;
    }
    .body-copy { max-width: 510px; margin: 0; color: #9eb2c5; font-size: 14px; }
    .benefits { display: grid; gap: 8px; margin: 21px 0 23px; }
    .benefit { display: flex; align-items: center; gap: 9px; color: #d9e9f3; font-size: 12px; font-weight: 700; }
    .benefit i {
      width: 19px; height: 19px; display: grid; place-items: center; flex: 0 0 19px;
      border: 1px solid #49dfff66; border-radius: 50%; color: #57e5ff;
      background: #0b789833; font-style: normal; font-size: 10px;
    }
    .actions { display: flex; flex-wrap: wrap; gap: 9px; }
    .visit, .dismiss, .never { border-radius: 10px; cursor: pointer; font-weight: 850; }
    .visit {
      padding: 12px 16px; border: 1px solid #60e8ff; color: #03141c;
      background: linear-gradient(135deg, #52e5ff, #8a9bff);
      box-shadow: 0 10px 30px #3dccf52b;
    }
    .visit:hover { filter: brightness(1.08); transform: translateY(-1px); }
    .dismiss { padding: 9px 2px; border: 0; color: #788e9e; background: transparent; font-size: 11px; }
    .never { margin-left: 10px; padding: 8px 10px; border: 1px solid #324b5b; color: #9db0bd; background: #09131b; font-size: 10px; }
    .trust { margin: 17px 0 0; color: #658092; font-size: 9px; letter-spacing: .035em; }
    .visual {
      position: relative; min-height: 540px; display: grid; place-items: center;
      padding: 54px 30px 34px; overflow: hidden;
      border-left: 1px solid #204354;
      background:
        radial-gradient(circle at 60% 38%, #175ea75e, transparent 34%),
        radial-gradient(circle at 38% 72%, #7532ba4d, transparent 34%),
        linear-gradient(145deg, #071521, #090d22);
    }
    .visual::after {
      content: ""; position: absolute; width: 340px; height: 340px;
      border: 1px solid #48dfff25; border-radius: 50%;
      box-shadow: 0 0 0 50px #6445ff0b, 0 0 0 100px #39d9ff09;
    }
    .chat {
      position: relative; z-index: 1; width: min(420px, 100%); height: 360px;
      display: grid; grid-template-columns: 118px 1fr; overflow: hidden;
      border: 1px solid #5cd9ff6b; border-radius: 17px;
      background: #08121deb; box-shadow: 0 25px 70px #000b, 0 0 40px #197cb02e;
      transform: perspective(900px) rotateY(-4deg) rotateX(2deg);
    }
    .sidebar { padding: 14px 9px; border-right: 1px solid #1a3d4c; background: #080e18db; }
    .mini-brand { display: flex; align-items: center; gap: 7px; margin: 0 5px 17px; font-weight: 900; }
    .mini-brand b { width: 24px; height: 24px; display: grid; place-items: center; border-radius: 7px; color: #06131a; background: #51ddff; }
    .channel, .friend { display: flex; align-items: center; gap: 7px; padding: 7px; border-radius: 7px; color: #7f9bab; font-size: 9px; }
    .channel.active { color: #e9fbff; background: #2ab9dd1c; }
    .channel mark { margin-left: auto; min-width: 16px; border-radius: 8px; color: #fff; background: #754fe5; text-align: center; }
    .sidebar-label { margin: 17px 7px 5px; color: #526b7b; font-size: 7px; font-weight: 900; letter-spacing: .13em; }
    .friend i { width: 7px; height: 7px; border-radius: 50%; background: #47e69a; box-shadow: 0 0 8px #47e69a; }
    .chat-main { min-width: 0; display: flex; flex-direction: column; }
    .chat-top { height: 48px; display: flex; align-items: center; padding: 0 12px; border-bottom: 1px solid #173746; }
    .chat-top span { display: grid; }
    .chat-top strong { font-size: 10px; }
    .chat-top small { color: #688391; font-size: 7px; }
    .online { margin-left: auto; padding: 4px 7px; border: 1px solid #34da9866; border-radius: 999px; color: #5ce5a8; font-size: 7px; }
    .messages { flex: 1; display: flex; flex-direction: column; justify-content: end; gap: 10px; padding: 15px; }
    .bubble { max-width: 88%; padding: 9px 10px; border-radius: 10px; color: #b8ceda; background: #101f2b; font-size: 9px; }
    .bubble b { display: block; margin-bottom: 3px; color: #58dcff; font-size: 8px; }
    .bubble.own { align-self: end; color: #e8e3ff; background: linear-gradient(135deg, #30376d, #51367a); }
    .bubble.own b { color: #cfbdff; }
    .system { color: #56727f; font-size: 7px; text-align: center; }
    .compose { margin: 0 12px 12px; padding: 10px; border: 1px solid #214455; border-radius: 9px; color: #536e7c; background: #07101a; font-size: 8px; }
    .float-card {
      position: absolute; z-index: 2; right: 18px; bottom: 47px;
      padding: 9px 11px; border: 1px solid #7e61ff70; border-radius: 10px;
      color: #e5dcff; background: #17112ee8; box-shadow: 0 12px 28px #0008;
      font-size: 9px; font-weight: 800;
    }
    .float-card i { display: inline-block; width: 7px; height: 7px; margin-right: 6px; border-radius: 50%; background: #4be39f; box-shadow: 0 0 8px #4be39f; }
    @keyframes nxo-promo-enter {
      from { opacity: 0; transform: translateY(18px) scale(.975); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    @media (max-width: 760px) {
      .backdrop { padding: 10px; }
      .promo { grid-template-columns: 1fr; max-height: calc(100vh - 20px); border-radius: 18px; }
      .copy { padding: 54px 23px 25px; }
      .brand-row { margin-bottom: 23px; }
      h2 { font-size: clamp(31px, 10vw, 44px); }
      .visual { min-height: 330px; padding: 24px 17px 30px; border-left: 0; border-top: 1px solid #204354; }
      .chat { height: 290px; grid-template-columns: 95px 1fr; transform: none; }
      .float-card { right: 10px; bottom: 15px; }
    }
    @media (max-width: 440px) {
      .visual { display: none; }
      .promo { display: block; }
      .actions { display: grid; }
      .visit { width: 100%; }
    }
    @media (prefers-reduced-motion: reduce) {
      .promo { animation: none; }
      .visit:hover { transform: none; }
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

  const pausedLobbyMedia = new Set();
  const pauseLobbyMedia = () => {
    document.querySelectorAll(
      "#background video, #start-menu-wrapper video, #start-overlay video"
    ).forEach((video) => {
      if (!video.paused) {
        pausedLobbyMedia.add(video);
        video.pause();
      }
    });
  };
  const resumeLobbyMedia = () => {
    for (const video of pausedLobbyMedia) {
      if (video.isConnected) video.play().catch(() => {});
    }
    pausedLobbyMedia.clear();
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
  let currentPlaying = false;
  let pageVisible = document.visibilityState !== "hidden";
  let shadow;
  let panel;
  let launcher;
  let uiHost;
  let promoShadow;
  let frameRequest = 0;
  let metricsTimer = 0;
  let longTaskObserver = null;
  let metricsActive = false;
  let autoTuneTimer = 0;

  const deviceSignature = [
    navigator.hardwareConcurrency || 0,
    navigator.deviceMemory || 0,
    `${screen.width}x${screen.height}`,
    nativeDpr
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

  const percentile = (values, fraction) => {
    if (!values.length) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.min(sorted.length - 1, Math.ceil(sorted.length * fraction) - 1);
    return sorted[Math.max(0, index)];
  };

  const frameSample = (now) => {
    if (!metricsActive) return;
    metrics.frames.push(now);
    const cutoff = now - 5000;
    while (metrics.frames.length && metrics.frames[0] < cutoff) metrics.frames.shift();
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

  const updateMetrics = () => {
    const now = performance.now();
    metrics.fps = metrics.frames.filter((time) => time >= now - 1000).length;
    metrics.peakFps = Math.max(metrics.peakFps, metrics.fps);
    const intervals = [];
    for (let index = 1; index < metrics.frames.length; index += 1) {
      intervals.push(metrics.frames[index] - metrics.frames[index - 1]);
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

  const shouldCollectMetrics = () => Boolean(
    pageVisible
    && !promoShadow
    && (
      (panel && !panel.hidden)
      || (autoTunePending && !currentPlaying)
    )
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
    if (shouldCollectMetrics()) startMetricCollection();
    else stopMetricCollection();
    if (launcher) {
      launcher.hidden = Boolean(
        currentPlaying
        && saved.enabled
        && saved.sleepMonitorInGame
        && panel?.hidden
      );
      if (!metricsActive) launcher.textContent = "N·ECO";
    }
  };

  const finishAutoTune = () => {
    autoTuneTimer = 0;
    if (!autoTunePending || currentPlaying || !pageVisible || !metricsActive) return;
    updateMetrics();
    const intervals = [];
    for (let index = 1; index < metrics.frames.length; index += 1) {
      const interval = metrics.frames[index] - metrics.frames[index - 1];
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
    writeJson(AUTO_TUNE_KEY, autoTuneReport);
    writeJson(SETTINGS_KEY, saved);
    applyPageFlags();
    renderUi();
    syncMetricCollection();
  };

  const scheduleAutoTune = () => {
    clearTimeout(autoTuneTimer);
    autoTuneTimer = 0;
    if (!autoTunePending || currentPlaying || !pageVisible) return;
    autoTuneTimer = window.setTimeout(finishAutoTune, 4000);
  };

  const detectPlaying = () => {
    const game = document.getElementById("game-area-wrapper");
    const playing = Boolean(game && getComputedStyle(game).display !== "none");
    document.documentElement.dataset.nxoPlaying = String(playing);
    if (playing && !currentPlaying) pauseLobbyMedia();
    if (!playing && currentPlaying) resumeLobbyMedia();
    if (playing && !currentPlaying && saved.enabled && saved.competitiveMode && panel) {
      togglePanel(false);
    }
    currentPlaying = playing;
    syncMetricCollection();
    scheduleAutoTune();
  };

  const restoreBaselineNow = () => {
    const captured = readJson(BASELINE_KEY, null);
    const config = readJson(GAME_CONFIG_KEY, {});
    if (captured?.values) {
      Object.assign(config, captured.values);
      writeJson(GAME_CONFIG_KEY, config);
    }
  };

  const openExternal = (url) => {
    const opened = window.open(url, "_blank", "noopener,noreferrer");
    if (opened) opened.opener = null;
  };

  const copyText = async (value) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        return true;
      }
    } catch {
      // The local fallback below still works when Clipboard API permission is denied.
    }
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.style.cssText = "position:fixed;left:-10000px;top:0;opacity:0";
    (document.body || document.documentElement).appendChild(textarea);
    textarea.select();
    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch {
      copied = false;
    }
    textarea.remove();
    return copied;
  };

  const showToast = (message, tone = "ok") => {
    const toast = shadow?.getElementById("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.dataset.tone = tone;
    toast.hidden = false;
    clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => {
      if (toast.isConnected) toast.hidden = true;
    }, 2800);
  };
  showToast.timer = 0;

  const formatPerformanceReport = () => {
    const text = copy();
    const labels = text.reportLabels;
    const fps = metrics.fps || autoTuneReport?.fps || 0;
    const low = metrics.onePercentLow || autoTuneReport?.onePercentLow || 0;
    const p95 = metrics.p95 || autoTuneReport?.p95 || 0;
    const profile = text.profileNames[saved.preset] || text.customProfile;
    return [
      `${labels.title} · v${VERSION}`,
      `${labels.game}: ${location.hostname}`,
      `${labels.profile}: ${profile}`,
      `${labels.target}: ${saved.targetFps || 75} FPS`,
      `${labels.fps}: ${fps ? Math.round(fps) : labels.unavailable}`,
      `${labels.low}: ${low ? Math.round(low) : labels.unavailable}`,
      `${labels.p95}: ${p95 ? `${Number(p95).toFixed(1)} ms` : labels.unavailable}`,
      `${labels.rendering}: ${earlyDiagnostics.applied.renderAt1x ? "1x" : `${earlyDiagnostics.nativeDpr}x DPR`}`,
      `${labels.textures}: ${earlyDiagnostics.applied.lowResTextures ? "low" : "high"}`,
      `${labels.communityProfile}: ${profileCodeFor(saved)}`,
      REPOSITORY_URL
    ].join("\n");
  };

  const formatDiagnostics = () => JSON.stringify({
    product: "Nexus 75 Optimizer",
    version: VERSION,
    game: location.hostname,
    language: saved.language,
    profile: saved.preset,
    targetFps: saved.targetFps || 75,
    metrics: {
      fps: metrics.fps || null,
      onePercentLow: metrics.onePercentLow
        ? Number(metrics.onePercentLow.toFixed(1))
        : null,
      p95FrameMs: metrics.p95 ? Number(metrics.p95.toFixed(2)) : null,
      longTasks: metrics.longTasks
    },
    startup: {
      nativeDpr: earlyDiagnostics.nativeDpr,
      lowResTextures: earlyDiagnostics.applied.lowResTextures,
      renderAt1x: earlyDiagnostics.applied.renderAt1x,
      interpolation: earlyDiagnostics.applied.interpolation,
      regionMode: earlyDiagnostics.applied.regionMode
    },
    autoTune: autoTuneReport
      ? {
          displayHz: autoTuneReport.displayHz,
          recommended: autoTuneReport.recommended
        }
      : null,
    communityProfile: profileCodeFor(saved),
    privacy: "No account, nickname, IP address, game packets or persistent device identifier included."
  }, null, 2);

  const renderCommunityPrompt = () => {
    const prompt = shadow?.getElementById("feedback-prompt");
    if (prompt) prompt.hidden = !feedbackPromptVisible;
  };

  const renderNexusUtility = () => {
    const card = shadow?.getElementById("nexus-utility");
    if (card) card.hidden = !nexusUtilityVisible;
  };

  const recordSuccessfulSession = () => {
    if (
      successfulSessionCounted
      || !saved.enabled
      || metrics.fps <= 0
      || metrics.frames.length < 30
      || metrics.fps < (saved.targetFps || 75) * 0.8
    ) return;
    successfulSessionCounted = true;
    community.successfulSessions = Math.min(
      999,
      Math.max(0, Number(community.successfulSessions) || 0) + 1
    );
    if (
      community.successfulSessions >= COMMUNITY_SUCCESS_THRESHOLD
      && !community.feedbackAsked
    ) {
      community.feedbackAsked = true;
      feedbackPromptVisible = true;
    }
    writeJson(COMMUNITY_KEY, community);
    renderCommunityPrompt();
  };

  const importProfileCode = (value) => {
    const imported = parseProfileCode(value);
    if (!imported) return false;
    draft = {
      ...draft,
      ...Object.fromEntries(PROFILE_KEYS.map((key) => [key, imported[key]])),
      preset: imported.preset,
      targetFps: imported.targetFps,
      language: saved.language
    };
    renderDraft();
    return true;
  };

  const renderDraft = () => {
    if (!shadow) return;
    shadow.querySelectorAll("[data-setting]").forEach((input) => {
      input.checked = Boolean(draft[input.dataset.setting]);
    });
    shadow.querySelectorAll("[data-preset]").forEach((button) => {
      button.classList.toggle("active", button.dataset.preset === draft.preset);
    });
    const profileInput = shadow.getElementById("profile-code");
    if (profileInput && shadow.activeElement !== profileInput) {
      profileInput.value = profileCodeFor(draft);
    }
  };

  const renderDiagnostics = () => {
    if (!shadow) return;
    const target = shadow.getElementById("diagnostics");
    if (!target) return;
    const text = copy();
    const applied = earlyDiagnostics.applied;
    const parts = [
      `${text.nativeDpr}: ${earlyDiagnostics.nativeDpr}`,
      `${text.textures}: ${applied.lowResTextures ? text.yes : text.no}`,
      `${text.render}: ${applied.renderAt1x ? text.yes : text.no}`,
      `${text.interpolation}: ${applied.interpolation ? text.yes : text.no}`,
      `${text.region}: ${text.regionModes[applied.regionMode] || text.regionModes.automatic}`
    ];
    if (autoTuneReport) {
      parts.push(`Auto: ${text.presetNames[autoTuneReport.recommended]} · ${autoTuneReport.displayHz} Hz`);
    } else if (autoTunePending) {
      parts.push(text.autoCalibrating);
    } else {
      parts.push(saved.autoTune ? text.autoCurrent : text.autoOff);
    }
    target.textContent = parts.join("  ·  ");
  };

  const renderMetrics = () => {
    if (!shadow) return;
    const text = copy();
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
    set("aux-label", saved.competitiveMode ? text.inputFrame : text.stats[3]);
    const effectiveTarget = saved.targetFps || 75;
    const healthy = metrics.fps >= effectiveTarget * 0.94;
    const probable60Hz = metrics.peakFps >= 55 && metrics.peakFps <= 65;
    const passiveRtt = Number(navigator.connection?.rtt) || 0;
    const rtt = passiveRtt ? text.rtt(passiveRtt) : "";
    const status = shadow.getElementById("status");
    if (status) {
      status.textContent = saved.enabled && saved.competitiveMode
        ? text.competitiveStatus(effectiveTarget, rtt)
        : healthy
          ? text.stable(effectiveTarget)
          : probable60Hz
            ? text.sixtyHz
            : text.measuringTarget(effectiveTarget);
    }
    if (launcher) {
      launcher.dataset.health = healthy ? "good" : "warn";
      launcher.textContent = metrics.fps ? `N·${metrics.fps}` : "N·75";
      launcher.title = `Nexus 75 Optimizer · ${text.panelHint}`;
    }
    if (healthy) recordSuccessfulSession();
  };

  const createOption = (key, [title, description]) => {
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

  const renderUi = () => {
    if (!shadow || !panel) return;
    const text = copy();
    panel.innerHTML = `
      <header class="header">
        <div class="header-line">
          <div>
            <div class="eyebrow">TAMPERMONKEY PERFORMANCE // V${VERSION}</div>
            <h1>Nexus 75 Optimizer</h1>
            <div class="site">${location.hostname} · ${text.panelHint}</div>
          </div>
          <select class="language" id="language" aria-label="${text.language}">
            <option value="en">EN</option>
            <option value="es">ES</option>
          </select>
        </div>
      </header>
      <div class="body">
        <div class="stats">
          <div class="stat"><b id="fps">0</b><span>${text.stats[0]}</span></div>
          <div class="stat"><b id="low">—</b><span>${text.stats[1]}</span></div>
          <div class="stat"><b id="p95">—</b><span>${text.stats[2]}</span></div>
          <div class="stat"><b id="aux">0</b><span id="aux-label">${text.stats[3]}</span></div>
        </div>
        <div class="status" id="status">${text.measuring}</div>
        <div class="release-note" id="release-note" ${changelogVisible ? "" : "hidden"}>
          <strong>${text.changelogTitle}</strong>
          <ul>${text.changelogItems.map((item) => `<li>${item}</li>`).join("")}</ul>
          <div class="inline-actions">
            <button class="community-button" id="dismiss-changelog">${text.changelogDismiss}</button>
            <button class="community-button" data-url="${CHANGELOG_URL}">${text.viewChangelog}</button>
          </div>
        </div>
        <div class="section-title">${text.mode}</div>
        <div class="presets" id="presets"></div>
        <div class="section-title">${text.controls}</div>
        <div id="options"></div>
        <details open>
          <summary>${text.howTitle}</summary>
          <div class="how-grid">${text.how.map(([title, body]) => `
            <div class="how-card"><strong>${title}</strong><span>${body}</span></div>
          `).join("")}</div>
        </details>
        <details id="community-hub">
          <summary>${text.communityTitle}</summary>
          <div class="community-body">
            <p class="community-intro">${text.communityIntro}</p>
            <div class="community-links">
              <button class="community-button primary" data-url="${NEXUS_CHAT_URL}">${text.exploreNexus}</button>
              <button class="community-button" data-url="${DISCORD_URL}">${text.joinDiscord}</button>
              <button class="community-button" data-url="${BUG_REPORT_URL}">${text.reportBug}</button>
              <button class="community-button" data-url="${FEATURE_REQUEST_URL}">${text.requestFeature}</button>
              <button class="community-button" data-url="${CHANGELOG_URL}">${text.viewChangelog}</button>
              <button class="community-button" id="promo-toggle">${isPromoDisabled() ? text.promoEnable : text.promoDisable}</button>
            </div>
            <div class="community-tools">
              <button class="community-button" id="copy-result">${text.copyResult}</button>
              <button class="community-button" id="copy-diagnostics">${text.copyDiagnostics}</button>
            </div>
            <div class="profile-box">
              <label for="profile-code">${text.profileCode}</label>
              <input class="profile-input" id="profile-code" autocomplete="off" spellcheck="false">
              <div class="profile-actions">
                <button class="community-button" id="copy-profile">${text.copyProfile}</button>
                <button class="community-button" id="import-profile">${text.importProfile}</button>
              </div>
              <p class="profile-hint">${text.profileHint}</p>
            </div>
            <p class="manual-updates">${text.manualUpdates}</p>
            <div class="community-card" id="nexus-utility" ${nexusUtilityVisible ? "" : "hidden"}>
              <strong>${text.nexusUtilityTitle}</strong>
              <p>${text.nexusUtilityBody}</p>
              <button class="community-button primary" data-url="${NEXUS_CHAT_URL}">${text.exploreNexus}</button>
            </div>
          </div>
        </details>
        <div class="feedback-card" id="feedback-prompt" ${feedbackPromptVisible ? "" : "hidden"}>
          <strong>${text.feedbackTitle}</strong>
          <p>${text.feedbackBody}</p>
          <div class="inline-actions">
            <button class="community-button primary" data-url="${GREASY_FORK_FEEDBACK_URL}" data-feedback-close>${text.leaveFeedback}</button>
            <button class="community-button" data-url="${BUG_REPORT_URL}" data-feedback-close>${text.reportBug}</button>
            <button class="community-button" id="dismiss-feedback">${text.feedbackNotNow}</button>
          </div>
        </div>
        <div class="actions">
          <button class="apply" id="apply">${text.apply}</button>
          <button class="tune" id="retune">${text.calibrate}</button>
          <button class="restore" id="restore">${text.original}</button>
        </div>
        <div class="diagnostics" id="diagnostics">${text.diagPending}</div>
        <div class="note">${text.note}</div>
        <div class="toast" id="toast" hidden></div>
      </div>
    `;

    const language = shadow.getElementById("language");
    language.value = saved.language;
    language.addEventListener("change", () => {
      saved.language = language.value === "es" ? "es" : "en";
      draft.language = saved.language;
      writeJson(SETTINGS_KEY, saved);
      renderUi();
      renderPromo();
    });

    const presets = shadow.getElementById("presets");
    Object.keys(PRESETS).forEach((name) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "preset";
      button.dataset.preset = name;
      button.textContent = text.presetNames[name];
      button.addEventListener("click", () => {
        draft = { ...draft, ...PRESETS[name], preset: name };
        renderDraft();
      });
      presets.appendChild(button);
    });

    const options = shadow.getElementById("options");
    Object.entries(text.options).forEach(([key, definition]) => {
      options.appendChild(createOption(key, definition));
    });

    shadow.querySelectorAll("[data-url]").forEach((button) => {
      button.addEventListener("click", () => {
        openExternal(button.dataset.url);
        if (button.hasAttribute("data-feedback-close")) {
          feedbackPromptVisible = false;
          renderCommunityPrompt();
        }
      });
    });
    shadow.getElementById("dismiss-changelog").addEventListener("click", () => {
      changelogVisible = false;
      shadow.getElementById("release-note").hidden = true;
    });
    shadow.getElementById("dismiss-feedback").addEventListener("click", () => {
      feedbackPromptVisible = false;
      renderCommunityPrompt();
    });
    shadow.getElementById("promo-toggle").addEventListener("click", (event) => {
      const disabled = !isPromoDisabled();
      setPromoDisabled(disabled);
      event.currentTarget.textContent = disabled ? text.promoEnable : text.promoDisable;
      showToast(disabled ? text.promoDisabled : text.promoEnabled);
    });
    shadow.getElementById("copy-result").addEventListener("click", async () => {
      const copied = await copyText(formatPerformanceReport());
      if (!copied) {
        showToast(text.copyFailed, "error");
        return;
      }
      nexusUtilityVisible = true;
      shadow.getElementById("community-hub").open = true;
      renderNexusUtility();
      showToast(text.copiedResult);
    });
    shadow.getElementById("copy-diagnostics").addEventListener("click", async () => {
      const copied = await copyText(formatDiagnostics());
      showToast(copied ? text.copiedDiagnostics : text.copyFailed, copied ? "ok" : "error");
    });
    shadow.getElementById("copy-profile").addEventListener("click", async () => {
      const profileInput = shadow.getElementById("profile-code");
      const code = profileCodeFor(draft);
      profileInput.value = code;
      const copied = await copyText(code);
      if (!copied) {
        profileInput.focus();
        profileInput.select();
      }
      showToast(copied ? text.copiedProfile : text.copyFailed, copied ? "ok" : "error");
    });
    shadow.getElementById("import-profile").addEventListener("click", () => {
      const profileInput = shadow.getElementById("profile-code");
      const imported = importProfileCode(profileInput.value);
      showToast(imported ? text.importedProfile : text.invalidProfile, imported ? "ok" : "error");
    });
    shadow.getElementById("apply").addEventListener("click", () => {
      saved = { ...DEFAULTS, ...draft };
      writeJson(SETTINGS_KEY, saved);
      if (!saved.enabled) restoreBaselineNow();
      location.reload();
    });
    shadow.getElementById("restore").addEventListener("click", () => {
      draft = {
        ...draft,
        ...PRESETS.original,
        preset: "original",
        language: saved.language
      };
      saved = { ...DEFAULTS, ...draft };
      writeJson(SETTINGS_KEY, saved);
      restoreBaselineNow();
      location.reload();
    });
    shadow.getElementById("retune").addEventListener("click", () => {
      saved = { ...DEFAULTS, ...draft, enabled: true, autoTune: true };
      try {
        localStorage.removeItem(AUTO_TUNE_KEY);
      } catch {
        // Reload still starts a calibration in the current tab.
      }
      writeJson(SETTINGS_KEY, saved);
      location.reload();
    });
    renderDraft();
    renderDiagnostics();
    renderMetrics();
    renderCommunityPrompt();
    renderNexusUtility();
  };

  const buildUi = (open = true) => {
    if (panel) {
      panel.hidden = !open;
      syncMetricCollection();
      return;
    }
    const host = document.createElement("div");
    host.id = "nxo-userscript-root";
    host.hidden = Boolean(promoShadow);
    if (promoShadow) host.style.display = "none";
    (document.body || document.documentElement).appendChild(host);
    uiHost = host;
    shadow = host.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = UI_STYLE;
    shadow.appendChild(style);
    launcher = document.createElement("button");
    launcher.className = "launcher";
    launcher.type = "button";
    launcher.textContent = "N·75";
    launcher.addEventListener("click", () => togglePanel());
    shadow.appendChild(launcher);
    panel = document.createElement("section");
    panel.className = "panel";
    panel.hidden = !open;
    shadow.appendChild(panel);
    renderUi();
    syncMetricCollection();
  };

  function togglePanel(force) {
    if (!panel) {
      if (force === false) return;
      buildUi(true);
      return;
    }
    const shouldOpen = force ?? panel.hidden;
    panel.hidden = !shouldOpen;
    syncMetricCollection();
  }

  const dismissPromo = () => {
    const host = document.getElementById("nxo-nexus-chat-promo");
    host?.remove();
    promoShadow = null;
    if (uiHost) {
      uiHost.hidden = false;
      uiHost.style.removeProperty("display");
    }
    syncMetricCollection();
    scheduleAutoTune();
  };

  const openNexusChat = () => openExternal(NEXUS_CHAT_URL);

  const renderPromo = () => {
    if (!promoShadow) return;
    const text = TEXT.en;
    const preview = text.promoPreview;
    promoShadow.innerHTML = `
      <style>${PROMO_STYLE}</style>
      <div class="backdrop">
        <aside class="promo" role="dialog" aria-modal="true" aria-label="${text.promoTitle} ${text.promoAccent}">
          <button class="close" type="button" aria-label="${text.promoClose}">×</button>
          <section class="copy">
            <div class="brand-row">
              <span class="brand-mark">N</span>
              <span class="brand-name">Nexus Chat</span>
            </div>
            <div class="eyebrow">${text.promoEyebrow}</div>
            <h2>${text.promoTitle}<span>${text.promoAccent}</span></h2>
            <p class="body-copy">${text.promoBody}</p>
            <div class="benefits">
              ${text.promoBenefits.map((benefit) => `<div class="benefit"><i>✓</i><span>${benefit}</span></div>`).join("")}
            </div>
            <div class="actions">
              <button class="visit" type="button">${text.promoAction} ↗</button>
            </div>
            <button class="dismiss" type="button">${text.promoDismiss}</button>
            <button class="never" type="button">${text.promoNever}</button>
            <p class="trust">${text.promoTrust}</p>
          </section>
          <section class="visual" aria-label="Nexus Chat interface preview">
            <div class="chat">
              <aside class="sidebar">
                <div class="mini-brand"><b>N</b><span>Nexus</span></div>
                <div class="channel active"><span>#</span><span>${preview.match}</span></div>
                <div class="channel"><span>◎</span><span>${preview.global}</span><mark>3</mark></div>
                <div class="sidebar-label">${preview.friends}</div>
                <div class="friend"><i></i><span>Nova</span></div>
                <div class="friend"><i></i><span>Raven</span></div>
              </aside>
              <div class="chat-main">
                <div class="chat-top">
                  <span><strong># ${preview.match}</strong><small>${preview.room}</small></span>
                  <b class="online">${preview.online}</b>
                </div>
                <div class="messages">
                  <div class="bubble"><b>The fine</b>${preview.first}</div>
                  <div class="bubble own"><b>${preview.player}</b>${preview.second}</div>
                  <div class="system">Nexus ID · NX-7A21F0 · Synced</div>
                </div>
                <div class="compose">${preview.placeholder}</div>
              </div>
            </div>
            <div class="float-card"><i></i>Nova is online</div>
          </section>
        </aside>
      </div>
    `;
    promoShadow.querySelector(".close").addEventListener("click", dismissPromo);
    promoShadow.querySelector(".dismiss").addEventListener("click", dismissPromo);
    promoShadow.querySelector(".never").addEventListener("click", () => {
      setPromoDisabled(true);
      dismissPromo();
    });
    promoShadow.querySelector(".visit").addEventListener("click", () => {
      openNexusChat();
      dismissPromo();
    });
  };

  const showPromo = () => {
    const host = document.createElement("div");
    host.id = "nxo-nexus-chat-promo";
    (document.body || document.documentElement).appendChild(host);
    promoShadow = host.attachShadow({ mode: "open" });
    renderPromo();
  };

  const showPromoAtFirstPaint = () => {
    if (!promoDueThisVisit) return;
    if (document.documentElement) {
      showPromo();
      return;
    }
    const rootObserver = new MutationObserver(() => {
      if (!document.documentElement) return;
      rootObserver.disconnect();
      showPromo();
    });
    rootObserver.observe(document, { childList: true });
  };

  const init = () => {
    if (!document.getElementById("nxo-page-style")) {
      const style = document.createElement("style");
      style.id = "nxo-page-style";
      style.textContent = PAGE_STYLE;
      (document.head || document.documentElement).appendChild(style);
    }
    applyPageFlags();
    buildUi(true);
    detectPlaying();
    const game = document.getElementById("game-area-wrapper");
    if (game) {
      new MutationObserver(detectPlaying).observe(game, {
        attributes: true,
        attributeFilter: ["class", "style"]
      });
    }
    syncMetricCollection();
    scheduleAutoTune();
  };

  document.addEventListener("visibilitychange", () => {
    pageVisible = document.visibilityState !== "hidden";
    if (!pageVisible) {
      clearTimeout(autoTuneTimer);
      autoTuneTimer = 0;
      stopMetricCollection();
    } else {
      metrics.frames.length = 0;
      syncMetricCollection();
      scheduleAutoTune();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "F8" && !event.repeat) {
      event.preventDefault();
      event.stopPropagation();
      togglePanel();
    }
  }, true);

  showPromoAtFirstPaint();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
