"use strict";

const RULESET_BY_SITE = {
  "survev.io": "lean_survev",
  "resurviv.biz": "lean_resurviv"
};

const rulesetForHost = (host = "") => {
  const normalized = host.toLowerCase();
  return Object.entries(RULESET_BY_SITE).find(
    ([site]) => normalized === site || normalized.endsWith(`.${site}`)
  )?.[1];
};

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "nxo:set-network-quiet") return false;
  const ruleset = rulesetForHost(message.host);
  if (!ruleset) {
    sendResponse({ ok: false, error: "unsupported_host" });
    return false;
  }

  chrome.declarativeNetRequest.getEnabledRulesets().then((enabled) => {
    const active = enabled.includes(ruleset);
    const shouldEnable = Boolean(message.enabled);
    if (active === shouldEnable) return;
    return chrome.declarativeNetRequest.updateEnabledRulesets({
      enableRulesetIds: shouldEnable ? [ruleset] : [],
      disableRulesetIds: shouldEnable ? [] : [ruleset]
    });
  }).then(
    () => sendResponse({ ok: true, ruleset, enabled: Boolean(message.enabled) }),
    (error) => sendResponse({ ok: false, error: String(error) })
  );
  return true;
});
