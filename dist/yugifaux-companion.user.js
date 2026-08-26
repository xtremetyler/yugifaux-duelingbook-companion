// ==UserScript==
// @name         YugiFaux DuelingBook Companion (Phase 1 POC)
// @namespace    https://github.com/xtremetyler/yugifaux-duelingbook-companion
// @version      0.2.0
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
    version: "0.2.0",
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
    dataVersion: "bundled-poc-2",
    minimumCoreVersion: "0.2.0",
    featureFlags: { panel: true, eventObserver: true, animations: true },
    allowedAssetHosts: ["raw.githubusercontent.com", "res.cloudinary.com"],
    animations: [
      {
        id: "ash-blossom-lonely-spring-effect",
        trigger: { eventType: "effect-declaration", cardName: "Ash Blossom & Lonely Spring" },
        presentation: {
          preset: "petal-bloom-v1",
          assetUrl: "https://res.cloudinary.com/vosvpv50/image/upload/f_auto,q_auto/ash_blossomm",
          title: "Ash Blossom & Lonely Spring",
          subtitle: "Effect Declared",
          accentColor: "#f3a6c8",
          durationMs: 3600
        },
        frequency: "every-event"
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
      if (!["title-card-v1", "petal-bloom-v1"].includes(item?.presentation?.preset ?? "title-card-v1")) {
        errors.push(`animations[${index}].presentation.preset is unsupported.`);
      }
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
    ["effect-declaration", /(?:\b(?:declare(?:d|s|ing)?|announc(?:ed|es|ing)?)\b.*(?:\beffect\b|$)|\beffect\b.*\bactivate(?:d|s|ing)?\b)/i],
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
      const presentation = animation.presentation;
      const supportedPresets = new Set(["title-card-v1", "petal-bloom-v1"]);
      const preset = supportedPresets.has(presentation.preset) ? presentation.preset : "title-card-v1";
      const art = presentation.assetUrl ? await this.#loadImage(presentation.assetUrl) : null;
      const overlay = document.createElement("div");
      overlay.id = APP.ids.overlay;
      overlay.className = `yf-preset-${preset}${settings.reducedMotion ? " yf-reduced-motion" : ""}`;
      overlay.setAttribute("aria-hidden", "true");

      if (preset === "petal-bloom-v1" && !settings.reducedMotion) {
        const petals = document.createElement("div");
        petals.className = "yf-petals";
        for (let index = 0; index < 28; index += 1) {
          const petal = document.createElement("i");
          petal.className = "yf-petal";
          petal.style.setProperty("--yf-start-y", `${(index * 37) % 105 - 10}vh`);
          petal.style.setProperty("--yf-delay", `${-((index * 17) % 34) / 10}s`);
          petal.style.setProperty("--yf-duration", `${2.5 + ((index * 13) % 16) / 10}s`);
          petal.style.setProperty("--yf-size", `${8 + ((index * 11) % 15)}px`);
          petal.style.setProperty("--yf-curve", `${((index * 19) % 35) - 17}vh`);
          petals.append(petal);
        }
        overlay.append(petals);
      }

      const stage = document.createElement("div");
      stage.className = "yf-animation-stage";
      if (art) {
        art.className = "yf-animation-art";
        art.alt = "";
        stage.append(art);
      }
      const nameplate = document.createElement("div");
      nameplate.className = "yf-animation-nameplate";
      const cardName = document.createElement("strong");
      cardName.textContent = presentation.title;
      const subtitle = document.createElement("span");
      subtitle.textContent = presentation.subtitle ?? "";
      nameplate.append(cardName, subtitle);
      stage.append(nameplate);
      overlay.style.setProperty("--yf-accent", presentation.accentColor ?? "#f8d36b");
      overlay.append(stage);
      document.body.append(overlay);

      const duration = settings.reducedMotion ? 1200 : Math.min(Math.max(presentation.durationMs ?? 2400, 500), 8000);
      this.diagnostics.info("animation", "animation played", { id: animation.id, duration });
      await new Promise((resolve) => setTimeout(resolve, duration));
      overlay.remove();
    }

    #loadImage(url) {
      return new Promise((resolve, reject) => {
        const image = new Image();
        const timeout = setTimeout(() => reject(new Error("Artwork load timed out.")), 8000);
        image.decoding = "async";
        image.referrerPolicy = "no-referrer";
        image.addEventListener("load", () => {
          clearTimeout(timeout);
          resolve(image);
        }, { once: true });
        image.addEventListener("error", () => {
          clearTimeout(timeout);
          reject(new Error("Artwork could not be loaded."));
        }, { once: true });
        image.src = url;
      });
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
    #${APP.ids.overlay} { --yf-accent: #f8d36b; pointer-events: none; position: fixed; inset: 0; z-index: 2147483644; display: grid; place-items: center; overflow: hidden; background: radial-gradient(circle at 50% 45%, color-mix(in srgb, var(--yf-accent) 28%, transparent) 0, #020617e8 66%); animation: yf-overlay-in .3s ease-out both; }
    #${APP.ids.overlay}.yf-preset-petal-bloom-v1::before { content: ""; position: absolute; inset: -20%; background: conic-gradient(from 100deg at 50% 50%, transparent, #f9a8d455, transparent 30%, #fbcfe855, transparent 60%); filter: blur(28px); animation: yf-pink-light 3.6s ease-in-out both; }
    #${APP.ids.overlay} .yf-animation-stage { position: relative; width: min(1040px, 92vw); height: min(760px, 78vh); display: grid; place-items: center; }
    #${APP.ids.overlay} .yf-animation-art { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 12px 18px #000a) drop-shadow(0 0 24px color-mix(in srgb, var(--yf-accent) 75%, transparent)); will-change: transform, opacity, filter; animation: yf-art-bloom 3.6s cubic-bezier(.16,.78,.22,1) both; }
    #${APP.ids.overlay} .yf-animation-nameplate { position: absolute; left: 50%; bottom: 3%; width: min(900px, 88vw); transform: translateX(-50%); border-block: 2px solid var(--yf-accent); padding: 15px 28px; color: white; background: linear-gradient(90deg, transparent, #831843dd 18%, #111827f2 50%, #831843dd 82%, transparent); text-align: center; animation: yf-nameplate 3.6s cubic-bezier(.2,.8,.2,1) both; }
    #${APP.ids.overlay} strong { display: block; color: #fff1f7; font: 800 clamp(25px,4.5vw,54px)/1.05 Georgia,serif; text-shadow: 0 2px 2px #000,0 0 22px var(--yf-accent); }
    #${APP.ids.overlay} span { display: block; margin-top: 10px; color: #ffe4ef; letter-spacing: .25em; text-transform: uppercase; font: 700 14px/1 Arial,sans-serif; }
    #${APP.ids.overlay} .yf-petals { position: absolute; inset: 0; overflow: hidden; }
    #${APP.ids.overlay} .yf-petal { --yf-size: 13px; position: absolute; left: -8vw; top: var(--yf-start-y); width: var(--yf-size); height: calc(var(--yf-size) * 1.55); border-radius: 90% 12% 85% 18%; background: radial-gradient(circle at 35% 30%, #fff 0 8%, #fbcfe8 30%, #f472b6 78%, #be185d); box-shadow: 0 0 7px #f9a8d4; opacity: 0; will-change: transform, opacity; animation: yf-petal-flow var(--yf-duration) linear var(--yf-delay) infinite; }
    #${APP.ids.overlay}.yf-reduced-motion { animation: none; background: #020617dd; }
    #${APP.ids.overlay}.yf-reduced-motion .yf-animation-art, #${APP.ids.overlay}.yf-reduced-motion .yf-animation-nameplate { animation: none; }
    @keyframes yf-overlay-in { from { opacity: 0 } to { opacity: 1 } }
    @keyframes yf-art-bloom { 0% { opacity: 0; transform: translate3d(0,12vh,0) scale(.64) rotate(-4deg); filter: blur(12px) brightness(1.8) } 18% { opacity: 1 } 42%,76% { opacity: 1; transform: translate3d(0,-1vh,0) scale(1.02) rotate(0); filter: blur(0) brightness(1.08) } 100% { opacity: 0; transform: translate3d(0,-3vh,0) scale(1.08); filter: blur(2px) brightness(1.25) } }
    @keyframes yf-nameplate { 0%,18% { opacity: 0; transform: translate3d(-50%,28px,0) scaleX(.72) } 32%,78% { opacity: 1; transform: translate3d(-50%,0,0) scaleX(1) } 100% { opacity: 0; transform: translate3d(-50%,-10px,0) scaleX(1.02) } }
    @keyframes yf-petal-flow { 0% { opacity: 0; transform: translate3d(-8vw,0,0) rotate(0deg) } 10%,82% { opacity: .94 } 100% { opacity: 0; transform: translate3d(118vw,var(--yf-curve),0) rotate(820deg) } }
    @keyframes yf-pink-light { 0% { opacity: 0; transform: rotate(-9deg) scale(.82) } 25%,70% { opacity: 1; transform: rotate(4deg) scale(1.04) } 100% { opacity: 0; transform: rotate(12deg) scale(1.12) } }
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
      test.textContent = "Preview Ash Blossom overlay";
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
        handlePublicEvent({ type: "effect-declaration", text: "Test Player declared the effect of Ash Blossom & Lonely Spring" });
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
