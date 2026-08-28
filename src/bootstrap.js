(() => {
  "use strict";

  const APP = Object.freeze({
    name: "YugiFaux Companion",
    version: "0.13.0",
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
      chainToast: "yf-chain-macros-toast",
      customMacroButton: "yf-custom-macros-button",
      customMacroMenu: "yf-custom-macros-menu",
      customMacroEditor: "yf-custom-macros-editor",
      customMacroToast: "yf-custom-macros-toast",
      markerButton: "yf-markers-button",
      markerPanel: "yf-markers-panel",
      markerToast: "yf-markers-toast",
      markerBadgeLayer: "yf-markers-badge-layer"
    })
  });

  const DEFAULT_SETTINGS = Object.freeze({
    enabled: true,
    animationsEnabled: true,
    muted: true,
    visualThemeEnabled: true,
    diagnosticsEnabled: false,
    customMacrosEnabled: false,
    reducedMotion: globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false
  });
