// ==UserScript==
// @name         YugiFaux DuelingBook Companion (Phase 1 POC)
// @namespace    https://github.com/xtremetyler/yugifaux-duelingbook-companion
// @version      0.1.0
// @description  Player-controlled YugiFaux presentation proof of concept for DuelingBook.
// @author       YugiFaux
// @license      MIT
// @homepageURL  https://github.com/xtremetyler/yugifaux-duelingbook-companion
// @supportURL   https://github.com/xtremetyler/yugifaux-duelingbook-companion/issues
// @updateURL    https://raw.githubusercontent.com/xtremetyler/yugifaux-duelingbook-companion/main/dist/yugifaux-companion.user.js
// @downloadURL  https://raw.githubusercontent.com/xtremetyler/yugifaux-duelingbook-companion/main/dist/yugifaux-companion.user.js
// @match        https://www.duelingbook.com/*
// @run-at       document-idle
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.xmlHttpRequest
// @connect      raw.githubusercontent.com
// ==/UserScript==

(() => {
  "use strict";

  const APP = Object.freeze({
    name: "YugiFaux Companion",
    version: "0.1.0",
    configUrl: "https://raw.githubusercontent.com/xtremetyler/yugifaux-duelingbook-companion/main/config/companion.sample.json",
    ids: Object.freeze({
      button: "yf-companion-button",
      panel: "yf-companion-panel",
      overlay: "yf-animation-overlay"
    })
  });

  const DEFAULT_SETTINGS = Object.freeze({
    enabled: true,
    animationsEnabled: true,
    muted: true,
    diagnosticsEnabled: false,
    reducedMotion: globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false
  });

  class Diagnostics {
    #entries = [];
    #enabled = false;
    #listeners = new Set();

    setEnabled(enabled) {
      this.#enabled = Boolean(enabled);
      this.info("diagnostics", this.#enabled ? "enabled" : "disabled", {}, true);
    }

    subscribe(listener) {
      this.#listeners.add(listener);
      return () => this.#listeners.delete(listener);
    }

    info(area, message, details = {}, force = false) {
      if (!this.#enabled && !force) return;
      this.#record("info", area, message, details);
    }

    warn(area, message, details = {}) {
      this.#record("warn", area, message, details);
    }

    error(area, message, details = {}) {
      this.#record("error", area, message, details);
    }

    list() {
      return [...this.#entries];
    }

    #record(level, area, message, details) {
      const safeDetails = {};
      for (const [key, value] of Object.entries(details)) {
        if (["password", "cookie", "token", "authorization"].includes(key.toLowerCase())) continue;
        safeDetails[key] = typeof value === "string" ? value.slice(0, 300) : value;
      }
      this.#entries.push({ at: new Date().toISOString(), level, area, message, details: safeDetails });
      if (this.#entries.length > 100) this.#entries.shift();
      for (const listener of this.#listeners) listener(this.list());
    }
  }

  class SafeStorage {
    async get(key, fallback) {
      try {
        return await GM.getValue(`yf:${key}`, fallback);
      } catch {
        return fallback;
      }
    }

    async set(key, value) {
      await GM.setValue(`yf:${key}`, value);
    }
  }

  const BUNDLED_CONFIG = Object.freeze({
    schemaVersion: 1,
    dataVersion: "bundled-poc-1",
    minimumCoreVersion: "0.1.0",
    featureFlags: { panel: true, eventObserver: true, animations: true },
    allowedAssetHosts: ["raw.githubusercontent.com", "res.cloudinary.com"],
    animations: [
      {
        id: "yf-test-dragon-special-summon",
        trigger: { eventType: "special-summon", cardName: "YugiFaux Test Dragon" },
        presentation: { title: "YugiFaux Test Dragon", subtitle: "Special Summon", theme: "gold", durationMs: 2600 },
        frequency: "once-per-duel"
      }
    ]
  });

  const isPlainObject = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);

  function validateConfig(value) {
    const errors = [];
    if (!isPlainObject(value)) return { valid: false, errors: ["Configuration must be an object."] };
    if (value.schemaVersion !== 1) errors.push("Unsupported schemaVersion.");
    if (typeof value.dataVersion !== "string" || !value.dataVersion.trim()) errors.push("dataVersion is required.");
    if (!isPlainObject(value.featureFlags)) errors.push("featureFlags must be an object.");
    if (!Array.isArray(value.allowedAssetHosts)) errors.push("allowedAssetHosts must be an array.");
    if (!Array.isArray(value.animations)) errors.push("animations must be an array.");

    for (const [index, item] of (value.animations ?? []).entries()) {
      if (!isPlainObject(item) || typeof item.id !== "string") errors.push(`animations[${index}].id is required.`);
      if (!isPlainObject(item?.trigger)) errors.push(`animations[${index}].trigger is required.`);
      if (typeof item?.trigger?.eventType !== "string") errors.push(`animations[${index}].trigger.eventType is required.`);
      if (typeof item?.trigger?.cardName !== "string") errors.push(`animations[${index}].trigger.cardName is required.`);
      if (!isPlainObject(item?.presentation)) errors.push(`animations[${index}].presentation is required.`);
      if (item?.presentation?.assetUrl) {
        try {
          const url = new URL(item.presentation.assetUrl);
          if (url.protocol !== "https:" || !(value.allowedAssetHosts ?? []).includes(url.hostname)) {
            errors.push(`animations[${index}] uses an unapproved asset host.`);
          }
        } catch {
          errors.push(`animations[${index}].presentation.assetUrl is invalid.`);
        }
      }
    }
    return { valid: errors.length === 0, errors };
  }

  class ConfigLoader {
    constructor(storage, diagnostics) {
      this.storage = storage;
      this.diagnostics = diagnostics;
    }

    async load() {
      try {
        const remote = await this.#requestJson(APP.configUrl);
        const result = validateConfig(remote);
        if (!result.valid) throw new Error(result.errors.join(" "));
        await this.storage.set("config-cache", { config: remote, fetchedAt: new Date().toISOString() });
        this.diagnostics.info("config", "remote configuration loaded", { dataVersion: remote.dataVersion });
        return { config: remote, source: "remote", fetchedAt: new Date().toISOString() };
      } catch (error) {
        this.diagnostics.warn("config", "remote configuration unavailable", { reason: String(error?.message ?? error) });
        const cached = await this.storage.get("config-cache", null);
        if (cached?.config && validateConfig(cached.config).valid) {
          return { config: cached.config, source: "cache", fetchedAt: cached.fetchedAt ?? null };
        }
        return { config: BUNDLED_CONFIG, source: "bundled", fetchedAt: null };
      }
    }

    #requestJson(url) {
      return new Promise((resolve, reject) => {
        GM.xmlHttpRequest({
          method: "GET",
          url,
          timeout: 8000,
          headers: { Accept: "application/json" },
          onload: (response) => {
            if (response.status < 200 || response.status >= 300) return reject(new Error(`HTTP ${response.status}`));
            try {
              resolve(JSON.parse(response.responseText));
            } catch {
              reject(new Error("Remote configuration is not valid JSON."));
            }
          },
          ontimeout: () => reject(new Error("Configuration request timed out.")),
          onerror: () => reject(new Error("Configuration request failed."))
        });
      });
    }
  }

  const EVENT_PHRASES = Object.freeze([
    ["normal-summon", /\bnormal summon(?:ed|s|ing)?\b/i],
    ["special-summon", /\bspecial summon(?:ed|s|ing)?\b/i],
    ["fusion-summon", /\bfusion summon(?:ed|s|ing)?\b/i],
    ["synchro-summon", /\bsynchro summon(?:ed|s|ing)?\b/i],
    ["xyz-summon", /\bxyz summon(?:ed|s|ing)?\b/i],
    ["link-summon", /\blink summon(?:ed|s|ing)?\b/i],
    ["activation", /\bactivate(?:d|s|ing)?\b/i],
    ["attack", /\b(?:attack(?:ed|s|ing)?|declared an attack)\b/i]
  ]);

  const normalizeLine = (value) => value.replace(/\s+/g, " ").trim();

  function classifyPublicLogLine(text) {
    const normalized = normalizeLine(text);
    if (!normalized) return null;
    const match = EVENT_PHRASES.find(([, pattern]) => pattern.test(normalized));
    return match ? { type: match[0], text: normalized } : null;
  }

  class PublicDuelLogObserver {
    constructor(diagnostics, onEvent) {
      this.diagnostics = diagnostics;
      this.onEvent = onEvent;
      this.logObserver = null;
      this.pageObserver = null;
      this.root = null;
      this.seen = new Set();
      this.scanQueued = false;
    }

    start() {
      this.#attachIfAvailable();
      this.pageObserver = new MutationObserver(() => this.#attachIfAvailable());
      this.pageObserver.observe(document.body, { childList: true, subtree: true });
    }

    stop() {
      this.logObserver?.disconnect();
      this.pageObserver?.disconnect();
      this.logObserver = null;
      this.pageObserver = null;
      this.root = null;
      this.seen.clear();
    }

    #attachIfAvailable() {
      const nextRoot = document.querySelector("#duel_log .log_txt");
      if (!nextRoot || nextRoot === this.root) return;
      this.logObserver?.disconnect();
      this.root = nextRoot;
      this.seen.clear();
      this.#scan(true);
      this.logObserver = new MutationObserver(() => this.#queueScan());
      this.logObserver.observe(nextRoot, { childList: true, characterData: true, subtree: true });
      this.diagnostics.info("observer", "attached to public duel log", { selector: "#duel_log .log_txt" });
    }

    #queueScan() {
      if (this.scanQueued) return;
      this.scanQueued = true;
      queueMicrotask(() => {
        this.scanQueued = false;
        this.#scan(false);
      });
    }

    #scan(seedOnly) {
      if (!this.root) return;
      const lines = this.root.innerText.split(/\r?\n/).map(normalizeLine).filter(Boolean);
      if (lines.length === 0) this.seen.clear();
      const occurrences = new Map();
      for (const line of lines) {
        const normalizedKey = line.toLocaleLowerCase();
        const occurrence = (occurrences.get(normalizedKey) ?? 0) + 1;
        occurrences.set(normalizedKey, occurrence);
        const fingerprint = `${normalizedKey}::${occurrence}`;
        if (this.seen.has(fingerprint)) continue;
        this.seen.add(fingerprint);
        if (seedOnly) continue;
        const event = classifyPublicLogLine(line);
        if (event) {
          this.diagnostics.info("observer", "public duel event detected", { type: event.type, text: event.text });
          this.onEvent(event);
        }
      }
    }
  }

  class AnimationPlayer {
    constructor(diagnostics, getSettings) {
      this.diagnostics = diagnostics;
      this.getSettings = getSettings;
      this.played = new Set();
    }

    resetDuel() {
      this.played.clear();
    }

    handle(event, config) {
      const settings = this.getSettings();
      if (!settings.enabled || !settings.animationsEnabled || !config.featureFlags?.animations) return;
      const animation = config.animations.find((item) =>
        item.trigger.eventType === event.type &&
        event.text.toLocaleLowerCase().includes(item.trigger.cardName.toLocaleLowerCase())
      );
      if (!animation) return;
      if (animation.frequency === "once-per-duel" && this.played.has(animation.id)) return;
      this.played.add(animation.id);
      this.#play(animation, settings).catch((error) => {
        this.diagnostics.error("animation", "animation skipped after a playback failure", { id: animation.id, reason: String(error?.message ?? error) });
      });
    }

    async #play(animation, settings) {
      document.getElementById(APP.ids.overlay)?.remove();
      const overlay = document.createElement("div");
      overlay.id = APP.ids.overlay;
      overlay.className = settings.reducedMotion ? "yf-reduced-motion" : "";
      overlay.setAttribute("aria-hidden", "true");

      const flare = document.createElement("div");
      flare.className = "yf-animation-flare";
      const cardName = document.createElement("strong");
      cardName.textContent = animation.presentation.title;
      const subtitle = document.createElement("span");
      subtitle.textContent = animation.presentation.subtitle ?? "";
      flare.append(cardName, subtitle);
      overlay.append(flare);
      document.body.append(overlay);

      const duration = settings.reducedMotion ? 900 : Math.min(Math.max(animation.presentation.durationMs ?? 2400, 500), 8000);
      this.diagnostics.info("animation", "animation played", { id: animation.id, duration });
      await new Promise((resolve) => setTimeout(resolve, duration));
      overlay.remove();
    }
  }

  const STYLE = `
    #${APP.ids.button} { position: fixed; left: 18px; bottom: 18px; z-index: 2147483645; border: 1px solid #d6b55b; border-radius: 999px; background: #111827; color: #f8e7aa; padding: 9px 13px; font: 700 13px/1 Arial,sans-serif; cursor: pointer; box-shadow: 0 4px 16px #0008; }
    #${APP.ids.panel} { position: fixed; left: 18px; bottom: 62px; z-index: 2147483646; box-sizing: border-box; width: min(350px, calc(100vw - 36px)); max-height: min(570px, calc(100vh - 90px)); overflow: auto; border: 1px solid #d6b55b; border-radius: 10px; background: #111827f5; color: #f8fafc; padding: 14px; font: 13px/1.4 Arial,sans-serif; box-shadow: 0 10px 34px #000b; }
    #${APP.ids.panel}[hidden] { display: none; }
    #${APP.ids.panel} h2 { margin: 0 0 4px; color: #f8e7aa; font-size: 18px; }
    #${APP.ids.panel} p { margin: 4px 0 10px; color: #cbd5e1; }
    #${APP.ids.panel} label { display: flex; gap: 8px; align-items: center; margin: 8px 0; }
    #${APP.ids.panel} button { margin: 7px 6px 0 0; border: 1px solid #64748b; border-radius: 5px; background: #1e293b; color: #fff; padding: 7px 9px; cursor: pointer; }
    #${APP.ids.panel} .yf-status { margin: 10px 0; padding: 8px; border-radius: 5px; background: #0f172a; }
    #${APP.ids.panel} .yf-diagnostics { max-height: 150px; overflow: auto; white-space: pre-wrap; color: #a7f3d0; font: 11px/1.35 Consolas,monospace; }
    #${APP.ids.overlay} { pointer-events: none; position: fixed; inset: 0; z-index: 2147483644; display: grid; place-items: center; overflow: hidden; background: radial-gradient(circle, #fff2 0, #020617cc 60%); animation: yf-overlay-in .3s ease-out both; }
    #${APP.ids.overlay} .yf-animation-flare { display: grid; place-items: center; min-width: min(680px, 90vw); min-height: 180px; border-block: 2px solid #f8d36b; color: white; background: linear-gradient(90deg, transparent, #7c2d12dd 20%, #111827ee 50%, #7c2d12dd 80%, transparent); text-align: center; animation: yf-flare 2.6s cubic-bezier(.2,.8,.2,1) both; }
    #${APP.ids.overlay} strong { display: block; color: #fff3bd; font: 800 clamp(26px,5vw,58px)/1.05 Georgia,serif; text-shadow: 0 2px 2px #000,0 0 22px #f59e0b; }
    #${APP.ids.overlay} span { display: block; margin-top: 10px; letter-spacing: .25em; text-transform: uppercase; font: 700 14px/1 Arial,sans-serif; }
    #${APP.ids.overlay}.yf-reduced-motion { animation: none; background: #020617dd; }
    #${APP.ids.overlay}.yf-reduced-motion .yf-animation-flare { animation: none; }
    @keyframes yf-overlay-in { from { opacity: 0 } to { opacity: 1 } }
    @keyframes yf-flare { 0% { opacity: 0; transform: scale(.82) } 18%,75% { opacity: 1; transform: scale(1) } 100% { opacity: 0; transform: scale(1.04) } }
  `;

  class CompanionUI {
    constructor(storage, diagnostics, getState, actions) {
      this.storage = storage;
      this.diagnostics = diagnostics;
      this.getState = getState;
      this.actions = actions;
      this.status = null;
      this.diagnosticOutput = null;
    }

    mount() {
      if (document.getElementById(APP.ids.button)) return;
      const style = document.createElement("style");
      style.textContent = STYLE;
      document.head.append(style);

      const button = document.createElement("button");
      button.id = APP.ids.button;
      button.type = "button";
      button.textContent = "YF";
      button.title = "Open YugiFaux Companion";

      const panel = document.createElement("section");
      panel.id = APP.ids.panel;
      panel.hidden = true;
      panel.setAttribute("aria-label", "YugiFaux Companion controls");

      const heading = document.createElement("h2");
      heading.textContent = APP.name;
      const intro = document.createElement("p");
      intro.textContent = "Phase 1 passive event-observation proof of concept.";
      this.status = document.createElement("div");
      this.status.className = "yf-status";
      panel.append(heading, intro, this.status);

      const settings = this.getState().settings;
      panel.append(
        this.#checkbox("Companion enabled", "enabled", settings.enabled),
        this.#checkbox("Animations enabled", "animationsEnabled", settings.animationsEnabled),
        this.#checkbox("Mute audio", "muted", settings.muted),
        this.#checkbox("Reduced motion", "reducedMotion", settings.reducedMotion),
        this.#checkbox("Diagnostics", "diagnosticsEnabled", settings.diagnosticsEnabled)
      );

      const test = document.createElement("button");
      test.type = "button";
      test.textContent = "Simulate test summon";
      test.addEventListener("click", () => this.actions.simulate());
      const reload = document.createElement("button");
      reload.type = "button";
      reload.textContent = "Check league data";
      reload.addEventListener("click", () => this.actions.reloadConfig());
      const disable = document.createElement("button");
      disable.type = "button";
      disable.textContent = "Emergency disable";
      disable.addEventListener("click", () => this.actions.emergencyDisable());

      this.diagnosticOutput = document.createElement("div");
      this.diagnosticOutput.className = "yf-diagnostics";
      panel.append(test, reload, disable, this.diagnosticOutput);
      button.addEventListener("click", () => { panel.hidden = !panel.hidden; });
      document.body.append(button, panel);
      this.diagnostics.subscribe((entries) => this.#renderDiagnostics(entries));
      this.refresh();
    }

    refresh() {
      if (!this.status) return;
      const { configState, settings } = this.getState();
      this.status.textContent = `Core ${APP.version} • Data ${configState?.config?.dataVersion ?? "loading"} • ${configState?.source ?? "loading"} • ${settings.enabled ? "active" : "disabled"}`;
      for (const input of document.querySelectorAll(`#${APP.ids.panel} input[data-setting]`)) {
        input.checked = Boolean(settings[input.dataset.setting]);
      }
      this.#renderDiagnostics(this.diagnostics.list());
    }

    #checkbox(labelText, key, checked) {
      const label = document.createElement("label");
      const input = document.createElement("input");
      input.type = "checkbox";
      input.dataset.setting = key;
      input.checked = checked;
      input.addEventListener("change", () => this.actions.updateSetting(key, input.checked));
      label.append(input, document.createTextNode(labelText));
      return label;
    }

    #renderDiagnostics(entries) {
      if (!this.diagnosticOutput) return;
      const enabled = this.getState().settings.diagnosticsEnabled;
      this.diagnosticOutput.hidden = !enabled;
      this.diagnosticOutput.textContent = enabled
        ? entries.slice(-12).map((entry) => `${entry.at.slice(11, 19)} ${entry.level.toUpperCase()} ${entry.area}: ${entry.message}`).join("\n")
        : "";
    }
  }

  const diagnostics = new Diagnostics();
  const storage = new SafeStorage();
  const state = { settings: { ...DEFAULT_SETTINGS }, configState: null };
  let ui;
  let logObserver;
  let animationPlayer;

  async function persistSettings() {
    await storage.set("settings", state.settings);
  }

  async function reloadConfig() {
    state.configState = await new ConfigLoader(storage, diagnostics).load();
    ui?.refresh();
  }

  function handlePublicEvent(event) {
    if (!state.settings.enabled) return;
    animationPlayer.handle(event, state.configState?.config ?? BUNDLED_CONFIG);
  }

  async function start() {
    state.settings = { ...DEFAULT_SETTINGS, ...(await storage.get("settings", {})) };
    diagnostics.setEnabled(state.settings.diagnosticsEnabled);
    animationPlayer = new AnimationPlayer(diagnostics, () => state.settings);
    logObserver = new PublicDuelLogObserver(diagnostics, handlePublicEvent);
    logObserver.start();

    ui = new CompanionUI(storage, diagnostics, () => state, {
      simulate() {
        animationPlayer.resetDuel();
        handlePublicEvent({ type: "special-summon", text: "Test Player Special Summoned YugiFaux Test Dragon" });
      },
      reloadConfig,
      async emergencyDisable() {
        state.settings.enabled = false;
        state.settings.animationsEnabled = false;
        document.getElementById(APP.ids.overlay)?.remove();
        await persistSettings();
        diagnostics.warn("safety", "companion disabled by player");
        ui.refresh();
      },
      async updateSetting(key, value) {
        state.settings[key] = value;
        if (key === "diagnosticsEnabled") diagnostics.setEnabled(value);
        if (key === "enabled" && !value) document.getElementById(APP.ids.overlay)?.remove();
        await persistSettings();
        ui.refresh();
      }
    });
    ui.mount();
    await reloadConfig();
    diagnostics.info("bootstrap", "companion initialized", { coreVersion: APP.version });
  }

  start().catch((error) => {
    console.warn("YugiFaux Companion failed safely:", error);
  });

})();
