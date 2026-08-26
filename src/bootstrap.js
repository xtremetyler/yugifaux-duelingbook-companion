(() => {
  "use strict";

  const APP = Object.freeze({
    name: "YugiFaux Companion",
    version: "0.10.2",
    configUrl: "https://raw.githubusercontent.com/xtremetyler/yugifaux-duelingbook-companion/main/config/companion.sample.json",
    ids: Object.freeze({
      button: "yf-companion-button",
      panel: "yf-companion-panel",
      overlay: "yf-animation-overlay",
      launcher: "yf-match-launcher",
      tokenButton: "yf-token-macros-button",
      tokenModal: "yf-token-macros-modal",
      tokenToast: "yf-token-macros-toast",
      chainButton: "yf-chain-macros-button",
      chainMenu: "yf-chain-macros-menu",
      chainToast: "yf-chain-macros-toast"
    })
  });

  const DEFAULT_SETTINGS = Object.freeze({
    enabled: true,
    animationsEnabled: true,
    muted: true,
    diagnosticsEnabled: false,
    reducedMotion: globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false
  });
