// ==UserScript==
// @name         YugiFaux DuelingBook Companion (Phase 1 POC)
// @namespace    https://github.com/xtremetyler/yugifaux-duelingbook-companion
// @version      0.12.5
// @description  Player-controlled YugiFaux presentation proof of concept for DuelingBook.
// @author       YugiFaux
// @license      MIT
// @homepageURL  https://github.com/xtremetyler/yugifaux-duelingbook-companion
// @supportURL   https://github.com/xtremetyler/yugifaux-duelingbook-companion/issues
// @updateURL    https://github.com/xtremetyler/yugifaux-duelingbook-companion/raw/refs/heads/main/dist/yugifaux-companion.user.js
// @downloadURL  https://github.com/xtremetyler/yugifaux-duelingbook-companion/raw/refs/heads/main/dist/yugifaux-companion.user.js
// @match        https://www.duelingbook.com/*
// @run-at       document-idle
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.xmlHttpRequest
// @grant        unsafeWindow
// @connect      raw.githubusercontent.com
// ==/UserScript==

(() => {
  "use strict";

  const APP = Object.freeze({
    name: "YugiFaux Companion",
    version: "0.12.5",
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
    diagnosticsEnabled: false,
    customMacrosEnabled: false,
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
    dataVersion: "bundled-poc-8",
    minimumCoreVersion: "0.8.0",
    featureFlags: { panel: true, eventObserver: true, animations: true },
    allowedAssetHosts: ["raw.githubusercontent.com", "res.cloudinary.com", "images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com"],
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
      },
      {
        id: "polyflora-hexbloom-effect",
        trigger: { eventType: "effect-declaration", cardName: "Polyflora Hexbloom" },
        presentation: {
          preset: "arcane-bloom-v1",
          assetUrl: "https://res.cloudinary.com/vosvpv50/image/upload/v1787763973/polyflora.png",
          title: "Polyflora Hexbloom",
          subtitle: "Pendulum Effect Declared",
          accentColor: "#8ee6b0",
          durationMs: 4600
        },
        frequency: "every-event"
      },
      {
        id: "no-way-out-effect-declaration",
        trigger: { eventType: "effect-declaration", cardName: "No Way Out!" },
        presentation: {
          preset: "trap-chase-v1",
          mediaType: "video",
          assetUrl: "https://res.cloudinary.com/vosvpv50/video/upload/v1787765186/i_want_to_animate_this_to_have.mp4",
          title: "No Way Out!",
          subtitle: "Trap Effect Declared",
          accentColor: "#f97316",
          durationMs: 5900,
          playbackRate: 1.75
        },
        frequency: "every-event"
      },
      {
        id: "no-way-out-set-activation",
        trigger: { eventType: "activation", cardName: "No Way Out!" },
        presentation: {
          preset: "trap-chase-v1",
          mediaType: "video",
          assetUrl: "https://res.cloudinary.com/vosvpv50/video/upload/v1787765186/i_want_to_animate_this_to_have.mp4",
          title: "No Way Out!",
          subtitle: "Set Trap Activated",
          accentColor: "#f97316",
          durationMs: 5900,
          playbackRate: 1.75
        },
        frequency: "every-event"
      },
      {
        id: "iris-radiant-infinite-reflections-effect",
        trigger: { eventType: "effect-declaration", cardName: "Iris the Radiant, the Celestial Eye of Infinite Reflections" },
        presentation: {
          preset: "celestial-excavate-v1",
          assetUrl: "https://res.cloudinary.com/vosvpv50/image/upload/v1787768161/iriseff.png",
          cardBackUrl: "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/3bf2e45d-2253-4b84-a45b-fbdec02fcd49/dhh7m81-c2929be0-8eda-42d9-840b-2ceb6ef6c44b.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7InBhdGgiOiIvZi8zYmYyZTQ1ZC0yMjUzLTRiODQtYTQ1Yi1mYmRlYzAyZmNkNDkvZGhoN204MS1jMjkyOWJlMC04ZWRhLTQyZDktODQwYi0yY2ViNmVmNmM0NGIucG5nIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmZpbGUuZG93bmxvYWQiXX0.okP0PGZmLu95xid1AOM3L6jquPM7gfyxle4iIfDsxog",
          title: "Iris the Radiant, the Celestial Eye of Infinite Reflections",
          subtitle: "Three Destinies Reflected",
          accentColor: "#a5f3fc",
          durationMs: 6200
        },
        frequency: "every-event"
      },
      {
        id: "sgt-peppers-lonely-hearts-club-band-effect",
        trigger: { eventType: "effect-declaration", cardName: "Sgt. Pepper's Lonely Hearts Club Band" },
        presentation: {
          preset: "concert-rise-v1",
          assetUrl: "https://res.cloudinary.com/vosvpv50/image/upload/v1787769996/sgt._pepper.png",
          title: "Sgt. Pepper's Lonely Hearts Club Band",
          subtitle: "Effect Declared",
          accentColor: "#facc15",
          durationMs: 4800
        },
        frequency: "every-event"
      },
      {
        id: "painful-preference-activation",
        trigger: { eventType: "activation", cardName: "Painful Preference" },
        presentation: {
          preset: "ice-cream-choice-v1",
          assetUrl: "https://res.cloudinary.com/vosvpv50/image/upload/v1787771135/painfulpref.png",
          title: "Painful Preference",
          subtitle: "Spell Activated",
          accentColor: "#f9a8d4",
          durationMs: 5200
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
      if (!["title-card-v1", "petal-bloom-v1", "arcane-bloom-v1", "trap-chase-v1", "celestial-excavate-v1", "concert-rise-v1", "ice-cream-choice-v1"].includes(item?.presentation?.preset ?? "title-card-v1")) {
        errors.push(`animations[${index}].presentation.preset is unsupported.`);
      }
      if (item?.presentation?.mediaType && !["image", "video"].includes(item.presentation.mediaType)) {
        errors.push(`animations[${index}].presentation.mediaType is unsupported.`);
      }
      if (item?.presentation?.playbackRate !== undefined && (
        typeof item.presentation.playbackRate !== "number" ||
        item.presentation.playbackRate < 0.5 ||
        item.presentation.playbackRate > 3
      )) errors.push(`animations[${index}].presentation.playbackRate is invalid.`);
      for (const assetKey of ["assetUrl", "cardBackUrl"]) {
        if (!item?.presentation?.[assetKey]) continue;
        try {
          const url = new URL(item.presentation[assetKey]);
          if (url.protocol !== "https:" || !(value.allowedAssetHosts ?? []).includes(url.hostname)) {
            errors.push(`animations[${index}] uses an unapproved asset host.`);
          }
        } catch {
          errors.push(`animations[${index}].presentation.${assetKey} is invalid.`);
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
    ["end-phase", /\bentered end phase\b/i],
    ["effect-declaration", /(?:\b(?:declare(?:d|s|ing)?|announc(?:ed|es|ing)?)\b.{0,160}\beffect\b|\beffect\b.{0,160}\bactivate(?:d|s|ing)?\b)/i],
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

  function getNewLogText(previous, current) {
    if (!current || current === previous) return "";
    if (!previous) return current;
    if (current.startsWith(previous)) return current.slice(previous.length);
    if (current.endsWith(previous)) return current.slice(0, current.length - previous.length);

    let prefixLength = 0;
    const prefixLimit = Math.min(previous.length, current.length);
    while (prefixLength < prefixLimit && previous[prefixLength] === current[prefixLength]) prefixLength += 1;

    let suffixLength = 0;
    const suffixLimit = Math.min(previous.length - prefixLength, current.length - prefixLength);
    while (
      suffixLength < suffixLimit &&
      previous[previous.length - 1 - suffixLength] === current[current.length - 1 - suffixLength]
    ) suffixLength += 1;

    return current.slice(prefixLength, current.length - suffixLength);
  }

  class PublicDuelLogObserver {
    constructor(diagnostics, onEvent) {
      this.diagnostics = diagnostics;
      this.onEvent = onEvent;
      this.logObserver = null;
      this.pageObserver = null;
      this.root = null;
      this.snapshot = "";
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
      this.snapshot = "";
    }

    #attachIfAvailable() {
      const nextRoot = document.querySelector("#duel_log .log_txt");
      if (!nextRoot || nextRoot === this.root) return;
      this.logObserver?.disconnect();
      this.root = nextRoot;
      this.snapshot = "";
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
      const current = this.root.innerText;
      if (seedOnly) {
        this.snapshot = current;
        return;
      }

      const addedText = getNewLogText(this.snapshot, current);
      this.snapshot = current;
      const lines = addedText.split(/\r?\n/).map(normalizeLine).filter(Boolean);
      for (const line of lines) {
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
      const previousOverlay = document.getElementById(APP.ids.overlay);
      previousOverlay?.querySelector("video")?.pause();
      previousOverlay?.remove();
      const presentation = animation.presentation;
      const supportedPresets = new Set(["title-card-v1", "petal-bloom-v1", "arcane-bloom-v1", "trap-chase-v1", "celestial-excavate-v1", "concert-rise-v1", "ice-cream-choice-v1"]);
      const preset = supportedPresets.has(presentation.preset) ? presentation.preset : "title-card-v1";
      const mediaType = presentation.mediaType === "video" ? "video" : "image";
      const media = presentation.assetUrl
        ? mediaType === "video"
          ? await this.#loadVideo(presentation.assetUrl, presentation.playbackRate, settings.muted)
          : await this.#loadImage(presentation.assetUrl)
        : null;
      const cardBack = presentation.cardBackUrl ? await this.#loadImage(presentation.cardBackUrl) : null;
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

      if (preset === "arcane-bloom-v1" && !settings.reducedMotion) {
        const field = document.createElement("div");
        field.className = "yf-arcane-field";
        const colors = ["#86efac", "#f9a8d4", "#fb923c", "#60a5fa", "#c084fc"];
        for (let index = 0; index < colors.length; index += 1) {
          const wisp = document.createElement("i");
          wisp.className = "yf-wisp-ring";
          wisp.style.setProperty("--yf-color", colors[index]);
          wisp.style.setProperty("--yf-ring", `${48 + index * 9}vmin`);
          wisp.style.setProperty("--yf-tilt", `${-34 + index * 17}deg`);
          wisp.style.setProperty("--yf-delay", `${index * 0.11}s`);
          field.append(wisp);

          const bloom = document.createElement("b");
          bloom.className = "yf-magic-bloom";
          bloom.textContent = "✿";
          const angle = index * 72 - 90;
          bloom.style.setProperty("--yf-color", colors[index]);
          bloom.style.setProperty("--yf-angle", `${angle}deg`);
          bloom.style.setProperty("--yf-counter-angle", `${-angle}deg`);
          bloom.style.setProperty("--yf-final-angle", `${angle + 35}deg`);
          bloom.style.setProperty("--yf-final-counter-angle", `${-(angle + 35)}deg`);
          bloom.style.setProperty("--yf-delay", `${0.35 + index * 0.13}s`);
          field.append(bloom);
        }
        for (let index = 0; index < 44; index += 1) {
          const dust = document.createElement("i");
          dust.className = "yf-fairy-dust";
          dust.style.setProperty("--yf-color", colors[index % colors.length]);
          dust.style.setProperty("--yf-x", `${(index * 47) % 100}%`);
          dust.style.setProperty("--yf-y", `${18 + ((index * 31) % 72)}%`);
          dust.style.setProperty("--yf-drift-x", `${((index * 29) % 33) - 16}vw`);
          dust.style.setProperty("--yf-drift-y", `${-12 - ((index * 17) % 38)}vh`);
          dust.style.setProperty("--yf-delay", `${((index * 19) % 30) / 10}s`);
          dust.style.setProperty("--yf-size", `${3 + ((index * 7) % 7)}px`);
          field.append(dust);
        }
        overlay.append(field);
      }

      if (preset === "trap-chase-v1" && !settings.reducedMotion) {
        const field = document.createElement("div");
        field.className = "yf-trap-field";
        const stamp = document.createElement("b");
        stamp.className = "yf-trap-stamp";
        stamp.textContent = "TRAP ACTIVATED";
        field.append(stamp);
        for (let index = 0; index < 18; index += 1) {
          const page = document.createElement("i");
          page.className = "yf-trap-page";
          page.style.setProperty("--yf-y", `${8 + ((index * 37) % 78)}%`);
          page.style.setProperty("--yf-delay", `${((index * 13) % 24) / 10}s`);
          page.style.setProperty("--yf-duration", `${1.8 + ((index * 17) % 15) / 10}s`);
          page.style.setProperty("--yf-spin", `${260 + ((index * 43) % 520)}deg`);
          page.style.setProperty("--yf-curve", `${((index * 29) % 33) - 16}vh`);
          field.append(page);
        }
        const frame = document.createElement("div");
        frame.className = "yf-trap-frame";
        field.append(frame);
        const seal = document.createElement("b");
        seal.className = "yf-trap-seal";
        seal.textContent = "NO EXIT";
        field.append(seal);
        overlay.append(field);
      }

      if (preset === "celestial-excavate-v1" && !settings.reducedMotion && cardBack) {
        const field = document.createElement("div");
        field.className = "yf-celestial-field";

        const halo = document.createElement("div");
        halo.className = "yf-celestial-halo";
        field.append(halo);

        if (mediaType === "image" && media) {
          for (const side of ["left", "right"]) {
            const reflection = media.cloneNode();
            reflection.className = `yf-iris-reflection yf-iris-reflection-${side}`;
            reflection.alt = "";
            field.append(reflection);
          }
        }

        for (let index = 0; index < 14; index += 1) {
          const shard = document.createElement("i");
          shard.className = "yf-mirror-shard";
          const radius = 25 + (index % 3) * 6;
          shard.style.setProperty("--yf-angle", `${index * (360 / 14)}deg`);
          shard.style.setProperty("--yf-radius", `${-radius}vmin`);
          shard.style.setProperty("--yf-near-radius", `${-(radius * 0.35)}vmin`);
          shard.style.setProperty("--yf-far-radius", `${-(radius * 1.12)}vmin`);
          shard.style.setProperty("--yf-delay", `${(index % 5) * 0.08}s`);
          field.append(shard);
        }

        for (let index = 0; index < 36; index += 1) {
          const star = document.createElement("i");
          star.className = "yf-celestial-star";
          star.style.setProperty("--yf-x", `${(index * 41) % 98}%`);
          star.style.setProperty("--yf-y", `${(index * 67) % 92}%`);
          star.style.setProperty("--yf-delay", `${((index * 13) % 24) / 10}s`);
          star.style.setProperty("--yf-size", `${2 + ((index * 7) % 6)}px`);
          field.append(star);
        }

        const destinations = [
          ["hand", "ADD TO HAND"],
          ["graveyard", "SEND TO GY"],
          ["banished", "BANISH FACE-DOWN"]
        ];
        for (const [path, labelText] of destinations) {
          const destination = document.createElement("div");
          destination.className = `yf-card-destination yf-destination-${path}`;
          const label = document.createElement("span");
          label.textContent = labelText;
          destination.append(label);
          field.append(destination);

          const excavated = cardBack.cloneNode();
          excavated.className = `yf-excavate-card yf-excavate-${path}`;
          excavated.alt = "";
          field.append(excavated);
        }

        const deck = document.createElement("div");
        deck.className = "yf-excavate-deck";
        for (let index = 0; index < 4; index += 1) {
          const deckCard = cardBack.cloneNode();
          deckCard.alt = "";
          deckCard.style.setProperty("--yf-stack", `${index * -3}px`);
          deck.append(deckCard);
        }
        field.append(deck);
        overlay.append(field);
      }

      if (preset === "concert-rise-v1" && !settings.reducedMotion) {
        const field = document.createElement("div");
        field.className = "yf-concert-field";
        const colors = ["#facc15", "#ef4444", "#60a5fa", "#a78bfa", "#34d399", "#f472b6"];
        const glyphs = ["♪", "♫", "♬", "♩"];

        for (let index = 0; index < 4; index += 1) {
          const spotlight = document.createElement("i");
          spotlight.className = "yf-concert-spotlight";
          spotlight.style.setProperty("--yf-origin-x", `${12 + index * 25}%`);
          spotlight.style.setProperty("--yf-angle", `${-24 + index * 16}deg`);
          spotlight.style.setProperty("--yf-color", colors[(index + 2) % colors.length]);
          spotlight.style.setProperty("--yf-delay", `${index * 0.12}s`);
          field.append(spotlight);
        }

        const equalizer = document.createElement("div");
        equalizer.className = "yf-concert-equalizer";
        for (let index = 0; index < 28; index += 1) {
          const bar = document.createElement("i");
          bar.style.setProperty("--yf-color", colors[index % colors.length]);
          bar.style.setProperty("--yf-height", `${18 + ((index * 31) % 78)}%`);
          bar.style.setProperty("--yf-delay", `${-((index * 7) % 16) / 10}s`);
          equalizer.append(bar);
        }
        field.append(equalizer);

        for (let index = 0; index < 34; index += 1) {
          const note = document.createElement("b");
          note.className = "yf-music-note";
          note.textContent = glyphs[index % glyphs.length];
          note.style.setProperty("--yf-x", `${2 + ((index * 43) % 96)}%`);
          note.style.setProperty("--yf-color", colors[index % colors.length]);
          note.style.setProperty("--yf-delay", `${-((index * 17) % 42) / 10}s`);
          note.style.setProperty("--yf-duration", `${2.4 + ((index * 13) % 21) / 10}s`);
          note.style.setProperty("--yf-size", `${20 + ((index * 11) % 34)}px`);
          note.style.setProperty("--yf-drift", `${((index * 29) % 23) - 11}vw`);
          field.append(note);
        }

        for (let index = 0; index < 3; index += 1) {
          const pulse = document.createElement("i");
          pulse.className = "yf-concert-pulse";
          pulse.style.setProperty("--yf-delay", `${index * 0.42}s`);
          pulse.style.setProperty("--yf-color", colors[index]);
          field.append(pulse);
        }
        overlay.append(field);
      }

      if (preset === "ice-cream-choice-v1" && !settings.reducedMotion) {
        const field = document.createElement("div");
        field.className = "yf-ice-cream-field";
        const questions = [
          ["18%", "26%", "#fff7d6", "-12deg", "0s", "76px"],
          ["82%", "28%", "#f9a8c4", "14deg", ".12s", "88px"],
          ["26%", "63%", "#7c3f22", "9deg", ".24s", "64px"],
          ["74%", "65%", "#fff7d6", "-10deg", ".36s", "70px"],
          ["8%", "48%", "#f9a8c4", "16deg", ".18s", "58px"],
          ["92%", "51%", "#7c3f22", "-15deg", ".3s", "62px"]
        ];

        for (const [x, y, color, tilt, delay, size] of questions) {
          const question = document.createElement("b");
          question.className = "yf-flavor-question";
          question.textContent = "?";
          question.style.setProperty("--yf-x", x);
          question.style.setProperty("--yf-y", y);
          question.style.setProperty("--yf-color", color);
          question.style.setProperty("--yf-tilt", tilt);
          question.style.setProperty("--yf-delay", delay);
          question.style.setProperty("--yf-size", size);
          field.append(question);
        }

        const dilemma = document.createElement("b");
        dilemma.className = "yf-flavor-dilemma";
        dilemma.textContent = "?";
        field.append(dilemma);

        const sprinkleColors = ["#fff7d6", "#7c3f22", "#f9a8c4", "#60a5fa", "#facc15"];
        for (let index = 0; index < 42; index += 1) {
          const sprinkle = document.createElement("i");
          sprinkle.className = "yf-sprinkle";
          sprinkle.style.setProperty("--yf-x", `${(index * 47) % 100}%`);
          sprinkle.style.setProperty("--yf-color", sprinkleColors[index % sprinkleColors.length]);
          sprinkle.style.setProperty("--yf-delay", `${-((index * 17) % 38) / 10}s`);
          sprinkle.style.setProperty("--yf-duration", `${2.2 + ((index * 13) % 18) / 10}s`);
          sprinkle.style.setProperty("--yf-drift", `${((index * 29) % 19) - 9}vw`);
          sprinkle.style.setProperty("--yf-spin", `${240 + ((index * 31) % 420)}deg`);
          field.append(sprinkle);
        }
        overlay.append(field);
      }

      const stage = document.createElement("div");
      stage.className = "yf-animation-stage";
      if (media) {
        media.className = mediaType === "video" ? "yf-animation-video" : "yf-animation-art";
        if (mediaType === "image") media.alt = "";
        stage.append(media);
      }
      const nameplate = document.createElement("div");
      nameplate.className = "yf-animation-nameplate";
      const cardName = document.createElement("strong");
      cardName.textContent = presentation.title;
      const subtitle = document.createElement("span");
      subtitle.textContent = presentation.subtitle ?? "";
      nameplate.append(cardName, subtitle);
      stage.append(nameplate);
      const duration = settings.reducedMotion ? 1200 : Math.min(Math.max(presentation.durationMs ?? 2400, 500), 8000);
      overlay.style.setProperty("--yf-accent", presentation.accentColor ?? "#f8d36b");
      overlay.style.setProperty("--yf-overlay-duration", `${duration}ms`);
      overlay.append(stage);
      document.body.append(overlay);

      if (mediaType === "video" && media && !settings.reducedMotion) {
        try {
          await media.play();
        } catch (error) {
          if (media.muted) throw error;
          media.muted = true;
          await media.play();
          this.diagnostics.warn("animation", "video audio was muted because the browser blocked autoplay", { id: animation.id });
        }
      }
      this.diagnostics.info("animation", "animation played", { id: animation.id, duration });
      await new Promise((resolve) => setTimeout(resolve, duration));
      if (mediaType === "video" && media) media.pause();
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

    #loadVideo(url, playbackRate = 1, muted = true) {
      return new Promise((resolve, reject) => {
        const video = document.createElement("video");
        const safePlaybackRate = Math.min(Math.max(Number(playbackRate) || 1, 0.5), 3);
        const timeout = setTimeout(() => reject(new Error("Video load timed out.")), 12000);
        video.preload = "auto";
        video.playsInline = true;
        video.muted = Boolean(muted);
        video.controls = false;
        video.loop = false;
        video.disablePictureInPicture = true;
        video.defaultPlaybackRate = safePlaybackRate;
        video.referrerPolicy = "no-referrer";
        video.addEventListener("canplay", () => {
          clearTimeout(timeout);
          video.playbackRate = safePlaybackRate;
          resolve(video);
        }, { once: true });
        video.addEventListener("error", () => {
          clearTimeout(timeout);
          reject(new Error("Video could not be loaded."));
        }, { once: true });
        video.src = url;
        video.load();
      });
    }
  }

  const LEAGUE_MATCH_DEFAULTS = Object.freeze({
    formatValue: "cu",
    formatLabel: "Custom Cards (Unrated)",
    matchTypeValue: "m",
    matchTypeLabel: "2 out of 3 Match",
    rulesValue: "*",
    rulesLabel: "TCG + OCG",
    duelNote: "YugiFAUX League Match - DM for info",
    allowWatching: true,
    expertMode: false,
    classicMode: false,
    tagDuel: false
  });

  function validateMatchIdentifier(value) {
    const identifier = String(value ?? "").replace(/\s+/g, " ").trim();
    if (!identifier) return { valid: false, error: "Enter the league match identifier." };
    if (identifier.length > 40) return { valid: false, error: "Use a match identifier of 40 characters or fewer." };
    if (!/^[A-Za-z0-9][A-Za-z0-9 ._#:/-]*$/.test(identifier)) {
      return { valid: false, error: "Use letters, numbers, spaces, or . _ # : / - in the match identifier." };
    }
    return { valid: true, identifier };
  }

  class MatchLauncher {
    constructor(diagnostics) {
      this.diagnostics = diagnostics;
      this.root = null;
      this.currentPlan = null;
    }

    open() {
      this.close();
      this.#renderSetup();
    }

    close() {
      this.root?.remove();
      this.root = null;
      this.currentPlan = null;
    }

    #createShell(titleText) {
      const root = document.createElement("div");
      root.id = APP.ids.launcher;
      root.setAttribute("role", "dialog");
      root.setAttribute("aria-modal", "true");
      root.setAttribute("aria-label", titleText);

      const card = document.createElement("section");
      card.className = "yf-launcher-card";
      const header = document.createElement("header");
      const title = document.createElement("h2");
      title.textContent = titleText;
      const close = document.createElement("button");
      close.type = "button";
      close.className = "yf-launcher-close";
      close.textContent = "×";
      close.setAttribute("aria-label", "Close match launcher");
      close.addEventListener("click", () => this.close());
      header.append(title, close);
      card.append(header);
      root.append(card);
      document.body.append(root);
      this.root = root;
      return card;
    }

    #renderSetup(errorMessage = "") {
      this.root?.remove();
      const card = this.#createShell("Start YugiFAUX Match");
      const intro = document.createElement("p");
      intro.className = "yf-launcher-intro";
      intro.textContent = "Prepare a league-approved Custom Cards match, then review everything before hosting.";

      const form = document.createElement("form");
      form.className = "yf-launcher-form";
      const identifierLabel = document.createElement("label");
      identifierLabel.textContent = "Match identifier";
      const identifier = document.createElement("input");
      identifier.type = "text";
      identifier.maxLength = 40;
      identifier.autocomplete = "off";
      identifier.placeholder = "Example: YF-2026-001";
      identifier.required = true;
      identifierLabel.append(identifier);

      const rulesLabel = document.createElement("label");
      rulesLabel.textContent = "Card pool rules";
      const rules = document.createElement("select");
      for (const [value, labelText] of [["*", "TCG + OCG"], ["TCG", "TCG"], ["OCG", "OCG"]]) {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = labelText;
        rules.append(option);
      }
      rules.value = LEAGUE_MATCH_DEFAULTS.rulesValue;
      rulesLabel.append(rules);

      const watching = this.#checkbox("Allow spectators", LEAGUE_MATCH_DEFAULTS.allowWatching);
      const expert = this.#checkbox("Expert mode", LEAGUE_MATCH_DEFAULTS.expertMode);

      const fixed = document.createElement("dl");
      fixed.className = "yf-launcher-summary";
      this.#appendSummary(fixed, "Format", LEAGUE_MATCH_DEFAULTS.formatLabel);
      this.#appendSummary(fixed, "Match type", LEAGUE_MATCH_DEFAULTS.matchTypeLabel);
      this.#appendSummary(fixed, "Duel note", LEAGUE_MATCH_DEFAULTS.duelNote);
      this.#appendSummary(fixed, "Password", "None");

      const error = document.createElement("p");
      error.className = "yf-launcher-error";
      error.hidden = !errorMessage;
      error.textContent = errorMessage;

      const actions = document.createElement("div");
      actions.className = "yf-launcher-actions";
      const cancel = document.createElement("button");
      cancel.type = "button";
      cancel.textContent = "Cancel";
      cancel.addEventListener("click", () => this.close());
      const review = document.createElement("button");
      review.type = "submit";
      review.className = "yf-primary";
      review.textContent = "Prepare & Review";
      actions.append(cancel, review);

      form.append(identifierLabel, rulesLabel, watching.label, expert.label, fixed, error, actions);
      card.append(intro, form);
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const result = validateMatchIdentifier(identifier.value);
        if (!result.valid) {
          error.hidden = false;
          error.textContent = result.error;
          identifier.focus();
          return;
        }

        review.disabled = true;
        review.textContent = "Preparing…";
        try {
          const plan = await this.#prepareDuelingBook({
            identifier: result.identifier,
            rulesValue: rules.value,
            rulesLabel: rules.selectedOptions[0]?.textContent?.trim() ?? rules.value,
            allowWatching: watching.input.checked,
            expertMode: expert.input.checked
          });
          this.currentPlan = plan;
          this.#renderReview(plan);
        } catch (launcherError) {
          error.hidden = false;
          error.textContent = String(launcherError?.message ?? launcherError);
          review.disabled = false;
          review.textContent = "Prepare & Review";
          this.diagnostics.warn("launcher", "match preparation stopped safely", { reason: error.textContent });
        }
      });
      queueMicrotask(() => identifier.focus());
    }

    #renderReview(plan) {
      this.root?.remove();
      const card = this.#createShell("Review YugiFAUX Match");
      const notice = document.createElement("p");
      notice.className = "yf-launcher-ready";
      notice.textContent = "DuelingBook is prepared. Confirm below to create the host room.";
      const summary = document.createElement("dl");
      summary.className = "yf-launcher-summary yf-launcher-review";
      this.#appendSummary(summary, "Match identifier", plan.identifier);
      this.#appendSummary(summary, "Deck", plan.deckName);
      this.#appendSummary(summary, "Format", LEAGUE_MATCH_DEFAULTS.formatLabel);
      this.#appendSummary(summary, "Match type", LEAGUE_MATCH_DEFAULTS.matchTypeLabel);
      this.#appendSummary(summary, "Rules", plan.rulesLabel);
      this.#appendSummary(summary, "Spectators", plan.allowWatching ? "Allowed" : "Not allowed");
      this.#appendSummary(summary, "Expert mode", plan.expertMode ? "On" : "Off");
      this.#appendSummary(summary, "Classic / Tag", "Off / Off");
      this.#appendSummary(summary, "Duel note", LEAGUE_MATCH_DEFAULTS.duelNote);
      this.#appendSummary(summary, "Password", "None");

      const error = document.createElement("p");
      error.className = "yf-launcher-error";
      error.hidden = true;
      const actions = document.createElement("div");
      actions.className = "yf-launcher-actions";
      const back = document.createElement("button");
      back.type = "button";
      back.textContent = "Back";
      back.addEventListener("click", () => this.#renderSetup());
      const confirm = document.createElement("button");
      confirm.type = "button";
      confirm.className = "yf-primary yf-confirm-host";
      confirm.textContent = "Confirm & Host";
      confirm.addEventListener("click", () => {
        confirm.disabled = true;
        try {
          const hostButton = this.#applyPlan(plan);
          this.diagnostics.info("launcher", "player confirmed league host action", {});
          hostButton.click();
          this.close();
        } catch (launcherError) {
          error.hidden = false;
          error.textContent = String(launcherError?.message ?? launcherError);
          confirm.disabled = false;
          this.diagnostics.warn("launcher", "confirmed host action stopped safely", { reason: error.textContent });
        }
      });
      actions.append(back, confirm);
      card.append(notice, summary, error, actions);
      queueMicrotask(() => confirm.focus());
    }

    async #prepareDuelingBook(options) {
      if (this.#isVisible(document.querySelector("#duel"))) {
        throw new Error("Finish or leave the current duel before starting a league match.");
      }
      if (this.#isVisible(document.querySelector("#hosting")) || this.#isVisible(document.querySelector("#joining"))) {
        throw new Error("Leave the current host or join request before starting another match.");
      }

      if (!this.#isVisible(document.querySelector("#duel_room"))) {
        const roomButton = document.querySelector("#room_btn");
        if (!this.#isVisible(roomButton)) {
          throw new Error("Log in to DuelingBook and return to the main menu first.");
        }
        roomButton.click();
        const opened = await this.#waitFor(() => this.#isVisible(document.querySelector("#duel_room")), 4500);
        if (!opened) throw new Error("DuelingBook did not open the Duel Room. Open it manually and try again.");
      }

      const plan = {
        ...options,
        deckName: this.#getSelectedDeck().label,
        deckValue: this.#getSelectedDeck().value
      };
      this.#applyPlan(plan);
      this.diagnostics.info("launcher", "league match settings prepared for review", {});
      return plan;
    }

    #applyPlan(plan) {
      if (!this.#isVisible(document.querySelector("#duel_room"))) {
        throw new Error("The Duel Room is no longer open.");
      }
      const selectedDeck = this.#getSelectedDeck();
      if (selectedDeck.value !== plan.deckValue) {
        throw new Error("The selected deck changed. Go back and review the match again.");
      }

      const host = document.querySelector("#host");
      if (!host) throw new Error("DuelingBook’s host controls are unavailable.");
      this.#setSelect(host.querySelector(".format_cb"), LEAGUE_MATCH_DEFAULTS.formatValue, "Custom Cards format");
      this.#setSelect(host.querySelector(".type_cb"), LEAGUE_MATCH_DEFAULTS.matchTypeValue, "2 out of 3 match type");
      this.#setSelect(host.querySelector(".rules_cb"), plan.rulesValue, "card pool rules");
      this.#setCheckbox(host.querySelector(".expert_cb"), plan.expertMode, "Expert mode");
      this.#setCheckbox(host.querySelector(".watching_cb"), plan.allowWatching, "spectator setting");
      this.#setCheckbox(host.querySelector(".classic_cb"), LEAGUE_MATCH_DEFAULTS.classicMode, "Classic mode");
      this.#setCheckbox(host.querySelector(".tag_duel_cb"), LEAGUE_MATCH_DEFAULTS.tagDuel, "Tag Duel mode");
      this.#setText(host.querySelector(".duel_note_txt"), LEAGUE_MATCH_DEFAULTS.duelNote, "duel note");
      this.#setText(host.querySelector(".duel_password_txt"), "", "room password");

      const hostButton = host.querySelector(".host_btn");
      if (!(hostButton instanceof HTMLElement) || hostButton.matches(":disabled")) {
        throw new Error("DuelingBook’s Host button is unavailable.");
      }
      return hostButton;
    }

    #getSelectedDeck() {
      const deck = document.querySelector("#decklist_cb");
      const option = deck?.selectedOptions?.[0];
      const value = String(option?.value ?? "").trim();
      const label = String(option?.textContent ?? "").replace(/\s+/g, " ").trim();
      if (!value || !label || option?.disabled) {
        throw new Error("Select a valid deck in DuelingBook before preparing the match.");
      }
      return { value, label };
    }

    #setSelect(control, value, label) {
      if (!(control instanceof HTMLSelectElement) || ![...control.options].some((option) => option.value === value)) {
        throw new Error(`DuelingBook no longer provides the required ${label}.`);
      }
      control.value = value;
      this.#dispatch(control, "input");
      this.#dispatch(control, "change");
    }

    #setCheckbox(control, checked, label) {
      if (!(control instanceof HTMLInputElement) || control.type !== "checkbox") {
        throw new Error(`DuelingBook no longer provides the required ${label}.`);
      }
      control.checked = Boolean(checked);
      this.#dispatch(control, "input");
      this.#dispatch(control, "change");
    }

    #setText(control, value, label) {
      if (!(control instanceof HTMLInputElement)) {
        throw new Error(`DuelingBook no longer provides the required ${label}.`);
      }
      control.value = value;
      this.#dispatch(control, "input");
      this.#dispatch(control, "change");
    }

    #dispatch(control, type) {
      control.dispatchEvent(new Event(type, { bubbles: true }));
    }

    #isVisible(element) {
      if (!(element instanceof HTMLElement) || element.hidden) return false;
      const style = getComputedStyle(element);
      return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0" && element.getClientRects().length > 0;
    }

    #waitFor(predicate, timeoutMs) {
      return new Promise((resolve) => {
        const started = Date.now();
        const check = () => {
          if (predicate()) return resolve(true);
          if (Date.now() - started >= timeoutMs) return resolve(false);
          setTimeout(check, 100);
        };
        check();
      });
    }

    #checkbox(labelText, checked) {
      const label = document.createElement("label");
      label.className = "yf-launcher-check";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = checked;
      label.append(input, document.createTextNode(labelText));
      return { label, input };
    }

    #appendSummary(list, termText, detailText) {
      const term = document.createElement("dt");
      term.textContent = termText;
      const detail = document.createElement("dd");
      detail.textContent = detailText;
      list.append(term, detail);
    }
  }

  const BLOOM_TOKEN_VARIANTS = Object.freeze([
    { carrierId: 1, artworkUrl: "https://res.cloudinary.com/vosvpv50/image/upload/v1787780580/Gemini_Generated_Image_npq6r3npq6r3npq6.jpg" },
    { carrierId: 2, artworkUrl: "https://res.cloudinary.com/vosvpv50/image/upload/v1787780580/a09bf7c0-4288-40d2-8ad6-7c5ebb873de2.jpg" },
    { carrierId: 3, artworkUrl: "https://res.cloudinary.com/vosvpv50/image/upload/v1787780580/579d4b8b-bafb-4723-88d0-f1c93aef848f.jpg" },
    { carrierId: 4, artworkUrl: "https://res.cloudinary.com/vosvpv50/image/upload/v1787780580/efe88690-bf51-48de-b6bb-dadef3a12dc8.jpg" },
    { carrierId: 5, artworkUrl: "https://res.cloudinary.com/vosvpv50/image/upload/v1787780580/042b472f-6020-4abf-beab-404575dc9201.jpg" },
    { carrierId: 6, artworkUrl: "https://res.cloudinary.com/vosvpv50/image/upload/v1787780941/cbfc5a0e-3546-4951-82e0-47515b6903b4.jpg" }
  ]);

  const DRAGON_WARRIOR_TOKEN_VARIANTS = Object.freeze([
    { carrierId: 7, artworkUrl: "https://res.cloudinary.com/vosvpv50/image/upload/v1787783783/Gemini_Generated_Image__34.png" }
  ]);

  const TOKEN_SUMMON_SOUND_DATA_URL = "data:audio/wav;base64,UklGRqS3BQBXQVZFZm10IBAAAAABAAIAgLsAAADuAgAEABAAZGF0YYC3BQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA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AQAFAAwAGAD//wMA4P/9/9z/GgD6/zAACgAnAAIAEwAJABkAEgAqAAEAGQDy//r/8//4//P/BADl//r/3v/f/+3/3P8AAOz/CQDz/w8A8v8cAPH/JwD7/xcABgD0/wkA4f8JAO7/AgD+//L/8P/o/+L/6v/8//X/GQDy/xsA7P8WAPn/FgABAB8AAAAgAAkABQAdAOP/IQDd/xAA8P8HAPr/FQD4/ykAAAAhAA4A/v8TAPr/DwATABUAEAAYAPr//v/0/+H/+f/f////5f////X/+v8EAP7///8JAPb/AAAJAPH/IAAAABAABwDw//H/4P/j/9v/4//e/+j/6P/3//X/AAALAPr/FgDt/wsA6P8UAPX/MgAHADEADQAMAAYA+f8NAAcAJAAPACgAAAATAPT/BQD8/woACAAEAA0A4P8UANL/HwDz/xYADgD+/wYA7//3/+7//v/q/xUA3/8UANf//f/V//b/2/8BAPD/BAAIAPf/EgDt/wsA6f/7//H/+P8KAAYAFgALAA8A8f8JAN3/BQD2/wcAGQAJACMAAAATAP3/AgANAA4ADAAiAO//DgDw/+//FAD3/xcABAD2//X/4P/o//P/9/8QAAwABgAXAOj/FADv/wkADAAKAAsAFwDv/xYA7v8AAAgA7v8KAO7/9v/5//L/AAADAPv/CgDt////7v/5//j/AAD5/wkA+/8RAAMADwAAAAsA7P8LAOr/BwADAAMAFAAHAAEACQDm/wcA7P8HAAsABQAaAAAAEAAEAAcABwAFAPn/BgDs/woA7v8KAP7///8LAPj/+f/6/9v/9f/g//b/+v8OAAYAGgD3/woA4P/8/+P////9/woABQAaAPX/FwDx//X/AADf/wkA+v8PABcAEgASAA0A//8RAPL/FwD1/xcA//8UAPv/FQDw/xQA+P8LAAAA///s//j/4f/6//7/AQARAP7//v/z/+n/8P/5//n/FgD+/w4A9f/p//b/2P8HAOn/AwADAO7/DwDv/wYABgABABAAEwD5/ywA4/80AO7/JwAIABIACgAAAPb/+P/2//P/CgDu/xgA8/8YAPj/DADz////7v////v/AwAXAAQAIgAAAAgA9//y//X/8f/9//T/AwD6/wcAAAASAPj/FQDt/wMA+P/7/wMABgAHAAgAEwD//wsA+P/t//f/7//+/woABAALAAQA+f8AAO//AwDw/wQA/P/4/w8A7P8PAO3/+//0//P/+f/4/+z/AwDi/xAA9f8CAA0A7v8PAPz/AAAUAPv/EgAHAAsADgAeAP7/MADp/x8A8f8AAAwAAgAgABgAIwAEABQA0f8DAMb/BADq/wwA+/8HAOz/9f/m/+H/+f/g/w0A6/8NAPj/AAAEAPX/DADt/w4A5v8WAOL/IAD1/xsAEQAEABIA9P8CAOv/BwDi/xwA4v8mAOn/JADz/xAABQDr/w0A6f8KAAsAEwATABoAAAAMAPn/AgD9/wUAAgD//woA8/8CAPz/8v8MAPL/DwD0//7/8P/u//b/9f///wEA+v////j/7v8FAOX/GgDw/yAAAgAKAAwA9P8MAP3/DgAHABoA+/8dAPH/FQD2/wwA9P8AAPX/9f8DAPL/EwDy/xgA7/8JAOz/8f/u/+r/+v/z/wwA9/8WAPb/DAD2/wIA8v8LAPD/EwAEAAUALgDr/z4A3v8fAOH/BADp/woA8v8NAPn/AAD///n/CwDz/xEA6f8GAOf/AwDt/xIA//8TABEA//8IAPX/9v/5//7//P8JAAEA//8JAPD/DgDs/w0A8v/9/wcA8v8WAP3/DAACAAIA7v8BAOD/BQD5/wsAHgADACUA7v8WAOL/EgDj/xQA6P8DAPf/7/8LAPL/FAD5/xIA6/8PAN7/CgDn/wMA+P/4/wAA6v8EAOb/DwDx/xkAAQAbABAAEwAXAAYAGgD//xgA+f8SAOv/FwDh/xwA6/8KAP7/8f8GAOb/CgDu/wEA/v/y/wUAAAD2/x0A6v8XAPX//f8CAPv/BwALAAEAFQDs/xoA3/8SAOz/AAD+//z/BQD8/wcA9P8DAO//BwDw/xUA8P8ZAPT/DwD+/wYAAwD9/wAA+P8AAP3/DwD6/xcA8P8FAPb/7v8BAOr/AgD3/wUA9v8OAOb/DQDe/wYA5/8CAPb//f/9//n//v/9/woA+v8cAPT/HAAAABoADwAnABIAIwAOAAYADgAAAAkACwD7//v/9v/Y/wEA1f8GAPT/+f8JAOT/BADd//b/7f/2/wsADwASACUA/f8gAPL/FQD8/wgA/v/2//v/9P/5//7/8v/w/+v/0//w/9b/AADz/xMAAgAZAAAAFgAAABsACQAaABYADgAaAAkAFQAHABIA/v8NAPv/AgD2//r/6v///+z/BgD3/wQA9v/8//z/8/8OAOn/EADh/wMA5//7//n/+P8EAP7/AAANAP7/EAAPAAUAJwACAC0ABwAfAA4ACgAYAPr/HQD6/xEABAD3//v/5//b/+//yv/2/9v/5f///8z/FQDG/w0A2P/9//P/CwADACQABQAbAAgA/f8TAOr/GQDo/xYA8/8NAPn/AADu//v/5v/8//H/AQABAAkADAARABMAFAARABUACQAaAAsAJgAVACsAFwAdAA0ABAAFAPn/AgD3//j/7P/p/+j/6f/2//P/+P/x/+P/5//b/+v/5v/7/+//CQDu/xEA5v8YAN7/FwDq/wQA/v/4/wEACgAGACAAEwANABMA4f8WANT/IwD6/xwAIAD//xMA8P/s//j/6v8AAA0A+f8hAO//FAD1/wMACgD9/x4A//8tAAUALQAAABoA+P8DAPn/9//2//f/6P8AAOP//f/s/+j/+P/e////7f/9////AAAGABQABwAlAP//GgDy/wcA7v8IAPP/CwD1//v/8f/t//X/8v////f/BgDw/xQA7f8dAP//EwAUAAYADwACAPn/+P/1/+z/DAD2/yMAAQAiAAAACgAJAPD/GgDr/xgA//8IAAwABQD6/woA1P8IAMr//f/q//L/DADu/wgA6f/s/+b/6//0/wsADwAhAB0AHgAQABQA/f8OAP3/DAAKAAMACAD3//P//f/m/wMA7P/w//v/4/8NAP7/FgAZAAcAEwD9/wMABgAAAAcACwDy/xUA6P8NAPL/AQD1/wUA8f8EAPj/7P8HAOD/DgDz/wMAAgD2//T/+//U/w4Ay/8SAOz/BAAUAP3/GAAEAAAACwD9/xAAHwATAEEACwA0APz/DADz//r/7/8AAO//AQD7//L/AADi//X/3//v/+T/AADm/xkA8/8fABIAEgAiAAMAFAADAAsADAAaAA0AKwADAB4A8v/8/+X/6f/x//H/CAD4/wwA8/////T/8//1/+v/7f/p/+j/7f/w/+z//f/l/wcA6/8FAAIA/P8ZAPv/IQACABYABgAEAAsAAgAGAAwA6/8HAN3/+f/5//j/FAD+/wYAAADn/wgA6f8WABEAGQAzAB0AKgAlAA0AGgAKAAMAGwD//yEAAQAUAPT//v/f/+X/2f/V/+n/2P/9/+r//f8AAO7/AQDp//L/9//r//7/+//x/xUA3v8YAOD//f/z/+v/CAD8/xYADwAbAAoAHAD8/xoAAgARABUABwAWAAgAAwACAP//6v8JANj/CADo//X/CgDq/xgA/v8OABsAEQAUACIA9P8eAO7/CQAKAAQAFgABAPv/8f/Z/+D/0f/b/9//6v/s/woA8/8hAAAAGwAUABEAGQAVABUAFQAgAAQALADw/xcA3f/w/9P/5P/Y//r/5/8JAPr/AAAKAPL/DgDz/wsA/v8RAAYAGAAFAAcAAADn//r/3v/2//D//P/9/wkA+P8PAPb/CQADAAYAFAAJACEACQAlAAEAGAD4/wEA8v/2/+b/9P/b//L/5f/x//7/9f8KAP//CgAPAAoAGQAJABMADAAJABMACAALAAYA9P/0/+n/3v/2/9//AwDy/wQA//8AAPz/AQD3/woABgAQACcADgAwAA4AFQAQAAAAAAAAAOb/8//p/93/CADc/xMA5f/7/+n/6//0////CwATAB4AAgAgAN7/FADR/wgA4f8EAPX/AwD+//n/DQDn/yQA4P8pAPH/FQAFAA0ABQAlAAEALwANAAkAHgDg/xUA4f/4//j/5//7//f/6/8JAOj////8/+//EAAEABIAJgALACYAAwASAPr/CQDv/wMA7//x//z/3/8BAN3/9f/e/+r/3f/z/+f/AgAAAA0AGQANACIAAQAXAPv/DgAHABkAFAAcAAwA//8AANv////S/wMA4v8FAPf/BAABAAEA///6/wAA6f8VANn/JwDj/x8A/f8GAAkA+/8AAAMA+/8PAAwADAAjAP//JAD5/xkABQASABMABwAPAPf/AgD4//r/BAD3/wMA9P/t/+7/5f/r//7/6f8VAOb/CwDw//P/BQDy/wcAAwD6/wAA/v/o/wQA6v/6////8f////T/9v/z/wAA8v8PAPf/BQD6//H/+f/z//7/BgALABMAIwANAC4ACQAUABYA+v8eAAkACwAlAP3/FwAJAPf/CwD5//H/EgDg/xcA7P8CAP3/+P///wMA8v8MAOj/AwD1//f/CwD1/xUA9v8PAPf/AQD7//b//f/8//n/CgDu/wwA4/8EAOr/AgD5/wUA9P8MAOf/EgDx/w4ABgD+/w0A6v8JAOP/BwD0/wkAAwAPAPX/DwDj//3/7f/r/wIA9P8LAAsACwAQAAMAAwD6//j/9v/7//b/DQD7/x0AAwARAAUA/f8EAAUACAAaABkAFwAnAA4AGwAKAAQA/f/+//f//P8EAPn/AQAAAOn/BgDf//r/6//q//n/7f/7/wQA8P8SAOz/+v/8/9X/BwDa/wMA/f8CAAoA/v8EAPP/BgD4/w8ABQAOAAAADADv/xUA6/8ZAPz/BgAPAO7/DgDw/wUAAgASAAQAJgD4/yEA+v8PAAwABwAZAAAADQDy//r/5f/w/+b/7P/u/+f/9v/n/wEA8f8MAP7/EAAAABMAAwATAAsADAAPAAgADgAGAA4A+v8CAPL/7v8AAO3/DgAEAAoAEgAAAAwA+f8CAPb/AAD9/w0A9/8bAN//DwDY//P/5P/k/+7/5//8//T/DgADABMAAwAWAPb/IAD0/xoAAQD//w8A6P8RAOP/CQDu////9//2//L/8//0//r/BAABABcA/P8kAPL/KQD6/x4AEwARACIADwAXAAMAAADw//b/7v/9//L/AQDr//j/7P/3//3/BQALAAQACQDx/wAA8P///wYAAgAPAPz/+f/q/+f/8v/1/xcAEAAgABkA/v8HAO//8/8MAPf/HwAMAAEAEADj/wMA5f/6//T/6//4/+X/9//9//z/CgAEAPT/BQDl//7/+P8AABEACgAeAAUAGgD3/wsA+v8DAAMAAwABAAIA/f8FAAAABAAJAPX/EwDu/xEA+/8GAAwAAAARAAIACwANAA0ADQAWAAAADgD9//3/AwD7/wEA/P/1/+j/8f/V//P/3v/z//X/8/8GAPT/BAD0//X/+f/v////+f8BAAgAAAAOAAIAAAAFAPP/CQAAAAsAFgADACAA+v8YAP7/AAAHAPL/BwAAAAIACQADAAAABQD+/wYA9P8NAOP/EADy/wgAEgADABMAAAD5//r/7f8AAP3/CwAQAAgAEQD9/wAA/v/6/wcACAAEABEA9v8FAOv//v/x/wIAAAAGAPf//v/f//f/6v/5/wkA/v8NAAIA/P8GAPr/AAAEAPb/AAD0/+z/+//g//r/6v/p//j/3//7//D///8OAAkAFgAWAAUAIgAAACUAFAAZACMACQAYAAEAAwAAAPn/BAD6/wgA/P8FAAMAAAASAAAADAAIAPX/CgD5/wYAGAD9/x8A7/8DAOr/6P/1/+P/BADz/wQA9/8AAOT/AwDh/woA8/8QAPX/CgDu//X/9//o/wsA9P8ZAPT/GADc/wYA4f/4/wgAAAAZAA0ACgAGAAUA+/8TAP3/GgAQAAQAGwDl/wkA4f/w//L/6P/z/+v/6//u//P//P8DAA8ADgAOABcAAAAcAAIAFgAcAAgAMgD+/x0AAQD2/wcA7f8DAAIABAAOAAoA+/8FAOT/AQDm/wsA9P8PAAAA/f8MAOr/DwDv/wEA9v/1/+//9P/r//P/+//t/xIA7v8eAPX/FwAAAAcABgAFAPz/CQD7//n/EQDd/xoA1f8EANz/9v/q/wYABgAVAB0ADAAZAP//EAD7/xMABQAKAA4A8P8EANv/9v/W//H/4f/z//P/+v/2/wIA+/8GABwA/P89AOz/MgDs/xgAAwATAB8AEwAVAAMA9P/z/+3/8P8FAPn/FwD+/wsAAQD0/xkA9/8vABMAIwAZAAAA/f/v/+3/8v8AAOv/CADQ//L/w//m/9X/9P/v/wUA+v8DAAEA+v8RAP//GAAQAAwAGQD9/wQA8v/t/+j/8v/k//n/6f/2/+//BQD1/xcACgAMACYA/f81AAMANQAQACgAEgAYAAUADgDn/wYA1f/6//D/7f8LAO7/AwD1//H/+v/x/wsABQAbABkAEwAcAAgACwAJAP3/AQD5/+f//f/V/wYA4f8GAPb/+P/7//f/8v8KAPL/FgADAAwAEQD5/wwA8f8GAPX/AgDz//j/7P/p/+//6v/7//z/+v8AAPD/9//9//v/FgAUACMAJAAWABYA+f8BAO7/AAD//wQACwD4/wAA5v/3/+r/BwACABwADwAbAAsAGAALAB4AFAAZABUA+/8LAOP/BwDv/wcABAD///j/+f/M//3/wv/6/+3/6/8NAOL/AADu/+///v/2/wIADAADABYABAALAAIAAgD//wcA/v8JAAIAAwD9/wYA7f8RAOn/DQD7//r/DADt/wkA9f8BAAsACQARABQAAAASAPT/CgD2/wsA+v8PAP//BwAJAP//DQABAP3/BQDv/wIA9f8AAAoABAAWAAMAAQD2/+v/8f/3//z/DwD9/xYA6/8OAOH/AwD1//n/CwD7/wgADAD7/xIAAQD9/xMA5P8OAN3/+v/q//v/+P8DAPL//f/k//D/5v/s////8v8cAPf/KQD4/xwAAAAJAA8ADAANABoA/P8TAPj/BwADAAYABAAAAP7/8v/4/+//9/8BAAAADAAOAPn/FQDh/xYA6/8PAA4ACwAbABEAAgAXAPH/DgD2////+f/9//f/AgAAAP//BgD5//j/+//o/wAA8f/9/w0A9v8hAPX/DgD2/+z/9P/y//X/EgD2/x0A9P8NAPD/9//0/+j/BwDz/xIAEAADABgA8v////f/4f8GANj/DADs/wUABAD3/wAA7//v//f/+f8DABUAEAAlABMAJwADACcA+P8ZAAQAAAAMAPP//P/z/+//+v/8//7/CgDw/wgA5/8AAPT//v8EAAwACwAXAAwACwAIAAYA+v8PAPX/CAAGAPX/EgDw/wgA+//4//7/9P/2/wIA9/8QAAAADwADAP3/AADo//7/5f////X/+/8EAPL/AADw/+r/+v/p/wcAAwAHABoA/f8cAPj/CQD7//H/AADk/wQA5/8AAPP//v/6/wYA+f8OAO//CQD2//r/GgDv/zUA9f8oAAQAEQAHAA4ABAAVAAwAEwAOAAUABgD3/wcA7/8JAPL/AgD4//n/BgD3/xkAAAAQAAoA7/8BAN//8v/x//3/BwAWAAEAEwDo////3P8BAOn/CAAAAP7/FQDt/xwA5/8KAO3/6v/u/+X/6P8AAOj/EADv//z/8v/d//X/5f8GAA4AFwAwABAALwAAABQABwAAACAABgAjABAABgALAPr/+/8JAOX/EgDc/woA8f8CAAoAAQAHAAAA/P/5/wMA9/8RAP//GQAEABkAAAAJAPr/+P/9//D/BgDs/wQA6v/1/+7/8f/1//3/9f/7/+v/8P/m//f/8f8AAAUA/P8HAPj/9v/8/+7/BgACABIAJQAVADIADQAaAAcAAwAJAAIABQAIAPn/CgD0/wgA7/8CAPD/8f8AAOH/BgDt//D/EgDe/y8A7f8fAAMAAAAJAAgACAAlAAYAIwAHAPf/EwDQ/xwA0/8YAOL/CgDk//r/5v/2/+///v/3/wAA+f/4//7/6/8OAO7/HQAAABQAFAD+/xwA//8SAA4ABAAGAP7/+P/7//X/+P/v/+7/6f/o//T/8f8IAP7/EAAAAP7////q/wgA9P8WABMAFgAlAAMAHADy/w4A+v8OAA8AGAAPAB4A/P8QAPP/9v8FANz/GgDY/w4A8v/1/wQA7//8//P/7P/v/+v/6f/9/+z/FgD0/yAA/P8RAAgA/f8bAAAAKAAOABwACgD///P//f/e/wwA4f8GAPH/8f/2/+X/+P/r/wEA+P8OAAEADwAJAAkADAAOAAUAGwAAABcAAQD6//7/5//q//n/3P8KAOT/AQDy//H/+f/t/wAA/P8MAAkAGQAFABcAAwAKAAYABwD5/wwA6/8DAP3/9f8eAPT/IAD//wIAEQDw/yYA+P8rAAwAHwANABIA+v8GAOX/AADZ//z/4v/k//7/zv8SANX/EAD0/wEADAAGAA8AIAAGACwA//8VAPv/9P/8/+b////n//j/6v/b//L/zv/4//P/9v8dAPr/GgAGAPz/FgD3/x0AFAAVAB8ABAACAPX/7f/y//f/+v////7/9v/2//b/6v8JAPb/GgATABcAJAAIABkABgAEAA0A/P8BAAEA8f8DAPT/AgD8/wIA/v///wEA/f8NAAoAGQAaABoAFAALAPn/+v/f//n/1/8BAOD/9//o/+L/4v/c/97/7P/q/wMAAQAFABUA9v8hAPT/JwAKAB8AGwAIAA0A/P/2/wAA8/8DAPz/+P///+n/AADr/wQA+f8DAAoA+v8dAP3/HAAVAAoAJAAAAA0ACQDq/xgA7P8WAAgA/v8LAOX/9//s//L/BQACAAYADAD7/wYA8v8DAOr/BwDv/wAAAADm/wUA0v/9/+D/8//8//P/BAAAAAwAFQAbAB4AGQANAAoA+f8IAPD/FQD3/xMABgD5/wUA4//v/+7/5P8MAPX/EQAMAPv/EAD2/xEACgAVABYAEgAKAA4A9v8SAO3/FwDv/w0A9v/w//z/2v8AAOL/AAD9////BAAEAPT/EADr/w0A9v/2/wgA3v8WAOD/DQD6//f/CADw/wUA/P8BAAkACgAJAB0A//8gAPT/DQD0/wEAAAAHAAcACQALAPj/BQDs//P/+f/x/wwABwARABMABQAIAAAA+v8NAPT/DwD4//7/BADz/w4A8P8BAOb/8v/f//b/7P8CAAAACQACAAcA8/8AAPX/+/8NAP7/FAAGAPX/EQDX/x0A4/8dAAEAAgAIAPH/9v/8/+z/BQD9//3/GQDp/y8A2f8xAOT/IQAAABMADgAMAAcADAAAAAkAAQD9/wYA8/8TAPj/GQAFAAsACQD2/wMA5/8EAOr/AAD8//P/BQDt//7/6//w/+v/9P/w/wMA7v8LAOf/CwDx/wYACAD8/xYA9/8YAPv/EwACAAAAAQDz//P/9//m//j/8P/x/wkA6P8TAOr/DQAIAAkALwAFADkACAAmABwADwAkAAcADwAMAPn/CwD6//T/CgDa/xQA2v8MAO//8/8AAOj//P/2//L/AAD8//z/DQDx/w0A3v8CANf/9f/o//H/AAD3/wkA/P8GAP7/AgD//wEA/v8NAAEAGgANABAACgDz//f/2//x/+P//f///wEACgAAAAgAAAAJAAYADgAVABcAHAAmABEALQACABsAAAD4/wYA4v8JAOT/AADy/+v/9f/e/+//8f/u/wsA9v8OAAIA/f8RAPH/FwACAA8AGgD8/xEA8f/7////8v8NAPf/BAACAO//CQDp/wEA/P/3/xMA+f8VAP///f8BAOj/CQDx/wkA/v8CAPz/AgD4/wUA+f8FAP7/AQAAAPj/AwDz/xMA/P8kAAMAHAD9/wIA7f/5/+7/AgD2/wYA8P/9/+r/8P/2//H/BwAEAAoAFwAGAB4AAgAZAAMABgAUAPf/IQD5/w4AAADx//3/7P/p/wIA1f8XANj/EwDy/wAACQD9/wMAFQDy/ycA8f8YAAIAAQAQAPT/DQDx/wEA+v/2////8P/6//v/9P8MAPb/EwAAAAkACAD2//3/9P/p/wYA4P8RAOf/BgDw//n/+P/8//z/CAD//xgADwAjAB0AGQASAAQAAQD8//v/AAD3/w0A7v8VAOb/BgDp/+P/9f/L/wkA2P8eAPj/IQACABsA9v8dAOz/IQD8/xsAEwAHABsA7v8bAOD/EgDu//3/AQDs//r/7v/t//7/+P///wYA5/8IANv////7//L/KQDl/y4A5P8QAPn/BQANABIACQAXAP7/BwAAAPD/EADh/xsA4P8WAO7/CQD5//n/+//u/wAA8f8CAPj//f/8/wcA/v8VAAcAEAAbAAIAKQD+/yMA/f8VAP7/DwAIAAUAFADm/xMAzP8HANb/9v/n//P/6f8AAO////8CAOj/EwDU/xUA4P8QAAUABAAbAPz/EQD+//7/+//7//f/BgD9/w8AAAAOAP//AQAMAOr/JgDe/x8A6P/2/wAA4f8QAPH/AwACAO//9v/+/9z/KgDj/zoACAAVABwA9v8YAPj/GwD//yMA+/8QAPj/7//9/+f/AwDw//z/6v/x/9v//v/k/xsABAAYABIA9v8JAO7/DgACABsADAAWAAEAAgDy//j/7P/5//b/+v8CAPr/BwD+/wUACAD8/xYA5/8XAN3/CAD1//r/FADy/xgA9v8AAP7/8////w0A9/8rAPX/IQAFAPr/FwDe/xgA6f8YAAEAEAAFAPb/+P/j/+7/6//z//D/AADh/w4A2/8cAO7/HAAGAAsAEwD//xAABAAPAAcAHAD1/xwA5f/+/+7/6//5//r//v8CAAEA7P8BAOf/AgALAAYAJwAAABUA9f/3/wAA//8TABcABQAHAPX/4v8AANv/EADv/xIA9f8AAOr/5v///9//LAD0/ykAAwD5/wAA6f/7/wsA9f8WAPP/7v8FANL/IgDm/ykAAQASAAYA+/8DAP//EQARACUADQAkAPj/GQDn/w8A7f8AAAEA6/8JAN//BADq/wIA/P8AAAAA+P/8//b/AQAAABEABwAXAP7/EQDv/wwA8f8AAAEA8f8HAO3//f/w//n/9P/9//v//f////n/9//6//T/BwAGABAAFQABAA0A9f///wcA9/8jAPv/GQACAPr/BADz/wIAAgACABEAAwAPAP3//f/2/+r////q/wMA+//0/wUA8P8AAAUA/f8VAAAACAAKAPX/EwD6/wwAEQD9/xoA8P8EAOn/8P/x//r/CgAAABUA8f/4/+r/4v/3//7//v8bAPf/EAD6//z/EQD9/yMABQAaAP3/CwDs/wkA7/8JAAMAAAAFAP3/7P8EAOf/BQAEAPr/GQDs/woA7//y/wAA7v8GAP7//v8LAPn/EwAAABMACAAFAAUAAAD9/wwA9/8aAPb/EAAAAPT/BQDj/wAA8v/z/wgA5/8EAOf/8P/5/+//BgAAAAAADwDx/xoA9v8fAAoAFAAUAPr/DwDr/wYA+P8DAP7/CADr/wwA3/8KAO//BwAGAAgADwAEAAwA+f8IAPf/BwD//wYABAD9/wMA+v8AAAYA//8MAAQABAAKAPj/DwDu/wwA8f8HAAIABwAMAAcA+P///9//7f/r/9z/CgDf/w4A8f/4//z/9f/6/xIA9v8kAPz/GQAJAA0AGAAIABoAAAAMAPX//P/1//T/AgD7/wcABwDz/woA5/8FAAEAAgAcAAEADQAGAPP/EwD2/xgACgANABAA/f8BAPj/8v/0//D/5//x/+D/6v/n/+H/9f/l////9f////v//f/7//7/AAD8/wkA8v8ZAO//KgD7/yMAAQAFAP3/+f///wgACQATABoAAAAmAOv/JQDz/xkAEQAKAB0AAgAQAPz/AwD0//3/8//3//f/+v/7/wUAAwAJAA0A9v8UAOX/EgDx/wMACgDz/w4A6//9/+f/7v/h/+//5f/0//P/9P/8//b/BgD7/xEAAAANAAkABAAUAAYAEgAHAAcAAQAFAP3/BQD7/wAAAAD5/wUA8/8HAPL/DAD2/xkA9f8VAPL//v8AAO//HQDv/yUA7v8QAPD/AwD6/wwAAAAWAP//DAAKAPP/IQDm/yQA7/8NAPj//P/4//n/9f/0//X/4v/x/9X/7P/h//f/9v8JAPz/CwACAPj/FwDz/yIABwAUABcACQAVAA4ACQAKAPr/+P/4/+X/BgDi/w0A8/8BAAEA8/8AAPP/+/8EAAIAFAALAA8ADAAEAAgACwAFABQABwAKAAkA+/8AAP7/+/8JAAwAAAAYAOb/BwDh//j/9v/8/wAA/f/4/+3/8//i//j/4/8AAOj/CwDq/w4A8f8KAAcACAAiAAUAJgD//x0A/v8fAP3/HAD2/wgA8P/y//T/6P///+X/BgDq/wEA9//3////9f8EAPv/EAAHABwAEgAgAA4AGAAIAAkAEQD7/xcA7v8TAOf/CgDn//7/6P/4/+X/+//q//T/AQDr/xIA8v8AAPn/6v/z//P/8/8DAP//AAAIAPT/CgD7/wMAEAD8/xwA/v8bAAMAFwAGABkAAwATAPv/BAD2//7////8/w0A8v8RAPD/BgD6/wEAAAAOAP//FgACAA0ACwACABQAAgAZAPn/CQDm/+v/5//i//r/8f/6//r/5P/z/93/5v/6/+n/EgAAAAQADgDn/wIA6P///wUADgAWABEACwABAAUA//8QAAUAFAAAAAwA+/8OAP3/GAAFAA8ACwD+/wQA+f/+//n/CQD+/xIABgACAAUA8P////b/AQABAAYA//8GAO7/CADs/wQABQDw/xkA5f8KAPD/7v/8/+f/+P/2/+z//f/u//P//v/w/woA+v8MAAMABgAOAAEAIQABACYABAARAAMA/f8AAAEA/P8LAPT//f/1/+H/AgDh/w8A//8OABEABQAQAP//EwACAB0ADAAjAAwAGgAAAAQA+v/z/wIA6f8NAOb/CADu/wAA/P8HAPz/CwDy//n/9//q/wAA9P/+//z/+P/v//j/4v/6/+T/AAD0////BAD2/wMA9//8/wcAAwAQAAkABQAAAPv/AAD5/woAAAABAAYA9f/+/wAA7v8RAPD/GQAEABUAFgAKABIABQACAA8AAAAYAAUADgAHAPv/BgDx/wUA8v8BAPb/+v/6//f/9f/6/+f//f/k//v/8v/x//3/9//+/w4A/v8UAPv/BQAAAAEAEgAOABwAEQAQAAMACAD8/w0AAgAOAAQADAD8/xAA+P8TAPv/CAD7//L/+P/m//z/8//+/wEA/P/+//v/8////+//DQD3/xAABwD5/wsA7f/+/wAA9/8OAPb//f/w/+r/9f/y/wQAAQAAAAgA8f8EAPP////8////BgABABMAAgAQAAcAAQAKAAMAAwARAAAADgAHAP//EgD3/w8A+P8AAPj/+f/7/wEAAgAEAAUA+P8EAPD/CQD2/wkA+v8GAPv/CQD+/woAAAABAAcA/v8OAAIACQAAAP3/+//4//n//f/2//3/8//2//r/8f8BAPT/+/8BAPH/CQDs////5//z/+n/9P/+////DQABAAMA+//7//z/DwABACcABQAmABAAFQAcAAkAHQADABQAAwAOAAYADAACAAgA+P/+//P/8P/7/+f/EADt/x8A+P8OAAAA9P8GAPX/CAAAAAYA9v8GAOb/CADl/wAA5//r/+b/4//t//T/AAD8/woA7P8EAOb/AAD7/wcAEAALABEACAAJAAMACAD9/xEA/f8TAAcAAQAJAPj/BAAAAAYAAwAIAAIAAgAJAAIADQAJAAYACAADAP//CADv/wQA5P/5//D/9f8JAPb/DAD1//f/7v/u/+f/AADt/xUA+f8YAAIACwAQAP7/HAD+/xcACgAGAA8AAQAEAAsA+f8IAPb/9//z/+z/8v/1//3/AgAEAAIA9//6/+j//v/2/wsADwAOABQA//8GAPT////7/wQAAgAJAAAA///3//T/9P/9/wAABAALAPj/AwDx//f/AQD3/w0A/v8AAP//8/////z//P8IAPb/DAD//w8ADgAMABQA+/8SAO//DgD+/wwAEQAIAA0ABAD6/wIA7v/7//v/7P8PAOP/DQDs//n/AAD0/wYA///+/wkA/f8UAAwAGgAWAA0ACQD8//3/+v8AAAAAAwD//wAA8v/8/9//8v/Z/+z/5v/v//H/9f/y//b/9f/z////+f8MAA0AFQAeABYAFAASAAYADgAPAA4AFwAPAAgACQD9/////v/+/wIABgAFAAkA//8BAPv/AQAEAA0AEAAMAA0A8v8JAOP/EAD1/wwACQD8/wcA9v/4//n/8f/2//z/7P8EAOH/AADj//v/8//0//r/4f/o/9z/1//0/+n/BgAAAP3/AwD1/wMAAQANABYAFwAeABkAFwAXAAoAFAAFAA8ABQAJAAEABAACAP7/CgD2/wMA7v/z//X/+f8HAAoACwALAAAABQAFAAkAGAANABsACgAIAAQA+v8DAPn/BwD6/wQA8//1/+v/5//y/+z/+v/4//T/+v/1//P/AgDx/wMA9//9/wAAAAAGAAoABAAQAP//EAD9/wgAAAD+/wUA//8GAAQAAwADAAQAAAAMAPz/DAD+/wYABQAFAP//AADv//j/8v/9/wYAAwAPAP//BAD1//7/7/8FAPj/DgAMAAsACgD9/+7/9//o//f/AQDr/wsA4P/7/+b/8P/z//f/+P8EAP3/CgALAAgAHQAOACQAHAAiABwAHwAOABwABAARAAAA+v/5/+z/8v/z//T/+P/3/+r/8v/i/+3/9f/0/wkA/v8HAAEAAgABAAMAAAAAAAQA+f8LAPj/CgAEAAAACAD9//X/AgDj/wYA7/8DAAAA/f/w//j/3P/9/+n/AwD//wcABQAEAAgA/f8UAPz/JwAKACsAEwAfAAwAHgACACMAAAATAAIA/P8GAPX/AgDy//f/6f/2/+///P/9//j/AQDx/wMA8/8FAPz/AwAHAP//GAD4/x8A8/8PAPH/AgDw/wcA8/8LAPz/AgAIAPb/BQDl//j/1//5/9j/AADl//P/7f/c/+3/4f/v//z//v8GABEABQAUAA0ABwAdAAYALQAXAC0AGQAfAP//FgDu/w4AAwD3/x8A5P8cAOn/CwD6/wcAAAAOAAAADAAEAAAADAD3/xAA9v8MAPf/CQD8/woABQD8/wkA5f8EAOD//f/n//r/5v/9/9r/+//Z/+f/7v/W/wIA3f8FAO7/AAD4/wcA/v8PAAcABwAVAAMAIQANACEAEAAVAA0ABgAWAP7/JAD9/yMA+/8UAPX/CADx/wAA9//8/wEA9v8KAOn/BwDf/wEA4/8CAOv/BQD3/wQABwAAABIA//8QAAAADQAHAAwADgD4/w4A5v8FAO//AAD1//z/6f/1/+r/6/8CAOf/GgDv/x4A/P8UAAQADAADAA0AAAASAAMACgAHAAAABwD8/wkA8v8DAOr/8f/x/+3/AQD9/wQAAwD3//f/9//v/wUA/v8DABoA8v8jAOj/DwDv/wAA/P8KAAIADwAFAP//CwDs/xcA6/8bAPb/EgD+/wkA//8IAP//BwD5/wAA9P/8//z//P8HAPb/BwDv/wEA+/8CAAkABwALAAkADwAIABoACAAfAA0AFAAOAP3/CADg/wAA1//5/+f/7f/s/+7/4v/8/+r/BAD///7/CwD1/xIA/P8RAA0ABQAIAP3/8P/7/+j/8v/w/+H/8v/e/+//6f/x//b/+f8DAAYADwARABgAEQAZABEAEQAVAAwAGwAOAB4ADgAVAAQAAQAAAPj/DwD8/x8A/v8YAPv/CAD4/wgA+f8MAPz/AAD9/+/////2/wUAAAAHAPX////k////5v8LAPb/DAD+/wAA///7////AgD1/woA6v8BAO3/6v/3/+P//f/2//X////s//H//P/r/xsA+f8kAAYAEAAIAAMAAAAIAAAADgAEABMAAgASAPr/BQD3////+v8AAP3/AAD///7/AAAAAAQA//8EAP3/CgAHABgAEgAeAAgAEgD2/wwA9P8SAP3/EgD8/woA7v///+v/8f/5/+v////t//T/7P/r/+j/9v/m/wMA4f8DAOT/AAD3/wMACgALABIADAALAAEACAD8/xIA//8YAAAABwADAPr/CwABAAoADQAHAAsADgD//xIA9v8JAPz/BAAJAAAACQDu/wAA4P8CAOv/EQD9/xUA/f8OAPP/BAD5////DgD//xkA/f8PAPH/AADj//r/6P/2//X/7f/y/+z/7f/7//f/BwAAAAcAAQAJAAwAGgAdAB0AHwANAA4AAwD8/wQA+P8AAAQA9/8FAPH/8f/4/+b/AQD1/wEAAAD8//3/AQDz/xIA8f8TAPv/+/8CAOX/BADm/wQA7f8CAOb/AwDe/w4A6/8VAP//CwANAP3/HQD3/ygA+f8eAP7/BQD///r/+/8FAPr/DgADAAAADwDs/xIA8/8UABEAGAAcAA8ADgD7/wkA9v8QAAAACQAAAPf/9//u/+3/8P/q/+v/9f/k/wAA6/////3/AQALAAcADgD8/wcA8//+/wMA9/8MAPP//v/n/+//3v/v/+j//f/z/woA9f8AAP7/6v8QAOv/JQAAACwAEAAhABAAEwAFABEABQAQABwA/v8sAOv/HwDy/w0ABgAKAA0ADgAGAAwABgD8/xIA7v8TAOz/CgDp/wIA3//4/+L/7f/w/+P/9//i//z/7/8DAPr/DQDt/w0A4v8DAPn/+v8VAPb/DQD3//P/+v/t//z/+v/5//7//v/0/wMA9P8BAAMAAgARAAwAFwAUABoAGgAcABcAGQAHAA8AAwAGAA0ABAAFAP//7f/x/+H/7v/o////9P8HAP//AAD9/wQA8v8YAPD/HAD9/wsAEQD7/x4A+P8YAPr/CwD1/wwA6f8SAOL/CwD0/wAADQD7/xEA+f8GAPn//v/4//f/9v/w//f/8v/1//f/7v/y//T/6v8DAO//CgD+/wYAEwABAB0A/v8QAPz/AAD8/wMA+P8NAPj/BwD7//T/+P/q//D/8//6/wUADwAPABEABwD9/wQA9v8QAAoAEAAeAP7/GwD0/wsA+/8AAP3/BADy/wYA7v/8//j/8f8HAOz/DADr/wgA+P8JAAgACwAIAAcABQABAA8AAAAYAPz/GQD0/xcA9P8PAAQAAgAYAPb/GQDz/wwAAgAGAAgACwD0/wUA4f/x/+3/3v8AANb//P/h/+n/9//h/wQA6v8BAO3/+f/s//7/+v8NAAsAEwALAAcAAwDz/wYA7P8OAP3/EQANAAwACgAFAAMAAAAOAP3/HgAEACAAFwAWAB8ABwARAAAABgABAAsA+v8TAOj/EADr//3/AADo/wsA5/8CAO7/9P/r//T/6f/+/+3////v/+//9//m/wYA8f8PAPv/CwD3//r/9//x/wEAAAAJAA4ABgACAAoA9f8YAP3/FQAQAPj/HQDh/xcA8v8JABMAAwAYAP3////2//L///8EAAYAHgAAABkAAQD9/woA8P8IAPr/BQABAA8AAAATAP//AgAAAO3/AgDp/wMA+/8CAAQAAgDx/wQA4f8DAPP/+/8LAPL/CgDu/wAA9v8AAAIA+/8GAO7//f/v//j/AAD//wkABQD5/wIA6P/7//T/9f8MAPb/DQD9//j/CQDt/xUA/v8RABQAAwAZAAAAFAAKABAAEgANAAwADAD//wwA+f8EAAIA/P8KAPf/BAD5//b/AQDy/wEA/v/1/wgA9f8AAAAA6f///93/AADs/wsA//8IAP//+f/9/+3/CwDs/xcA/P8RAAkABwAEAAEAAgD5/xAA8v8QAPH/BAD3/wMA//8CAAQA9P8DAOf/AwDw/wsABAAPAAsACAAAAAUA+P8JAAEABgASAPz/GAD0/wwA9f/3//v/5P/+/+L/9//2//T/CAD//wAACgDw/wcAAQD//yIA+P8gAPn/AwAEAPn/EAAAAA8AAAAEAPX////3/wQADgANABkABAAEAPT/+P/0/wcA/v8PAPz/+//2/+H/9//Z//z/4/8AAO3/BgD1/w4ACAAWABkAEwATAAcACgD+/xkA9/8lAOz/EgDj//H/5//a//X/3v8AAPL/AAD+/wIA+f8HAPj/CAADAAQAEQAAABgA/f8RAPv/AAACAP3/CAAJAAYACwAJAPv/EADz/xMA/f8PAAgABwAPAAQAEgABAA4A/f8EAPf//P/5//r/AQD8/wkA+/8TAPH/FwDs/wwA/P/5/w8A7f8QAO7/AwDv//3/5P/5/9f/7v/b/+f/8//s/wIA9P///+3/+//i/wYA6P8RAP3/DgANAAQAEwADABQABgAOAAEACQD5/wwAAAAUABAAFQASAAQAAAD0//b/AQACACAACgAfAP7/AAD4//X/BQAIABAAFQAJAAoAAQD7/wQA9v8MAPb/BgD3//X/+P/w//f/+P/2//f/8f/x/+3/9P/0//v/AAAAAPz/CADx/w0A9/8LAAAADAABAA8AAwANAAYABgAFAP3/CAD2/wsA9v8FAPb/AADz/wYA8/8KAPb/AAD6//P/AADz/wkAAAALAAgACwACAAsA/P8JAAEAAgANAPr/EgD5/wcA/P/6//3/+v/5/wIA+f8BAAEA/P8FAPn/AAD6//v//f8AAAMACQAEAAoA+v8IAPD/DQD0/xAABAADABAA8f8IAO//8//7/+v/+//9/+v/CQDn/////v/0/xIA+/8KAAEA+v8BAAAABAAUAAgADwAJAPT/DADs/xEAAQASAAkADQD5/wcA8v8FAP7/AAAEAPr/AAD0//z/9////wQAAwAIAPz/+f/y/+v/+//z/w0A/f8SAP3/DwACABIACAAXAAQAFAAGAAcADwD4/woA8f////P/+v/0//r/7f/8/+7/+/8AAPD/FgDn/xgA7P8NAPv/CAAFAAkACQACAAcA8v8FAOT/CgDk/w4A6P8JAOn/+f/u/+z////z/xEA/P8VAPT/EADv/xIA9/8QAAIA/v8JAO7/CwD1/w0ABAASAAcAFQAIABIAEgAOABsADAAWAAYACAACAAAAAAAAAP3/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/f/z/wcA6P8CAOX/+v/l//3/6P8KAO//EAD5/wUABAD4/wgA+f/+//j/8//o//b/3v8BAOn/AQD5//j/AAD5/wEADAAEABsACwAVABMADAASAAwABwAJAPv//v/2//j/+P/4//z/9P/+/+//AAD5/wcACQAWAAwAIgACACIABQARABgA+P8eAOr/BgDy/+///v/2//f/AgDg//7/3v/4/wEAAQAhAAgAFAADAPj/AgD1/wkA/v8JAPr/+v/y/+r/8v/t//L/9f/x/+v/+f/f/wwA7P8aAAEAFAACAAYA9/8EAPb/DAACAAQADwDy/wgA8P/5/wAA+v8HAAoAAwAYAAkAHAAXABgAGAATAA0AEwABABMA/P8OAPn/BQD2//v/8//v//H/7v/t//L/8P/x/wQA7/8VAPH/CgD2/+//+//n//z//P/5/wwA+v/4//7/2v8DAOf/AQALAPn/FgD6/wsADAAJABkAEgAOABYAAgAPAAYAAgATAPr/EwD7/wQAAwD6/woAAAALAAYACAABAAYA+f8IAPb/CAD2/wEA+f/1//7/7v/+/+r/9//n//T/7v////v/CwD9/wYA/f/5/wwA+f8ZAAQACQAHAPb////+//r/DgD//woABgD1/wgA7f8FAAIABgAXAAIADQD5//j//P/4/wYABQAAAAkA7/8BAO7/9v8AAO7/DAD0/wMABAD2/w8A/P8KAA4AAQAQAAAAAQAFAPr/AwD+//r/AAD0//7/9f/5//n/9f8AAPv/CAAKAAgAFAAAAAwA+f/8//n/9//+/wAA/f8BAPD/8//v/+f/BADu/xQA/P8FAAYA9v8QAAYAGgAdAB0AEAAbAPH/GwDo/xQA/v8BABAA7f8HAOX/9f/s//z/8v8VAO3/HADr/w8A/P8EABAAAAARAAAAAwD+//v/7//7/+L//v/p//v/+v/s//7/5P/2//P/9/8GAAIACwAJAAQADAACAA4ADAAMABkAAgAQAPj/+P/4//D/AwAAAAsADAACAAgA/f8CAAYACQANABcABwAaAAIADQABAAAAAgD5/wcA7v8DAOT/+P/p//b/9f/6//n/+f/6//X/BwDw/xkA8/8bAAEADAAGAAMA+P8JAO//CAD7//L/BgDZ/wIA2P/5/+n//P/9/xEACQAgAAoAFQAFAAAACgD6/xUAAAAOAAMA+v/8/+7/9v/y//f/+//5//3/+v/5/wAA+v8MAAYAEQASAAkAEgD8/w4A/v8MAAYAAwD8//b/5//v/+b/7//5/+3/CgDy/wsAAQAFABAADAAPABsACAAVAAUA+f8GAOj/AAD0//X/AQDt/wAA8f/6//7//P8JAAsADQATAAsACAANAAAAEQABABMAAQAKAPf/+P/q/+v/5v/1/+7/AQD6//n/BADr/xAA9/8YABMAGQAkABYAGAANAAEA/f/4/+7//v/o//n/5P/q/+n/6v/2//f/BAD6/w8A+f8WAAUAFwAVABoAEgAXAP//BQD3//T/AADt/wUA6v/6/+z/8v/w////8v8NAP7/CgAOAAAADgAAAAQACAADAAQABQDy//7/4//y/+b/6//0//n/AgARAAkAGAAKAAwADwAJABkADQAbAAwAEwAAAAIA7//3/+v/9v/u//b/6v/t/+v/6P/9/+//EAD6/xUAAAANAAIADAACABUAAAASAAQA/f8NAOr/EgDs/wgA+f/4/wAA+P/7/wgA+P8TAAMADAARAPz/DwDz/wQA9v8AAPv/AAD///z/AwD5/wEA9v/+//f/AgD9/w4A/f8OAPv/AwADAAAADgAHAAkACQD8////8v/z//L/9//7//7/AwD0/wUA6v8FAPj/DgALABgABQAWAPr/DAACAAQAEAAAAAsA+v8AAPH/AADq/wIA7v////j/+f////z//v8BAAAA+P8OAOL/FQDk/wkA///9/w8AAAAEAAMA9//7/wAA8/8XAPr/IAAHABMACQAEAAEA/////wIAAAAHAPT/AQDn//P/7//s/wMA8P8MAPb/AgD9//3/AAAFAAAACgAGAAMADQD9/wwA+P8IAPL/AgDv//r/9P/6//7/AgAEAAQACAD6/xIA9P8aAP//GAAHABMA/v8RAPj/DAAFAAAADgD0/wMA8v/8////AAACAAcA9v8IAPL/AgD///z/AwD6//f/+//u//r/8v/4//v/8v8CAOT/AQDl/////v8EABQABwAOAAEA/v8AAAEABwAYAAMAHQD0/wgA7P/6//P/+v/8//v/AgD7/wUA/P8EAP3/DQD9/yAA/f8hAAMADQAUAP7/GgD+/wcAAQD3//3/+v/w////8P/4/wEA8v8JAPb///8AAP3/BwALAAUADAAFAPb/CADp/wsA/v8IABEAAAAAAPv/6P/+/+//BAD//wQA+/8AAO7//v/w/wAA+f8DAPr/+//2/+n//P/o/wcA9P8KAPj/BwD4/woAAQAWAAkAHQAIABcACwASABUAEAAUAAMAAAD5/+r//f/u///////x////6f/0//L/9f/8//7/AAABAAEAAAADAAIABwAGAAgABQD9/wEA8/8IAPn/EwD+/wwA9v8AAPf/AQAHAAcAEQADAAcA+f/5//H/+f/0/wIA/P8IAPr/AQD1//X/AAD4/xIABwAWAA4ADgAJABEABwAZAAYAEQAAAP3/9v/x/+//8f/u//D/8//t//j/7f/8/+7/AQD2/xEAAwAfAAwAFgASAAMAFQADAAwACgAAAP//AADt/wYA6/8BAPr/+f8JAPP/BwDx//7/+f8FAAMAEQAAAAcA9f/1//L/+P/4/wIA+//7//3/6/8AAO//BgACAA0ADwATAA4AFAADAA0A/P8AAP3/9f8DAPL/AAD0//D/8f/q/+v/8//x////AgAHAA0ACAAOAAcAEgAPABkAEgAUAAQACQD3/wUA8/8DAPL/+v/w/+7/8//u////9/8QAPr/GgD2/xoA+P8aAAIAGgAHAA8AAQD8//3/6P8DAOL/DADt/wYA8//5//D/+v/7/woADgASAA8ABgACAPj/AQD2/wsA/v8LAP//+v/0/+T/6v/k//D/+f///wkACAAJAA4ABAASAAUAEwAKABMADAAQAAUABgD5//z/8v/2//P/9P/4//b/+//7/////P8NAPv/GAAAABIACAAOABAAFAAQAA4AAQD5//P/7//z//X/9v/8//P/+P/w/+//9f/2//7/BwAGAAwABwAFAAAABgACAAoACQACAAgA9v8BAO//+v/y//j/+/8BAP7/DgD3/wgA8//2//3/9f8LAAgADAATAP3/BgDv//X/9f/x/wIA9v8GAP7/BQAFAAcACQAQAAgAGwAFABkABAAKAAgA/f8JAPb//f/5/+3/+P/x//H//v/z/////P/6//z/AAD7/xEABQAeAAwAFwAIAAEAAAD4/wAAAAAIAAMADAD2/wAA5v/4/+n/AAD5/wQA/v/3//b/7//0//j/+////wAA/f8BAPX/AAD0//v/AQAAABMADAAVAAsABAADAPz/BAADAAkACQANAAAADQDy/wUA7v/9//z//P8IAP7/AQAAAPj/AAAAAAEADAAAABAABQAOAA0ACgAMAAAAAAD3//n/+P8AAAEAAwAKAP7/AgD1//P/8f/z//P/AAD+/wAABAD2//7/8P/6//f/AQACAAwAAwAQAP3/BgD///j/DAD0/xUAAAAQAAgABgAAAAMA9/8CAPb//v/+//j/AADu//j/6v/1//b//P8GAAAACQAAAAQAAQAGAAIAEwACABYABgAAAAwA6f8PAOv/CwD6//7/+//2//P////3/wQABgD4/xMA7/8WAP3/FgAQABIADgABAAAA7P/6/+f////z////+f/3//P/7v/z/+3/BAD5/xwABQAfAAYADAACAAAAAwADAAkACQARAP7/EgDp/wYA4v/8//D/AAAAAAcAAAAFAPr/AAAGAAAAGwABABoABgADAAoA8/8FAPX/+f/3//L/7//3/+b/AADt/wMAAQAHAA0ADQARABAAFQAIABIA/P8HAPL/BQDx/wsA9P8HAPH/+f/s//H/8f/9//3/EQADABgAAwATAAgADAAKAAMABgD//wQA//8EAPT/+P/h/+T/2f/j/+X/8//6//3//v/7//P//f/2/wYADQASABkAFgALABAA9f8LAPH/CwAAAAwABwAKAPz/DAD0/w8AAAAFABAA/P8TAAEADAALAAcAAwAPAPL/EgDp/wMA6//1//P/9f/3//f/9f/1//f/9v8DAP3/DgADAA8AAwALAP//BgABAAAACQD6/wMA9v/z//X/8v/3/wAA+P8LAPb/BgD1//7//v8HAA8AGwAYABgADgD//wUA7v8KAPT/DQAAAAgAAAAEAPL/AADp//v/8f/6/wAA/P8KAP7/CAD6////8P/+/+z/BQD4/wYABgD9/woA8/8IAPb/CgACAA8ACwAOAAsABwAMAAAAEQD6/w0A7f8FAOb/BwDv/wEA9P/v/+//5P/w/+7//v/9/woA//8NAPb/CgD8/w4ACgAWAAkADwD+/wAA/v8AAAcABwAOAAEABgD0//r/8//5/wAAAAAKAAYABQAJAPr/AgD8//f/CAD3/w8AAwAKAAYAAAD6//r/8f/7//n/+/8GAP3/CQAAAP///P/7//H/AADy/wAA+//6/wAA+P8AAPz//f////b////+/wMAFAARAB8AFgATAAgAAwACAAAAEAAFABcAAwAIAPf/9f/r/+z/6f/0/+3////w//3/+P/3/wYA/f8KAAIA//////z/+P8LAPL/EgDx/wQA9//8//j//v/0/wQA+v8LAAsADQAaAAYAFgAAAAoA/f8GAPz/CAABAAMABgD6/wAA8v/9//H/CAD4/xUAAgAXAAsAEAAOAAYADgD2/w0A6P8OAOr/DgDy/wIA7P/v/97/4//i/+f//f/y/xEA+v8QAP3/BgADAAgADwAQABQAEAAPAAcABgD9//j/9P/r/+7/6//s//L/9f/4/wQA//8IAAgAAAASAAAAFgALAA8AEQADAA0AAgAHAAIAAQD3////6f8EAOz/CQD6/wYAAAD9/wAA9/8IAPv/FQADABUAAAAJAPP/AgDv/wAA9P/7//T/8f/3/+3/CAD2/xEAAQADAAMA/P///wwABQAaABIADgANAPT/+v/k//D/6v/2//T////0/wAA9f/8/wAA/f8HAAcACAAQABIACwAeAAEAFwD8/wcA+/8AAPj/AQD1/wcA8P8KAOz/BQD0//v/AgDz/wgA+/8FAAgABwAFABAA9v8QAPT/BwAAAAIABAAFAP7/AwD7//7/AwD9/wkAAwAAAAcA9/8IAP3/CwABAAwA9P8EAOP/+P/q//H/AAD2/wkA///8//v/9f/t/wIA7v8OAP7/DQAKAAQADgD8/wcA/f/6/wIA+/8DAAYAAwAAAAIA7//5//D/9f/8/wQA//8NAP7/AAD+//r/AwAAABAAAwATAAEABgAGAP7/DwD//wsAAwD9/wUA+f8GAAkABwATAP//AQDx/+3/7v/u//T//P/2/wAA+P/8/wAA/v8JAAEADwD+/wwA//8FAAwABQAUAAkACQAGAPz////5//v//v/7/wEA/f8AAAIA+P8EAO///f/2//P/BwD6/wsACwD+/wsA9P/4////+P8MAAsACwAOAAEA//8AAPr/AQAAAP//BQD7/wIAAAD5/wUA9v/+//z/8P/5//T/7/8GAPT/CwAAAP3/AADw/wEA9/8OAAcAFQAPAA8ACgAJAAQACQACAAcAAQD8//7/7v8AAOn/BwDu/wcA+v/7/wUA9P8DAPz///8DAAkABAAXAAMAGAABAA0A/v/7/wAA6v8HAPD/AwD8//T/9//t//H//P/8/wsADAAHABMA9v8PAPT/BQADAP//CwD+//7//P/z//b/+f/w//3/8//9//v/BwAAABQABQASAAwACAAMAAIACgAEAAoABgAEAAAA+v/3//f/9P/6//j/9/8AAPn/CQACAAcACQD8/w0A+/8UAAMAFAAEAAUA/P/3//j/9//8//7/+P/3/+n/5//n/+X//v/0/wwABAAAAAgA8v8DAP7/BQASAA8AEgANAAEA///7//f/CADz/xUA7v8UAPX/DAAGAAkADgAKAAgACQAEAAYABwAEABAAAQAVAPj/DADu//3/7//3//n//P8AAAAA/P////T//f/4//3/BgD6/wwA9v8BAPf/8P/2/+b/8v/t//b/+f////b////v//3/9/8FAAgAFAAPAB0ADAAYAAwACwASAAgAEwAQAAgACQD+//D/AwDh/xEA7f8NAPr/+//1//X/7v8AAPn/BwACAAIAAwD4/wMA7/8EAPD/BAD9/wgABwAIAAQABQD//wQABAD9/wsA7/8IAOz/AQD3//3////3/wAA7v8AAOr/BQD1/w8AAAAZAP3/HADz/xMA+/8KAA0ACAAUAAcACgD4/wUA6P8OAOn/FADr/wQA6P/0/+z/9//3/wEA//8CAAYAAQAHAAcAAgAMAAAACgAAAAIAAQD6/wIA+v8FAAAACQAAAA4A+P8TAPj/EQAAAAIABQDy/wAA8f/6//f/9//z//r/8f/8//v/+P8EAPH/CwD0/xgA+/8iAPz/HAABAAsAEAD7/xwA9f8dAPb/GADu/w8A3P8IANz/BAD6//r/EwDs/xIA6f8LAO//EQD4/xUA/P8JAPj/9//1/+z//f/p/wQA5/8AAOr/+v/1//n/AAD//wgAAQAIAP3/BwD6/woAAgAHAAwA//8GAAAA/P8EAP7/+/8KAPb/EgAGAAsAFAADABAACgANABIAEQANAA8ABAAEAAMA+P8AAOv/9//j//H/4v/4/+b//v/y//n/AADz/woA+f8OAAIAEQAGABUAAAAUAPz/BwABAPf/CADs/wAA8v/5/wQA+/8LAP///P/8//n/+/8RAPz/IwD7/xYA/v8DAP7/AAD5/wEAAAD5/wwA6v8NAOb/BQDq/wYA7f8QAPD/FgD9/w0ABwAAAAgA/P8BAPv//P/3/wAA9f8FAPX/AAD5//3/AAAIAAIADgADAAYACAAIAAgAFAADABcAAAAOAPj/AQDs//v/5v/9/+r//f/s/+3/7//j//r/7f8HAPf/EgD9/xUACQARABQADgALABAAAAARAAcADAAQAAAAAAD+/+X/BgDe/wsA7v8FAAAABAABAAUA///+/wcA9P8YAPD/GwDx/xAA7/8JAOf/BgDl/wAA9v/2/wsA8f8QAPL/DgD5/xEAAAARAPz/BwD7//z/BAD4/woA9/8AAPT/9f/z//n/+v8GAAgACAAVAAEAGAAJABEAFgAJAA4ABQD+/wAA/v/1/wQA6v/6/+v/5f/v/9v/7//l//P/+v8AAAIADgD8/w8A/v8KABAACwAaAA4AFwAGAA8A+f8BAPP/+P/9//3/DAD+/w4A9/8FAPr/AAAHAAMAEAALABQABwAWAPj/DQDs/wIA7f8AAPT//v/0//b/9//x/wIA8v8NAPL/EQDu/xAA8f8OAPr/CQD9////+v/z//f/6//6/+v////w/wEA+/8FAAcADAANABEACgARAAkAEAALABMAAwASAPX/BADv//X/8v/0//H/+v/t//j/8f/0//v/9/8AAPz/BwACABMADwAfABEAHgAAAA8A9f8DAPn/BAD6/woA8v8JAO3/AADw//7/9/8FAP7/CAABAAAACgD4/xQA8/8SAPH/BgDz/wQA9f8NAPT/DQD5/wAAAgD8/wQAAQACAAkABwAIAAsAAAAEAPf/+//2//j/+v/8//X//f/r//f/7f/w//3/8f8FAP7/AgAOAAUAFgARABcAEAAVAAAACwD1//3/+//5/wEA/v/+//3/8v/z/+//6//7//D/CQD9/w0AAwANAP//DQD9/wsABwALABYACgAZAAMADwD8/wYA+/8GAPv/BAD6//z/AADx/wMA6v8AAOz////y/wMA8/8FAPL/AAD2//n////7/wQAAAAFAAAACgD9/xIAAAASAAAACwD4/wUA8/8HAPr/CwABAAgAAAD///r/9v/8//T/AAD0/wAA9P8AAPj/BAD9/wAA///3/wAA9v8EAAAACQAJAA4ABgAPAP//AwAAAPf/DAD2/xIA/P8JAPn//v/u//n/6//7//j/AAAGAAAACAD+/wQAAwAJAAoAFQAHABYABQANAAkABwAHAAgA+v8IAPH/AAD1//X//f/z//3/9f/5//D//f/m/wMA5v8DAPT/AQADAAMACQAFAAYAAQAJAPr/FQD5/x0A/v8WAP3/DAD8/wkA//8HAP7//v/9//b/BADy/wsA7/8FAO3/AADw////9//9/wUA+v8NAPf/AAD4//H/AAD6/w0ABwARAAQADAD3/wQA7//+//j///8DAAIA//////T/+f/5//n/BwD+/w0AAwAIAAkACAAMAA4ACgAUAAUAEAAEAAkABwAIAAMADQD3/w8A7f8HAO3/9v/v/+7/8v/0//z/8v8GAOb/CQDl/wkA9/8JAAoABQAMAP7/AwD4/wMA8/8NAO3/DQDs/wQA9f8AAAMAAAAPAP7/EwD0/xIA7/8SAPj/DQABAAMA///+//j//v/4//b/AgDx/xMA/f8WAAgABAAIAP7/BgAJAAgADAAKAP7/BgD0//n/9f/t//z/7f/8//L/8f/3//L//v8GAAEAFQAEAA8ADgAIABUACQAMAAsA+/8IAPL//f/1//P/+P/3//X//P/2//T//v/r/wYA7/8LAP3/DgACABAA/P8RAPr/CgADAAAADAD8/woA+P8KAPT/EAD0/xQA+/8OAAQABgAJAAYACAAHAAgA+v8NAOP/CwDc////6v/0//3/8/8EAPj//v/7//z/+P8KAPL/FwD4/w0AAgD8/wUA9/8FAAAABAAAAP3/7P/9/+f/AwD6////AwD0//3/9v/+/wAACQAIABUACgAZAAUADwAAAAYAAQAMAAIAEAD//wcA/f8AAAAA/v8CAP//AgACAAIAAAAFAPL/CADs/wkA9/8LAP3/BwDz//3/6v/3//P/+f8EAPn/CgD5/wsA+P8TAPX/FwD5/w4ABgAAAA0A9v8FAPP/+//1//n/7v8BAOP/BADn//r/9//z/wYA+v8MAAYACgAHAA4A/f8aAPf/GwAAAAoABQD/////AAAAAAIACQD8/wkA8f8EAPT/BgAAAAgA//8EAPT//v/2//r/AQAAAAQABAD//wAA+v/+////AgAMAAkAEwAKAAkABQACAAAABgD7/wcA9v/+//L/8//1//H/+f/1//3/8f8FAO7/DQD+/wYAEAAAABEABgAHAAcACQD8/xYA8P8aAOv/CwDz//n/AwD3/w0A+v8JAPb/AwD2/wUA9/8KAPP/AwDx//b/+P/u//3/7v////D/AQD1/wEA/f/+/wQA+v8NAP7/EgAJABIADAASAAEADAD6//3/AADy/wkA9/8KAPn/AgD1//v/9////wIACAAPAAwAFQAJABEABQAJAAwABgAZAAcAGAD9/wYA7v/4/+v/+P/3//f/AADr//z/4//1/+z//f/3/woA9v8OAPb/CAADAP//DwD4/wgA+v/5//z/9P/6////+/8GAAAAAAAFAPr/CgD+/wsABQAFAAUAAAAAAP//AAD8/wIA+P8AAPj/9//4//n/8/8MAPn/GQAJAA4AFAADABEACwALABEACwAHAAoA+P8CAPD/9//0/+z/+v/s//f/9//1//7//P/8/wQAAgAHABIACgAYAAwADgADAP//+f/6//f/AwD2/wQA9P/w//f/5P/4//D/9f8CAPn/CQAEAAQACwD+/wkA//8GAAQABAACAAMA/P8CAPj/BgD3/wwA+v8OAAEACAAHAAUACgAJAAsABwAEAAAAAQD8/wkA9f8IAO3/9//w/+z/+//0/wAA///9/wIA9/8CAP//AwASAAsAFQARAAAACwDz/wAA+P/9//r//f/w//v/6P/z/+z/6//4//L/AQAEAAcAEQANAAoAGQD//yEABAAYABEACwAOAAcAAAADAPf/9//4/+3/+//w//v//P/2/wEA8//6//j/9f8EAAAACwAJAAgA//8DAPX/AQD8/wEAAQABAAIAAwAEAAAACwD7/xEA/P8NAAwA/f8YAPH/DwD8////BwD6/wAAAADu/wAA4f/0/+n/7v////n/CAABAAQAAAADAAAADgACABYAAgATAAIACwAEAAQA/f/9/+v/9//t//n///8AAAAAAwDx/wAA7v/7/wAA/f8QAAIACgAGAP3/CAD9/wMACwD6/xIA+f8JAAAABAAAAAoA+v8JAPj/BgD+/woAAAAJAPz//v/5//X//P/5////AAD7/wMA+v8CAAYA+/8SAPj/EAABAAkACgALAAMAFAD3/xcA9v8IAP7/8/8AAOz/9//z//D/9//1/+//AADm/wUA6P/9//b/+P8AAAAAAAAFAAIAAgAKAP//CQAAAAEABwAEAAoADAAFAAYAAAD4/wAA9f8GAP7/DAAKAAgACwAAAAEA/P8AAP3/CwAFABEACwANAAEACwD1/wgA//8AABAA+v8NAPf/+v/3//P//P/5//7////2/wAA8//+/wEA+f8PAPX/DAD0///////4/wsA//8FAAgA9/8DAP3/+P8QAPX/EAD6//n/AADv/wAAAAD1/woA6/////P/9P/9//7/9/8LAPP/BgD+//n/CAD2/woAAAAIAAQABwD+/xEA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BAD2/wMA8v8AAPf//v////n/AAD0/wAA9P8GAPb/FQD7/xsABgASAA8ADAARAA4AEgAMABUAAAASAPP/BwDy//7/+P/9//b/AgDt/wAA7f/1//b/8//6//3/+/8FAP//CAABAAMAAgD4/wMA8P8DAPf/AAD///z/9//+/+v//f/u//P//v/s/wUA8f8AAPr/+P/9//7//f8HAAQAAgAUAPn/GgD+/xIABQAPAAYAFgAIABcADQALAA0A//8NAPv/EgD+/xUA+v8RAPD/BADx//X//v/w/wMA8//+//L/+P/t/wAA9P8NAAAADQADAAIAAAABAAMACAAKAAQADAD5/wQA9P/8//X/+P/0//f/7v/3/+7//v/5/wcAAwAIAAMAAwAAAAcABAAOAAsACQAOAPv/CQDx/wAA9v/8/wAAAAACAAAA///3/wIA8P8KAPX/DQAEAAwADAAEAAQA9f8AAOv/CQDx/xEA+v8PAPj/CQD3/wYA/f8DAAMAAAAJAAAACwAAAAgA+f8FAO3/AADv//r/+f/6//n//P/4//j/AAD2/wYAAAAIAAsABwAJAAgABQAKAAgABgAKAP//BAD+//v////7//X/CADr/w4A7/8IAPb/AwD1/wMA8v8CAPv/AAAQAPj/GADv/wkA7f8AAO3/CgDw/xAA9f8LAPT/AwDw////9////wcA//8QAPr/CgD5/wIAAQAFAAgADwAJAAwACQAAAAsA/f8NAAcACQASAAAADQD8/wMA+/8HAPn/CgDz/wUA7P8DAOr/CADs/wQA6P/6/+f/9P/y//P////2/wIA+P8FAPX/CwD1/xIA/P8bAP//GgD8/w4A+f8LAPb/EAD2/woA/P/4//3/6v/8/+3/BAD8/w4AAgAMAAAABQADAAUACgAOAAsAFAALAAwACQAAAAEA///8/wAA/P/9//3//P///wAA/f8EAPb/BwD0/wgA9/8JAPj/BwD5///////y/wQA8v8GAPv/BAD6/wMA8P8CAO/////6//7/AAADAP7/AwD4//n/9v/w//j/8P/4//X/+P/2//7/8v8EAPj/AQALAAAAFQAOAAsAHwAHABwAEwALAB0ABgAWAAYABAD9//3/8f8EAPP/BAABAPP/CQDn/wIA7f8AAPf/DQD9/xEAAQAAAAgA8v8OAPX/CwD7/wAA9P8AAOj/BwDr/wMA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DwD6/wAA+v/7//j/AwDx/wMA6//4//L/7v8BAO7/BQD4//v/AgD2/wMA/P8FAAUADwAIABIA+v8EAO3/9f/4//T/DAD8/wkA+//5//L/9f/z/wYA/v8TAAUADAAHAAAABAAFAAQADQAJAAgABgACAAAACAAAAAwAAwACAAAA9//8//r/AAABAAoA/P8UAPD/EgDz/wcAAAD7/wIA+P/7//v//P/4/wYA6/8PAOr/CwAAAAAAEQD8/w4AAgAHAAoACAAFAAsA9v8HAPD/+v/5/+//AQDx////9P/3/+7/9//t/wQA+f8SAAAADgADAP7/BwD7/wsABAANAAoADAAFAAUA/P/8//b/+//4/wMA/P8KAPn/CgD3/wYA/f8FAAEAAgAAAP//BgD+/xAAAAAMAP//AAD6//7/+P8EAP3/CQAIAAUADgD//wMAAAD2/wMA+v8AAAgA8/8GAOz/8v/1/+X/AQDu/wAA/P/2////9//6/wMA/f8MAAgAAAAOAPL/DAD4/wwADAAPAA4ABQD5//b/7P/3//b/AQAAAAMA+//7//j/9f/+//j/BAACAAcABgAQAAAAGwD6/xoA/f8PAAEACwAFAA4ABgAOAAcABQAJAPn/DQDy/wsA9v8CAPr/+//1//v/8//8//n/9f8AAO//BgD3/wYABQD//wkA9/8BAPr//f/+/wAA+f8EAPP////3//b/AQD1/wkA/f8DAAQA9v8FAPf/AwAIAAIADgAAAP//AADx/wIA/f8DAA0AAAALAP3/BAABAAYACQALAA8ACwAQAAkACQAEAAEA/P8AAPT////z//T/+v/r/wEA7P8AAPL/+//4//z//v8GAAIACQAIAAEACwD5/wYA9f////X//f/7/wAA/v8AAPn/+P/6//f/BgABAA0ACgAGAAkAAgADAAgAAQAJAAMAAAAGAPj/BAD8/wAABAD7/wcA8/8AAPH//P/8/wAACgAEAAwABQAGAAQAAgABAAMA/f8EAPz///8CAPb/BQDw//3/7//0//T/9v8BAP//CAACAAUA//8IAPj/EwD3/xkA/v8SAAQAAgAFAPb/AADz////7/8DAOf/CwDr/xEA/P8PAAYABAAHAAAACwAKABQAEAAUAAIABQDy//b/8f/z//j/9v/4//v/8v/+//X///8AAAIACQAJAAYACwD+/woAAAAGAAUA+f/+/+v/9f/u//H/9//t//r/8f/7//z/AQAAAA4A/f8aAAAAGQAIAAsAEAACABUA/v8SAPX/CwDw/woA8P8OAPP/DgD7/wsABQAFAA4A//8TAP//FAADAA4AAQAIAPb/AQDv//X/9P/s//n/6v/0/+r/7//r//L/8P/6//r//f8FAP7/DwAAAA4AAwACAAIA+//7//7/9/8BAPz///8AAPn//P/9//n/CgD//xUACAASAA0ACwAOAAwAEAALABAAAAAMAPj/CAD4/wYA9v8EAPH/AAD3//j/CQD1/xYA+/8RAAEAAgADAAAAAAAHAP//AAD//+j////e/wAA6v////X/9//5//X//////wcABQANAP//CwD2/wcA+f8HAAYACAAQAAEADQD4/wEA9//+//r//v/+//r/BAD7/wsAAwALAAcABQAFAAAAAwADAAQABwAGAAEABQD4/wMA+////wYA+f8NAPj/CAD8////+P/6//P//f/6//7/AwD5/wEA9f/8//T//v/4/wMA//8BAAMA9f8FAO//AQD7//3/BQD9/wAAAAD8/wAABgD7/xMA+v8QAAAABgAJAAYACAAKAP3/CAD8////CwD6/xAA+//+//r/8P/0//v/8/8LAP//CQAKAP7/BgD///3/DQAAABEADAABAAwA9v8AAPr/+P/7//j/9P/9//D//f/0//r/+f/4//v/+P8BAPz/DwADABYABgAMAAQAAQAEAAMACQAIAAgAAAADAPH/AwDr/woA9/8LAAcAAwANAP//BwAGAAMADQAIAAUACwD4/wQA8v/7//H/9v/z//X/+f/4//3//P/7//z/+//+/wIABAAIAAgABwAHAAQABQAEAP//AAD5//T/9v/v//X/9//z//j/+v/v/wkA7f8SAPz/EQANAA4ADwALAAgACQAMAAQAGQD6/xYA8P8FAO3//v/w/wEA+f8DAAUA//8OAPr/DQD9/wYAAwADAAUABwAAAAcA+//4/wAA5v8CAOj//P/6//T////3//b//f/8//3/DwD9/xkAAAAMAAAA+f/7//T/9//9//n////+//f/AAD4//3/BAD+/wwABgAMABEADQAWAA4AEAAKAAYAAwAEAPz/CAD2/wcA+P/8//z/7//8//L//v/8/wMA/P8IAPX/CgD3/wcAAQADAAoAAQANAPr/DQDr/woA6f8DAPj/AAACAP/////5//z/+P8AAP//CgACAAoA/v/9//r/8v////r/BgAGAAcABAD+//v/9f/7//j/AwD//woA+/8NAPX/CQD2/wQA/f8FAAIABwAIAAAACAD7/wIA//8AAAIAAAAFAAAABgADAAEABwD//wMAAgD9/wEAAAD6/wwA+v8PAP//AgD///j//P/9//r/BgD+/wMAAgD3//7/8//2//z//f8CAAUA//8AAP3/9/8GAPb/DgD8/wkAAQAEAP//BAD8/wQABwABABQA+/8MAPP//f/z//n/+f/+//v////4//r/9//2//z/+v8AAAUAAAAOAPv/CgD5/wIA+P8DAPn/BgD9/wAAAgD5/wUA9/8DAPj//v/8/wMAAAAQAAIAFAAHAA0ADwAHAA8ABQAJAAYABgAIAAIABgD4/wEA8//+//X/AAD8/wMAAwACAAYAAAADAAAABQAAAAcA/f8AAPj/9f/z//P/9P/2//j/+P/7//T/+f/w//7/9/8JAAMAEAAJAA4ACAAHAAcAAQAFAAMAAwACAAUA+P8CAO///v/y/wEA+f8JAPz/CQD7/wYAAAAFAAcABwAFAAgAAwADAAUA/f8BAP7/9P8AAO3/+//z//T//f/4/wIAAAD//wAA/f/5/woA+P8VAP3/DwD//wQA+v8BAPj/AwD8/wYAAAAFAPn/AAD0//7/AQAAABEA//8NAP7/AgABAAMABgAIAAIABQD5//3/9v/3//7/+v8AAP///v8AAP//BAAEAAoABAAIAAQAAwAGAAYAAwAHAAAAAQD4//v/8f/9//X/AAAAAAEAAAD///v////8/wMAAAAEAAYAAQAJAP//BQD6/wAA8/8AAPD/BQD0/wMA+P/7//n/+P8AAP7/CAAHAAoADAAGABEAAgAQAAAACAABAAMAAAAFAPr/BAD7//7/AwD3/wYA8f8HAPT/DgD7/w8A+v8IAPb/BwD5/wwA+v8FAPb/+P/1//L/9//z//r/9f/8//T/+//z//r/+//+/wIABwD//xIA+v8TAAEACQAIAAYAAQALAP3/DAAFAAYADQD//wYA+v/8/wIAAAARAA4ADwARAAIABQAAAP//BgABAAgAAAACAPb/9f/v/+z/8//v//v/8/////D////w/wIA9/8JAP//BwAAAPz/AgD1/wcA9P8JAPD/AQDs//7/9P8DAP3/BQABAAIACwD8/xUA+P8ZAP7/GwAFABgABAALAAAAAQAHAP//DgD6/wgA9P8CAPX/BgD6/wwABwAJABMAAAAOAPn/AAD///r/BwD6/wIA9P/3/+v/8//p//f/7f/4//P/8//6//P/BQD2/wwA9f8JAPj/BQAAAAYACAACAAsA+P8LAPL/CADy/wcA9/8IAP7/AQADAPf/DwD1/x0A+v8dAP//EwADAAwABQAHAAcA/f8LAPL/DAD1/wcAAgABAAoA/P8FAPr/BQD+/xAAAAAVAP3/CwD7//v//v/y/wEA8f8AAO3/+P/e//b/2v///+v/AwD8//v////4/wAABQAGABIACgAPAAkAAwAAAP7/9P8BAPP/BAD5//3//P/z/wAA9f8HAP//DQAAABQAAAAXAAQAEwAGAA0AAwAEAAAA/v8AAPz/AwD7/wQA+f/9//3/9v8CAPr/BAD//wgA+v8IAPL/AgD2//3/AAD6/wYA8v8DAO///v/0////+P8FAP3/CAAEAAQACgADAAsACAAJAAoABwAGAAQABAAAAAQA+/8DAPf/AAD7/wAAAgAFAAEACwD6/wsA/f8HAAoABQANAAIAAAD9//j////7/wMAAAD8//7/7f/4/+n/+v/w/wIA9P8EAPH/AADu/wAA+P8BAAEA//8AAPj/AAD4/wYAAAAFAAYA/P8BAPv//f8GAAMADgANAAgADAAAAAUAAQABAAwAAwAQAAcABgAGAAAA//8AAPz/AwABAAQABAADAAAAAAD9/wAA+/8DAPn/AwD8//7//P/6//f/+P/2//f//P/z//3/8f/6//f/+f////r/AAD9//z//v8AAPj/DQD0/xQA+/8KAAUAAAAKAP//BgAAAAUA+v8NAPP/FwD4/xYAAAANAAAABwAAAAUABwADABAAAQAOAAIAAwAIAAEABwAHAP7/BwD3/wAA/v/8/wAA+v/z//z/5/8AAO//AQD5////9f/6/+3/+v/0/wIAAAAFAAYA+f8CAPH////9/wMACQAHAAgA/v8AAPX/AAD7/wEABQD8/wUA8/8CAPT/BgD6/wsA+f8OAPT/DgD8/wsACQAFAAwAAQAGAAAABAAAAAoAAgANAAUABgABAAAAAAACAAUAAgAJAAAABQD//wAAAAD7/wAA9f/+//P//f/0//3/9f/8//X//f/2/wMAAAAGAAgA//8GAPX//v/5//r/AgD5/wEA+f/5//f/+f/z/wMA9f8KAAEABwANAAYADgAJAA4ACgAPAAYADAAFAAgAAwACAPz//P/2//3/+P8BAP7//f////r/+/8EAPn/EAD9/woAAQD9/wAA+P////v//v/5//n/8P/4/+7//v/5/wIABgAAAAcA//8CAAQACQAKABQACQANAAMA+v8BAPT/BQD9/wQA///8//n/+v/5/wQAAAALAAkAAAALAPb/CAAAAAYAEAAEAA4A+v/9/+7/9P/w//j/9f/7//X/+//2//v//v/7/wkA+P8QAPj/DwABAAoADQAFAAoA/v////z//P8AAAMAAQAHAAAAAQACAPn/BwD4/w4A+/8TAAAAEAADAAYAAAD///r/+P/8//H/BgDz/wkA9v8BAPL/AAD1/wUAAQAGAAsAAwAMAAMABgACAP//AgD6/wEA+P/9//L////r/wEA7P/+//T/9//7//f////4/wMA+/8JAAIACwAJAAUABgD/////+//8//v//v/8/wAA+v/7//r/8f8GAO//FwD5/xwAAgAUAAQADQADABEACQAVABIABwAUAPf/EQD5/w0AAgAGAAIA/P8AAPn/BAAAAAsAAgAHAPn/9//w/+7/9P/3/wAA9v8AAOT/+f/d//f/6v/9//b/AAD9//7/AwAAAAgACQANAA8ADgALAAcABwABAAUAAAAHAPj/BwDv/wMA8//8/wAA+P8LAP3/EAABABAAAAAQAPz/FQD7/xUA+/8KAPz//f/+//f//f/1//f/9f/x//n/8v/9//z///8AAAEA+v8DAPb/AgACAAEAEgAAABQA+f8LAPH/BwDx/wgA+v8KAAUACwALAAoACQAGAAUAAAAFAPz/BgD8/wEA/v/5//v/8P/y/+//7v/5//T/AAAAAP7/AwD9////BgD+/xAABAANAAYACAAAAAYA/f8BAP7/+f///+//+//w//n/+/8AAP3/CwDz/wkA9////w0AAAAaAAsAFQAMAAsAAwAHAPz/CQD3/wYA9v/8//v/+f8DAP//CAD9/wUA9f/+//n///8CAAgABAALAAAAAQD+//b////3/wEAAwABAAsA/P8HAPn/BAD6/wUA/f8GAAAAAgABAPv//v/0//n/8P/4/+r/+f/l//n/7f/5//n/9f/+//P/AAD8/wcACwAPABUAEQAUAAwADAAIAAoACAAPAAIAEgD4/w0A+P8GAAAA//8EAPz/AwD+/wMAAgAGAAIAEAAAABAA//8AAAMA9/8GAPz/AQAAAP3//v/+//r//v/1//j/9P/y//r/8v/9//b////y/wEA6f/+/+r/+P/0//3/9/8IAPT/CwD4/wQAAgABAA0ACQAOABQACgAVAAkACgAKAP//CAD7/wgA/P8OAPj/DgDw/wYA7P8AAPD/AAD4/wcA//8LAAMABQADAAAABQAAAAYABAAEAAYAAgADAAQA/f8FAPr/AAD8//b////y//3/+P/z/wEA6/8FAO7/AAD4//v//P8AAPr/CwD9/xEABAAJAAkAAAAHAAAABwAEAAgABgAFAAQA/v8AAPz///8AAP//AgD8//7/+f/5//3/+v/+////+f8FAPr/CwAEAA0ABwALAP7/BwD4/wMAAAACAAkAAQABAP7/8v/7/+7/+f/4//b//v/6//r/AAD4//7/AAD4/woA//8LAAoADAAKABEAAAATAPr/DwD//woACQAFAAoAAAABAP///v8AAAAA/v8AAPr//f/5//r/+//3////8f8AAO7//f/z//T////u/wUA8v8DAPj/AwD6/wcA9v8LAPP/CAD7/wEABwD7/w0A9f8JAO//AQDt/wAA9f8JAAAAEQAFAAsACQABABIAAAAYAAgAFAAOAA8ACwAOAAQACwABAAYAAAAHAPv/CwD0/wYA8v/7//X/9//8/////f8GAPn/AAD8//H/CQDs/xMA8/8NAPn/AAD6//v/+v8BAPr/BAD2//z/9v/1//z/+v/8//3/9v/5//P//P/0/wIA+f8BAP7//f8AAP//AgAJAAgADAAPAAIAFgD5/xgA/f8TAAIADQAAAA0A+f8OAPb/BwD8//3/AwD3/wMA+v8DAP7/BwD5/wgA+P8IAAMACgAKAAYAAQAAAPn//v////3/BwD7/wIA+f/3//X/9P/1//3/+/8DAP///v////X/AADz/wEA8f8EAOz/BQDx/wEA/f8AAAAAAgD7/wIA/f8AAAcAAQAOAAMADQADAAgABAAHAAMACgAAAA0A/P8KAPn/AwD8//7/BQD7/wYAAAD+/woA+P8OAP3/CAAHAAUADQAFAAUABAD5/wAA9//7//v/9v/+//X////1////9v8BAP3/BAAAAAQA+/8GAPX/CwD2/woA+v8CAAAA/P8DAPr/AAD6/////f8FAP3/CwD6/wgA/P8FAP7/AQAAAP//BQAAAAIA/v/7//n/+v/6//7/+f////b//P/+//r/DAD9/xEAAQAHAAIA/f8CAP//AwAIAAAABgD8//j//f/y/wMA/v8IAAoAAwAMAPz/CwAAABAADAATAA4ACgAFAAAA/v8BAP7/BAD//////v/1//z/9P/7//v//P/8//3/9P////H/AwDy/wkA8f8KAO7/BgDx/wMA9/8EAPn/AgD5//7/+//3/wMA9f8MAPn/CwD8/wYA+v8HAPr/CAD9/wYAAAAFAP//AgD///3/BAD9/wwABAALAA8AAAAVAPz/DgACAAMABQAFAAAADQD2/woA8/8BAPv//P8FAPv/BwD7/wAA+//7//3///8CAAkABAAQAP//CQD5//7//v/9/wEABAD7/wQA8f/9//D/9v/6//b/AAD3//7/9v/4//f/+//9//7/AQD5/wIA8f8EAPD/CQD2/xAA//8QAAEACAAGAAIAFQADAB4AAAAVAPz/BwD5/woA9/8XAPT/FAD0/wAA+P/z/wAA/f8HAAkABwAHAAMA/v8EAP3/CQACAAoAAAADAPn/+f/8//j//v////X/AQDu//3/9f/3//3/9//9/wEA+f8MAPr/CQD9/wAA/v/+//v/AAD6/wEA/P8DAP3/AgD8//z/AAD2/wcA9v8HAP7/AwAEAAMA//8JAPP/CgD0/wQA//8AAAEA//////3/AAD4/wcA+v8KAAMABAAHAAQAAAAQAPv/EwAFAAgAFQD//xUA/P8FAP3///8AAAUA/v8IAPb/AgDx////9/8AAAQA//8PAPz/DAD5////+f/5//v//v/6/wEA9P/9//P/9P/7//X/AwD+/wAAAwD4/wQA+/8EAAkAAwAQAAgAAgAPAPP/DgD1/wUA///+////+P/4//f//P/7/wQA/f8BAPf/+f/2/wEA/f8SAAAAEgAAAAIA/v/7//r/AQD6/wkA//8IAAEAAgADAP7/BwD8/wkAAAALAAcACQAJAAUABAAFAAAABwABAAIABwD3/wUA8//6//v/8/8FAPj/BAD+//3//f/9//n/BAD4/wUA+P8AAPj//P/5//b/+//u//3/7f/5//n/9P8AAPn/+/8HAPb/DQABAAUAEAABABEABgAHAAkAAwAHAAsABwARAAoACgAGAAMA/v8EAP3/AwAHAPv/EAD1/w0A9P8CAPb//P/5//3//f8BAP3/AQD///f/AwDw/wgA9v8KAAEACQAGAAQAAgAAAAAABAAEAAYAAwD+//3/9f/9//b/AAD+//r/AQDw/wAA9P/8/wEA+P8EAPj//P/+//j/BAD//wQABgD+/wUA+/8DAAIAAQAIAP//AwAAAPf/BQDx/wgA+f8EAAAAAQD//wMA/f8JAAAABwAFAAAACwAAABAAAwAPAP//CQD2/wUA/P8FAAoAAAAOAPv/BAD6//v/+/////j/BwD2/wMA+f/0//7/7f8AAPb//f/+//r//P8AAPj/DAD7/w4AAAAIAAMABgAFAAMABwD9/wMA/P/5/wIA9f8BAPz/9/8EAPT/AwD9//z/BQD5/wQA/v/7/wYA9/8HAAEAAAAKAPv/CAD6/wAA/v/7/wMA+/8CAP3/AAACAAgABQARAAAADgD4/wkA/f8LAAYADAADAAMA+//9//r///8AAAAAAwAAAAEA/P////r/AAD8/wEAAAD+/wEA+P8AAPv/+/8DAPL/AwDx//7/+/8AAAAABgD6/wcA9f8GAPn/CgD+/woAAAADAAMA//8FAP//AQAAAPv/AgD8//z/BgD0/woA+v8AAAcA+v8GAAEA/P8MAPj/DQD9/wIAAgD9/wEABQD6/w4A9v8IAP7//P8FAPv/BAAAAAAAAQACAAEABwACAAMAAgD9/wMAAQADAAUAAQD//wIA9/8GAPr/AAACAPb/BgD1/wIA+v/+//v/AAD4/wIA9f/6//L/9f/1//r/+P/9//f/9v/3//X/+/////v/CQD4/woA//8HAA0ACQAVAA4ADQAPAAIADAADAAgAEAABABIA+/8GAPX//v/2/wMA+f8MAPT/CgDs/wQA8/8CAAUAAgALAAAAAQAAAP7/AAAGAP7/DwD2/woA8f8AAPf////+/wEA+/8AAPj//P/8//////8HAAAACAAEAAAABAD8/wAAAQAAAAIAAQD9/wMA+v8HAPv/BgD9/wAA///9/wAA/v////r//v/5//v//f/1//3/9//5/wEA+/8EAAAA/v8DAPj/BAD+/wAADQD8/xUAAgANAA0ABAALAAgAAAAOAPz/CwAEAAMADgD8/w0A+P8BAPT/+//z//7/+P8AAPv/AAD3////9v/+//3//P8CAPr/BAD7/wEAAAD+/wIA///8/wQA8v8HAPT/BQD9/wEA///+//r//f/6/wAAAwAFAAoAAgAIAP7/AgD//wQAAAAMAP//BwD///v/AAD8/wAABgD//wIA/P/2//7/9v8HAAIACQAJAP3/BQD0//3//f/6/wwA//8OAAMABAADAP//AQAEAAAADQAAAA0AAwAGAAoA//8LAPv/BQD5/wEA+v8CAPj/AwD1/wMA9P8AAPn/+f////T/AAD1/wAA+v8AAP7//v/9//3/+f/+//r/AAD8/wAA+//8//f/+//0/wAA+P8GAAAABwAEAAYAAQAGAAYABAAQAAEAEQABAAkAAwAIAAIADAD+/wwA+P8HAPr///8FAPn/CwD6/wEAAAD2/wMA9f8AAP3//v8HAP7/CQAAAP//AAD5//r/AADz/w0A9f8SAPr/DAD7/wIA/v/8/wQA/f8EAP//AgD7/wYA9P8JAO//AQDw//T/+P/u/wIA9/8HAAEAAwAAAAAA+/8GAAIADQANAAoADgAAAAgA/P8CAP7/AAABAP7/AAD4//v/9P/6//r//f8DAP3/BgD5/wkA/f8NAAQAEQAFABUA/v8UAPf/BQD9//T/BwDv/wkA9f8BAPr/+f/6//r/9v8EAPr/DAADAAUABQD9///////9/wUA/v8KAP3/DQD8/wUA///8/wAA/P/6/wAA9v8CAAAABgAPAAQAEAD9/wMA/P/9/wIAAAACAAQA+//+//P/9//x//f/9v/8//z/AAD+/wUA/v8IAP//BgABAAMABgADAAkAAAAJAPn/BwD2/wQA/P///wIA/f8AAP////8AAAYA//8PAPj/DQD0/wcA/f8IAA0ABgAMAP7//f/4//X/+v////v/CgD4/woA9v/9//z/8v8GAPb/BAABAPf/CADy/wYA+v8AAP3//P/2//r/8P////P/CgD+/wwABwD//woA9v8IAPv/BQAFAAMACwAHAAMADAD1/wgA+P8CAAYABAAIAAgAAQAEAAQA/f8HAP3/AgAFAPz/BgD7//z/AAD4/wUAAgAAAAoA+f8BAP7/9/8JAPv/CgAFAAAACAD4/wUA+f8CAP3//v/8//r/9/////X/BAD2/wIA/P/6/wYA9P8IAPf/AQD/////AAACAPf/BADx/wQA9f8AAP3/+/8IAPv/DgAAAAQABAD+/wsABgARAA8ACgAIAPv//f/5//v/BQACAAkABgD7//7/8P/3//f//f8BAAQABQABAAIA///+/wUAAAAJAAYAAwABAPv/+//6/wAAAAABAAAA9f/6//D/+f/8//7/BwD+/wgA/P8AAP//+P8CAPz/AAADAPv/AgD9//r/BQD3/wsA/v8IAAQAAQAGAAAABwACAAkABwAFAAcA/v8AAAAA9f8HAO//CQD5/wEAAwD4/wEA+f/5/wYA/f8NAAkAAQAOAPn/CgAAAAQACQAEAAUABAD+/wAA9//6//L//P/z/wAA+/8AAAEA/P8BAPr//v/9//7/AgABAAQABAD+/wUA+f8FAPz/BgADAAMABgD+/wEA/f/7/wQA+f8EAP7/+f8BAPX/AAAAAPv/CAD2/wEA+P/3/wEA9/8NAP//DAABAAQA/P////v/AgAAAAoAAgAIAP3//P/8//X/BwD//w8ACAAHAAYA/v/+/wIA+v8MAP//CgAEAPz/BADy/wAA+f///wUA/P8KAPr/BwD7/wMA/v8CAAAAAgAAAAIA/v8AAP///P8EAPP/CADv/wYA8v8CAPj//v/9//j/AAD4/wAA/v8DAAEADgD9/xMA9/8KAPj/AAAAAPz/CAD6/wgA+v8AAP3/+/8AAAAAAAAHAP//CQD+/wMAAgD8/wYA/f8AAAsA9v8VAPf/CQD8//j/+//1//n//v8AAAIABgD//wQA9/8FAPb/EAD//xYABAAHAAYA9f8HAPP/BwD+/wUAAQACAPz////5//v/AgD5/w0A9/8MAPX/CQD2/wkA+f8FAP//+/8GAPT/CgD6/wcAAQACAPr/AADu/wAA8/8BAAMAAAALAPr/BQD1//7//f///wYABAAHAAQAAAD+//3//P8EAP7/EAD7/w4A+v8AAAMA+P8MAPv/CAADAAAABQD6////+P/4//3/+v8CAAIAAgAKAP//BQD+//r/AAD2/wUA+v8GAP7/AQD///z//f/9//z/AQAAAAEAAAD7/wAA9f8FAPX/CQD8/wQABQD+/wkA/f8EAP//AgD9/wcA+P8IAPn/AwAAAAAAAQD///7/+v8CAPn/CgAAAAYACAD7/wYA+P/+/wAA/P8EAAQA/P8KAPP/BQD6////CQAAAA4AAgAHAAAAAgD9/wIAAAAHAAIADAD+/woA+v8AAAAA9f8FAPb/AAD///n/BgD4/wMA+v/+//////8CAAQAAAAFAPz/AAD9//z////5/wEA+/8GAAAABwAAAAAA/f/7//z//P/+//7////+/wAA/P8AAPr/AQD9/wIABgAAAA0A+/8MAPz/CQAAAAQAAAAAAAAAAQAAAAMAAAAAAAIA+v8GAPz/CgD//wUA/f/5//z/9P////z/AgACAAIA//8CAPj/BQD8/wUACwD//xUA9/8NAPf/AwD6/wQA/f8GAAAA//8AAPT//v/t//z/7P8AAPL/BQD6/wEAAgD5/wkA+/8HAAUAAgAMAAcACAAMAAIABQAEAPr/BQD5/wIA//8FAAEACQAAAAMAAQD2/wYA8v8KAPj/BwAAAAAAAAD/////AAAAAAAABAAAAAUA/f8FAPz/BAAAAAAABgD8/wcA+/8AAPr/+f/6//v/+f8BAPj/AAD4//f//v/y/wUA9f8JAPz/BgAAAAQA/f8EAPr/AwAAAAAACgD+/w8A/f8LAP3/AwD//wAAAwAEAAgABQAFAAEA///6/wAA9P8HAPj/CQAAAAIABAD9/wIA/v8DAAAABQD//woA/f8MAP//BQAAAP//AAABAAAABQD//////P/0//v/8v/7//f/9//8//T/+//8//f/BAD4/wMAAAAAAAUAAwACAAgAAAAIAAAABAACAAEABAAAAAQA/v8AAPz//P8AAAEAAgAIAP7/CQD6/wQAAQAAAAsAAAAKAAMAAQAFAP7/AgAAAPz/AQD2////+//+/wcA//8MAPv/AQD3//b/+P/4//3/AAD//wAA/v/z////7P8BAPT/BQABAAkABAAIAAQABAAKAAEAEgABABUA//8SAAAACwAEAAMAAQAAAPj//P/3//X//v/0/wQA+f8GAP3/AAD///v/AgABAAAACQD+/wUA//8BAAAAAgD9/wIA+f8DAPb/BgD4/wIA///6/wQA9P8AAPL//f/2/////f8EAP//CAD+/wMAAAD8/wcA/P8MAAcACAAQAAIACgADAAAABwACAAQADgD6/xEA8/8FAPb/9//7//H/+//0//z/+P8BAPr/BgD4/wQA+P8BAAMAAQAPAAAACwAAAAEAAQAAAAAAAQD9//v/+f/z////8f8FAPX/AAD3//H/9f/v//j//f8FAAgADQAFAAYA/f8DAP7/CgAHAAgADAD8/woA+P8LAAAACwAFAAQAAAAAAPr/AQAAAAMADQAAABEA+v8GAPr//f8BAP3/CAADAAUABgABAAIAAgD9/wQAAAAAAAgA+P8IAPb/AgD7//3//f/5//j/+v/1//v/+f/1//7/7v/+//H/+//5//r/AAABAAYACgAMAAYADgD8/w4A+v8NAAEABwAKAP//DAD4/wMA8//7//X/+//8/wIAAAAIAP//BQABAP//CwD8/wwAAQACAAkA/v8LAP3/AAD9//X/+//5//b/AgD0/wMA+////wQA+f8IAPn/BAD///7/BQAAAAUABgADAAAAAADw//7/7/8AAP7/AAAKAPn/DAD4/wkAAAAKAAQADgAAAAsA/P8AAP7/+/8FAPf/BQDw//v/7f/5//b/BAD//wsAAQAFAAMA//8IAAAADgAKABIADgAMAAMA///2//b/9f/5//3/+//+//b/+P/y//P/9//2/wIA//8OAAYADgANAAQADQADAAUACQD8/wUA+//5/wIA9f8GAP3//v8EAPT/BQD3/wAAAgD//wYACAAAAAoA/P////3/9f8CAPf/BQD3/wIA8/8AAPX/AgAAAAIABwAAAAcAAQAHAAcACwALAAsABwABAP//+f/4//j/+P/6//r/+f/5//X/+f/1//r/AAD//woABgAIAA4ABAAMAAgAAgANAPv/CwD9/wYAAQABAP7////1////8/////z//v8FAP7/DAAAAAkABAACAAMAAAAAAAIA/P8EAPf/AAD5//n////w//3/8//3/wAA/v8JAAcABwAEAAIA/v8CAPz/BAD7/wMA+v/+//v/+P/8//z//v8AAAEA+/8EAPn/BQACAAgACgALAAQACgD+/wUA//8CAAUAAgAFAAAA/P/5//b/9v/9//j/BwD+/wsAAQAJAPz/BgD4/wMAAAACAAwAAgAIAAAA/f/7//z/+P8FAPr/CgD//wMAAQD+/wMAAAACAAUA//8DAP3//v8CAP3/CQD//wUA///5//z/8/8AAPn/CAAAAAcA//////z////5/wQA+f//////8/8FAPH/BwD1/wYA9/8BAPj//v/7/wMAAwAMAAkACQADAAMAAAACAAcA//8MAPz/CAAAAAUAAAAJAPz/CQD4/wQA+f8AAP7/AQAEAP//BQD5/wIA/P8EAAEACwAAAAoA/P8AAPn/+f/5//f////1/wIA8/////T//f/3/wAA+v8AAPv/AAD+//7/AgD4/wUA9v8DAPz/AAD//wAA//8CAAAACwAEABIABwAMAAYAAQAHAP3/CgAAAAcABAAAAAEA/v/5/wIA+P8AAAAA+P8CAPP/BAD4/wwABAAQAAwABwAFAAAA//8FAAMACQAGAP//AADx/wAA7P8JAPT/CwD8/wMA+f////T////5////AQD7/wIA9/8AAPX/AgD2/wIA+P8CAP3/AwAFAAIACAAAAAIAAQAAAAAABgD9/wkA/P8AAP//9v8CAPf/AwD9/wAA+//8//r///8BAAYACgAKAAwABwAMAAQADAADAAgABQD//wkA+P8HAPf////5//f/+//1//v/+f/6//7//v/9/wMA+P8CAPv///8DAPz/CQD7/woA+v8DAPz//P////v///8AAAMAAAAMAPn/DwDx/w4A7v8NAPr/BwAIAPv/CQDy/wEA8v8EAPb/DQD6/woA+/8AAP///v8HAAQADgAFAAsA/f8DAPf/AQD//wAACQD9/wUA+//5//v/+v/6/wUA9/8GAPb//f/+//r/CQD8/w4A/v8HAP//AAADAAAABwAAAAYAAAD///7/+//6/wAA/P8GAAEAAwAGAPj/CAD1/wcAAQADAAoAAAAEAPz//v/6/wAA+v8GAPr/CAD5/wQA+f8AAAAA/f8IAPj/CgD2/wcA+P8FAPz/BAD9/wIA/f8AAAEA+P8HAO//BgDu/wAA9P8CAPz/CAAEAAMACgD9/wgAAAAGAAQACgAEAAwAAgAHAP//AAD8//3/AAD8/wUA/v8BAAAA+/8CAPv/AwD//wMAAAADAAAABQD//wYA//8AAAIA8/8FAPD/BQD5/wAA///2//7/7v////L/AQD//wIAAwAAAPn/AAD1/wAAAgD+/w0A9v8HAPX/AAD//wEABQAHAAMABwAAAAAAAAD5/wUA+f8LAP7/BgD+/////v/7/wUA+/8NAPr/CwD//wYAAwAGAAEACQAAAAcAAwADAAUAAgAGAAIABQD+////+//8//7/AAACAAYAAQAFAPn/AgDy/wAA+f8AAAAA///4////8v8AAPn/AAAAAP7/AAD9/wUA//8FAAAA/v8AAPr//v/9//z/AgD//wIAAwD9/wAA/P/7/wMA9/8KAPj/CwD9/wgAAAAFAAIABwAEAAkABAAFAAUA//8IAPr/CAD6/wIAAAD9/wEA+v/6//3/+P8DAAAAAwADAP////8AAPv/AwD+////AQD//wEABAAAAAAAAQD2/wAA8v/8//j//P8AAP7/AgD8/wAA+v8DAP7/DgACAA0ABgAEAAQAAgD9/wMA///6/wgA8P8JAPT/AAAAAPz/AAD+//v/AAD6/wAAAgD+/woA/P8IAAAAAAAIAPn/CQD4/wcA+P8EAPz/AAACAPz/BQD9/wQA//8IAPz/DgD5/w8A/f8IAAIA/v8EAPf/AAD5//3//f/7//7//f//////AAD//wQA/v8KAAAADQAEAAgABgACAAcA/P8GAPX/CADz/wkA9f8BAPP/+P/1//X////3/wYA+v8KAP7/DAD//wwAAAAHAAYAAgAKAP7/CwD7/wYA+v/4//n/8P/1//v/9f8DAAAA//8KAPf/CgD4/wEAAAD8/wcAAAAEAAUAAAADAAMA9/8HAPL/BAD7/wIAAwAEAAQABAAEAAMABgABAAUA//8DAPz/AgD8/wQA/f8CAP7/+f/+//X//P8BAPz/DAD//wUAAQD+/wIAAAAAAAUAAAADAAAA/f/+//b/+v/3//n/+v/5//f//f/3/wIAAQADAAkAAAAIAAAABgAEAAYACAAEAAoAAQAHAP//AQD6////9v8BAPn/BAAAAAEABgD8/wkA/P8GAAMAAAAJAP//BwADAAIAAgAAAPr/AAD2/wAA+f////7/+v8DAPr/BQD6/wMA+/8AAAEAAQAIAAMABQACAP7//P/7//b/+f/6//b/AQD0/wcA8/8IAPj/BgAAAAQABAAEAAcABAANAAIAEAAAAAsA+v8EAPP/AAD2/wAA/v8AAAAA/P////j/AQD6/wIABAAAAAwABAAKAAkAAwAHAAAAAAACAPz/BgD+/wAAAwD2/wQA8P8AAPb//v/+/wIAAAAFAAAAAwD//wAA/f/+////9v8CAPL/AwD7/wAABAD6/wMA+f/9//7//f8BAAIAAQAHAAMABAAEAPz/AAD3//3/+P////n/AgD6/wIA/P/+//z/+v8AAP7/BwADAA4ABQAPAAYACAAKAAIACwAEAAgABAAGAP7/BAD6////+//7//r//f/9/wAAAgABAAQA//8AAPn/AAD6/wAAAQAAAAQAAAAAAAAA+/8BAPn/AwD9/wIAAQACAAMABwAAAA8A/f8KAPr//f/7//b////6/wAA/P////j////3////+v8AAP//BQAFAAgACgAFAAcAAQAAAAEA+/8CAPv/AQD//wAA/v8AAPb/AADy//z/9//5//7/+v8AAP//AgD+/wUA+P8GAPz/BQAKAAcADgAKAAMACAD+/wAAAAD//wUAAAAHAAAABAD+/wAA/P8AAPz/AAD7/wAA+/8EAP//AwAEAPz/CAD4/wYA//8DAAYABAACAAYA+v8DAPb/AAD7//3//v/4//r/9v/4//v/+v/9//v/9//7//T//v/6/wIABQAIAAgACQADAAEA/f////7/BQABAAgAAgADAAAA/v8AAP7/AAABAAEABAAFAAUABwAEAAIAAwD8/wIA+/8BAP//AgADAAYAAgADAAEA+/8GAPn/DAAAAAsAAwAIAPz/BQD2/wAA9v/9//3/+v8FAPX/BgDx/wAA8/8AAPf/AQD7/wEA//8AAAUAAAANAPz/DwD4/wkA/v///wQA+/8EAP////8AAPr/+P/9//T/AAD5/wAAAAAAAAcABQAKAAcABgADAAAAAQD//wQAAQALAAIACgD///7/+f/3//j/+v/+//v/BAD4/wUA9v8EAPT/AwD3/wEA/////wYA+/8IAPf/BgDz/wQA8/8CAPv/AQAEAAAACgD+/wsA+P8NAPf/DgD//wsAAwAEAAAAAAD+//z//v/1/wQA8f8MAPP/CgD6/wIAAwACAAoABQAKAAEACQD+/woA/f8HAP//AAD+//n/+v/v//n/7P/+//X/AQD//wEAAAD///////8CAAIACQAIAAoACAAGAAMAAQACAP7/AwD5/wIA9/8DAPz/AwAEAP3/CAD2/wYA9P8HAPf/DwD+/w8AAAABAP3/9//8//b/AQD2/wcA9f8GAPj/AQD//wAABgAAAAoAAQAIAAAACAD//wkA+f8EAPj//P/9//X/AADy/wAA8v8BAPb/BQD5/wcA+/8IAAAABQAIAAAAEAAAABIAAwANAAEABQD//wEA//////z//P/6//r/+//5//v//P/+/wAAAwAAAAUA//8CAP//AgAAAAUA/f8IAP3/BwABAAIABgAAAAIA/v/8//j//v/3/wgA+P8MAPb/BAD0//v/9v/2//3/9f8FAPT/CQDx/wUA8P8CAPf/BQD8/wgAAAAIAAYABAANAAEAEAABABAAAAAKAPz/AwD8/wUAAgAIAAYAAAACAPn//P/8//7/AQAHAAQACAAFAAIABgABAAgABAAGAAAAAQD4/wEA9v8BAPX//P/y//f/8f/3//b/+//+//7/AgD6/wMA9f8FAPb/CwD4/w8A9/8NAPv/CAAAAAEAAAD+/wEA//8JAAIADgABAA0A+v8IAPb/BQD7/wcA//8JAAAABgAAAAAAAAD9/wAA/v8DAP3/BgD6/wcA+f8FAP//AwD//wAA+P////f//f/+//z/AAD5//z/9P/8//L/AAD6/wMABAAAAAgA/f8IAP//DAABABAA/v8QAPz/DAAFAAUADgD+/wsA9/8EAPH/AwDv/wUA8v8GAPT/AwD1//z/+f/3////+/8BAAIAAwABAAMA+v8AAPb//v/+/wIABQAGAAQAAwABAAEAAAACAP//AAD7//7/+f////v/AAD+/////v/6////+/8CAAQABQAOAAAAEAD9/wwA//8OAAAAEQD+/xAA//8LAAMAAAAEAPT/AQDw/wAA8/8EAPX/CQD3/woA+P8GAPr/AgAAAAIABQACAAcAAAAGAPz/AwD8/////v/+/wAAAAADAP//CgD6/wsA9/8AAPb/9//0//b/9v/6//z//P8AAPX/AADv/wIA9f8IAP7/DQD//w8A/v8LAAAABgAFAAYACQAHAAgABgABAAQA///8/wMA8f8HAPH/BwD5/wMA/f8CAPr/BwD5/wcA/v///wcA+/8OAPv/CwD3/wMA9/////7//P8AAPv//f/8/wAA+P8HAPD/DQDw/wcA+f/8/wQA+/8LAAMACwAAAAgA8f8HAO7/CAD6/wYABAADAAQABAACAAUABQACAAoAAAAJAAIACAACAAcA//8BAPr/+//2//n/9//9//v/AQD+////AAD2/wEA+P8DAAIACQAEAA8A/f8JAPr//v////b/AQD1//3/9//5//j/AAD1/woA9f8JAPv/BAAHAAcAEgAKABIABgAJAPv/AQDz/wMA9/8IAPv/BQD6//v//v/x/wkA8f8MAPb/BQD8/wQA/v8KAPv/CwD6/wQA/v/4/wIA9P8FAPz/BgAAAAQA+f8DAPb/BAD+/wYACAAFAAgABAD//wIA9/////n/+//6//v/+P////n/AQD+/wAAAQD9/wYAAAAKAAYADAALAAgADAABAAcA/v8CAAMAAgADAAMA+f////L/9v/9/+z/CQDq/wgA8v8AAPn/AAD4/wcA+P8HAAAA//8HAPn/CwD3/wwA9/8JAPf/BAD2/wUA+/8GAAAAAwD+/////f/2/wQA8f8GAPj//v8AAPv/BAADAAUACgAIAAUADAD9/w4A/f8NAAkACQAQAAUABwAAAAAA/P8GAPr/DgD5/wcA+v/9//r/+v/2//7/8//9//b//P/9/wAAAQADAAAAAQD7//7/+//9/wIA/v8NAPv/DwD3/wUA9//8//r//P/8/wAA+v////n/+v8AAPX/BwD0/wgA/f8DAAgAAAANAP7/DwD//xAAAQAOAAEADgAAAA4AAwAHAAkA/P8JAPb/BgD2/wMA+P8BAPj/AAD2////9f/8//r/+P8AAPr/AAAAAP//AwAAAP3/BAD4/wIA/P8AAAMAAAAFAAAA///+//n/+//8//n/AQD5/wAA/P/8/////f/9/wIA+f8GAPv/CAADAAcACgADAAoAAAAGAAAABQADAAYABgAJAAQABwAAAP7//v/2/wEA9f8FAPn/AAAAAPn/BAD5/wEAAAD//wAAAwD5/wwA9v8NAPv/BwAAAAAAAAD+//7/AgD+/wcAAgABAAUA+P8DAPb/AQD6/wEA/v8CAP//BQAAAAYAAQACAAQAAAAFAAEAAwAFAAQABQAHAAAABgAAAP//BAD3/wUA9/8AAPz//v/+////+f/+//P//v/0/wEA/f8BAAQA/f8FAPn/AQD5/wAA/f8DAP//BwD6/wUA9P8AAPf//P8AAPv/BAAAAAAABQD+/wAAAAD5/wQA+f8EAP3/AgABAAEABQAFAAIABwD//wQAAgABAAoAAgALAAMABQACAP7/AQD5/wAA+/////3////6/wAA9/8AAPn//v/7//7//f8AAAAAAAAHAPz/CwD5/wsA+v8KAPv/CAD9/wUAAAADAAAAAQD8//7/+v/7/////P8FAP//BAABAAAAAgABAP//BwD6/wkAAAAHAAgABQAIAAYA/v8FAPX/AQD4/wAAAAABAAMA/v8AAPj/+f/9//f/AwD6/wAAAAD7/wEA/P/9/wEA+P8EAPn/AQD///3/BgD7/wQA+v8AAPn/BAD8/w4AAAAOAAAABwD9/wAA+//7/wAA+f8FAPj/BQD1/wIA9/8EAAAABgADAAIAAgACAAMABwAGAAkACAAHAAcABAADAAIAAAAGAP//BwAAAP7/AAD0//3/8P/5//L//P/2/wUA+/8NAP3/CQD9/wAA///7/wMA/v8GAAIAAAAAAPn/+v/7//r/AAD/////AwD+/wYAAAADAAEA/P8EAPX/CQD3/wsA/v8KAAAABgD7/wAA9f////j/AAAAAP3/CAD8/wkAAgACAAUAAQADAAUAAgADAAIA/v8AAPn/+f/5//P/+//z//3/9/////b/BQD3/w8A/v8PAAEACgADAAkABwALAAgACQAIAAUACAD//wUA+v8CAPr/AQD7//3/+v/7//r////6/wQA+v8JAP3/DgABAA0AAAAFAPz/AAD4////+/8AAAIA/v8GAPn/AAD4//j//P/4/////P8BAP//AgAAAAAA/v8AAPv//v////n/CAD1/w4A9P8NAPP/CAD0/wYA+f8HAP3/CQAAAAYABgAAAAsA/v8LAP3/BwD6/wAA+P/8//v//v//////AAAAAAAABAAAAAoAAwAMAAgACgAHAAoAAAAKAP7/BwD//wAA/P/6//b/9v/x//T/7//0//H/+f/z/wAA+P8CAP7/AAABAAAAAgAAAAQA/f8JAPr/DgD2/w0A9P8GAPn/AAAAAAIABAAHAAQABgAGAAAACwD9/w4AAAAKAAYAAgAIAAAABQACAAIAAAABAPv/AAD+//7/AwAAAAIAAwAAAAIAAQD+/wMA/f8AAAAA+f8AAPX//P/3//n/+P/2//b/9P/6//f/AQD6/wYA/P8JAAAACQAGAAgACgAIAA0ABwAMAAQACgAAAAYA/f8AAP7/+/8AAPj/AAD2//7/9f8AAPb/BgD8/wcAAgABAAcA/P8HAP3/BAAAAP///v/7//n//P/6//7//f/5////9f8AAPz//P8JAPv/DAD+/wYA/P8CAPn/BAD+/wMAAgD+/wIA+f8DAPj/BAD6/wQA+/8FAP7/AgAGAP7/DgABAAwABQADAAEAAAD//wAA/v/+////9/8EAPb/CQD7/wcAAAAGAAIACQABAAYABgAAAA8A/P8OAPr/BAD8////+v8AAPX////2//r//v/3/wAA+P/+//3/+/8AAPz/AAD+/wEA/v8EAP3/BAD8/wEA/P8BAP//AQAFAP7/CQD8/wkAAAAMAAQADgAEAAkAAQAAAP7/+//8//3//P8DAP3/AwD7/wEA9v8HAPX/DQD5/wgA/v8AAAAA//8AAP3/AgD3/wMA7/8CAO7/AAD1////+v/+//j//f/5//3/AgD+/wsAAAAJAAQAAgALAAAAEAAAAA0A//8EAPn/BQD5/w4AAQANAAYAAgAEAPz/AgD+/wUAAQAJAAAACQD5/wQA+P8AAP7/AgABAAAA/v/8//v//f/7/wAA+/8BAPr/AAD7/wIA/v8DAP7/AwD9/wAA/f/3//7/8v/+//P/+//0//f/9P/3//j//v8CAAEACwD//wsA/v8GAAMAAgAKAAEACgD//wcA+v8IAPf/CwD3/woA+v8DAAAA/v8FAP7/CwACAA4AAgAOAP//DgD9/w4AAAAIAAUA/P8HAPj/BAD7/wAA/P/+//v//v/7/////////wIA/v8BAPf/+//z//j/+f/7/wAA+v////j/+f/8//r/BAABAAkAAwAIAAAACAAAAA0ABAANAAYABgAGAAAABgD8/wcA+/8GAPr/AAD4//7/+f8AAAAA//8DAPn/AQD3/wQA//8JAAIABAAAAPz////1/wEA8/8FAPb/AwD1//7/8//+//j/AwD+/wcAAAADAAMA/v8IAP3/CgADAAkABAAFAP3/AQD3/wQA+/8FAAAAAAAAAP7///8DAP3/BwD//wcAAQAEAAMAAQACAAAAAAD+//z/+f/5//f//f/7/wEA/v///wAA+v8EAPz/CgACAAwACAAIAAUAAQAAAP7/AAD6/wQA9P8EAO//AQDv/wAA8/8DAPn/BAD9/wAAAQD8/wkAAAANAAMABwAAAAAA/v8AAAAAAgACAAAAAQD9/wEA/P8GAAAACQAGAAQACAAAAAgABAAJAAcACAAAAAYA8/8FAPD/BAD4/wEA/v////v//f/4/wAA+f8BAP7//f8CAPr/BAD8/wEA+/8AAPb/AADy/wEA8/8AAPb/AAD6/wAA/P8AAAEAAAAKAAIACwADAAEAAgD+/wAAAgABAAcABgACAAcA/f8EAAAAAQAEAAMAAwADAAIAAAAFAPr/BwD5/wQA+v////n/AAD3/wUA+P8FAP3//f8BAPf/AwD6/wMA/v8EAP7/BwD6/woA+v8HAP//AAAAAP3////9////AAABAAEABgABAAYA/f8CAPr/AAAAAAAABgD//wUA+//+//z/+P8AAPz/AgADAAAAAgAAAP//AAAAAAAAAgD+///////9/wIAAQADAAUAAgACAAMA/f8HAAAACAAGAAQABwD+/wMA+/8BAP3/BQD7/wUA+P8BAPj//P/6//3//f8AAAEA+/8IAPH/CwDv/wgA9f8DAPr/AwD6/wcA+P8CAPz/9/8FAPL/CQD5/wQAAAABAP//BQD7/wgAAAAGAAwAAQAOAAAACAACAAQAAwAFAAEAAgAAAPf/AADw////9v8AAP7/BQD+/wcA+f8FAPr/AQAAAAAAAQAGAP7/CgD7/wUA/f///////P8AAPz/AQD+/wYA/f8MAPr/DAD6/wgA/P8HAPz/CQD8/wYA///9////9v/9//j/+//7//v//P/9//r/+//7//v/AwD//wsA//8JAPj/AQD3//7/AQD8/wgA+P8DAPf////6/wUA+f8RAPj/EgD8/wsAAQAGAAMACQABAAsAAAAJAAUABQAJAAAABAD7/wAA9v8BAPf/BgD7/wUA/P8AAPr/AQD9/wcAAAAHAAAAAgD+//7/+//8//r/+//9//v////+//7/AQD7/wMA/P8CAP7/BAD//wcAAAAFAAAAAAADAPn/CQD5/wwAAAAJAP7/AwD1/wIA9P8GAP3/BQACAP//AAD6//3//P/8/wAAAgD+/wcA9/8CAPX//v/6/wAAAAACAAIAAQADAAIABQADAAgAAwAJAAMACgADAAYAAAD///7//P///////f////v/+P/7//P//f/1/wAA+P8DAPz/BgACAAQABwAAAAQAAAAAAAAABAABAAoAAAAIAPj//P/1//f//f/9/wQAAAAFAPr/BwD1/wcA/f8FAAgABgAIAAkAAgAGAAIAAAAIAPj/DAD2/wcA/P/+/wAA9v/7//n/+f8BAAAAAQACAP3/AQD+//7/AQD6/wMA/P8BAP7//P/9//n//////wMAAwAEAAIABAACAAYABwAGAAsAAwAMAAEACgAAAAYAAAADAAIA/v8DAPT/AgDw/wAA8P8BAO7/AwDt/wEA9v8BAAMABAAKAAMABQD9/wEA+P8HAPj/DAD7/wQA/v/4//z/9P/4//n//f8AAAMAAAAEAAAAAAADAP7/CQD9/w4AAAALAAIABAD//wEA+/8FAPr/BQD8/wAAAgD9/wcAAAAGAAcABQAJAAcAAgAFAPv/BAD2/wMA8v////H//f/1////+f8AAPn/AQD8/wMAAgABAAkA/v8LAP//CgACAAYAAgAFAP7/BQD5//7/+f/z//v/8P/6//X/+v/6//3/+v8BAPr/AAAAAP7/DQD//xUABAAQAAcACAABAAcA/v8JAP//CAABAAIAAwD6/wUA+v8DAAAAAAACAAEA+/8HAPT/CQD7/wQABAD//wMA/f/8////+////wAA/v8BAP3/+//7//n////9/wUA/v8GAPv/AQD7//7//f/+//v//v/5//z/+//3/wEA9v8FAP3/AgAAAAIAAQAKAAUAEwAKABEACgAKAAgABAAGAAIAAQACAP3/AAD6//f/+P/w//n/8v/6//n/+////wAAAAAHAAEABwADAAMACAACAAsABAAJAAMAAgD9////9v8AAPT/AAD4//v//f/0////9f////z/AAAAAAMA//8IAP//DAACAAsABgADAAUA/P8EAPz/BAAAAAEAAAD///z//f/9//z/AgD8/wcA+v8GAPj/AwD8/wAA///9//7/+//9//v/AAD6/wYA+/8IAP3/BQAAAAIAAwAHAAMACwACAAcAAQD//wAA/f/9/wEA+f8DAPb//P/3//T//P/2/wIA/f8IAAIACAAFAAcACAAMAAgADgAJAAYACQD8/wgA+/8EAAAA//8BAPj/+//0//X/9P/+//L/CwDz/woA+f8AAAAA/P8DAAEAAwAGAAMAAwAEAP3/BQD7/wEA/f/8//z/+P/9//n////+//3/AAD5////+f8BAP3/BwAAAAcAAAAEAAAABQAAAAUAAgACAAIAAgAAAAYAAAAIAAAABwAAAAMAAQACAAAABwAAAAUAAwD8/wUA9f8BAPX/+//0//j/8v/8//T/AgD6/wMA/v8AAAEAAAAHAAUACQAKAAUADAAAAAQA/v/8//3/+v/7//3/9//7//f/8//9//D/AgD7/wQABwADAAkABQAHAAYACwAGAA4ABQAIAAYAAAAFAPv/AgD6/wAA+f8AAPX/AQD0/wIA+/8CAAAAAQD//wAA/v/9/wIA+/8JAP3/BwD+/wEA/f8AAP7/BgACAAkABwAAAAgA+P8EAP7/AQAIAP7/BgD5//v/9f/4//j/AAD6/wMA+P/8//f/9P////n/BQADAAUABgABAAEAAgAAAAYABAAEAAgAAAAHAAAAAQACAPz/AgD5////9/////n/AAD+/wAAAAD//wAAAAAAAAAABAD//wsA/v8MAAEACQAJAAUADAABAAkA/f8FAPr/AgD5/wAA+P////b//v/3//v/+//3////+v8AAAAAAAAEAAQAAQAGAP//AQD/////AAAFAAAACQD9/wEA+v/4//3/+f/+/wEA+P8GAPb/AwD7//3/AAD+////BAD8/wgA/P8CAAAA/P8DAP3/BQAAAAYAAQAHAAAACAAAAAsAAQAPAAAADgD8/wcA+v8AAP///v8BAAAA+v////X/+//9//r/BQD7/wQA/v8AAAEABAAHAA0ABQAMAP//AAD9//r/AAAAAP7/AQD1//f/8v/x//X/9v/6/wAA/P8EAP3/AAAAAAEABAANAAYAEwADAA0AAAAEAAAAAAAAAP7/AAD//wQA/f8EAPj/AgD0/wQA9/8HAPv/BAD//wEAAQAAAP//AAD+////AAD9/wEA/f8BAAAAAAAEAAAABgD9/wUA/P8BAP7///8AAP7//v/9//z//P////r/AwD2/wYA9f8FAP7/AgAHAAIABwAFAAEABQAAAAMABgAFAAoABgACAAMA+f8AAPn//f/+//7//f8BAPf//v/3//b//f/0/wAA+v8AAAEAAQAEAAUAAAAEAP//AQADAAIABwAEAAYAAwADAAEA//8CAPj/AgDz/wIA9P8BAPv/AAD//wMA+/8FAPr/AQAFAP//EQAAAA8AAAAGAAAAAgAAAAUA/v8IAP3/AwD///z/AwD4/wQA/f///wMA+/8CAPz//v////3///8AAPv/AQD2/wAA+P///wAA//8EAAAAAAAAAPz//v///wAABAAFAAgABQAFAAAA/v/8//v/+/8AAPv/AAD9//3//v/9//7/AAD+/wIAAAAEAAYABQANAAcACwAJAAMABwD//wIA/f8BAP7/AwD+/wMA+P////D//f/y/wAA/v8BAAQA//8AAP//+v8CAPz/AgAEAP3/CgD3/wcA+f8CAP3/AgD9/wMA9/8BAPb/AwD9/wUABAAEAAMAAQD+/wMA+v8GAPv/BAD+/wAAAAD7/wAA+/////7/BAAAAA0A/v8PAP//CQABAAUAAgAFAAAAAwD9////+//7//z/+v/+//v//P/9//r/AQD+/wYABAAGAAYABAACAAIA//8DAAIAAQALAPv/CwD2/wEA9//5//v/+v/8/wAA/P8EAP///v8AAPb/AAD4/wAA//8AAAIA//8BAAAA/f8FAPv/BQD/////BQD+/wkABgAIAAwAAwAHAAAA//8BAPz/AQAAAP3/BAD6//7/+f/2//z/9/8AAPz/BQD//wQAAQABAAMABAABAAYAAQACAAIA+/8CAPn/AQD//wAAAAD+//n//f/4////AQAAAAoAAAAGAAAA//8BAAAABwAHAAwACQAKAAEABAD6/wAA+f8AAP3//v8AAPr/AAD2//3/+P/6//3/+P/9//v/+P8AAPj/AAD9//7/AAD+//7////+/wYAAAAQAAAADQAAAAIAAAABAAAACgADAAsABgAAAAQA9f8DAPT/AwD9/wIAAAABAPv/BQD5/wUA/v8AAAMAAAADAAYAAAAKAAAACAACAAQAAQAAAP3/AAD5/wEA+/8AAAEA/v8HAPr/BQD3/wAA+v8AAAAABAABAAgA/f8GAPn/AAD9//z/AQD/////AwD6/wMA/P8AAP/////+/wEA+/8CAPv///////r/AAD3/wAA9f////j/AAAAAAIAAQAEAPv/BgD6/wcAAgAFAA0ABQARAAcACgAJAAAACAAAAAMABAABAAEAAgD4/wIA9P8AAPf/AAD7/////P/7//v//P//////BwD9/wsA+f8DAPn//P/8/wAA//8HAPv/BAD0//3/9v/9////AgABAAQA/v8CAP3/AwAAAAcABAAFAAYA//8GAPz/AwD9/wAA+v8AAPT/AwD0/wUAAAAFAAoAAwAGAAMA/v8FAP//BAAEAAMAAwACAPz/AgD1/wAA9v/7//3/+v8EAP3/BQAAAAQA//8GAP//DAABABEAAwAOAAMAAwADAPv/AgD+//7/AAD4//v/9//z//z/9f/+//3/+f8AAPX/AAD8//7/BgD+/wgA//8BAP//AAD8/wUA/P8HAAAABAAEAAAABAD8/wIA+/8CAAAABAADAAkAAwALAAIABwABAAEAAAD//wIA/v8CAP3///////3////+//n////2/wEA/f8CAAUAAAABAP//9f8DAPX/BQAAAAIAAwD///n//v/x/wAA+f8BAAYA//8KAP7/AwAAAAIAAgAKAAAADAAAAAcAAgACAAMAAAAAAP///P/9//j//v/3/wAA+f8DAP3/AwD+/wMA+/8GAPr/BwD//wMABgD+/wYA+/////3//P/9/wEA+f8HAPr/BQD+/wEAAQABAAUAAwAFAAcAAAAKAP7/CAACAAUAAwAAAP3//f/2////+P8BAAAA/P8DAPb//P/7//j/AQABAAIACgAAAAcAAAD//wAA+/8AAP///v8EAPv/BQD9/wAA///7//z//f/6/wQA/P8LAAAACQAFAAQABQACAAEABAD+/wIA/f/+/////P8BAPz/AQD5////9/8AAPv/AwAAAAYAAAAEAAAA//8EAPz/BgACAAAACAD6/wUA/P8AAAIA/v8BAAAA+f8FAPj/BgABAAMACgAAAAUAAAD9/wEA/f8BAAUA//8HAPv/AAD4//z/9v/8//r/AAD+/wMA/v8CAPr/AAD7/wAA//8CAAAAAgAAAAIA/////wEA+/8BAPz//f/+//r///8AAP7/BAAAAAAAAwD5/wMA/f8EAAcABwALAAQABwD8/wMA9/8EAPz/BgAAAAcA/f8IAPX/BQD3//7/AQD5/wYA/P8BAAMAAAAFAAgA//8MAPr/BAABAPr/CQD7/wYAAQD9/wUA+P8BAPr////8/wIA/f8JAPz/CwD8/wUA/v/9/wAA+P8AAPf/AAD5/////P/+//7//f8AAAAAAgACAAUAAAAGAP7/BAD//wIAAAAAAAMA/P8FAPn/BAD4/wIA9f8AAPT/+//8//v/BgAAAAoABQAHAAMABQAAAAgA//8KAAUAAgALAPf/CAD0/wAA/P/8/wAAAAD+/wEA//8AAAMA/f8FAPn/BAD4/wEA/P/+/wIA+/8EAP7///8AAPr/AAD+//3/AwD//wIABQD8/wsA+/8HAP7/AAAAAP7//v/9////+P8AAPb/AAD5/wAA/v8AAP//AgAAAAYACAAFABEAAAANAAEAAwAGAAEABwAEAAMA//8AAPT//v/x//7/+P////3////7/wAA+/8AAAAA/P8HAPr/BwAAAAIABAABAAIABAD9/wUA+v8BAP//AAAGAP7/BwAAAAIABQAAAAcAAwABAAUA/P8DAP3//v8AAPn/AAD6//7//v/+////AAAAAAAAAQACAAEABwAAAAsA//8HAAAAAAAAAAAA/P8CAPj//P/4/+///f/s/wAA9//+/wAA/f/9/wIA/f8IAAYADAANAA0ACQALAAIABQD//wIAAAACAP3/AgD0/wMA8v8CAPn///////7/AQAAAAQAAQAGAAAABQD8/wYA9P8IAPL/BgD5/wAAAQD+/wAAAQD7/wUA+/8EAAIAAwAIAAUABQAEAP7/AQD6/wAA+//+//z/+//6//b/+//3/wAAAAADAAQAAQAAAAIA/v8IAAMADAAIAAYABQD//wAA/v/8/wIA+/8DAPv/AAD6////+f8BAPj/BgD5/wcAAAACAAYAAQAHAAIACAAAAAsA/P8KAPz/BAD//wAA//////3/AAD+//z/AQD0/wQA9P8BAP3/+/8DAPj/AQD6/wEA+v8GAPf/BwD1/wMA+f8CAAAAAwAEAAAABgD7/wkA+v8KAAAABgAHAAMABQADAP3/AwD6/wAAAAD8/wAA/f/6/wAA+P8CAPv/BAAAAAgABAAIAAYAAwADAAAABAADAAYAAgAGAPz/AgD4//3//f/4/wMA+P8AAPj//P/2//3/+v8AAAIA//8EAPr/AgD3/wMA+f8IAPv/CgD4/wgA9v8CAP3/AAAEAAAABAD8/wEA+/8CAP3/BQD8/wYA+P8CAPr//f8CAP3/CQABAAkAAwAGAAEABQACAAQACQABAA0AAAAJAPz/BAD3/wQA9v8DAPn//v/8//f////3//3//f/8/wAAAQD9/wQA/P8BAAAAAAACAAUAAQAGAAEABAAAAAUAAAAGAAAABgAAAAMAAAAAAAAAAQAAAAIA///+/wAA+P8DAPf/AAD7//z/AAD7/wEA//8BAAAAAgD//wQAAAAEAAMABgACAAQA///9////+P8AAPn/AAD5//7/+f/+//v/AAD9/wAA/v///wAA//8GAAIADgAEAA4AAgADAAEA+v8EAPz/BQAAAAMA/v8AAPf/AAD4/wEAAAD//wUA+/8AAPn////7/wEA//8BAAAA/v/9//3//v/9/wMAAAAGAAQAAgAFAAAABAAAAAYAAwAIAAMABwAAAAMA/f/+//3/+v/+//r//f/8//z/+v/+//n/AAAAAP//BwD//wkAAQAEAAMAAgABAAIAAAD+/wMA/f8FAP//BAD8/wIA+P8BAPj/AgD7/wMAAAAAAAQA/v8CAP3/AAD9/wQA//8IAAEABQADAAIAAwAAAAUA//8IAP7/BgD//wEAAAD+/wAA/P8AAPv/AAD4/wAA9f8BAPT/AgD4/wMA/f8DAP//AQD//wAAAAACAAMABAAFAAMAAgAAAAAA/v8CAAIABAAGAAMA//8AAPb//v/2//7/+/////r/AAD3/wAA+v8BAP//AgAAAAIAAAAEAAEACQADAAgAAwACAP//AQD8/wYAAAAGAAQAAAAAAPv/+//6//z/+/8CAPz/BwD8/wgA+P8FAPf/AQD7/wUAAAAJAAIABQAAAP///v/+/wAAAAADAAAAAgD+//3//f/+////AgD//wEA/f/9//z//f8BAAAABQAFAAQABQAAAAAA//8AAP//AwD9/wUA+/8EAPz/AgAAAAAAAAD+/////P8AAP//AwABAAEA///9//r//v/8/wIAAgAEAAUAAQABAP7////+/wEAAgAFAAQABwABAAMA///+//z//f/6/////f///wIA/v8AAPz/+v/7//v//v8EAAEABwACAAIAAAAAAP3/AwD//wYAAAAEAAIAAAACAAAAAAAEAP7////+//r/AAD//wAABQACAAIABAD8/wIA/P///wIAAAAGAAMAAgAFAPv/BAD7/wAA///+/wAAAAD9/wAA+/8AAP3//v8AAPz/AAD5//7/+v/9////AAADAAAAAAD///v//v/8/wEABQAEAAkAAwACAAAA/f8DAAAACQAHAA4ABwAKAAAAAAD6//r/+//6//7/+//8//v//P/7//7/+f/+//j//P/+//7/BQABAAoABAAKAAQABQACAAIABAAEAAYAAAAFAPf/AwD1/wMA+P8CAPr/AAD+////AgABAAUABQAFAAYAAwACAAIA/v8CAP7//P8CAPP/AwD2///////6/wAA+///////BQD//wwA+/8KAPf/AAD2/wAA+v8GAAAABQADAPv/BAD3/wMA/v8GAAYACwAIAAwABQAHAAUAAAAJAP3/BwD8/wEA/f8AAPv/+v/1//L/8v/w//X/9f/8//z/AQACAAMAAQACAPz/AQD9/wMAAgAHAAIACQD+/wkA+v8GAPn/AgD//wAAAwAAAAMA//8CAAAABQACAAcA/v8IAPr/BgD+/wAABQD+/wUA/f/9//v/9//7//r/AAAAAAIAAAADAPr/BAD3/wMA+v8EAP7/BQAAAAIAAAD//wAA/v////z/AAD//wUABAAMAAUADgAAAAkAAAAGAAMABwAHAAgAAAAEAPb//f/0//b/+P/3//j//v/7////AAD7/wAA/P///wAAAAACAAYAAQAIAAAA//8AAPT/AAD3/wEAAQAAAAEAAAD9/wMAAAAEAAgA/v8PAPj/EAD6/w8AAQANAAIABgD///7//P/8//z//v////3/AAD6/wAA+v////v//v////z/AAD9//z/AAD4/wAA+f/+//v//f/7/wEA/P8IAP7/DQAAAAsAAgAGAAQABAAHAAcACQAMAAcACQAAAAAA+//6//v//v///wAA/v/8//n/9f/4//L//P/2/wIA+v8IAPz/CAD8/wIA/v8AAP//AAD8////+/8AAAEAAAAIAP//BgD//wAABAAAAAkABAAIAAgAAwAEAAMA/v8GAP//BgADAAAABAD7/wMA/f8EAP//AwD+/wAA/v///wAAAAACAAQAAAACAPz/+v/7//P/+//2//j//v/2/wAA+v/6//7/+f8AAAAAAwAKAAcACwAGAAUAAwAAAAMAAgAEAAUAAgAFAAAAAQD8/wAA+//+//3//P8AAP7/AQABAAEAAAD///z//f/6//7//f8DAAEABQACAAAAAgD8/wIA/f8BAAMAAAAKAAIACQAFAAIAAwAAAP//BAD7/wcA+/8FAP7/AAD+//3//P/9//3/AAAAAAAAAAD+/wEA+/8GAPj/BQD3//7/+P/7//z//v/+/wAA+/8AAPj/+f/6//X/AAD8/wMABQACAAYAAAACAAEAAwAFAAcABAAJAAMABwAFAAQACAAAAAYA+/8FAPv/BwD9/wcA/v8DAP3//P/7//v/+/8AAAAAAgAGAP7/BAD5////+v/+//3/AQD//wUA/v8CAPv////6/wAA/P8DAAAAAwAGAAEABgABAAEAAgD//wEAAQD9/wQA+f8EAP//AQAGAP7/AwD9//7//f8AAP//AgAAAAQAAAAEAP7/AAD+//v/AAD6/wIA//8AAAAA//8AAAAA/f8DAPn/BAD9/wMABQABAAUAAAAAAAAA//8AAAAAAAABAAEAAgACAAEAAgD//wAA/P8AAP7/AQAAAAQAAAADAAAA/P/+//f//P/8/wAAAgACAAQAAgAAAAAA/f8AAP3/AQD+/wIA/f8EAPz/AwD8/wAA+v/+//n/+/////n/BgD6/wcA+/8CAP3/AQD+/wYA/f8JAAAAAgAFAPr/BwD6/wMA/f8CAPz/AgD6/wQA/v8FAAMAAAAFAP3/AwAAAAQAAwAFAAIABAACAAEAAwAAAAEAAgD//wEAAQAAAAQAAQAAAAQA+v8DAPj/AQD8/wIAAgABAAEA/v/8//n/+//5/wAA/f8EAP//AgD//wAA//8AAP//AAAAAAAAAwAAAAIA/v/9////9v8BAPX/AQD8/wAAAQAAAAIAAAABAAEAAgAAAAMA/P8FAP7/CAADAAcABAACAAAA/v////3/AAD//wIAAAAFAP//AAAAAPr/AwD5/wMA/P8CAPz/BAD//wcAAAAFAP7///8AAPr/BQD6/wgA/v8IAP//BgD//wAA///9/wAA/////wAAAAD9/wIA/P8BAPz//P/+//r/AQD9/wQAAAACAP3/AQD3/wUA+v8HAAMAAgAFAP3///////7/AgADAAAAAwD7/wAA+v/+////AAAAAAIA/P8CAPv/BAD//wkAAQAIAAAAAwAAAAAAAQACAAMAAQAFAP3/BQD5/wMA/P8CAAAAAAACAPz/AwD7/wUA/f8GAP3/BQD9/wQA/f8AAP7//f8CAPz/CAD8/wUA+f8AAPb/AQD3/wUA/P8DAP/////9//r//P/9//7/AgABAAAAAgD8/wIA/f8AAAIA//8EAAAAAgACAAAAAwAAAAUAAgACAAIA/////wIA//8FAAEAAQABAP//AAAAAAAAAgAAAAYA//8HAP7/BQD//wUA//8GAP//AwD//wAA///+/wAA+/8CAPf/BQD3/wQA+v8BAPn//f/2//z/+f/9/wEA+v8EAPT/AAD3/wAA/v8FAAAABQD/////AAD5/wcA+/8KAAAABQABAP///v//////AgACAAAAAgD9/wMA/v8HAAAABwADAAIABgD//wUAAAACAAIAAgACAAMAAAACAAAAAQAEAAEABAACAAAAAgD+/wEA/f///////f////v//P/5//z/+v/+//////8AAAAAAAAAAP7/AAAAAP7/BgABAAsAAgAHAP/////8//3///8AAAEAAAAAAPn//P/1//z/+P8BAP3/BgD9/wYA/f8EAAAABQAGAAQABgAAAAMAAAADAAMABwAAAAUA+f8BAPz///8CAP3/AwD+//7////7//z////5/wQA/f8DAAIAAQACAAMAAQAFAAIAAwAEAAAAAwAAAAEAAAACAP7/BgD+/wQA/v/7//z/9v/7//r//f///wAA/P8AAPb//f/3//3/AAD//wYAAAAFAP7/AgD+/wUA/v8KAP3/CgD+/wQAAQD//wMA/f////v//P/3//7/9v8BAPj/AQD7/wAA/P8AAPz/CAD//w4ABQAJAAkABQAJAAcACgAGAAgAAAAHAPv/BwD6/wUA+P////j//P/8//7/BAD+/wkA//8GAAAAAQABAAQAAAAHAP7/AQD+//n/AQD5/wMA+/8AAPr/+//4//3//v8AAAMAAAADAPr//v/0//3/9v/+//7//f8DAPn/AwD6/wAA/f8AAP7/BAD//wgABQAHAAwABAALAAUABwAGAAUAAwAEAAAAAQD///v////4//r//P/1/wEA9/8BAPz/AwD//wUA/f8HAPz/CQAAAAoACAACAAkA+v8GAPr/BwD7/wkA+v8DAPn//P/6//r//f/8/wEA+/8BAPf/AQD0/wQA/P8EAAUA/f8FAPn/AAD8/wIA/v8JAPz/CwD+/wMAAwD8/wUA+/8CAP///////wAA+v8BAPf////7//r/AgD7/wUAAAAFAAAABwAAAAkAAQAFAAcAAAAKAAMACQAIAAcABAADAPz////6//z//f/9//7////6////9//9//r/AAD8/wUA+v8FAPr/AgABAAIACAAAAAYA/P8DAPr/BQD7/wYA+/8EAP3/AAD9//7/AAD5/wYA+P8FAPz///8AAP7/AgABAAEAAAABAPz/BwD7/w0A/v8HAAAA/v8DAPz/AwAAAAMAAAAEAPr/AgD2/wAA+//+/wEA/v8DAP7/AAD//wAAAAABAP//AQAAAAAABwAAAAkABAAEAAUAAAACAAAAAAABAAQAAAAFAP3/AAD7//z//v/7/wAA+v8AAPf/AQD0/wIA9v8AAP7//P8DAP3/AgD+/wAA/P8FAPz/DgD9/wkAAAD9/wIA+v8BAAAA//8AAAAA+v8BAPb/AAD8/wAAAwAAAAQA/v8BAP7/AwABAAgABAAGAAMAAwACAAUAAgAGAAEAAAAAAP3//v/+//7/AAACAP7/AgD7//7//P/+/wAABAADAAYAAgADAAEAAwACAAUAAgACAAIA/v8CAPv/AQD7/////f/+//z////7/wAA///+/wQA+v8CAPn////8/wAA/f8AAPr//f/6//v/AAD7/wUA+/8GAP3/AwAAAAMABQAHAAUACAADAAIAAwD8/wgA/P8JAP//AwD+////+/////v/AAD+/wAAAgAAAAMAAQADAAQABAAEAAYAAAAGAP7/BAD//wQA//8CAPz//f/7//j//v/7//7//v/+//z////4/wAA+v8AAAEAAQAHAP//BQD8/wAA/P8CAPv/BQD5/wIA/P/9/wAA+/8AAPz/AAD6/wIA+/8CAP3/AgD+/wMA/v8CAAAA//8CAP//AgABAAEAAgAAAAMAAgADAAMABAADAAgAAwALAAUACAAIAAUABQADAAEAAAABAP3/AgD8/wEA/P/+//v//f/6//3//P/+//7/AQD+/wUA/P8EAPr/AQD7/////P////3//v8AAP3/AQD4/wAA9P8AAPf/AQD+/wQAAQAFAAEABAAAAAIAAgABAAYAAAAHAPz/AQD+//z/AwD8/wQAAAD///7//f/6/wEA/f8FAAIAAgACAP//AAD+/wIAAAAGAAEABQAAAAEA/v///wAAAAACAAMAAQACAAAAAAACAAMAAwAFAAMAAAAFAPv/BgD9/wIAAAAAAPz////7/wAAAAD//wUA/f8DAPn/AAD3/wAA+P8AAPn////7/////f/8//3/+//+//v////7/wAA//8BAAIAAwAAAAMA/P8DAAAAAwAGAAIABwADAAMABgADAAMABAAAAAQA//8CAAAAAQABAAEABAAAAAUA//8CAAAAAAD//wEA//8DAAAAAgABAAAAAgD9/wEA/f8AAP//AAAAAAEA//8BAP7////+//3//v/+/////f8CAP3/AwD9/////P/8//z//////wEAAwAAAAIA/f/+//3//v8AAAUAAAAJAPv/BAD8//z/AAD8/wAAAQD//wEAAAD8/wQA+v8IAP//CAACAAYAAAAHAP//BQAAAAEAAwACAAQABAAFAAAABQD6/wQA/P8BAAAAAAD//wAA+//+//r/+//+//r/AAD8//7//v/8//3/AAD+/wIAAAACAAAAAQD//wIAAQAAAAQA/v8DAPz/AAD+////AAACAAAAAwD+//7/AAD8/wMA//8GAAAAAgD+////+/8AAAAAAQAHAAAACAD//wEA///9////AAAAAAAA//////z/+//9//r/AAD9////AAAAAAIAAgAEAAUABgAGAAgABQAKAAMACgADAAUABAAAAAIA//8AAAAA//////7////9//7//P/9//3//f8AAP//AgD+//7//P/8//j/AAD1/wQA+f8CAP///v////z/+//+//7/AAAEAAAABgAAAAEA///+//3/AAD+/wIAAQAAAAMA/P8AAP3/AAADAAQACAAGAAcAAAAFAPz/BwAAAAsABAAKAAAABAD8//3////5/wMA+v8BAP3//f/7//7/+P8DAPr/BAAAAAAAAQABAAAABgABAAUAAwAAAAEA/////wAAAAD//wMA+v8BAPf/+//4//n/+//+//r/BAD5/wAA/P/4/wEA+P8GAAAAAwAAAP7/+//8//v/AAABAAMACAAEAAsAAgAIAAAABgAEAAgACQAHAAgAAQAEAP7/AwAAAAMAAAACAPz/AAD7/wAA/f8AAAAA//8CAP3/BAD+/wMAAQAAAAIA/////wAA+/8AAP3//P////r/+//6//j//P/8/wAAAAABAAEAAAABAP7/AwD+/wUAAAAEAAMAAQAEAP//AQD8/wEA+v8HAPv/CwD//wYA/v8AAPv/AAAAAAAABwD//wgA+v8DAPX/AAD1/wMA+f8GAP7///8AAPf////9/wAABAADAAEAAwABAAAABgD//wcAAAADAAEAAgABAAIAAAABAAAA//8DAPv/BgD6/wUA/v8EAP7/BgD9/wYA//8CAAEAAAAAAAAA/////wAA+/8AAPn////8//7/AAD+/wAA/P/7//v/+P/+//7/AgAEAAMAAAAAAPn////8/wAAAwAEAAQAAAAAAPv//v/7/wAA/f8CAP3/AgD9/wAA//8AAAQAAAAIAP//BQD//wMAAQAGAAMABAABAP7/AQD//wUABQAGAAQABAAAAAIAAgACAAcAAwAKAAEABgAAAAAA////////AAAAAPv/AAD1//z/9//7//j//f/1////+P/+/////v8AAP7/AAD//wAA//8CAP3/AQD6////+v/+//3/AAAAAAMAAAADAAAAAQABAAQABQAGAAsABAAMAAIABwACAAEAAQADAAAABgABAAMAAgD//wEA/P8AAPv/AAD9/wEAAAACAAAAAAD9//7//P////v////7//r//v/5////+v/9//r//f/9/wEAAAADAAEAAgAGAAAACAABAAQABAAAAAYAAAABAP3//P/6//3//P8AAP3/AAD7//z//P/9/wEAAgABAAUA//8DAAAAAQABAAIABAABAAYAAAADAP7/BAD+/wkA/f8HAAAAAgADAAIABQAEAAMA//8BAPj/AQD5/wMA//8DAAAA/v/+//n//v/7/wMA/v8GAP//AgAAAAAAAAACAAAAAQAEAPz/BQD5/wIA+f/9//v/+f/9//r//v/+////AAAAAP/////+/wAAAAAEAAQABgAGAAEAAgAAAP//AwAAAAQAAAACAP//AwD9/wUA/v8BAAAA/f8CAPv/AAD6/wAA/P8BAP3/AQD7/wAA///9/wQA/P8DAP3/AgD//wgAAAALAAMABwAFAAEABQAAAAcA/v8HAP3/BQD5/wIA9v8AAPn//f/+//z/AAD+/wAA+/8BAPb/AgD4/wMAAAACAAYAAAADAP7/AAD//wIAAQAGAAAAAgD8//r/+v/3//3/+v8AAPz////9//3/AAD//wIAAgABAAIAAAACAAIABQAHAAgABAAIAP7/BgD9/wYAAAAGAAMABQADAAAAAgD8/wMA/f8DAP3/AQD7////+v/+//3//v/9//z////8/wIA//8CAAIAAAAFAAEABgACAAcAAAAHAP3/BQD6/wEA+/////7//v/7//z/9v/4//n/9/8AAPv/AAD9/wAA+v8EAPj/CgD8/wwAAQAIAAEABQD//wUA//8DAAEA//8EAPv/BAD5/wEA+f8AAPz/AQAAAAIABAAAAAUA//8FAAAABQACAAQABAACAAUAAQAHAP//CQD7/wgA+v8CAP3/AAAAAAIAAAABAAAA+v////b////6/wAA/P/8//n/+v/5//z//v/9/wMA/v8AAAEA/f8EAP//BgAEAAcAAwAEAP3////6//v//v/5/wAA+f8AAPz//v/+//7//v8AAAEAAgAHAAEACgACAAoABAAIAAUABwAEAAQABQD9/wcA9/8HAPj/BQD7/wMA+v8BAPr/AAAAAP//AwD8/wMA+/8CAPv/BAD6/wgA/P8HAAAAAQABAP7/AAAAAAAABAADAAMAAwAAAP///v/7//7/+//+//z//v/6//3/+v/6//z/+//+////AAD//wAA/v8CAAMABAAHAAYABQAHAAIABgAAAAYAAAAHAAAABAD8/wAA9f/9//b//v/9/wAA/////wAA+/8CAPj/BQD7/wcAAAAIAP//CAD+/wkAAgAFAAYAAAAEAPz/AwD8/wQA+v8DAPr/AQD7/////P/7//7//P8AAP7/AAD6////+P/+//7///8CAAMAAQAGAAEABAAFAAEACgADAAgABQABAAEA/v/8////+v////v/+v/4//f/+P/6//7///8BAP//AAD+/wAAAAADAAQACQAFAAwABQAHAAUAAQADAAAAAAAAAAAA/f8AAPz////+/////v8AAP3/AQD+/wEAAAD//wEA/f8EAP//BQAAAAUAAgACAAEAAAABAAIAAgADAAQA/v8CAPj/AQD5/wAA/f////3//P/5//r/+P/5//7/+/8CAPz/AAD5//7/+/8AAAAABgADAAYAAgAFAAIABwAEAAUABAAAAAEA//8AAAAAAAAAAAIAAAAAAP///v/9//7/AAAAAAMAAwAEAAMABAABAAQAAQACAAMAAQAEAAEAAwD//wEA+v8CAPn/BAD6/wIA+f8AAPf//v/6//3////7/wAA+//8//z//P/9/wEA/f8DAP3/AQD//wAAAQADAAAABgD//wYAAAAEAAMABAACAAUAAAABAPz//v/5////+v8CAP//AAAAAP3//v8AAP//BQADAAUABwABAAkAAAAIAAAABQD+/wUA/f8GAPv/BAD6/wAA+/////3///8AAP//AwD9/wIA/P8AAP7/AgABAAcAAgAEAP//AAD7/////v8AAAAAAAD9/wAA/P8AAAAAAAADAAAAAQD7/wAA+f8CAPz/AgD///3////5//7//P/9/wAAAAD//wQA//8HAAEABwAGAAQACAAAAAQA/P8BAP3/AgAAAAIAAAD+/wAA+v8AAPv/AgD6/wQA/f8HAAEABgACAAEAAgD//wQAAAAGAAEABAAAAAIA/f8AAPv////9////AAAAAAAA////////AAAAAAAAAAD7//7/+v/+//3/AAD+/wAA/v/9/////f8BAP//BQD//wQAAAD+/wAA+/8BAP3/AgD9/wAA+//9//r////7/wEA/f8AAAAA/f8DAP3/CAABAA4ABgANAAcACAAFAAcABQAGAAUAAgAGAAAABAD9/////f/7////+v8BAPr/AQD5/wEA+v8AAP3///////7/AAD//wEA/v8EAPr/BgD6/wMA/P8AAP7//f/+/////v8AAPz/AAD6/wAA/P8EAAAABAAAAAIA//8CAAEAAgAGAAAACQD+/wkA/P8HAP3/CAD+/wcA/v8DAPz/AAD+////AAD7/wEA+P8AAPn///////7/AgD9/wEA/f8AAP7/AAD+/////v/7/wEA+v8GAP//CAAAAAYA//8EAAAABAAEAAQABgABAAQAAAAAAAAA/v8AAPz/AAD8//7//P/+//7/AQAAAAUA//8DAP7///8DAP7/CgD//wgA//8BAPv/AAD3/wEA+f8AAP3//v8AAPz/AQD8/wAA/v8AAAAA/v8EAPz/BQD//wUAAQAEAAAAAwD//wIA///+/wEA+v8FAPr/BgD8/wMA/P8DAPv/BwD8/wgA//8EAP//AAD///7/AAAAAAMAAQAAAAAA/v8BAAIABAAHAAMABwAAAAUA//8IAP//CQAAAAMAAAD+//v//v/5/wAA+v////r/+P/6//f/+//+//z/AAD+//z/AQD6/wMA/f8CAP3/AAD8//3//v/+/wAAAAAAAAAAAAD//wIA//8HAAAABwADAAUABgAFAAQABwAEAAcABgADAAgAAgAJAAIACAAAAAIA/v/9/////f8AAAAA/v8DAPn/AAD5//v//f/8//z/AAD3////9v/4//v/+P/8//z/+//+//3//f8AAP//AgAAAAIAAQACAAAABAD+/wUA/v8FAAAABAABAAQAAAACAP7/AQD8/wUA/v8IAAIAAgAFAP3/BQD//wMABAAFAAEABwD9/wcA/f8FAP//AwAAAP//AAD7/wAA/v8AAAEAAAABAP7//v////v/AQD9/wAAAAD7/wAA/P/+/wAA//8AAAAA//8AAP7///8AAP//AgD//wAA/////wAA/v8AAP3////8/wAA/f8AAP//AAAAAAAAAgAAAAUAAQAFAAMABgADAAcAAQAHAAEABAADAAAAAwD9/wAA/f/7/wEA+v8CAP7//v8AAP3//f8AAPv/AAD9//7//v/9/wAA/v8FAP7/CAD8/wIA/P/9//7///8BAAUAAgAIAAAAAQABAPr/BQD9/wUAAgABAAIA//8AAP//AAAAAAAAAAABAP3/AwD7/wYA/P8EAAAAAAAEAAAAAgAAAAAA/f8AAPn/AgD6/wEA+//8//v/+f/7//v//P/8/////v8AAAEA//8EAP//BwABAAkAAgAHAAEABgAAAAYAAAAEAAAAAQACAAAABAD9/wcA+f8GAP3/AwAAAAIA//8FAP3/BwAAAAUAAgAAAAEA/v////7//P8DAPr/BAD8/wAA/v/9/wAA/v8DAAAABQD//wMA/P8CAPn/BAD4/wQA+v8AAPr//f/5//z/+//9/wAA/P8CAPv/AgD+/wIAAgADAAQAAwACAAAAAAD9/wAA/v8BAAEAAAABAPz//v/+/wAAAAAFAAAABgABAAIABQACAAkABgAJAAYABAAAAAEA/v8AAAEAAAAFAP7/AgD9/////P////3/AwD9/wUA+/8AAPz/+P8AAPX/AAD6//3/AAD7////+f/8//r//P8AAAEAAgAFAAAAAwAAAAAAAgD//wgA/f8LAPr/CAD6/wQA/f8EAP7/BQD8/wIA/P/+/wAA+/8GAP7/CAAAAAcAAAAGAP3/BgD//wQAAAABAAAA//8AAAAA//8AAP7///////3//v/+//z/AQD8/wMA//8CAAIAAAADAAAAAgABAAMAAQAFAAAABQAAAAAA/v///wAAAAADAAAAAwD//wAA/v/+////AAAAAAIA/P/+//r/9//9//r/AAAAAP7/AQD8/wAA//8AAAMAAQAGAAAABQD+/wQA//8FAAAABgD9/wYA+P8FAPj/AgD+//7/AgD8/wEA/f8AAP7/AgD9/wYA/f8HAP7/BAAAAAIAAAADAAAABgAAAAQAAAD///7//v/+/wMA/v8FAPz/AAD7//3/+/8BAP7/BgAAAAUA///+//7/+v8BAP//BgABAAUA//8DAPv/AQD6/wAA+v8AAPr////7/////f8AAP7/AQD//wIA/f8CAP7/AAABAAAAAgADAP//BgD//wQAAgAAAAUA//8EAAEAAQAFAAIAAgAFAP//BAAAAAEAAwAAAAAAAQD8/wIA/P8DAPz/BAD6/wYA+P8FAPr/AwD+/wMA/v8AAP3/+/8AAPr/AQD9/wEA/v8AAPz/AAD6/wMA+/8GAP7/BAD9/wAA/P8AAPz/AAD9/wAA/v8BAAAAAQACAAAAAQABAAAABAABAAQAAAACAAAAAQAAAAEAAAAAAAEA/f8DAPv/BAD7/wQA+/8CAPr/AQD9/wQAAAAHAAEABAADAP//BAD8/wMAAAADAAIAAAABAP3///8AAP//AwAAAAAAAAD///7/AAD8/wIA/f8BAP3/AAD7//z/+v/5//7/+v8CAPv/AwD9/wAA///+/wAAAAADAAEABgD+/wcA+v8GAPz/BAD+/wIA/f8AAP7//v8CAPr/BgD7/wUAAAABAAEAAQABAAQAAwAFAAQAAQAEAAAAAwABAAIAAwAAAAMA//8BAP3/AAD+/wAA/v8CAP3/AwD8/wEA/P8AAP3/AQD//wIA//8AAP7/AAAAAP//AgD+/wMA/v8EAP//AwAAAAMA//8FAPz/BwD7/wIA/P/8//3/+f/9//r//f/7//7/+v////n//v/8//////8AAAAAAAABAAAABAAAAAkAAAAJAAAABQAAAAMAAQADAAMAAQACAP7/AQD+/wQAAAAIAAAACAD+/wUA//8AAAMAAAAFAAIAAQAFAP7/AQD+//7/AAD+/wAAAAD8/wEA+f8AAPz///////7//v////3////8/////f///////P8AAPj/AAD3//7/+///////AgD+/wUA/P8HAP//BwACAAYABAAFAAIAAwAAAAIAAAABAAUAAAAFAP//AAD+//7///8AAAAAAQAAAAEAAQD//wEAAAAAAAUA//8FAAAAAQABAAIAAQAHAAAACAD+/wUA+/8BAPr/AAD9/wEA//////7/+v/8//n////6/wEA/P8DAP//AAABAP7/AQAAAP//BAD+/wIA/v8AAP7/AAD//wIA//8CAP3/AAD9//7/AAAAAAIAAwAAAAMA/v8DAP3/AwAAAAMAAgABAAEAAAD//wAAAAACAAMAAAAHAP7/BwD9/wYA//8FAP7/BAD8/wAA+//7//v/+P/9//v//v/9/////f8AAP3/AQD//wEAAgABAAcAAAAHAAAAAwABAAAAAAAAAP//AAD9/wEA/f8AAAAA/P8EAPz/AwD//wAA//8AAAAAAwACAAQAAAADAPz/AQD9/wAA//8AAP3/AAD7/wAA/P///wIA/P8IAPv/BQD7/////f8AAAAAAwABAAEAAgD7/wMA+f8FAP3/BwAAAAcAAQAFAAMAAgAEAAIABgACAAYAAAAGAP3/BgD9/wYAAAADAP7////6//v/+//6/wAA/f8AAAAA/f8BAP3/AAAAAAAAAQABAAAAAQD+/wAA/v/+/wAA/P////v//f/7//3//P/+//7//f////7//f8AAPv/AwAAAAIABgACAAUABQAAAAcA/f8FAP7/BAACAAYABAAGAAEAAgABAAAAAwAAAAUA//8GAPz/BgD5/wEA+//+////AAAAAAAAAAAAAAAA//8DAP7/BAAAAAEAAQD//wAA//8AAP//AwD9/wIA+//+//n//P/6//3/+//6//z/9v////b/AQD7/wIA/v8BAP3/AQD+/wMAAgAFAAUABQADAAUAAQAFAAMABAAHAAQABAAEAP//AgD9/wEA/v8AAAAA//8AAP7////9/////v8CAP//BwD+/wcA/v8GAAAABQADAAQAAQAFAP7/BQD9/wMA/f8BAPz/AAD6//v/+v/7//r////7/////v/6/wEA+f8EAP7/BAACAAMAAQAEAP7/BQD+/wUAAQAEAAIAAwAAAAEA//8AAP7////8//7/+v////v/AAD8/wAA/f8CAPz/BQD9/wQA//8AAAIA/f8GAP7/CQAAAAkA//8GAP3/AwD8/wIAAAADAAIAAAAAAPn//f/2/wAA+f8DAAAA//8CAPn/AQD7/wIA//8FAAAACAD//wgAAAAIAAQABgAHAAEABgD9/wMA/v8AAAEA/P8AAPr/+v/7//b//P/7//3/AAAAAPz/BgD2/woA+P8HAP3/AwAAAAMA//8CAP7///8AAPv/BAD5/wUA+v8BAPv///8AAAEABQABAAYA//8EAP3/AwAAAAUABAAFAAQAAAABAP3/AwD8/wkA/v8LAAAABgAAAAMAAQAGAAMABQAAAP///f/9//z/AAD8/////f/5//7/9f/+//r/+/8BAPr/AwD9////AQD6/wUA/P8EAAAAAAACAAAA/v8CAPr/AQD7/wAA//8AAP//AQD8/wEA+/8CAP3/CAAAAAwAAQAIAAAAAgAAAAIAAgAEAAQAAAAEAPn/BAD4/wUA/P8HAP7/CAD7/wUA+f8CAP3/AwAAAAUAAAABAP//+/////v//v////7/AAD+/////v////3/AAD+/wAAAwAAAAQA/v///wAA/P8AAAAA/P8DAPb/AAD3//z//f/+/wAABAD6/wcA9v8FAP3/AwAHAAMACgAEAAIAAgD//wIABgABAAsA//8EAP7/+/8BAP3/BgADAAQAAgAAAPz////9/wAABAACAAYAAAAAAPz////7/wMA/f8HAP7/BAD//wAAAAAAAAAABAAAAAIA///8////+v/+//3/+/8AAPr//f/+//r/AAD+/wAABAAAAAQABQD//wgA/P8EAAEAAAADAAAA//8BAPn/AAD8//3/AAD8/wEA/v/9/wAA+f8AAPz/AQABAAEAAwD//wAA/v/+/wAAAAABAAYA/v8JAPv/BwD9/wUAAQAGAAUABQAGAAAABAD7/wIA+/8DAPz/BQD7/wMA+v////z/+v8AAPv/BAD+/wQA/f8DAPv/AwD8/wMAAAAAAAEA/v////7//f8AAP////////v//v/3//3//P///wIAAAAAAAEA+f8DAPn/BgAAAAUAAwAEAP//BQD8/wYAAQADAAYA//8DAP3//f////3/AgADAAAABgD7/wIA/f///wMAAQAFAAUAAQAFAPz/AwD6/wIA+/8FAP7/BgD+/wQA/v8GAAAACQAAAAcAAwABAAcA/f8HAPz/AgD9////+v8AAPX/AAD3//3//f/5//7/+v/7//z/+//+//////8AAAAAAAACAP3/AQD7/wAA/v///wAAAAAAAP///v/+////AAAEAAMABwAEAAMABQD+/wgA/f8KAAAABgACAAAAAAD8/wAA/v8DAAAACAD9/wcA+P8EAPn/AwAAAAMABQACAAMAAAD+//7//v/9/wEA/v8BAP3//f/+//j////4/////P///wAAAAAAAAEAAAAEAAEABQACAP//AgD4/wQA+f8FAP7/AgD/////+/////n/AQD+/wMABAAAAAIA/v//////AAABAAMAAAAEAP7/AQD+/wAAAAAAAP7/BAD8/wQA/v8DAAMAAwAIAAIACQABAAgAAAAGAP//BgD+/wQA//8AAAAA/v8AAPv////5//7//v/+/wAAAAD9/wEA+f8BAPv/AAAAAAAAAgABAP7/BQD5/wMA+v////7//P/9//z//f///wAAAQADAAAAAwD9/wMA/f8DAAAABAADAAMAAQAAAP3////9/wMAAQAFAAEAAwD7/wEA+P8DAPv/BQAAAAQAAQAAAAAA/f8AAP3/BQD9/wcA+f8EAPj/AQD9/wAAAgAAAAIAAQAAAAEAAQABAAQABAADAAUAAAABAPz/AAD8/wAAAAAAAAEAAAD//wAA/v8AAP3/AAD9//3//v/6//7//f/8/wEA+/8AAP3/+/8AAPn/AwD8/wQAAAABAP7/AwD5/wgA9v8IAPn/BgAAAAUABgAEAAUAAAABAP7/AgD+/wUAAAAGAAEABAD+/wIA/P8CAAAAAwABAAMAAAABAP//AAAAAAMA/v8GAP3/CAD+/wYAAAACAAEAAQD+/wIA+/////7/+f8DAPn/BAD9/wIA/v8AAPr/AAD6/wIA/f8DAP7/AQD9//7//P/+//7/AAD+/wAA/P/8////+/8CAP7/AQD+//3//f/9////BAAAAAsAAgAIAAIAAAACAP7/AwADAAMABQAAAAAAAAD9/wQA/v8GAAIABAAFAAMAAgACAAAAAAABAP//AAD+//////8AAP//AAD9/wAA+//9//v//f/9//7//////wAA/v////3//v/+/////////wAA/v8AAP3/AAD8/wAA+/8BAAAAAgAIAAIACgACAAYAAQADAAAABgD8/wgA+v8EAPv///8AAPz/AAD+//////8AAPz/BAD8/wgA//8KAAAABwD//wIAAAAAAAQAAQAGAAMAAwAAAAAA+/8AAPn/AAAAAAMABAADAAIAAAD//wAAAAABAAMAAAACAP3/AAD7//7//P8AAP3/AAD6////+f/+//7///8CAP7/AAD9//z//v/9////AwAAAAUA/v8BAP3//v/+//7/AAAAAAAAAAD8/wAA/P8CAAAABAACAAYA//8IAP3/CAAAAAUAAwAEAAAAAwD9/wAA///9/wQA+v8GAPn/AgD5/wAA+/8CAP3/BgD+/wgA//8HAAAABQAAAAMAAQAAAAIAAAAAAP///v/+/////f8BAP3/AwD+/wEAAAAAAAEAAAABAAEAAAAAAPz/+v/7//r//P////r/AAD5//3/+//9//3/AQD9/wcA/f8HAP//AgABAAAAAgACAAMAAwAEAAEABAD//wMA/P8CAPz/BAD//wYAAQAEAAMAAwAGAAMABQADAAMAAQACAAAAAwABAAQAAQACAAAA/P////j/AAD8/wIAAAACAPv//v/5//r//v/5/wEA/P8AAP7//f/8//7/+/8BAP7/AgAAAAEA//8AAP//AwACAAYAAwAGAAAAAgD+////AQD+/wMA/f8AAPv//P/6/wAA+v8GAP3/BQACAAAABAAAAAIAAgACAAIABAAAAAQA/f8BAPz//v/9//7/AAD//wEAAAABAP//AQABAAMAAwADAAMAAAABAP//AgAAAAQA//8EAPv//f/5//n//v///wIAAgAAAP3/AAD5/wIA/f8FAAEAAwAAAAAA/P8AAPn/AAD+////AQD9/wAA/f//////AQAAAAQAAAAEAAAABAD//wQAAAACAAEAAgAAAAAA///+/wAA/P8CAPz/AwD+/wMA//8CAAAAAQADAAIABAADAAIAAgACAAAAAwD//wQA//8CAAAA//8BAP7/AAAAAP//AAAAAP7/AAD+/wAAAAAAAAEAAwAAAAMA/v8AAP3//v/+/wAA/v8AAP//+v/+//f//f/6//////8CAAAAAwAAAAAAAgD+/wQA//8EAP//AgD+/wAA/P8AAPv/AAAAAP//BgD6/wYA+P8DAP3/BAADAAYAAwAGAAAABAABAAIABgAAAAYA/v8AAPv//v/7/wEA/v8CAAAA/v/8//3/+v8AAP//AgADAAAAAAD///3/AAAAAAIABAAAAAIA/f////7//f8CAP//AwABAP7/AAD6//3//f/+/wIAAAADAAIA/v8CAPr/AAD9/wAAAAACAP//AgD9/wEA//8CAAEAAwADAAEAAwAAAAQA//8FAAAABAAAAAIA/v8DAP3/AwD//wEAAAAAAP7////8////AAD//wMAAAADAAEAAgADAAEAAwACAAMAAwACAAMAAAAAAP7//f/9//3/+/////v////8//7//f/+/////v8AAAAA//8BAP3/AQD//wEAAAACAAEAAgAAAAAA/P/9//z/+/8BAPv/BAD9/wAA////////AgABAAUAAwACAAMA/v8BAPz/AAD//wAAAAAAAP7/AAD//wIAAwAEAAUABAADAAEAAgACAAUABAAGAAIAAgD//wAA/v8AAP7/AQD//////v/7//z/+//9////AAAAAAMAAAABAP////8CAPz/BgD8/wQA//////7//v/5/wAA+P8AAP3//P8AAPr/AgD8/wQA//8EAP//AwD+/wEA/v8BAP//AgABAAMAAgABAAEA//8AAP//AAABAAAAAwADAAMABgADAAUABQACAAUAAQADAAAAAAABAP7/AgD+/wAA/v/7//7/+//8/wAA/v8DAAAAAwABAAIA//8EAP7/BgD//wQA//8CAPz/AAD6/////P/8/wAA+/8BAPn/AAD5/wAA+/8CAAAABQABAAQAAAABAAEAAAACAAAABAD//wEA/v/+/wAA/v8CAAAAAQAAAAAA/P8AAPr/AwD7/wQA/v8BAAAA/v8BAP//AQABAAEAAQACAAAAAgAAAAEA/v8BAAAAAgAAAAIAAAAEAP7/BgD+/wUA//8AAAAA/f8AAP7///8AAAAA//8DAPv/AwD7/wEA//8AAAAAAQAAAAAAAQD+/wIA+/8BAP3/AQAAAAAAAAD9//z/+v/8//r//v/6/wAA+v8BAPv/AQD//wEABgACAAoAAwAGAAMABAACAAgAAAAHAP//AgD+/wEA/v8BAAAA//8DAP7/AQAAAP//AgD//wAAAwD8/wYA/f8DAAMA//8EAP///v8AAPz/AQD//wAAAAAAAAAAAQABAAMAAQABAAAA/v8AAP3/AAD+/////P/6//r/+P/7//v///8AAAAAAQAAAAAAAAD//wAAAgABAAYAAQAEAAAAAAD/////AAAAAP//AAD///z/AAD6/wAA/f8AAAAAAAD//wMA//8FAAIABgAFAAQABAAAAAIA//8DAAEABAAEAAMAAgABAP3/AgD7/wIA/v8AAAAA/f8AAP///v8AAPz//v/8//3//v/+/wAA//8AAAAA//8DAAAAAgABAP//AwD//wMABAADAAYABQAAAAMA/f8AAP7//f8AAP7//f8AAPr////7//3//v/+//7/AQD//wIAAgAAAAMAAAABAAAAAgAAAAcAAQAGAAAAAAD///7/AAABAAEABAAAAAAAAQD9/wEA/v8AAAAA/f8AAP7/AAACAAIABwADAAQAAwD+/wEA/v8AAAMAAQAFAAEAAAAAAPv//v/9//3/AAD7////9v/9//b////5/////f/9//v//v/6/wAAAAAAAAYAAAAGAP//AgD//wIAAQAGAAMACAACAAQAAAAAAAAAAAAAAAEAAAABAAAAAAAAAAAAAAAAAAAA//8AAAAAAgABAAQAAQAEAAAAAgAAAAAAAQAAAAIAAAABAAAAAAAAAP//AAD+/wAA/f8AAP7/AwD9/wIA+//9//3/+/////7//v8AAP3//f8AAPn/AwD7/wQA/v8CAP//AAD//wAAAAAAAAAA/v////z/AAD9/wAA//8BAP//AgD//wIAAQACAAMAAwAEAAUABQAHAAgACAAIAAUABQAAAAEAAQAAAAEAAQD+/wAA+//7//7/+f////v//P/+//v//v////z/AgD9/wAA///9/wAA/v8BAAEAAwAAAAIA/v8AAP7/AAAAAAIAAgACAAAAAAAAAP7/AAAAAAEAAwAAAAIAAAD//wAA/////wIA//8DAAAAAQABAP//BAAAAAUAAAADAAAAAAD9////+/8AAPn/AAD6//7/+v/6//n/9//5//n//P///wAAAwADAAIABAABAAQABQAGAAgACQAGAAkAAgAHAAAABQAAAAEA//////z/AAD8/wEAAAD//wMA/P8AAP3///8BAAIAAgADAP//AAD7//3//f///wAAAAAAAAAA///+//7//v//////AAAAAP//AAD+///////+/wAA/v////3////6////+f8AAP3/AwABAAMAAgAEAAEABgAEAAYACQAEAAoAAwAGAAEAAQD//wIA/v8DAP//AQAAAP3/AAD9////AAD//wEA//8DAP7/BQAAAAQAAwABAAEA//8AAP7/AAD9/wMA/P8CAPv////4//n/+f/6//3////9/////P/5//3/+P8AAPv/AAD//wEAAAABAAAAAQAAAAEAAwABAAcAAQAHAAMABAAEAAMABAADAAQAAwAFAAEAAgD//wAA//8AAAAAAAD////////8/wAA/v8AAAIAAQADAAIAAAACAP//AQAAAAAAAwD//wMA/v8AAP7//P/9//z//f/9//3//v//////AAD9/wAA+/////z//////wIAAAAIAAAABgD//wAA/v8AAP7/AwD//wUAAAABAAEA/v8BAP3/AgD//wUAAQAEAP//AgD8/wUA/P8HAP//BgAAAAQAAAABAAEAAQABAAQAAQAFAAAAAQD+//3//v/8/wAA/P8AAPz////7/wAA+v8CAPv/AAD9//3//P/+//r/AgD9/wMAAAAAAAMA//8CAAEAAAAEAAAAAgAAAAAAAgABAAQABAAEAAYAAQACAAAA/P8AAPz/AgD//wMA//8BAPv/AAD5/wAA/f8AAAEAAQAFAAEAAwD+/////P8AAP3/AQD+/wAA/P/+//z/+//+//n/AAD8/wIAAAACAAIAAgABAAUABAAFAAcAAwAIAAEABwABAAQAAAACAAEA//8CAP3////9//z//v/8//7//v//////AQD+/wQA/P8CAP3//f////v/AAD+//////8AAPv/AAD4////+v8AAAAAAQABAAMA//8CAP7/AgACAAMABgAFAAUAAwABAP///v/8/wAA/v8CAAAAAgAAAAEA//8CAAAABAACAAYAAwAHAAMABQACAAAAAQD+/wEA//8AAP///v///wAA/f8AAPn/AAD6/wAAAAAAAAQAAQAEAAQAAQADAAAAAAABAP3/AgD8/wAA+//6//r/+f/8//3//v///////f/+//z///8AAAEAAwACAAMA//8BAPz/AAD+/wEAAgADAAMAAQAAAP//AQD//wQAAAAHAAIACAACAAgAAAAGAP//AwABAAEAAgABAAAAAAD7//7/+v/6//z/+v////3/AAD+/wEA/v8CAP//AgD//wIA/v8HAAAABwABAAAAAQD6/wAA+v/9/////P8AAP///P////v//v8AAAAACAABAAkAAAAFAAAAAwACAAMABAADAAEAAAD+//z//v/6/wEA/f8DAAAAAgACAAAAAAAAAP//AQAAAAAAAQAAAP//AAD8/wAA/P/+/wAA//8BAAAAAAAAAP////8BAAAABQACAAYABAADAAUAAAAEAP3/AgD7/wAA+v/8//r//f/7////+//8//z/+P8DAPr/CwAAAAoAAwAEAAMAAAABAAEAAwADAAYAAQAEAP3/AQD5/wAA+/8AAP///P8BAPr/AQD9/wAAAAABAAQABAADAAMAAAD+/wAA/P8BAP7/AgD//wAA/f/6//3/+P8BAPv/BQAAAAQAAgABAAAAAQAAAAEAAQD//wEA/v8BAP7/AQD+/wEA/f///wAA/f8EAAAABQAEAAMABAABAAAAAgAAAAQABAACAAQA/P////j/+//4//v//f/8/wIA/f8CAP7/AAD//wAAAAAFAAAABwABAAIAAwD9/wMA+v8AAP7//f8AAP3///////7/AAD//wIAAAADAAIAAAACAAAAAgADAAMABgACAAUAAAABAP7//v/+//3///8AAP//AAD/////AAAAAAEAAAAAAAAA//8BAAAAAgABAAIAAAAAAAAA+/8BAPf/AQD8/wAAAAAAAP//AAD7/wAA/f8AAAMAAAAIAAAABQD+/wAA/f///wEAAAAEAP//AAD8//z/+/////7/BQAAAAcAAgACAAMA//8GAAAABwAAAAUA//8BAP//AAD//wIA/P8BAPv//v/9//z//v/+//7/AAD//wEAAAAAAAIAAAADAP//AgD//wMA/v8EAP7/AwAAAAIA/v8BAPv////9//3/AgD//wUA//8EAP3/AAD9//3/AAD//wIAAAADAP//AQD9/wEA/P8DAP7/BAABAAAABQD+/wUA/f8DAP7/AgD//wEA/f8BAPr/AQD7//7//v/8/wAA/f8BAP3/AgD+/wQAAQACAAMAAgABAAQAAAAGAAAABAADAAAAAwD//wAAAAD9/wAAAAD+/wMA+v8DAPv/AQD+/wAA//8BAAAAAQABAP7/AAD8/wEA/f8DAP3/AgD8/wAA/P8BAAAAAgADAAAAAgD9//3//P/9//3/AgD+/wQA/P8BAPv//f/9//v////+/wAAAAABAAAAAgAAAAMAAgADAAQAAgADAAEAAwAAAAMA//8DAP//AgD//wAA/v////7/AgAAAAMAAQAAAAMAAAAFAAAABwABAAYAAAACAP//AQD+/wMA/v8CAPz/AAD8//3//v/8/wAA///9/wAA/f/9/wEA+v8FAPz/BAD//wAAAAD9/////P8AAP7/AgD//wQA/v8BAP3/AAD9/wEA//8EAAIAAwAEAAAAAQD///////8AAP3/AgD9/wQA//8DAAMAAAAEAAAAAQACAAAABAACAAIABAACAAIAAwD+/wAA/P/8//z//P/9////+v8BAPj/AAD7//7/AAAAAAIABAACAAUAAgABAAUAAAAGAAAABQD//wEA/f////z////9///////+/////////wAAAAABAAQAAgAEAAEAAAAAAP//AAADAAIABAACAP//AAD5/wAA+v8BAP//AQAAAAEA/v8CAP3/AAAAAP7/AAD6/wAA+P8BAPr/AQD8/wAA/P8AAPz/AAAAAAIABwADAAoAAwAIAAIABQACAAQAAgAFAAEAAwAAAP7/AAD4//3/9//8//v//v/9/////P8AAP7/AQADAAAABwD8/wYA/f8DAAAAAgAAAAIAAAAAAAAA/P8AAPz/AAD9/wIA/v8CAP3/AAD8//7//v///wAAAQAAAAQAAAADAAAAAAACAAAABAAEAAQABAAFAAAABwD7/wgA/P8EAAAAAQABAAEAAAAAAP///f8BAPf/AwD1/wAA+f//////AAAAAAAAAAD9/wEA+/8EAP3/BwABAAUAAwAAAAEA/v8CAP//BAAAAAEA//8AAPz/AAD8/////v/7//7/+f/8//v//////wIAAAADAAAAAQD//wEAAAACAAIAAwACAAMAAwACAAMAAwAAAAMAAAABAAQAAAAFAP7/AgD9/wEA/P8DAPv/BAD8/wAAAAD9/wMA/P8CAP7/AQD+/wIA/f8EAPv/BAD9/wAA///6////+v////7////+////+//+//r/AAD8/wAAAQAAAAQAAQADAAIAAgACAAMAAQAFAAMABQAGAAQABgACAAQAAQACAAEAAQAAAP//AAD+/wAAAAD//wAA/v/+//7/+v////n/AAAAAAEAAwABAAAAAAD6/wAA/P8AAAAAAAAAAAAA/v////7//f8AAPz/AgD7/wIA/P8DAAAABAAAAAQAAAACAAAAAAACAAEABgABAAYAAAACAAAA//8AAAAAAAADAP3/AgD9//3//v/7//3//v/6/wAA/P/+/wAA/P8CAP7/AQABAAAAAwACAAMAAwADAAMAAwABAAEAAQAAAAEAAAD//wAA/v///wAA/P8AAP7//v////z///8AAP//BAAAAAQAAQABAAMAAAADAAEAAQADAAIAAgADAAAAAQD+/wAA//8AAAAAAAD//wAA/v8AAP///v8AAPz////9//7/AAD//wMAAAAEAAEAAgAAAAAAAAACAAAABgABAAMA///+//3/+//8//3//P////v////6//v//f/6/wAA/P8BAAAAAgAAAAQAAAAHAAAACgACAAcABAACAAQAAgACAAYAAQAFAAAAAAD+//3////+/wAAAAAAAAIA/v8AAP7//v////3/AQD+/wIAAAAAAAAAAAD//wQA/f8DAP7/AAAAAAAAAAACAAAAAAAAAP7/AQD8/wAA/v/+/wAA/v8AAAAA/v8AAP3//f8AAPv/BAD//wQAAQAEAAEAAwAAAAEAAQAAAAQAAAAFAAAAAwD8/wEA+/8AAPz///////v/AAD7//3//f/9//7/AAD+/wQAAAAEAAMAAAAGAAAABgAAAAMAAAAAAP//AAAAAAAAAgD+/wMA+/8CAPr/AQD7/wEA/f8AAAAA/v8CAP7/AgD//wMA//8CAP//AAD//wAAAAACAAEAAgAAAAAAAAD//wAAAgABAAcAAgAEAAAAAAD8/wAA/P8CAAAAAAADAPv/AAD6/////P8DAP3/BgD8/wQA/v8BAAEAAAADAAAAAQD//wAA/////////////////v////7//v8BAP7/BAABAAEABwD+/wkA//8FAAAAAwAAAAYA//8HAP7/AwD/////AAD7/wAA/P////3////6/wEA+v8CAP7/AAAAAP////8AAP//AwAAAAIAAQAAAP//AAD5/wEA+v8AAAAA//8DAAAAAgD//wAA/f8AAP3/AgAAAAMAAQACAP//AQD+/wAAAAD//wMA//8DAAEAAQAEAAAABQAAAAUAAgADAAMAAQABAAEAAAAAAP//+/8AAPf/AAD5//3//v/+/wAAAAD+/wEAAAABAAUABAAGAAMAAwAAAAIA/v8CAP//AAAAAPv////6//z//v/+/wAAAQD7/wAA+f/+////AAADAAMAAwACAAEAAAABAAAAAQACAAEAAgABAAAAAgAAAAQAAQACAAEAAAAAAAEAAQABAAAA///8//3/+//9//z//f/+//3/AAD//wAAAQD//wMAAAABAAQA//8FAAAAAgACAAAAAQAAAP7/AQD7/wEA+///////+/8AAP3///8CAAAAAwACAAAABgAAAAcAAwAGAAMAAgACAAAAAQAAAAAA//////7////+////////////AAD+/wEAAAAAAAIAAAAAAAEA/v8AAP7///8AAP//AAAAAP//AAAAAP7/AQD//wIAAgAAAAQAAAACAAMAAAADAAAA/f8BAPv/AgD+/wAAAAD8/////P/9//7//v8AAAAAAgABAAMAAQABAAIAAgACAAYAAAAEAP7//v8AAPz/AQD9/wEA/f/+//z//P/8/wAA/v8DAAEAAwAEAAIAAwABAAIAAQACAAIAAAABAP///v/+//z/+//9//r////8//7/AAD9/wEA//8BAAIAAgACAAMAAQADAAEAAgACAAEAAQAAAAAA//8AAAAAAgACAAQAAwADAAEAAwABAAYAAwAEAAYAAQADAAAA/P8AAPj/+//8//b/AAD4/////v/8/wEA/v8AAAIA/f8EAP//AAAAAP7/AAD+//7////+//7//f/+//z////9/wAAAAABAAQAAQADAAIAAQADAAMAAgAFAAAAAwABAAAAAgAAAAAAAQD+/wAA//8AAAAA//8CAAAAAAAAAP////////7/AAD+/wAA///7//7/+f/+//z/AAAAAAEAAQADAAAABAAAAAMAAgAAAAUAAQAFAAQAAQADAP//AAD//wAAAAAAAAAAAAD///7////+/wAA/v8BAP7/AwD9/wMA/f8BAAAAAQADAAEAAAAAAP7///8AAP//AgD//wAAAAD8/wMA/P8DAAAAAAABAP//AQD//wIAAAAEAP//BQD8/wQA+/8DAP3/AgAAAAIAAAABAAAAAAD/////AAD9/wQA/P8EAP3/AQD///7//f/7//z//f/9/wAAAAD+/wIA/v8BAAIAAAAGAAAABgABAAMAAQADAAEABAABAAMAAQABAAEA//8AAP3//v/8//3//P/9//7//f////////8AAP7////+////AAAAAAAAAgD9/wIA/P8DAP//AgAAAAEAAQABAAIAAAAEAP//BwD//wgA//8EAAAAAAABAP//AgAAAAIAAQAEAP//BgD7/wMA/f/+/wEA+/8EAP7/AQAAAAAA/v8AAPv/AAD8/wAA///8/wAA/P8AAP7/AAD//wEA/v8AAP////8BAP7/AQAAAAAAAAAAAAAAAAAAAAAABAD//wUA/f8DAAAAAQAEAAAAAgAAAAAA//8BAPz/BAD8/wMA/v8AAAAA/v8CAP//AwAAAAMAAAADAP3/AwD9/wEA/v8AAAAA/v8DAPz/AwD9/wEA/v8BAP7/AgAAAAIAAgAAAAMA/f8CAP3/AQD//wAA//8AAP7//v////v/AAD7/wAA/f8AAP//AAAAAAAAAQD//wIA//8CAAAAAwABAAMAAQABAAAA//8AAP7/AQD//wMAAAACAAAAAAABAAAABQAAAAYAAAAEAAAAAgAAAAIAAAAAAAIA+/8CAPn//v/6//z/+//+//v/AAD8//7/AAD7/wMA+/8EAP7/AgABAAIAAAAFAP7/AwAAAP//BAD8/wUA/f8DAP3/AwD8/wQA/v8CAAAA//8DAP3/BAD+/wMA/f8CAPz/AgD+/wAAAAD9/wIA/f8CAPz/AAD8/wEA//8DAAEAAwABAAAAAwAAAAQAAAAEAAAAAgD+/wEA/f8AAP7/AAAAAAAAAgD//wIAAAABAAMAAAADAAEAAQABAAIAAgADAAAAAAD///3//v/7////+//+//z/+//7//v//f/9/////v8AAP7/AQAAAAMAAQAFAAMAAgAEAAAABAD//wMA/v8DAPv/BAD6/wUA+/8FAP//AwAAAP//AQD9/wIA/f8GAPz/BgD6/wEA+/////z/AAD8/////f/7/wAA/P8CAAAABAABAAMAAgADAAIAAQACAAAABAD//wMAAAAAAAAAAAD//wEA/v8AAP///f8AAP7/AAABAAAAAgD//wEAAAAAAAEAAAAAAAAAAAD+/wIA/f8CAPz/AAD8/wAA/v8BAAAAAAABAP7/AgD9/wMA/f8EAP//AwAAAAMAAQACAAMAAAAFAP//BQD+/wUA/v8FAP//BAABAAEAAAD//wAA/v8BAPz/AgD7/wAA+/8AAPz/AAD7//7/+v/6//z//P8AAP//AgAAAAIA//8CAP7/AgD//wEAAgACAAMAAwACAAEAAgD//wMA/f8AAAAA/v8BAAEAAQADAP//AQD+/wAAAAACAAAABQD//wMA/////wEA/v8CAP7/AQD+/wAA/P8AAPz/AQD//wAA//////7///8AAAAAAgAAAAMA/v8BAP7/AAABAAIAAwAEAAQAAQAEAP7/BAD+/wIA//8BAP7/AAD+/wAAAAD//wEA/f8BAP3/AQD9/wAA/P8CAPv/AgD9/////v/9//z////9/wAAAAAAAAIAAAABAAAAAAAAAAIAAgAEAAMAAwAAAAAA//8AAP//AAD//wAA/v8BAP7/AgAAAAAAAAD//wAAAAABAAIAAwACAAIAAAD//////f////3///8AAAAAAAABAP3/AAD+////AwD9/wMA/v8AAAEAAgACAAYAAAAFAAAAAAABAP7/AQAAAAEAAAACAP//AgD9/wAA///+/wAA/P8AAP3/AAAAAAEAAAAAAP7//f/9//v/AAD//wIAAQACAP//AQD9/wAAAAACAAIAAgACAAIAAgAAAAIAAAACAP7/AAD//wAAAQABAAIAAgAAAAAA/v//////AAAAAAMAAgADAAEAAAAAAP//AAD//wAA//8AAPz/AAD7//3//f/6//7/+f////3/AAD//wAA/v8AAP7/AQABAAEAAwD//wIA//8CAAAAAwAAAAUA/v8DAP3/AAAAAAAABAABAAUAAgABAAAA/////wEA//8EAAAAAQAAAP//AAD///7////9//z////9/wIAAQAEAAQABAAAAAIA//8CAAIAAwAFAAMAAwABAP7//f////r/AQD6/wIA/P8AAP3/AAD9/wMA/v8DAAAAAAACAP7/BAAAAAMA//8BAPz////9//7////+//3////8////AAAAAAIAAAABAAEAAAACAAEAAgADAAEAAgAAAP7/AAD+/wAAAgAAAAMAAAAAAAMA/v8EAAAAAwACAAIAAAADAP//BQAAAAEAAAD7//3/9//7//n//v/6////+v////v//f/+//3/AAAAAAMAAgAFAAMABAADAAEAAwD+/wQA/v8EAAAABAAAAAMA/P8DAPv/AwD//wMAAwACAAQAAAACAAAAAQABAAEA//8BAPr/AAD7/wAA////////AAD7/wEA+/8CAP7/AwD//wMA/v8DAPz/AgD9/wAAAAD9/wAA+/8AAPz/AwD//wYA//8EAP7/BAD//wgAAgAKAAYABQAGAAAAAQAAAAAAAAAAAP7/AAD8//7//f/6//7/+v////3///8AAP//AQAAAAEA/v8AAPv/AQD8/wIA//8BAP////////7/AAD+/wIA/f8AAP//AAACAAEAAgAFAAAAAwAAAP//AgD//wIAAgAAAAMA/f8AAP3/AAAAAAAAAAABAP7/AAD///7/AgD9/wQA//8EAP//AQD+/wEAAAACAAIAAgACAAEABAAAAAUA//8DAAEAAAAFAAAAAgD//////v/+//7/AAD+/wAA/v/9//7/+f////n/AAD8/wEA/v8AAP////////////8AAAAA/v8DAPv/AwD9/wEAAAD//wAA/v/+/wAAAQACAAYAAgAHAAAABAAAAAMAAgAEAAQABAAEAAIAAQAAAAAAAAABAAAAAQD9/wAA/v///wAA//8AAAEA/v8CAPv/AAD8//3//f/8//v////6/wAA/f/+/wAA/P8AAP3/AQABAAMABAAEAAMAAwAAAAIAAQABAAMAAAABAP/////9///////+/wAA/v8AAP////8AAAMAAAAHAAAAAwAAAAAAAAAAAAEAAQACAAAAAQD9/wAA+/8BAP7/AgAAAAMAAgABAAIAAAABAAEAAAACAAEAAAACAPz/AAD8//7//v/+////AAD7/wAA+v////3///8BAAAAAQD//////f/+//7/AAAAAAEA//8BAP3/AAD+////AgAAAAMAAgABAAMAAQABAAUAAAAGAAAAAQAAAP//AwAAAAMAAgAAAAEA///8/wAA+/8BAP//AQAAAAAA/f8AAPz/AAD+/wAA//8AAP////8AAP3/AQD8/wIA/v8CAAAAAgABAAQAAAAFAAEAAQAEAAEABAAEAAEABAAAAAAAAAD//wAAAAD//wIA/f8CAP7/AQAAAAAAAQD//wAA/P8AAPv//v/+//7//f8AAPn/AAD5//3//v/7/wEA/P8AAAAA//8DAAAAAwABAAIAAgACAAEAAgABAAIAAgABAAMAAAACAP7/AAD9/wAA//8CAAEABAACAAIAAQD+/wAA/f8BAAAAAAAAAP///P/9//r//f/9////AAAAAAAAAAAAAAIAAgADAAQAAwACAAEA//8BAAAAAQABAAAA//////z//f/8//v/AAD8/wIA//8AAAAAAAAAAAIA/v8FAP7/AwABAAAAAwD//wAA///9//7//P/8//7//P8AAAAAAwABAAMAAQABAAEAAQADAAUAAgAIAAIABwADAAIAAwD+/wMAAAACAAEABAABAAUAAQAAAAAA/P8AAP3//v///////f8AAPn//v/4//n/+v/3//3/+v////3/AAD9/wIA/f8CAAAAAgADAAMABQADAAQAAgAEAAAABAD//wEA///+/wAA//8CAAIAAQADAAAAAAD///7/AQD//wQAAgABAAMA//8AAAAA/f8CAPv/AQD9//7/AAD9/wEA/v8AAP/////8/wAA/P8DAAAABQACAAQAAAAAAAAA//8DAAAABwAAAAYAAgACAAAAAAD+/wEA//8CAAIAAAADAP7/AAD9//7/+//8//r//P/9//z/AAD9/wAA/v////7//v/+/wAAAAACAAEAAQAEAAAABAAAAAIAAQABAAMAAQAFAAEABAADAAIABAAAAAAA///+////AAD9/wUA+v8GAPr/AQD+//v/AQD6/wMA/v8DAAAABQD9/wUA+v8CAPz/AAAAAAAAAgD//wMA/f8DAPz/AgD9/wAA//8AAAEAAgADAAMAAwAAAAMA/P8DAP3/BAAAAAQAAgAAAAEA/P8AAPr/AAD8/wAA/f8AAP3/AQD+/wAA/f8AAPz//v/9//7/AAAAAAIAAQD//wEA/P8AAP////8FAAAABwADAAQABQACAAIABQD//wgA//8HAAAAAwACAAAAAwAAAAAA/v/9//z//v/8/wAA/f8BAP3////9//r////6/wEA/v8CAAAAAQD//wAA/v/9//3//P/9//z/AAD9/wQA/f8DAPz/AAD9//7/AAAAAAQAAgAFAAQABQACAAQA//8DAP//AwAAAAQAAwADAAMAAAABAPz////7//////8AAAIAAAAAAAIA/P8EAPz/AgD//wAAAAABAAAABQAAAAUAAAABAAAA/f8CAPz/BQD//wUAAAAEAP//AQD8/wAA/P8AAP3//v8BAP3/AgD9///////7/////P///wAAAAACAAEAAAABAP3/AAD8/wEAAAACAAIAAAACAP7/AQD9/wAA/f////3/AAD9/wIAAAAEAAIAAgAAAAAA//8AAAIAAAAHAAMABgACAAAA///9//3/AAD//wMAAAABAAEA/f8CAPv/AQD7/wAA/v8AAAAAAAACAAEAAAABAP///v8AAPv/AwD+/wMAAwABAAUAAAABAAAA/P8AAP3/AAACAAEABQACAAAAAAD5//v/+P/6//v//v/+/wAAAAD+/wAA/v8AAAAAAAABAAEAAAAEAAAABQACAAIAAgD+/wAA/f8AAAAAAgABAAQAAwABAAQA//8EAP//BAACAAUABAAFAAEAAgD//wAA///9/wEA/P8EAP3/AwD9/wAA/f/+//3////9/wIA/v8BAAAA/f8EAPr/AwD6////+//7//3//f///wAAAAABAAAA//////v////9/wEAAwADAAUAAQACAAAA/f8AAPz/AgD//wAAAQD9/wAA/////wEAAAAAAAIA//8CAAAAAgADAAMABAAEAAEAAgAAAP//AgAAAAUAAgAEAAAAAAD9//3//v/+/wEA//8FAAAABAAAAAIA/P8BAPz/AAABAP7/BAD8/wEA/P/9//z//f/6////+P8AAPv///8AAAAABAAAAAEA//////3////+/wMAAQAHAAEABAD//wAA///+/wIAAAAFAAIABAACAAMAAQAEAAAABAAAAAIAAgABAAEAAgAAAAAA/v/+//z/+v/8//r/AAD9/wIAAAACAAAAAQD9/wEA/P8DAAAAAwADAAAAAgD+/////v/9//3/AAD9/wUA/v8DAAAAAAAAAP7/AAAAAAAAAgABAAEAAgAAAAEAAAD//////v/+//z////7/wAA/v8BAAIAAAACAP//AAABAAAABAADAAIABQD+/wIA+v8AAPz/AAD+/wIA/v8EAP7/AgD//wAAAAAAAAMAAQAEAAIABQAAAAUA//8FAP7/AgD8/////P/+//7/AAD//wEA///+//3/+f/+//n/AQAAAAMABAABAAIA//////7/AAD//wMA//8CAP//AAAAAAAAAQAAAAEA/v8AAP3/AAD//wIAAAACAAAAAQD//wAAAAD//wIAAAAAAAAA/f8AAPv////9/wAAAAABAAAAAAABAAEAAgABAAMAAAAFAAAABAABAAEAAwAAAAQAAAACAAAA/////wAA/v8DAAAAAwACAAAAAwD+/wAA/v//////AgAAAAYAAAAGAAAAAAD///v////8//7////9/////v/7//7/+v/+//3//v8AAP//AQAAAAMAAAABAP//AAAAAAAAAAACAAEAAwAAAAMAAAAAAAEA//8BAAAAAQACAAIAAwAFAAEABQAAAAIAAAAAAAEAAQAAAAIA+/8AAPr////9//7/AAD+//7////9/wAAAAAAAAQAAAADAAEA/v8CAP3/AgAAAAIAAAAAAP7//v/+//z/AAD8/wIA/P8EAPz/BAD8/wIA/f8BAP//AgAAAAIAAAABAAEA/v8CAPr/AQD7/wAA//8AAAAAAQAAAAEA//8AAP//AQD//wMAAAADAAIAAgAAAAEA/v8BAP//AAACAAAABAAAAAMAAgAAAAQAAQADAAMAAQADAAAAAAAAAP7/AQAAAAAAAQD6/wAA+f/+//z//v/+/wEA/f8CAP3/AAD///7/AAD+/wAAAAAAAAAAAAD//wAA/f8AAPz//v///wAAAAABAAAAAQD//wEAAAABAAMAAgAFAAIAAwABAAAAAAD//wAAAAAAAAAA//8AAAAAAAABAP7/AgD9/wEAAAAAAAQAAAADAAEAAAAAAP///f8AAPz/AgD+/wEA/////wAA//8AAAEAAAADAAAAAQABAAAAAQD//wIAAAABAAIAAAAAAP///f////z/AAD//wAAAAAAAP7/AAD8/wEA/v8AAAEAAAACAAEAAAABAP//AAAAAP7/AQD8/wEA/v8AAAAA/////wAA/f8AAP//AAACAAEAAgACAAAAAQAAAAEAAAAEAAAABgAAAAIAAQD+/wMA//8CAAAAAAAAAAAA/v8DAPv/AwD9/wEAAAD//wEA/f8AAP7/AAD+/wAA/v8AAP//AAAAAAAAAQD//wIA//8EAAAAAwAAAAAAAAD+/wAA/P8CAP3/BQD+/wQA/f8AAPv//v/8/wAAAAABAAEA//8BAPz/AQD8/wIA//8BAAEAAQACAAMAAQADAAAAAgAAAAAAAAAAAAEAAAAAAAQA/v8DAPz///8AAP7/AgAAAAEAAgAAAAEAAAD//wIA//8FAAAABAAAAAAAAAD8/////v///wAA/f8AAPv////9//3//v////3/AgD7/wMA/P8AAP////8AAAAA//8AAAAA/f8DAPv/AwD+/wMAAAAEAAAABQD//wMAAAAAAAEA/v8BAP7/AAAAAAEAAgAAAAIA//8AAP7/AAAAAAMAAwAFAAIABQAAAAEAAAD+/wIA//8DAAIAAQACAAAAAAAAAP3/AAD8/wAA//8AAAEAAAAAAP///P8AAPv/AQD+/wAA/v////7//////wAAAAAAAAAA//8AAPz////+/wAAAAABAP//AAD8//7//////wIAAQADAAIAAgABAAIAAAACAAAAAgACAAIAAgAAAAEAAAABAP//AQAAAAAAAQD//wMAAAACAAEAAAAAAAAA/P8AAPz/AAAAAP7/BAD7/wEA+v/+//v////+/wMAAAAGAAEABQAAAAIAAAAAAAMAAAAGAAAAAwAAAP7//v/9//v////6/wAA/f/+/wAA/v8BAAAAAAADAAAAAQAAAP//AQAAAAIAAQABAAAA/v8AAPz/AAD8/wAA/v/+//////8BAAAAAgABAAIAAgABAAIAAQACAAMAAQAGAAAABQAAAAAAAAD//wAAAAAAAAMA//8DAAAAAAABAP3/AQD8/wMAAAADAAEAAAD///7/+v8AAPr/AgD//wAAAgD8/wIA+v////3//v8AAAEAAAAEAP//AgAAAP7/AQD7/wEA+/8AAP3////+/wAAAAAAAAAAAAD///7//////wIAAAAFAAAABAAAAAIAAQABAAAAAQAAAAIAAAACAAEAAQAAAAAAAAAAAAAAAAACAAAAAwADAAIABAABAAAAAwD9/wQA//8CAAAAAAACAP7/AgD9/wAA/P/+//3////+/wAA/f8AAPv//P/7//n////5/wEA/f8BAAAAAAAAAP///f8BAP3/BAAAAAMABAAAAAYA/v8FAAAAAQACAAAAAgABAAEAAgACAAEAAwD+/wMA/f8BAAAAAQADAAIAAwABAAIA/v8CAPz/AQD//wAAAAD///7/AAD9/wAA/v8AAP///v////7///8BAP//AwAAAAEAAAAAAAAAAAAAAP//AwAAAAQAAQABAAAAAQD8/wMA+/8EAP7/AAACAP3/AwD8/wAA/v/8/wAA/P8AAP///v8AAP7///////3/AAD+/wMAAQACAAUA//8FAP3/AQAAAP//AgABAAIABAAAAAQAAAABAAEAAAACAAAAAAAAAAAAAQAAAAEAAAAAAP//AAAAAAAAAAAAAAAAAQAAAAAAAAD9/////P/+//3//////wAAAAAAAAAAAAAAAAAA//////3/AAD//wEAAAABAAAAAQAAAAAA//8BAP//AwAAAAMAAgD//wIA/f8AAAAA/f8DAP3/AAAAAP3/AwD7/wAA/P/9/////v///wIA/v8FAP//AwABAAAAAgABAAMABQADAAYAAQAEAAAAAgAAAAEAAAABAAEAAQACAAIAAAABAAEAAAACAP7/AgD+/wIA//8CAP//AQD9/////f/+//3//v/8//7//P/+//3//P/+//z////+/////v////7//v8AAP7/AQD+/wAA//8AAP//AgAAAAUAAQAEAAQAAAAEAAAAAQACAAAAAwAEAAAABwD9/wQA/v8AAAEA/v8DAP//AQACAAAAAgD+/wAA/v/+/wAA/v8CAAAAAQACAAAAAgAAAAAAAgAAAAMAAAACAAAA//8AAPz/AAD8//3//P/9//3/AAD9/wIA/f8BAP//AAAAAP//AQAAAAAAAAABAAAAAgD+/wIA/v8AAP7//v////7///8AAAAAAAAAAP7/AgD//wIAAAAAAAEAAAACAAIAAwADAAMAAQAEAP7/BAD//wQAAQACAAIAAQABAP//AAD+//////8AAP//AgD+/wMA/f8AAAAA/v8BAP7/AAABAP//AQD/////AAD+/wEA//8BAAAAAQAAAAIAAAAAAP/////+/wAA/v8DAAAAAQACAP3/AAD7//7//f/9///////+/wAA//8AAAEAAAADAP//AgAAAAEAAAADAP//AwD//wAAAAD9/wIA+/8AAPz/AAD//wEAAAAEAAAABAAAAAIAAQACAAIABAACAAQAAgACAAEAAQAAAAAAAAD//wAA/v8AAAAAAAAAAAAA/f////r/AAD8/wEA//8AAAAA/v/+//7//v8BAP7/AgD//wAAAAD+/wAAAAAAAAIAAAACAAAAAAAAAAAAAAAAAP//AAD+//7//////wAAAAABAP//AgD8/wIA/f8CAAAAAgAAAAMAAAADAP//AgAAAAEAAQABAAAAAQAAAAAAAgD//wQAAAACAAEAAAABAAAAAAABAAAAAAABAP//AQAAAAAAAwD+/wEA//8AAAAAAgD//wQA/f8BAP3//v/8//3/+//+//z//f/+//3//v/9//3////9/wAA//8BAAEAAQACAAAAAQAAAAEAAAAEAAAABQD//wMA/f8DAP//AgAAAAEAAQAAAAEAAQACAAAABAAAAAMAAAABAAEAAAACAAAAAgD8/wAA+//+//7///8AAAAAAAAAAAAA//8CAP7/BQAAAAIAAAD///7//v//////AAAAAAAA/P8AAPr/AAD+/wAAAQAAAAEAAQABAAAAAwD//wQA/v8CAP7/AAD+/wAA/v8AAP///f////v////7/wAA//8BAAAAAgABAAIAAwACAAUAAgAEAAIAAQADAAAAAgABAAAAAAABAP7/BAD+/wMA//8CAAAAAAAAAAAAAwABAAMAAgAAAAEA/f///////////wAA/P8AAPr////8//7////9/wEA/f8CAPz/AgD8/wQA/f8EAP3/AgD//wAAAAAAAAAA/v8AAP3/AAD//wEAAAABAAAAAQAAAAAAAwD//wQA//8EAAAAAwD//wEA/////////P8AAPv/AAD7/wEA+/8BAPv/AAD9/wIAAAAFAAEABQACAAIAAgABAAQAAwAFAAQAAgACAAAA/v8AAP3/AgD//wIAAAAAAP7/AAD9/wEA//8DAAAAAgAAAAAAAAAAAAAA/v8AAPz/AAD8/////f/+//3//f/9//z//f/8/wAA//8CAAAAAAAAAAAAAQAAAAMAAAADAP//AgAAAAEAAQABAAEAAQAAAAAAAQAAAAMAAgAFAAEABAAAAAMAAAADAAEAAgAAAAAA/f/9//v//v/+/wAAAQD//wEA/v8AAAAA//8CAAEAAQAEAAAAAwAAAAEAAAABAAAAAAD//////v/9/////P8AAPz/AQD9/wEA/v8AAP//AAAAAAEAAAABAAAAAAAAAAAAAAD+/wAA/v////3////9/wAA/v8BAAAAAQAAAAAAAAABAP//BQAAAAYAAQADAAAAAQAAAAIAAQAEAAIAAwABAAAAAAD+/wIA//8DAAAAAgAAAAAA/v/+//3////+/////v/+//7////+/wAA//8AAP///////wAA//8CAAAAAAACAP//AwD//wIAAAABAAAAAAD///7/AQD9/wQA//8DAP7/AQD9/wEA/v8CAAEAAQADAP//AwD+/wIAAAADAAAAAgD9/wAA/f/+/wAA/v8AAP7//f/9//3//v/+/wAA/v8CAAAAAwAAAAMAAAADAP//BQAAAAUAAgABAAUA//8EAAAAAgABAAIAAAACAAAAAQD+/wEA/f8BAP3/AQD9/wAA/P/+//z/AAD7/wEA/P8AAP///v8BAP//AgD//wEA//8AAP//AQD//wMA//8DAP7/AAD+///////+/wAA/v8AAP3/AAD8/wAA/v8CAAAAAgABAAAAAgAAAAMAAQAFAAEABgAAAAMAAAABAAEAAgABAAQA//8DAP//AAABAP7/AAD9//3//v/9//7/AAD+/wEAAAAAAAEA//8AAAAAAAACAAIAAAADAP//AAAAAAAAAQD////////9//3//v/6/wAA+v8AAPv/AAD8/wAA/f8AAP////8AAP//AQAAAAMAAQAEAAEABAABAAIAAgAAAAEAAAABAAEAAgADAAEAAgAAAAEA/////wAA//8DAAAAAgAAAP//AAD+/wAAAAAAAAEAAQD//wIA/f8DAP3/BAD+/wIA//8AAP7////+/wAA/////wAA/P8BAPv/AgD8/wEA/f8BAP7/AQAAAAIAAQADAAIAAgAAAAAAAAAAAAIAAQACAAAA/v8AAPz/AgD+/wIAAAD+/wEA+/////3//f///wAA//8CAP3/AgD9/wEAAAACAAEAAgAAAAEAAQAAAAQAAQACAAIA//8AAP7//v8BAP//AQABAP//AQD9////AAD+/wMAAAAEAAEAAwACAAIAAAABAAEAAQACAAAAAAD+/wAA/f8AAP3/AAD9///////9/wAA/f8AAP7/AAAAAAAA//8AAP7/AQD+/wEAAAAAAAIA/f8BAPz/AAAAAAAAAgAAAAEAAAABAAAAAgABAAQAAAACAP7/AAD+////AAD+/wIA/f8CAPv/AQD9/wIAAQAFAAUABgAFAAUAAwAEAAMAAgACAP//AQD+/wAA/v////3/+//5//r/9//+//r/AQD+/wEAAAD/////AAD//wIAAAADAAEA//8AAPz/AAD9/wAA//8AAP//AAD+////AAAAAAEAAgABAAIAAAABAAEAAAACAAEAAAADAP7/AgAAAAEAAgACAAMABAABAAUAAQAEAAMAAwAEAAIAAgAAAAAA//////7//f/+//v/+//7//n//f/6//7//f/+/wAA//8BAAAAAQABAAIAAQAEAAEABgACAAMAAAAAAAAA/f8CAPv/BAD6/wMA/P8BAP//AAAAAAAA/v////7/AAAAAAEAAgAAAAQA/v8CAP3/AAD//wEAAgABAAAAAAD//wEAAAACAAIAAQAAAAAA/f8AAP7/AAAAAAAA///9//7/+/8AAP3/AQABAAIAAwACAAQAAgAEAAEABAAAAAQA/v8EAPz/AgD+///////9//7/+/8AAPz/AgD9/wEA/v8AAP7/AQD+/wMA//8DAAEAAAAEAP7/AwD+/wAAAAAAAAEAAAACAAAAAwD+/wIA+/8CAPv/AgD+/wIAAAAAAAAA+/8AAPn/AAD7/wAA/v8AAP7/AQD+/wIAAAADAAEAAgABAAAAAQABAAAAAgD//wQA/f8DAP3/AQAAAAAAAAABAAAAAgADAAEABwAAAAcA/v8FAP//AwAAAAEAAQAAAAAA/P8AAPv////8/////f/+//z//v/+//z/AgD7/wIA+/8AAPz/AAD/////AAD+/////P////z/AAD//wMAAQAEAAEAAQADAP//BgAAAAcAAQAFAAEAAgABAAAAAQAAAAEA//8CAP7/AQD+/wEA//8DAP//BAAAAAIAAgAAAAEAAAAAAAAAAAAAAP///v/9//z/+//9//z//////wAAAQD//wEAAAACAAAABAAAAAUA//8DAAAAAgACAAEAAAAAAP7//v////3/AQD//wIAAAAAAP///v8AAP7/AgAAAAMAAQABAAAAAAD//wAA/v/+/////f8BAPz/AgD8/wIA/v8BAAAAAgACAAMABAACAAQAAAACAP//AQD+/wEA/f8AAPv////8//3////8/wAA/P8AAP7/AQAAAAMAAQAEAAAABQD//wMAAAAAAAIAAAAAAAAAAAD//////v8AAP3/AQD9/wEAAAABAAEAAgACAAMAAQABAAAAAAAAAAAAAAAAAAIA//8CAP7/AAAAAP3/AAD+/wAAAAAAAAEAAgAAAAMA/f8CAP3/AAD/////AAD+/wAA/P////v/AAD9/wIAAAACAAAAAwAAAAQAAgAEAAUAAwAEAAEAAgAAAAIAAAAAAP3////7//3//P/+//7//////wAA/////wAA//8AAAAAAAABAAEAAAAAAP//AAD//wAA/////wAA//8AAP7/AQD+/wMAAQAEAAMABAAAAAIA//8AAAEAAAAEAP//AwD+/wAA/f/+//z/AAD+/wIA//8CAAAAAQABAAEAAgABAAAAAAAAAAAAAAD//wAAAAD//wAA/f8AAP3/AAD//wAAAQAAAAIAAAABAAEAAQABAAMAAQAEAAEAAgD//wAA//8AAAAAAQAAAAAAAAD//////v////7////+//3////7/wAA/P///////v////////8CAP//AwAAAAIAAgAAAAIAAAABAAEAAQABAAEAAAABAAAAAgABAAMAAAABAP7/AAAAAAEAAAACAAAAAgD//wEA//////7//////wAAAAABAAAAAAAAAP7/AAD/////AAABAAEAAwABAAEAAQAAAAAAAAD//wAA/v//////AAD+/wEA/P8BAP3/AgD//wMAAAAEAAAABAAAAAIAAAAAAAMAAAABAAAA///+//7/+/8AAPv/AQD8/wAA/v//////AAAAAAIAAAADAAEAAgACAAAAAgAAAAEAAQAAAAEA//8AAP//AAAAAAEAAAABAP//AgAAAAIAAAABAAAAAAAAAP7/AAD//wAAAAAAAP/////8////+/8BAP7/AgAAAAAAAAAAAAAAAQAAAAAAAAD+/wAA/v8AAP//AAD//wAA/v8AAP7/AAAAAP//BAD//wQAAAADAAAAAwABAAUAAAADAAAAAQAAAAAAAAD+/wEA/f8BAP3/AAD+/////f8AAP3/AQAAAAAAAQAAAAIAAAABAAEAAQADAAIAAwABAAEAAAAAAAAAAAAAAAAA//8AAP7/AAD+//7/AAD+/wEAAAAAAAAA/v8AAP7/////////AAAAAP//AAAAAAAAAgAAAAMA//8CAP//AgAAAAEAAQAAAAAAAAAAAAAAAQD+/wMA/v8BAP////8AAP//AQAAAAEAAAABAP3/AgD9/wIA//8AAAAA//8AAP//AAD//wAA/P8AAPz/AAD//wEAAAABAP////8AAP7/AAAAAAEAAwAAAAMA//8BAAAAAAAEAAEAAgACAP//AwD+/wEAAAAAAAEA//8AAAAAAAAAAAAAAAAAAP3/AAD8/wAA/v8AAP//AAD+/wAA/v8AAP//AgAAAAIAAQADAAEAAwAAAAEAAAAAAAEA/v8BAP3/AQD//wIAAAACAP7/AQD//wEAAAABAAEAAAABAAAAAQAAAAEAAQAAAP/////9//7//v/+/wAA/f8CAPz/AQD+/wAAAAAAAAIAAAADAAAAAQD//wAA//8BAP7/AAD9/////v///wAAAAAAAAEAAAAEAAAABQADAAIABAABAAAAAQD//wEAAAD//wAA+/8AAPr////9//3//v/9//7/AAD//wEAAQACAAIAAgACAAEAAgACAAEAAwD//wIA/f8BAPz/AQD+/wIAAAACAAAAAAABAAAABQABAAYAAQAEAAAAAgD+/wIA/P8CAPz/AAD+//3////6//7//P//////AAAAAAAA//8AAP//AgAAAAAAAQD9/wAA/f8AAP///v8AAP3//v////3/AAAAAAIABAACAAMAAwACAAQAAgAFAAMAAwADAAAAAQD+/////v/9/////f////7/////////AAAAAP//AgAAAAMAAAADAAAAAgAAAAAAAQD+/wEA/P8AAPv/AAD7/wEA/f8AAP//AAAAAAAAAAACAAEAAQACAAAAAwAAAAIAAAAAAP//AAD9/wAA/P8CAP3/AgAAAAAAAQD//wEAAAABAAEAAgACAAIAAQADAAAAAgAAAP//AAD9/wAA/f8AAP7//////wAA//8BAAAAAwABAAIAAwAAAAQA/v8CAP//AQD//wEA/v8AAPz//f/8//v//f/9/wAA//8AAAAA//8AAP7/AgAAAAMAAQABAAAAAAD+/wAA/v8AAAAAAAAAAP7///8AAAAAAwADAAMABAAAAAQAAAAFAAIAAwABAAIA/v8BAPr/AgD6/wIA/f8BAP7//v/+//7//v8BAP//AQABAP//BAD8/wMA/P8BAP//AQAAAAAA//8AAP7/AAD+/wAA/v8AAAAAAQABAAEAAAABAAAAAgAAAAMAAgABAAIAAQAAAAEAAAAAAAAAAAABAAAAAQAAAAEAAAAAAAAAAAD//wAA/v8AAP7/AAD9/////v8AAP7/AAD//wAA//8AAAAA//8AAAAAAQAAAAIA//8BAP7/AQAAAAAAAgD//wMA/v8CAP//AAAAAAAA//8AAP//AgAAAAEAAQAAAAIA/v8CAP7/AQAAAAAAAQAAAAAA///+/////v8AAAAAAQABAAAAAAAAAP3/AQD+/wIAAAABAAAA//8AAP//AAAAAAAAAAAAAP//AgAAAAIAAQAAAAIA//8AAP////8CAAAAAgAAAAAAAAD+//3/AAD8/wEA/f8BAAAAAAAAAAAAAAACAAAAAQACAAAABAAAAAMAAAABAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAIAAAAAAAEA//8CAP7/AQD+/wAA///+/////f////3//f/+//v//v/9////AAAAAAIAAAAAAAEA//8DAAAAAwADAAAAAQD///7//////wAAAQD//wEA/v8AAP//AQAAAAIAAgADAAQABAADAAMAAgABAAAAAAD//wAA/f8AAP3/AAD//////v/+//7/AAAAAAEAAwAAAAQA/f8DAPz/AQD+/wIA/v8BAP3/AAD9////AAAAAAMAAgAFAAAABAAAAAMAAQADAAIAAgAAAAEA/f8AAP7////+//z//f/8//z////8/wAA/v8AAAEA//8CAAAAAQADAAEABAABAAIAAAD//////v/9/////v///wAA/v8AAP3//////wAAAgADAAIABAAAAAMAAAABAAEAAAACAAAAAAAAAAAAAAAAAAAAAQD//wAA/v//////AQAAAAIAAAAAAP///v///wAAAAABAAAA//8AAP3/AQD+/wEAAAABAAAAAQD+/wEAAAADAAQAAwAEAAAAAAD+/////v8AAAAAAAD+/wAA+/////z///////7/AQD9/wEAAAAAAAIAAQADAAMAAQAAAAAA//8DAAAAAwACAAAAAAAAAP7/AQAAAAIAAgABAAIAAAAAAAAA//8AAAEAAQACAAAAAAAAAP////8AAP//AAAAAAAAAAAAAP7/AAD8/wAA/P8AAP3////+//7//v///wAAAAAAAAAAAAD+/wEA//8CAAAAAQADAAAAAgAAAAEAAgACAAIAAwAAAAEA/////wIA/f8FAP7/AwD+/wAA/v8AAP//AQD//wAAAAD//wAA//8AAAAAAAAAAAEA//8AAAAA//8BAAAAAAAAAP//AAD//wEAAAADAAAABAD//wQA//8CAAAAAgABAAEAAAD//wAA/P8AAP3/AQD//wAA//8AAP//AAAAAAAAAgAAAAIA//8BAP7/AAD+/wAA/v8AAP///v8BAP3/AgAAAAAAAQD//wEAAAAAAAIAAAABAAMAAAADAAAAAAAAAAAAAAAAAP////////7/AQD9/wIA//8DAAAAAgAAAAEA//8AAAAAAAAAAAAAAAAAAP/////9//7//f//////AAAAAAAAAAAAAAEAAAADAAAAAwD//wMA//8BAAAAAAD//wAA/v8AAP//AAAAAAAAAAAAAP//AAD//wAAAQABAAIAAgABAAEAAAAAAAAAAAAAAAAAAAD//wAA//8AAAAAAgAAAAMAAAACAP//AgABAAMABAADAAMAAgAAAAEAAAAAAAIA//8BAP7//v/+//3////9/wAA/v////3//v/9/////v8AAAAAAAAAAAAAAAD//wAA/v8BAP//AQAAAAEAAAAAAAAAAQAAAAIAAAACAAAAAAABAAAAAgABAAEAAQACAP//AQD+/wAAAAD+/wAA//8AAAAA/////wAA/v8BAAAAAAABAP7/AQD//wEAAQAAAAEAAAD//wAA/v8AAAAAAAACAAEAAQABAAAAAQAAAAEAAgACAAIAAQABAAEAAgAAAAMAAAADAP7/AQD9/wEA/f8BAPz////9//3////8/wAA/P8AAPv/AAD8/wAA/v8AAP//AAD/////AAD+/wEAAAACAAAAAAAAAAAAAAABAAAAAwACAAEAAwD//wMA//8CAAAAAwAAAAIAAAAAAAAAAAAAAAAAAQD//wAA////////AAD//wIAAAACAAAAAQD//wAAAAAAAAAAAQAAAAEAAAAAAAAA//8BAP//AQAAAAAAAAAAAAAAAQD//wAA//8AAAAAAAAAAP//AAD//wAA//8AAP//AAD+/wAA/f8AAP7/AAAAAP//AAD+/wAA//8AAAAAAAAAAAAA//8BAAAAAQACAAEABAABAAIAAQABAAEAAgABAAIAAgABAAIAAAACAP//AwD+/wMA/v8CAP//AQAAAAAAAAD//wAA//8AAP//AAD9//7/+//+//r////6/wAA/P8AAP3////+////AAAAAAIAAQACAAEAAgABAAMAAQADAAAAAwAAAAEAAgAAAAMAAAABAAAAAAD//wAA/v8CAP//AwAAAAAAAAD+/wAA/v8AAP//AAD//wAA/f8AAPz/AAD+/wAAAQAAAAEAAAAAAAAA//8BAAAAAQACAAAAAgAAAAEAAAAAAAAAAAAAAAEAAAABAAAAAAABAAAABAAAAAQAAQACAAEAAQAAAAAAAAAAAP///v8AAPz/AgD6/wEA/P8AAP7/AAD9/wEA/v8BAAAAAAABAP//AQD+/wIA//8CAAAAAQD//wAA////////AAAAAAAAAgD//wIA//8AAAAA//8AAP//AAAAAAAAAAABAP3/AgD8/wIA/v8BAAAAAgABAAIAAAACAAAAAAABAAAAAwAAAAMA//8AAP//AAAAAAEAAAABAAAAAAD+/wAA//8AAAAAAAABAP//AAD///////////7/AAD8/////f/9//7//f8AAP//AAD//wAA//8CAP//BAD//wMAAAAAAAEAAAABAAEAAQADAAMAAQAFAP//BgD//wUAAQAEAAMAAgACAAEAAAAAAAAA/v8BAP7/AwD9/wEA/P8AAPv////+////AAD+/wAA/v8AAP3/AQD8/wMA/P8BAP7/AAD//wAA/v8AAP3////+//3/AAD+/wAAAAAAAAAAAAAAAAEAAAACAAEAAwABAAIAAQABAAIAAAADAAAAAAABAP3/AQD9/wAAAAAAAAAAAgD+/wIA/f8CAP7/AQD//wEA/v8DAP3/AwD+/wAAAAD9/wMA/f8EAP//BAAAAAUA/v8FAPz/BQD9/wQAAAACAAAA//8AAP7////+/////f////z/AAD8/wAA/f8AAP//AAAAAAAAAgAAAAIAAgABAAIAAAAAAAAAAAD//wAA/f8AAPz/AAD+/wAA//8AAAAAAgAAAAMAAAABAAEA//8DAP//AQABAAAAAQAAAAAAAQD//wEA/v8AAP7/AAD+/wAA/v8CAP7/AgD//wEAAAAAAAAA//8BAP3/AQD9/wEA//8CAP//AgAAAAAAAwAAAAUAAAAFAP//AwD//wIA//8BAP////////3/AAD8/wEA/P8CAPz/AwD8/wEA/f8AAP//AAAAAAAAAAAAAAEA/f8DAP3/AQAAAAAAAQD//wEA////////AAAAAAIAAAADAAEAAQADAAAABAABAAQAAgADAAAAAAD//wAA/v8CAP//AQAAAP////////7/AAD+/wAA//8AAAAA//8AAP7/AAAAAAAAAAABAP//AQD9/wAA/f8AAP7/AAAAAP//AAD+/wAA//8AAAAAAQAAAAIA/v8CAP3/AQAAAAAAAgD+/wAA/v/+/////////wIA/v8EAP//BAAAAAEAAAAAAAEAAQACAAEAAgAAAAIA/v8CAP7/AAD//wAAAAAAAAAAAAACAAAAAwAAAAQA//8DAP//AgABAAAAAQAAAAAA//8AAP7/AQD+/wIA/f8CAP3/AAD9/wAA/f8AAP7/AAD//wAA//8AAP////8AAP7/AgD//wIA//8CAP3/AQD9/wIAAAADAAEAAQABAP7/AAD//wAAAQAAAAEAAAD//wAA/v8AAP//AAABAAAAAwD+/wEA/f8AAP//AQAAAAIA//8CAP//AAAAAP//AwD+/wQA//8CAP//AQD+/wIA/f8DAP7/AAD///////8AAP//AQAAAAAAAAD+/wEA/f8BAP//AQABAAEAAAAAAP//AAD//wAAAAAAAAAA//8AAP7//v/+//7/AAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAABQD//wMA//8BAAAAAgAAAAQAAAADAAEAAAACAP3/AwD9/wIAAAABAAAAAgD//wMA/v8BAP////8AAP7/AAD//wAA/v8AAP//AAD//wAAAAD//wEAAAACAAEAAAAAAAAA/v8AAP7/AAD//wAA//8AAP7////+////AAAAAAEAAAAAAAAAAAAAAAEAAAACAAAAAAAAAP////////7/AAAAAAEAAAAAAAAA////////AAABAAAAAwAAAAMAAQABAAEAAAAAAAEAAAADAAAABAAAAAAAAQD+/wAAAAD//wEAAAAAAAEA/f8BAP3/AAD+/wAA//8BAP7/AgD//wIAAAABAAEAAAAAAAAAAAD//wEA/v8AAP7/AAD9//7//v/9/wAAAAAAAAEAAAAAAAAAAAABAAAAAgABAAIAAQABAAAAAAAAAAAAAgAAAAIA/////////v/+/wEA/v8CAP//AAAAAPz/AQD9/wAAAQABAAIAAgAAAAIA/v8AAAAAAAADAAAAAwAAAAEAAAABAAAAAQD//wAAAAAAAAAAAAABAAAAAQD//wEA/P8AAP3/AAAAAAEA//8BAPz/AAD7/wEA/v8CAAAAAgABAAAAAgAAAAIA//8CAAAAAgD//wIA/v8BAP//AAD//////////wAAAAAAAAAAAAAAAAAAAgAAAAQAAAADAAEAAQAAAAMA/f8FAP//AwABAP7/AQD7/wAA/P8AAAAAAAAAAAEA/f8AAPz/AAD+/wAAAAABAAAAAgD//wIA/v8CAAAAAQABAAAAAQAAAAEAAAACAAAAAQD+/wAA/v8AAP//AAAAAAAAAAD+/wAA+v8AAPr/AAD+/wAA//8AAP7//v////7/AQD+/wQAAAAFAAAABAAAAAMA//8EAAAAAgABAAAAAAD//wAAAAAAAAAAAAD//wAA/v8CAAAAAgADAAIAAwADAAEAAwAAAAMAAAACAAEAAAABAP//AAAAAP7/AAD+//7//v/9//////8AAAEA//8CAP3/AAD8//7//f//////AAAAAP//AAD9/wAA/f8AAP7/AQD//wMAAAACAAAAAAABAAAAAAABAAAAAQABAAAAAQAAAAAAAAAAAAAAAAABAAIAAgABAAIAAAACAAEAAgACAAEAAgAAAAAAAQD//wEA/v8AAP///v8AAPz/AAD9////////////AAD8/wMA+/8DAP3/AQAAAAAAAAAAAAAA//8AAP3/AAD8/wAA/f8BAP7/AAAAAAAAAAAAAAEAAAACAAAAAwABAAMAAgACAAMAAQACAAAAAgAAAAMAAAAEAAAAAgAAAAAA////////AAAAAAAAAQAAAAAAAAD//wAA/v8AAP//AAAAAAAAAAAAAAAAAAD///7/AAD8/wAA/f8BAAAAAAAAAP//AAD//wAAAAAAAAEAAgAAAAIAAAAAAAEA/v8DAP3/AwD+/wEA/v8BAAAAAwABAAMAAQAAAAEA//8CAP7/AgD9/wIA/f8AAP3////9//7//v/+/////v8AAP////8AAP//AQD//wEAAAADAAAABQAAAAQAAAACAAEAAAAAAP//AQD//wEAAAABAP//AAD//wAA//8BAAAAAwABAAIAAgAAAAEAAgD//wMA/f8CAP7/AQAAAP//AAD+/wAAAAAAAAAAAAD//wIA/f8EAP7/AQAAAP//AAD+/wAA/v////7////8/wAA+/8AAP7/AAAAAP//AQD+/wIA//8EAP//BAD//wIA//8AAP//AAAAAAAAAQAAAAAAAAAAAP//AAAAAAAAAQABAAIAAwADAAQAAwAEAAEAAwAAAAMAAAAEAAAAAgABAAAAAAAAAP3/AAD9/wAAAAD+/wAA+/8AAPz//f////3/AAD+///////+//7/AAD9/wAA/P8AAP7///8AAP3/AQD9/wEA/v8BAP//AgD//wQAAAAEAAIAAgAEAAIAAwABAAMAAAAEAAAABQABAAQAAgACAAEAAAAAAAAAAAAAAAEA/v8CAP7/AQD//wAA//8AAP7////+//7//v/+//7//v/+//3//v/7/wAA+/8CAP3/AgAAAAAAAQAAAAAAAAD//wEAAAAAAAIA/v8CAP7/AAAAAP7/AgD//wEAAAAAAAIAAAABAAAAAAACAAAAAgACAAEABAAAAAQAAAACAP//AAD+/////v8AAP3/AAD9/wAA/v8AAAAA//8AAP//AQAAAAEAAAABAAAAAgD//wMA/f8CAP7/AAD//wAAAAAAAAAAAAAAAP7/AQD+/wEAAAACAAEAAgABAAEAAAABAAAAAAABAP7/AgD+/wEAAAAAAAAAAAAAAAEAAAACAAIAAQAGAAAABAD+///////9/wAA/v///////f/+//z//P////3/AAD/////AAD//wIAAAADAAEAAgACAAAAAQD//wAAAAD//wEA//8AAP////////7/AAAAAAEAAgACAAMAAwABAAQAAAAEAAAABAAAAAIAAAABAAAAAAAAAAAAAAD+/wAA/P8AAPz/AQD8/wIA+/8BAPz/AAD/////AAD+/wEA//8BAP7/AQD9/wEA/P8CAP3/AwD//wEAAQAAAAEAAAAAAAAAAQAAAAEA//8CAP7/AgD//wEAAAAAAAAA/v8AAAAAAAACAAAAAwAAAAIAAgABAAQAAQADAAMAAAAEAAAAAwAAAAAAAAD///7////8/wAA/f8AAP7///8AAP3/AgD+/wQA//8EAP//BAD8/wQA/P8CAP3/AAD9//7//f/9/////f8BAP3/AAD8/////f///wAAAQAAAAMAAAACAAAAAQAAAAEAAQABAAAAAgAAAAMAAAADAAIAAgAEAAAAAwAAAAIAAwACAAQAAQABAAAA//8AAP7///////3/AAD8/wAA/v/+/wAA+/8AAP3/AAAAAAAAAAACAP7/AgD9/wAA/v8AAAAA//8BAP3/AAD8/////v8AAAAAAAAAAAAAAQABAAQAAgAEAAEAAwAAAAMAAAACAAEAAQACAP//AAD/////////////AAD9/wEA/P8BAP7/AQD+/wEA/v8AAP7/AAD//wAAAAAAAAAAAAAAAP//AgD+/wQA//8EAAAABAABAAQAAAAEAAAAAgD//wAAAAD9/wIA/f8BAP7//v////3/AAD/////AAD//wAAAAD9/wIA/v8DAAAAAQACAAAAAQAAAAEAAQABAAAAAAD+/wAA/v8BAP//AQD+/wAA//8AAAAAAAABAAAAAQABAAAAAQAAAAAAAQAAAAIA//8AAP//AAAAAAEAAAABAAAAAAAAAAAAAAD//wAA/v8AAPz/AwD8/wQA/v8CAAAAAAAAAAAAAAACAAIAAQADAP7/BQD8/wUA//8DAAIAAAACAAAAAAAAAP////8AAPz/AAD7/wAA/f/+/////v8AAP7/AAD9/wAA/v8BAP//AQAAAAAA//8AAAAAAQAAAAAAAQAAAAIAAAABAAAAAAAAAAAAAAABAAAAAgAAAAIAAAAAAAAAAAABAAEAAgACAAIAAQAAAAAAAAAAAAEAAQABAAAAAAD+/wAA/////wEA/v8AAP7//f////3/AAAAAP//AwD//wEAAAAAAAIA//8DAAAAAQAAAAEA//8DAP3/BQD9/wIA//8AAAAA//8AAP//AAD+/wAA/f8AAP3/AAD9/wAA/v8AAP//AAAAAAAAAQAAAAEAAQACAAMAAAADAP//AwD//wMAAAACAAAAAgD//wEA//8AAAAA//8BAP//AQD//wEA//8BAP//AgAAAAEAAQAAAAAAAAD//wAA/////wAA/v8AAP///f8AAPz/AQD9/wAAAAAAAAAAAAAAAAAAAAAAAAEA/v8DAP3/AwAAAAEAAgAAAAIAAAACAAAAAwAAAAMAAAADAAAAAgAAAAAAAAD9/wAA/P8AAPz/AQD9/wAA/f////3//////wAAAAAAAAEA//8BAP//AgAAAAMAAQACAAEAAAAAAAAAAAAAAAIAAAABAAAA//8AAP7/AQD//wEAAAAAAAAAAgD//wMA//8CAAAAAAABAP7/AQD//wAAAAAAAAAAAAD+/////v///////v8AAP7/AAD/////AQD+/wIA/v8BAP7/AQD9/wEA/P8CAP7/AQAAAAAAAgD//wIAAAAEAAAABgAAAAcAAAAEAAAAAQAAAAAA/////////v////v////8//7//////wAAAAACAAEAAwABAAQAAQAEAAIAAgADAAAAAgD+/wAA/P////r/AAD6/wAA/f///wAA/v8BAAAAAQABAAAAAgAAAAAAAQD//wEA//8AAP///v////7///8AAP//AwAAAAMAAAABAP//AQAAAAMAAQACAAAA//////3/AAD+/wEA//8AAP//AQD//wEAAAADAAIAAwACAAAAAgAAAAEAAAACAAAAAAD//////v/+//7//v8AAPz/AAD8/wAA/v8BAAAAAAABAAAAAAAAAAAAAAACAAAAAwD//wIA//8AAP////8AAP//AAAAAP//AQD//wEAAAAAAAAAAAAAAAEAAAACAAAAAAACAP//AgD//wEAAAABAAAAAQAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAD//wAA//8AAP7/AQD8/wAA/P8AAP3/AQD//wEAAAAAAAEAAAACAP//BAD+/wQA/v8DAP3/AQD8/wAA/f8AAP7////+//////8AAAAAAQABAAAAAgD//wEA//8AAAEAAQABAAEA//8AAP7/AAAAAAAAAQABAAAAAAD+/wAA/v8AAAAAAAABAAAAAAAAAP//AAD//wEAAAAAAP//AAAAAAAAAAABAAEAAQACAAEAAwABAAMAAQACAAAAAQAAAAAA//8AAP//AAAAAP//AQAAAAAAAAAAAAEAAAAAAAAAAAD//wAA//8AAP//AAD+/////v////////8AAP7/AAD///7/AAD9/wIA//8AAAAA//8AAAAAAAAAAAEAAAACAP3/AgD8/wEA//8BAAAAAQAAAAEAAAAAAAEAAQAEAAEABQABAAIAAAAAAAAAAAAAAAAAAQD//wEA/v8AAP7///////////8AAP//AAAAAAAAAgAAAAMAAAAAAAAA//8AAAAAAAAAAAAA//////3//v///wAAAAABAAAAAQD//wAA//8AAAEAAAACAAAAAAAAAP////8AAP7/AgD+/wIAAAAAAAAAAAAAAAAAAAABAAAAAgAAAAEAAAAAAAEA//8BAP//AQD//wEA//8BAP3/AAD+/wAAAAAAAAEAAAABAP//AAAAAAAA//8BAAAAAQAAAAAAAAAAAAAAAAAAAAAAAQD//wAAAAAAAAEAAAAAAP//AAD//wAAAAAAAAAAAQAAAAEA//8AAP7/AQD//wIAAAABAAEAAAAAAAAAAAAAAAEAAAAEAP7/AwD9/wEA//8AAAEAAAABAAAAAAD//wAA/P8AAPz/AgD+/wAA///+/////f8AAP//AgD//wMA//8CAAAAAQAAAAIAAAADAAAAAQABAAAAAwAAAAMAAAAAAAAA//8AAAAAAAADAP//AgD//wAA//8AAAAAAgAAAAIAAQAAAAAA//8AAP//AAD//wEA/v8BAP3/AAD9//z//f/8//////8AAAAAAAD+/wAA/f8BAP7/AgAAAAIAAgAAAAMA//8DAP//AgAAAAIAAAACAP7/AgAAAAEAAwAAAAQA/v8CAP//AgAAAAEA//8AAP////8AAP7/AAD+/wAA/v8AAP7/AQAAAAIAAAABAAEAAAABAAAAAAAAAAAA//8AAP3/AAD9/wAA/f////3/AAD//wAAAAACAAEAAgAAAAEAAAACAAEAAgAEAAAABAD//wAA/v/+////AAD//wIA//8BAP////8AAP7/AQAAAAIAAwAAAAIAAAAAAAAAAAAAAAAA//8AAP7/AAAAAAEAAAABAAAAAAAAAAAAAQAAAAEA//8AAP7/AAD9/////P8AAP3////+//7//v/+/wAA//8AAAAAAQABAAIAAAACAAAAAgD//wIAAAACAAIAAAAAAP///////wAAAAACAAAAAgAAAAEA//8CAAAAAgABAAAAAwD+/wIA/v8AAP//AAAAAAAAAAACAP//AQAAAP7/AAD8/wAA/v8AAAAAAAAAAAAAAAAAAP////8AAP//AAAAAAEAAAABAAEAAgABAAIAAQACAAIAAgADAAIAAQACAAAAAAABAP//AAD+/////v/9//7//v/9/wAA/f8AAP//AAAAAP///v/+////AAACAAAABAAAAAEA/v8AAAAAAAAAAAEAAAAAAAAA/P8AAPr/AgD9/wMAAAACAAAAAAAAAAAAAQAAAAMA/v8GAPz/BgD9/wUA//8DAAAAAQAAAAAAAAABAAEAAAACAP7/AgD8/wAA/v8AAAAAAAAAAAAAAAD////////+/wAA//8CAAAAAgABAAEAAQACAAEAAgABAAIAAQAAAAEA/v////3//f/+//3//f/9//3/+//9//v////+/wAAAAACAAIAAgACAAEAAgAAAAQAAAAGAAAABQD//wIAAAAAAAEA//8BAP//AAD//wEA/v8EAP7/BAAAAAEAAgAAAAIA//8BAP//AQD//wEA/f8BAPz/AAD+/wAA//8AAAAA/v8AAP3/AAD+/wAAAAAAAP//AAD8/////P8AAP//AAAAAAAA//8AAP7/AgAAAAYABAAFAAQAAQADAAAABAACAAUAAQAEAP7/AAD7////+//+//7///8AAP/////9/////v8BAAAAAgABAAEAAwAAAAMAAAACAP//AQD9/wEA/f8BAP7/AAAAAP7/AQD9/wIA/f8BAP3/AgD+/wIAAAADAAAAAQD//wAAAAD+/wEA/v8CAP//AAAAAAAAAAAAAAAAAgABAAEAAQAAAAAA//8AAAAAAQAAAAAAAAD//wAA//8AAAAAAAAAAAAAAQAAAAEAAAACAAAAAgABAAIAAgAAAAEA/v8AAP7/AAD+/wEA/P8BAPz////+//3////+/wAAAAABAAAAAQD//wEA//8CAAEAAgACAAAAAgAAAAIAAgADAAIAAQABAAAAAAD//wEAAAACAAAAAgD+/wAA/f/+////AAAAAAAAAAD///7//////wAAAgAAAAMA/v8BAP7/AAAAAAAAAAABAP7/AAD8/wAA/f/+/wAA//8BAAAAAQAAAAEAAAABAAAAAgACAAMAAgACAAEAAAAAAAAAAQABAAIAAQABAAAAAAAAAAAAAAAAAAEAAAAAAAAA/////wAA/v8AAP3/AAD8//7//v/+/wAAAAABAAAAAAAAAAAA//8BAAAAAgABAAIAAQABAAAAAAD//////v//////AAAAAP//AAD+/wAA/v8AAAAAAAAAAAEAAQACAAAAAgABAAIAAwABAAMAAAABAAAAAAAAAAAAAAAAAAAAAAAAAP//AAAAAAIAAQACAAEAAAAAAAAAAAABAAEAAQADAP//AQD+/////v8AAAAAAAD//wAA/v////////8AAP7/AAD+//7////+/////v8AAP///v8AAP3/AAD+/wAAAAACAAIABAADAAQAAgAEAAAAAwABAAEAAwAAAAMAAAABAP/////+/////v8AAP7/AAD///7/AQD+/wIAAAAAAAAA//8AAP//AAD//wAA/v8AAPz/AAD9/wAA/v8AAP//AAAAAAAAAAAAAAEAAAACAAAAAwABAAIAAQABAAAAAAAAAAEAAAACAAAAAgAAAAEAAAAAAAAAAQAAAAEAAAAAAP////8AAP7/AAD//wAA/v////3//v/9//////8AAAAAAAAAAP7/AAD+/wAAAAAAAAIAAAABAAAAAAAAAAAAAAABAP//AAD/////AAAAAAMAAAACAAAAAQAAAAAAAAACAAAAAgAAAAEAAAAAAAAAAAAAAAAAAAAAAAAA//8AAP//AAD//wAA//8AAP//AAAAAAEAAAAAAAEAAAABAAAAAQABAAAAAQAAAAAAAAAAAP//AAD//wAA/v8AAP7/AAD9/wAA/f8AAP///v8AAP7/AAAAAAAAAQABAAEAAwAAAAIAAAAAAAIAAAADAAAAAgABAAAAAQAAAAAAAAAAAAAAAQAAAAEAAAAAAAAAAAAAAAAAAAAAAP//AAAAAAAAAAD//wAA/v/+//7//v///wAAAAAAAAAA//////////8AAAAAAQAAAAAA/v/+//7//////wAAAAAAAAAA//8BAAAABAABAAUAAAAEAAAAAwAAAAMAAwACAAMA//8AAP3////+/wAAAAABAAAAAAD/////AAD//wIAAAACAAAAAAAAAP//AAD//wEA/v8AAP3/AAD9/wAA/v8CAP//AQAAAAAAAAAAAAEAAQACAAEAAwAAAAIAAAAAAAAAAAAAAAAA/v8AAP7/AAD//wAA//8BAP7/AgD+/wIAAAABAAAAAAAAAAAAAAAAAAAA/v8AAP3/AAD9/wEA//8AAP//AAD+/wAAAAAAAAIAAAABAAAAAAACAAAAAQABAAAAAQAAAAAAAAD+/wEA//8AAAAA//8BAP//AQAAAAIAAAACAP//AAD//wAAAAAAAAAAAAAAAP7/AAD+/wAAAAAAAAAA/v8BAP3/AgAAAAMAAQADAAAAAQD//wAAAAAAAAEAAAABAP3/AAD7/wAA/f8AAP//AAD+/////v///wAAAAABAAAAAQD//wAA//8AAAAAAQACAAEAAgAAAAIA//8BAAAAAQACAAIAAgABAAIAAAACAAAAAgAAAAIAAAABAAAAAAAAAP//AAD///7//////wAAAAAAAAAAAAAAAAEA//8BAP3/AAD+////AAAAAAEA//8AAPz/AAD7/wAA/v8AAP//AAD+/wAA/v8AAAAAAAAEAAAAAwAAAAAAAgAAAAIAAwABAAMAAAAAAAEA//8CAAAAAgAAAAAA//8AAP7/AAAAAAAAAAD//wAAAAD//wAAAAD//wAA//8AAAAAAAABAAAAAQAAAAAAAAAAAAEAAAABAAAAAQAAAAAAAAD//wAAAAD///////////////8AAAAAAQAAAAAAAAD//wEAAAACAAEAAQAAAAAA//8AAP//AQAAAAIAAQAAAAEA/f8AAP3/AAD//wAAAAABAAAAAQD//wAAAAAAAAEA//8CAP//AwAAAAEAAAAAAAAAAgAAAAIAAAAAAAAA//8AAP//AQAAAAAA//////3//v/+//7/AAAAAAAAAAD//wEAAAABAAIAAQACAAEAAAACAAAAAgABAAEAAwAAAAEA/v8AAP7/AQD//wEA/////////v8AAAAAAAABAAAAAAADAP//AwD//wEAAAAAAAEAAAAAAAAA//8AAP7//v/+//3/////////AAD+/wEA/f8CAP//AQAAAAEAAQABAAAAAQABAAEABAAAAAQA//8CAP7/AgD//wIAAAABAAAAAAAAAAAAAAAAAAAAAAAAAP/////+///////+/wAA/v8AAP7/////////AAAAAAEAAAABAAAAAQAAAAIAAAACAP//AQD//wAAAAD//wAA/f8AAP7/AAAAAAEAAQAAAAAAAAAAAAEAAAADAAIAAgAEAAAAAgD//wAAAQD+/wMA//8AAAAA/f8AAP7///8AAP//AQAAAAAAAgD//wIA//8BAAAAAAAAAAAAAQD//wIA//8BAAAAAAACAAAAAAABAP7/AQD//wAAAQD+/wAA/f/+//3//f///////////////v/+//7//v8AAAAAAAABAAAAAAAAAAAAAgACAAUAAwAEAAAAAgAAAAAAAAAAAAEAAAAAAP//AAD9/wEA/f8DAP7/AgAAAP//AAD//wAAAQAAAAQAAAACAAAAAAAAAP//AAD//wAA////////AAD+/wAA/f8AAPz/AAD9/wAA/v8AAAAAAQAAAAEAAAABAAAAAAABAAAAAwD//wQAAAADAAEAAQAAAAAAAAAAAP//AAD//wAAAAD+/wAA/v8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAgAAAAEAAAAAAAEAAAAAAAMA//8CAP////8AAP//AgABAAAAAgD+/wAA/v/+/wAA/v8BAAAAAQAAAAAA/////wAAAQABAAMAAAADAP//AgD//wEAAAAAAAAA///+//7//f/+/wAA/v8BAPz/AQD9/wAAAAAAAAMAAgADAAMAAAABAAAAAAABAAAAAgAAAAAAAAD+/wAA/v8AAP7/AAD+/wAA//8AAAAAAAABAAEAAQABAAEAAAAAAAAAAAAAAAAAAAAAAAEA//8AAP//AAAAAAAAAgAAAAMAAAACAAAAAAAAAAAA//8BAP//AAAAAP7////8//7//f//////AAAAAAAAAAD//wAA//8AAAAAAAABAAEAAAAAAP7/AAD/////AAD9/wAA/v///wAA//8BAAAAAQACAAEAAgACAAEAAwABAAQAAwACAAQAAAACAAAAAAD//wAAAAAAAP///v/+//7/AAD//wEAAAABAP//AAD//wAAAAABAAEAAAABAP//AAD8/wAA/f8BAAAAAAD//wAA//8AAAAAAAADAAAAAgAAAAAA/v8AAP//AAAAAP//AAD/////AAAAAAAAAAAAAAAA//8BAAAAAAACAAAAAgABAAAAAQD//wEA//8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAACAAAAAAAAAP//AQAAAAEAAAABAAAAAAD//wAA//8AAAAAAAAAAP3/AAD8/wAA/f8AAP7/AQD//wAA//8AAP//AAAAAAEAAQABAAEAAAAAAAAAAAAAAAEAAAACAAAAAAABAP//AAD///7/AAD//wEAAAAAAAAA//8AAP//AAABAAAAAQAAAAAAAAAAAAAAAQD//wEA//8BAP7/AQAAAAIAAQACAAEAAAAAAAAAAAAAAAMAAQAEAAAAAQD//wAAAAABAAEAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAP/////+/////v8AAP7/AAD////////+//////8AAP//AAD//wAAAAAAAAEAAAABAAAAAAACAAAAAgABAAEAAAAAAAAAAQD//wIA/v8AAAAAAAABAAAAAAAAAAAAAAABAAAAAwAAAAQAAAADAP//AAD/////AAAAAAAAAAAAAP/////9/////v8AAAAAAAABAAAAAQAAAAIAAAACAAAAAQAAAAAAAAAAAAAA//8AAP7/AAD+/wAA//8AAP///////wAA/v8CAP//AgABAAAAAAD///7/AAD+/wEAAAAAAAEA//8AAP//AAAAAAIAAQADAAAABAAAAAQAAgACAAIAAAACAP//AgD//wEA//8AAP7////8/////f8AAAAAAAABAP7/AAD+/wAAAAABAAEAAgAAAAEAAAD//wAA/f8AAP7/AAD//////////wAA//8AAP//AgAAAAMAAAADAAEAAgABAAIAAQABAAEAAAAAAAAAAAAAAAAA//8AAP//AQD//wAAAAAAAAAAAQAAAAEA/v8AAP7/AAD/////AAD///7/AAD9/wAAAAD//wQA/v8EAAAAAQABAAAAAwADAAIABAACAAEAAQD9/wEA/P8AAP7/AAD////////9/wAA/P8AAP7/AAAAAAEAAAACAAAAAQAAAAAAAAAAAAEAAAAAAAAA/////////v8AAP//AAAAAP//AAD//wAAAAAAAAAAAQABAAEAAQABAAAAAAAAAAAAAAAAAAAAAQAAAAEAAAAAAAAA//8AAP7/AQD//wEAAAAAAP/////9/wAA/v8AAAAA//8DAP7/AwD+/wEAAAABAAEAAgABAAMAAQABAAEA//8CAP//AwAAAAMAAAABAP7////9//7//////wAA//8AAP///v////7///8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAABAAAAAAAAAAAA//8AAP//AAAAAP//AwAAAAIAAAAAAAAAAQAAAAQAAAAFAAAAAgABAAAAAQAAAAAAAQAAAAAAAAD9/wAA/P8AAPz/AAD+////AAD+/wAA//8AAAAAAAABAAEAAAADAAAAAgD//wAAAAD//wEAAAABAAAAAAD//wAA/f8BAP//AgAAAAIAAAAAAAAA//8AAP7/AAD//wEA//8BAP//AAD+/wAA/f8BAP//AgAAAAIAAQABAAEAAQABAAAAAQAAAAEAAAABAAAAAQAAAAAA/v8AAP7/AAAAAAEAAQABAAAAAgD+/wIA//8BAAAAAAABAAAA//////3///////7/AAD9/wAA/v/+/////////wAAAAABAAAAAQAAAAAAAAAAAAAAAgABAAIAAQABAAAAAQD//wEAAAAAAAEAAAACAAAAAQD//wAA//8AAP//AgD//wIAAAAAAAAA//8AAP7/AAD+/wAA//8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAA//8AAP7/AgD//wMA//8AAAAA/v8AAP//AAABAAEAAAACAP//AwD+/wIAAAABAAEAAAABAP7/AAD+//////8AAP//AAD//wAA/v8AAP////8AAP//AQAAAAEAAAAAAAAAAAAAAAAAAQAAAAEAAAAAAAAAAAAAAAAAAAD//wEA//8BAAAAAAAAAAAAAAAAAAAA//8BAP//AQD//wEA//8AAP//AAD//wAAAAABAAEAAAACAAAAAAAAAAAAAQAAAAMAAQAAAAEA//8AAAAA//8BAP//AAAAAP//AAD+/wEA/f8BAP7/AQD//wEA//8BAP//AQD+/wEA/v8AAAAA//8BAP3/AQD+/wAAAAABAAAAAQD//wEA//8BAAAAAQAAAAAAAAAAAAAAAAAAAAIAAAACAAEAAQABAAAAAgABAAIAAQACAAAAAQD+/wEA//8BAP//AAD+/////f/9/////P8BAP7/AQD//wAA/v////7/AAD//wAAAAAAAAEA/v8BAP3/AAD+/wAAAAAAAAIAAAADAAAAAgAAAAEA//8CAP//AgAAAAEAAAAAAAAA//8BAP//AAAAAAAAAAAAAAAAAQABAAEAAAAAAAAA//8CAAAAAwABAAAAAAD//wAA//8AAP//AQD+/wEA/f8AAP7/AAAAAAEAAAAAAAAA//////7/AAAAAAAAAQD//wAA//8AAAAAAAABAAAAAQABAAEAAAABAP7/AQD+/wEA//8CAP//AQAAAP//AAD+/wAA//8BAAAAAQAAAAIA//8CAP//AQAAAAEAAQABAAAAAAAAAAAAAAAAAP/////9/////v///wAAAAAAAAAA//////7///8BAP//BAAAAAIAAAAAAP//AQAAAAIA//8AAAAAAAAAAAAAAAAAAAAA//8BAP7/AgD+/wEAAAABAAAAAgAAAAIAAAABAAAAAAD///7/AAD//wEAAQAAAAAA//8AAAAAAAABAAAAAQAAAAAAAAD/////AAD//wAAAAAAAP//AAD//wAAAAAAAAAAAAAAAAEAAAADAAEAAwADAAEAAgAAAAAAAgD//wMAAQABAAIAAAAAAP///v////////8AAP//AAD+/wAA/v8AAP7/AQAAAAEAAQD//wEA/v8AAAAAAQAAAAEA//8AAP////8AAP7/AQD+/wEA//8BAP3/AQD8/wEA//8BAAEAAQAAAAEAAAAAAAEA//8DAP7/BAD+/wMAAAABAAAAAQAAAAEA//8AAAAAAAAAAAAAAAAAAAAA/v/+//////8AAAEAAAABAP//AAD+/wAAAAAAAAAAAAABAAEAAQAAAAAA//8AAP7/AAD//wEAAAAAAAAA/v////3////+/wAA//8BAP//AQD//wAAAAAAAAEAAAABAAAAAQAAAAIAAAADAAAAAwABAAEAAQD//wAA//8BAP7/AgD//wEAAAAAAP//AAD//wAAAAAAAAEA//8CAP//AQAAAAAAAAAAAP7/AQD+/wIAAAAAAAAAAAD//wAA/P8BAP7/AAAAAAAAAAAAAAAA/v8AAP7/AgD//wQAAAADAP7/AQD9/wAA//8BAAIAAAADAAAAAgAAAAEAAAABAAAAAQAAAAAAAAD//wEA//8BAAAAAAD//wAA/v8AAAAAAAAAAP//AQD+/wEA//8AAAAAAAABAAAAAAAAAAAAAQABAAAAAQD//wAAAAD+/wEA/v8CAP//AQAAAAAAAAAAAP7/AAD//wEAAAAAAAEAAAAAAP/////+/wAAAAAAAAEAAQAAAAAA//8AAP//AAD//wEAAAACAP//AgD+/wEA/f8AAP//AAAAAAAAAAABAAAAAAABAP//AgD//wIAAAACAAAAAgAAAAAA//8AAP7/AAD+/wAA//8AAP///////wAA//8CAAAAAQABAAEAAgABAAIAAQABAAEAAQAAAAIA//8CAP//AAAAAP////8BAP//AgAAAAAA//8AAP//AAAAAAIAAQAAAP/////9//3//v/+/wAA/v8BAPz/AAD9/wAAAAAAAAAAAQAAAAEAAgAAAAMA//8BAAAAAAD//wAA//8BAAAAAQAAAAAAAAD+/wIA//8EAAEABAACAAMAAQABAAAAAAAAAAAAAAD//wEA/v8AAP7//v////3/////////AAAAAP//AQD+/wEA//8AAAAA//8AAP///////wAAAAABAAAAAQABAAAAAAAAAP//AAAAAAAAAgABAAEAAgAAAAIA//8BAP//AAAAAAAAAAAAAAAAAAAAAP3/AAD+/wAAAAABAAAAAQAAAAAAAAD//wEA//8AAAAAAAD//wAA/v8AAP///v8AAP7/AAAAAAEAAQACAAAAAgD9/wIA/v8BAAEAAgACAAIAAAAAAP////8AAAAAAQAAAAAAAAAAAP//AAD//wEAAAAAAP//AAD+/wEA/v8BAAAAAAAAAAAA//8AAP//AQAAAAAAAAAAAAAAAQAAAAIAAAAAAAAA//8AAP//AgAAAAIA//8AAP7/AAD+/wAA//8BAP//AQD+/wAAAAAAAAAAAAD//wAAAAAAAAEAAAABAAEAAAAAAP7/AAD//wAAAQAAAAIAAAAAAAAAAAD//wEAAAACAAAAAgD//wAA//8AAAAAAAAAAAAAAAABAAAAAAAAAP//AAD+/wAA//8AAAAAAAD//wAA//8AAAAAAAAAAAEAAAACAAAAAAAAAAAAAAABAAAAAQAAAAAAAQAAAAEAAAABAAAAAAAAAAAAAAABAAAAAAAAAP7/AAD//wAAAAAAAAAAAAD///7/AAD+/wEAAAABAAEAAAAAAAAAAAAAAAAAAAABAAAAAAD//wAA//8AAP//AAAAAAAAAAAAAAEAAAAAAAEAAAABAP//AQAAAAAAAAAAAAAA/v8AAP7/AAAAAAIAAAACAP//AgD//wEAAAAAAAEAAAABAP//AAAAAAAAAAAAAP//AAD//wAAAAAAAAIAAAACAAAAAAAAAAAAAQABAAEAAAABAP7/AAD8/wAA/v8AAP7/AAD9/////f/+//7///8AAP//AAAAAAAAAAAAAP//AAD//wEAAAACAAEAAgABAAAAAAAAAAAAAAAAAAEAAQAAAAAAAAD//wEAAAACAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAP7/AAD+/wEA/v8CAP//AQD//wAA//8AAAAAAAAAAAEAAQABAAIAAAACAAAAAgAAAAEAAAAAAAAAAAAAAAAA//8AAP7//////wAAAAAAAAAAAAD//wAA//8AAAAAAAAAAAAA//8AAP7/AAD//wAAAAAAAAAAAAAAAAAAAQAAAAIA//8DAP//AgAAAAEAAAAAAAAAAAD//wAAAAD//wEA/v8BAP7/AAD//wAAAAABAAAAAQAAAAAAAAAAAAEA//8BAAAAAQAAAAEA//8AAP//AAAAAAAAAAABAAAAAgAAAAAAAAD+/wAA/v8BAAAAAQAAAAAA/v8AAP3/AAD//wAAAAD//wAA//8AAP//AQD//wEA//8AAP//AAAAAAAAAAD//wAA/v8AAP//AQAAAAIAAAACAAAAAQAAAAAAAQAAAAMAAAADAAAAAgD//wEA//8AAP//AAD/////AAD//wAA//8AAP//AAAAAAEAAAACAAAAAQD//wAAAAAAAAEA//8BAP///////wAA//8CAP//AwAAAAEAAAAAAAAAAAAAAAEAAAABAAEAAAABAP7/AQD+/wEA/f8BAP3/AQD+/wEA//8AAP7/AAAAAAAAAQD//wEA//8AAP//AAD9/wAA/f8AAP7/AAAAAAAAAQAAAAAAAQABAAEAAwABAAMAAgABAAIAAAABAP//AQD+/wEA/v8BAP7/AAD+//7//v////7/AAD/////AAD9/wIA/f8CAP//AQAAAAEAAAABAP//AQD//wAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAgAAAAIAAAABAAAAAAAAAAAAAAABAAAAAAABAP//AQD//wAA//8AAP//AAAAAAAAAAAAAAAA/v////3/AAD9/wEA/v8CAP3/AAD+/wAAAAAAAAEAAQADAAAABAD+/wQAAAADAAEAAQACAAEAAAAAAAAAAAABAP7/AQD9/wEA//8AAAAA//8AAP//AAD+/wAA/v8AAP7/AAD9/wEA/f8AAAAAAAABAP//AQAAAAAAAAAAAAAAAgAAAAIAAAAAAAAA//8AAAAA//8BAP7/AgD//wIAAAACAAAAAQAAAAEAAQABAAIAAAABAAAAAAD//wAA//////////8AAP7/AAD+/////v8AAP7/AAD//wAAAAAAAAEAAAACAP//AgAAAAEAAAACAAAAAgD//wAA/////wAA//8BAAAAAQAAAAAAAQAAAAAAAAD+/wAA/////wEA//8BAAAAAAAAAAAAAAAAAAAAAQAAAAEAAAAAAAAAAAAAAAAAAQAAAAAA//8AAP//AAAAAAEAAAABAAAAAAAAAAAAAAABAAEAAgABAAIAAQAAAAEAAAAAAAAA//8AAP///////////////////////wAA//8BAAAAAQABAAAAAQAAAAAAAQAAAAAAAAD//wIA/v8BAP7/AAAAAAAAAAABAP//AwD//wMAAAAAAAEA//8BAAAAAAAAAAAA/v8AAPz/AAD8/wAA/v8AAAAAAAAAAAAAAQAAAAMAAQABAAAAAAAAAAEAAQAAAAEA//8AAP7/AAD+/wAA/v8AAAAAAQAAAAEAAAABAAIAAAACAAAAAQD//wEA//8BAAAAAAD//wAA/P8AAP3//v8AAP7/AAAAAP//AAD//wAAAAD+/wAA/v8AAAAAAAAAAAAAAAAAAP//AAAAAAAAAgAAAAMAAAABAP//AAAAAAEAAAABAAAAAQAAAAAAAAD//wEA/v8BAP//AQAAAAIA//8CAP//AQAAAAAAAAAAAAAAAAABAP7/AQD+/wEA//8AAAAAAAAAAAAAAAAAAAAA//8BAP7/AgD//wAAAAD//wAAAAD//wEA/v8AAAAA/v8BAP//AAAAAAAAAAACAP//AwD//wIAAAAAAAAA//8AAAAAAAABAAAAAAAAAP//AAD//wEAAAACAAAAAAABAAAAAQABAAAAAgAAAAEAAQAAAAEAAAAAAAAA/v////7//f/+/////v8AAP7/AAD//wAA//8BAP//AgD//wIAAAABAAAAAQAAAAAAAAD//wEA/v8CAP7/AQAAAAAAAAABAAAAAgAAAAEAAQAAAAEAAAABAAAAAAAAAAAAAAD//////////wAAAAAAAAEA//8BAAAAAAAAAP//AQAAAAIAAQABAAAAAAD+/wAA/f8AAP7/AAAAAP//AAAAAAAAAAAAAAAAAQAAAAEAAQABAAAAAQAAAAAAAAAAAAAAAAAAAAAA//8BAP//AQAAAAAAAAAAAAAAAQAAAAEAAQAAAAEA/v8AAP//AAAAAAAAAAAAAAAA//8AAP//AQAAAAEAAAABAP//AAAAAAAAAQAAAAAAAAD+///////+/wEA/f8BAP////8AAP//AAAAAP//AAAAAAAAAgAAAAMAAAABAAAAAAABAAAAAQAAAAEAAAACAAAAAQAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/////////////AAD//wAA//8AAP//AAD//wAA//8AAAAAAAAAAAAAAAD+/wAA/f8AAP//AAAAAAAAAAAAAAAAAAACAAAAAwAAAAMAAQACAAIAAAACAAAAAgAAAAIA//8AAP3/AAD+/wAAAAABAAAAAAAAAAAAAAD//wAAAAAAAAAA//8AAP////8AAAAAAAAAAP7/AAD//wAAAAAAAAEAAAABAP//AQD//wEAAAABAAEAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAP//AAD//wAAAAAAAAAAAQD//wEAAAAAAAAA/v8BAP//AAAAAAAAAAABAP//AQD//wEAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAP//AAD//wAA//8AAAAAAQAAAAAAAAD//wAAAAAAAAAAAQAAAAEAAAABAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAD//wAA//8AAP//AAAAAAAAAAAAAAEA/v8AAP7/AAAAAAAAAAABAP//AQD//wAAAAAAAAAAAAAAAAEA//8AAP//AAAAAAAAAAAAAAAAAAAAAAAAAQAAAAEAAAABAAAAAQAAAAIAAAACAAAAAgAAAAEAAAABAAAAAQABAAEAAgAAAAEAAAAAAP//AAD//wAAAAAAAP//AAD+/wAA/v////7/AAD+/wAA/v8AAP//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAABAAAAAAAAAAAA//8AAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAACAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//8AAAAAAAABAP//AQAAAAAAAAAAAP//AQD//wAAAAAAAAEAAAABAAAAAQAAAAAAAAABAAAAAQAAAAAAAgAAAAAAAAD//wAAAAAAAAAA//8AAP///v8AAP7/AAD/////AAD//wAAAAD//wEAAAABAAIAAAACAAAAAAABAAAAAQAAAAEAAAABAAAAAAAAAAAA//8AAAAAAAABAAAAAgAAAAEAAAAAAAAAAQAAAAEA//8AAP//AAAAAP//AAD//wAA//8AAP7/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//AAAAAP//AQD//wEAAAAAAAAAAAAAAAEAAAABAAEAAAABAP//AgD//wEAAAAAAAAAAAD+/wAA/////wAA/v8BAP//AAAAAAAAAQAAAAEAAAAAAAAAAQAAAAMAAAABAAAA/v8AAP3/AAD//wAAAAABAAAAAQAAAAAAAQAAAAMAAAACAAAAAAAAAAEA//8BAP////////3////+//////////7/AAD+/wAAAAAAAAEA//8BAAAAAQAAAAAAAAABAAAAAAAAAAAAAQAAAAEAAAABAAAAAgAAAAIAAQAAAAAAAAAAAAAAAAAAAAEA//8BAP//AAAAAP//AAAAAAAAAAAAAAAAAAD//wEAAAABAAEAAAACAAAAAAD//wAA//8AAP//AAD//wAA//////////8AAAAAAAAAAAAAAAAAAAAAAAABAAAAAQAAAAEAAAAAAAAAAAAAAAAAAAAAAAIA/v8DAP3/AgD9/wAA//8AAAAAAAAAAAAAAAAAAAAA/v8BAP//AAAAAAAAAQAAAAEAAAABAAAAAgD//wEAAAAAAAIA//8CAP//AAD//wAA/v8BAPz/AgD8/wAA/v//////AAAAAAAAAAAAAAIAAAACAAAAAQAAAAEAAAABAAAAAgABAAEAAQAAAAAAAAAAAAAAAAAAAAAAAAD//wAA//8AAAAAAAAAAAAA//8AAP////8AAP//AAAAAP//AAD//wAAAAAAAAAAAAAAAAIAAAABAAAAAAABAAAAAAAAAAAAAAACAP//AwD//wEAAAAAAAAAAAABAAEAAQABAAIAAAACAP7/AgAAAAEAAAAAAAAAAAAAAAAAAAD///////8AAP7/AQD//wAA/////wAA//8AAAAAAAAAAAEA//8AAP//AAAAAAAAAAABAAAAAAAAAAAAAQAAAAIAAAABAAAAAAAAAAAAAAAAAP////8AAP3/AAD+/wAA//8AAP//AAD+/wAAAAABAAEAAAABAAAAAAAAAAAAAAABAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAgAAAAEAAAAAAAAAAAAAAAEAAAABAAAA//8AAP3/AAD+////////////AAD//wAAAAD//wAAAAAAAAAAAAAAAAAAAAAAAAAA/v8BAP//AgAAAAEAAAAAAAAAAAAAAAAAAQABAAMAAAADAAAAAQAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//AAD//wAA//8AAAAA/////wAA/f8AAP7///8AAP//AgAAAAIAAAABAAAAAQAAAAIAAQACAAEAAQABAAAAAAAAAAAA//8AAP7/AAD+////AAAAAAAAAAAAAAAAAAD//wIA//8CAAAAAAAAAAAAAQAAAAEAAAAAAAAAAAD//wAAAAAAAAAAAAABAAAAAAAAAAAA//8AAAAAAAAAAAEAAAABAAAAAAAAAAAAAAAAAAAAAAAAAP//AAD+/wEA//8AAAAAAAAAAAAA//8BAP7/AQAAAAAAAAAAAAAAAAAAAAAAAAD//wAA/v8BAP//AgAAAAMAAAABAAAAAAAAAAAAAAABAAAAAQAAAP//AAD+/wAA/v8AAAAAAAAAAP//AAD+/wAAAAAAAAAAAQAAAAEAAAABAAAAAAABAP//AQAAAAAAAAAAAAAAAQAAAAAAAAAAAAEAAAACAAEAAQAAAAAA//8AAP7/AQD//wEAAAAAAAAAAAD//wAA//8AAAAA//8AAP7/AAD+/wAA//8AAP//AQAAAAAAAAAAAP//AAD//wAAAAAAAAIAAAACAAAAAAABAAAAAQABAAAAAgAAAAEAAQD//wEA/v8BAP//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//8BAP7/AQD//wAAAAABAP//AQD+/wAA/////wAA/////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAQABAAIAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAEA/v8AAP//AAAAAAAAAAACAP//AQD+/wAAAAAAAAEAAAACAAAAAQAAAAAAAAABAAAAAgAAAAMAAAACAAAAAAAAAAAAAQAAAAAAAAD//wAAAAAAAAAA/v8AAP7//v8AAP7/AAAAAAAAAAD//////////wAAAAAAAAEAAAAAAAAA//8BAAAAAQABAAEAAQAAAAAAAAAAAAAAAAAAAAEAAAABAAAAAAD//wAAAAAAAAEAAAACAAEAAQABAAEAAAAAAAAAAAAAAP//AAD+/wAA/v8AAP7/////////AAAAAAAAAAD//wAAAAAAAAEA//8DAP//AQAAAAAAAQAAAAAAAAAAAAAAAQAAAAIA//8CAAAAAAABAP//AQD//wEA//8BAAAAAQD//wAA/v8AAP7/AAAAAAAAAAD//wAAAAAAAAEAAQAAAAIAAAAAAAAA//8BAAAAAAABAP7/AQD9/wAA//8AAAAAAQAAAAIAAAABAAAAAAACAAEAAgAAAAEAAAABAAAAAAAAAP7/AAD+/wAA/////wAAAAD//wAAAAAAAAEA/v8DAP3/AgD//wAAAAAAAP//AAD//wAA//8AAAAAAAABAAAAAAAAAAAAAAAAAAEAAAAAAAAA/v8AAP7/AAD//wAA/v8AAP3/AAD//wAAAAAAAAEAAAAAAAAAAAAAAAIAAAACAAAAAAAAAAAAAQAAAAEAAAAAAP//AAAAAAAAAQAAAAIAAQABAAEAAAAAAAIA/v8DAP//AAAAAP//AAD+/wAA////////AAD+/wAA//8AAAAAAAAAAP//AAD//wAAAAAAAAEA//8AAP//AAAAAAAAAAAAAP//AQD//wEAAAAAAAEAAAAAAAEA/v8CAP//AAABAAAAAAAAAP//AAD//wAAAAAAAAAAAAABAAAAAQD//wIA//8CAP//AgAAAAIAAAABAAAAAAAAAP//AQD//wAAAAAAAP//AAD//wAAAAAAAAAA//8BAAAAAgAAAAEAAQD//wAA/v8AAP//AAAAAAEAAAACAP7/AgD+/wAAAAD//wEA//8AAAAAAAAAAAEAAAABAP//AAD//wAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAEAAAABAAAAAAAAAAAAAAAAAAAA/v8BAP7/AQD+/wAA//////7/AAD//wAAAAD//wIA/v8CAP7/AQAAAAAAAAABAAAAAQAAAAAAAAD//wEA//8BAP//AQD//wEAAAAAAAIA//8CAAAAAgAAAAEA//8BAP7/AQAAAAAAAQD+/wEA//8AAAAAAAAAAAAA//8CAP//AQAAAAAAAAAAAAAAAQAAAAEA//8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAIAAAABAAAAAAABAAAAAQAAAAAAAAAAAAAAAAD//wAA//8AAP////8AAP7/AQD+/wEA//8AAP//AAD//wEA//8CAP//AAAAAAAAAQD//wAAAAAAAAAAAAAAAAIAAAACAAAAAQAAAAAAAAAAAAAAAQAAAAAAAAAAAP//AAD/////AAD//wAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAQAAAAAAAAD//wAAAAAAAAAAAAAAAAEAAAABAAAAAQAAAAAAAQAAAAEAAAAAAAAAAAD//wAA/v8AAP7///8AAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//wAA//8AAAAA//8AAP//AAAAAAAAAAAAAAAAAAAAAAAAAgAAAAMAAAACAAAAAAAAAAAAAQAAAAIAAAACAAAAAgAAAAEA//8BAAAAAAABAAAAAQD//wAA/f8AAP3/AAD+/wAA//8AAAAAAAAAAAAAAQD//wIA//8CAAAAAQAAAAAAAAAAAAAA//8AAP7/AQD+/wAA//8AAAAA//8AAAAAAAAAAAAAAAABAP//AQAAAAAAAAAAAAEAAAABAAAAAQAAAAAAAAAAAAAAAAABAAAAAQAAAAAAAAAAAAAAAAAAAP//AQD9/wEA/v8BAAAAAAAAAAEAAAAAAAAA//8CAP7/AwD//wIAAAABAAAAAAD//wAAAAD//wAA/v8BAP7/AAD//wAA//8AAP////8AAP//AgAAAAIAAAABAAAAAAAAAAAAAAAAAAEA//8BAP//AAD//wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//8BAP//AAAAAAAAAAAAAAAAAQAAAAAAAAAAAAIAAAACAAAAAQAAAAEA//8BAP//AAAAAP7/AAD//wAA//8AAP//AAD//wAAAAAAAAIAAAACAAAAAQAAAAAAAAAAAP//AAD/////AAD//wEAAAAAAAAA//8AAAAAAAABAAAAAQAAAAAAAAAAAAAAAAD//wEA//8AAP//AAD//wAA//8BAAAAAAAAAAAAAQAAAAEAAAABAAAAAQAAAAAAAAD+/wAA/v8AAP//AAAAAAAAAAAAAAAAAAABAP//AwAAAAIAAAAAAAAAAAAAAAAAAAAAAAAA//8AAP7/AAAAAAAAAAD//wAAAAAAAAAAAQABAAIAAAABAP//AAAAAAAAAQAAAAAAAAAAAP3/AAD+/wAAAAAAAAAAAAAAAAEAAAABAAEAAAABAAEAAAABAP//AQAAAAAAAAAAAP//AAD//wEAAAAAAAEAAAABAAAAAgABAAIAAAABAAAAAAAAAAAAAAAAAP/////+//3////9///////+/wAA/v8AAP//AAAAAAAAAAABAAAAAQAAAAAAAAAAAAAAAAAAAP//AAAAAAAAAAAAAAAAAQAAAAAAAAAAAAEAAQACAAIAAQACAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAP//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP///v/+//7///8AAAAAAAD//wAA//8AAAAAAQAAAAIAAAABAAAAAAAAAAAAAAAAAAAA//8AAP7/AAD//wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//AAD+/wAAAAAAAAAAAAD//wEAAAAAAAEAAAABAAEAAgABAAIAAAABAAAAAAAAAAAAAAAAAAAAAAAAAP//AAD//wAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAP//AAD/////AAAAAAAAAQAAAAAAAAD+/wAA//8AAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAEA//8AAAAAAAAAAAAAAAAAAP//AAD+//////8AAAAAAAAAAAAA//8AAP//AAAAAAEAAgACAAIAAQAAAAAAAQAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//wAAAAAAAAEAAAABAP//AAD//////v8AAP7/AAD/////AAD//wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAP//AAAAAAAAAAAAAAAAAQAAAAIAAAABAAEAAAABAAAAAgAAAAIAAAAAAAAAAAAAAAAA//8AAP////8AAP3/AAD9/wAAAAAAAAEAAAABAAAAAgAAAAIAAQACAAAAAQAAAAAA//8AAP//AAAAAP//AAD+/wAA/v8AAP//AQAAAAEAAAAAAAAAAAAAAAAAAQAAAAIAAAAAAP//////////AAAAAAAAAAAAAAAAAAAAAAEAAAACAAAAAgAAAAAAAAAAAAAAAQAAAAAA//8AAP3/AAD+/wAAAAAAAAEAAAAAAAAA//8AAAAAAAACAAAAAQAAAAAA///+//7////+/////////////////wAAAAAAAAEAAQABAAIAAAACAAAAAgABAAIAAQABAAAAAAAAAAAAAAAAAAAAAAAAAP//AAD//wAA//8BAAAAAQAAAAAAAAAAAP//AAD//wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAQAAAAEAAAABAAAAAAABAAAAAQAAAAAAAAAAAAAAAAAAAAAA//8AAP//AAAAAAAAAQAAAAEAAAAAAAAAAAABAAAAAQAAAP//AAD+////////////AAD9/wAA/f8AAP//AAAAAAEAAAABAAEAAAABAAAAAgAAAAEAAQAAAAAAAAAAAAAA//8AAAAAAAAAAAAAAAAAAP//AAD//wEAAAABAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAQAAAAAAAAAAAAAAAAACAAAAAQAAAAAAAAAAAAAAAAD//wAA//8AAAAA/v8AAP7/AAAAAAAAAAD//wAAAAABAAAAAQAAAAAA//8AAP///////wAAAAAAAAAA//8BAP7/AAD//wEAAAABAAAAAgAAAAEAAAAAAAEAAAACAAAAAgAAAAEA//8AAAAAAAABAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//8BAP//AQD+/wAA/v8AAAAAAAAAAAAAAAAAAAAAAAAAAP//AQD//wEAAAAAAAAA//8AAP//AAAAAAAAAAAAAAAAAAAAAP//AAAAAAEAAAABAAAAAQAAAAAAAAAAAAEAAAACAAAAAgABAAEAAAAAAAAAAAAAAAAAAAAAAAAA//8AAP7/AAD//wAAAAAAAAEAAAAAAAAAAAABAAAAAAABAAAAAAD/////AAAAAP//AAD/////////////AAD//wIAAAABAAAAAAAAAAAAAAABAAAAAAAAAP//AAD+/wAA//8AAAAAAAD//wAAAAAAAAAAAAAAAAEAAAAAAAAA//8AAAAAAAAAAAAAAQD//wAA//8AAAAAAAAAAAEAAQABAAIAAAACAAAAAQAAAAEAAAABAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//8AAAAAAAAAAAAA//8AAP7/AAD//wAAAAD//wEA//8AAAAAAAAAAAEAAAACAP//AQAAAAAAAAAAAAEAAAAAAP//AQD//wEAAAAAAAAAAAAAAAEAAAABAAEAAAABAAAAAAAAAAAAAQAAAAAA//8AAP//AAD//wAAAAAAAAAAAAAAAAAAAAAAAAEAAAACAAAAAAAAAAAAAAAAAAAAAAD//wAA//8AAP//AAD//wEA//8BAAAAAAD//wAA//8AAAAA//8AAP7/AQD9/wEA/f8AAP7/AAD//wAAAAAAAAAAAQACAAEAAwABAAMAAAADAAAAAQACAAAAAQD//wAA/v8AAP//AAD//wAAAAAAAAAAAAAAAAAAAQD//wEAAAAAAAAA//8AAP7///8AAP//AAD/////AAD//wAAAAAAAAEA//8BAAAAAAAAAAAAAAABAAAAAAABAP7/AAD//wAAAAAAAAAAAAABAAEAAQABAAEAAAACAAAAAgAAAAEAAAAAAAAA/v8AAP3/AAD+/wAA/v8AAP7/AAD//wEAAAAAAAIA//8CAAAAAQAAAAIAAAACAAAAAAAAAP//AAD//wAA//8BAP//AQD+/wAA//8AAAEAAAACAAAAAAAAAAAAAAAAAP//AQD//wAAAAAAAAAA//8AAP//AAAAAAAAAAAAAAAA//8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//AAD//wAAAAAAAAAA//8AAAAAAAAAAAAAAAAAAP//AAAAAAAAAAAAAAAA//8AAP//AAAAAAAAAAAAAAEAAQABAAEAAQAAAAEAAAADAAAAAwAAAAIAAQABAAEAAAAAAAAAAAAAAAAA//8AAP7/AAD+/wAA//8AAP//AAD/////////////AAAAAAAAAAD//wAA////////AAAAAAAAAAAAAAAA//8AAP//AAAAAAAAAQAAAAAAAQAAAAIAAAACAAIAAQADAAEAAQACAAAAAQABAAAAAQAAAAAA//8AAP//AAAAAAAAAAAAAAAA//8AAP//AAAAAAEAAAABAP//AAD/////AAD//wEA//8AAP//AAD//wAA//8BAP//AQD//wAA/////wAAAAAAAAAAAAD//wAA/v8AAP7/AAD//wAAAAAAAAEAAAABAAAAAQAAAAIAAAACAAEAAQABAAAAAQAAAAAAAAAAAAAAAQAAAAIA//8BAAAAAAAAAAAAAAAAAAAAAQAAAAIA//8BAP////8AAP//AQAAAAAAAAD//wAA///+/wAA/v8AAAAAAAAAAAAAAAAAAAAAAAABAAAAAAABAAAAAAAAAP//AAAAAAAAAgD//wIA//8AAAAAAAACAAEAAQACAAAAAAAAAP//AAD//wAAAAAAAP//AAD+/////v/+/////v8AAP//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAQAAAAAAAAAAAAAAAAAAAAEAAAABAAAAAAABAP//AQAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAABAP//AAAAAP//AAD+/wAA/v///////////wAA//8AAP//AAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAQAAAAEAAAAAAAAAAQAAAAEAAAABAAEAAQABAAEAAQABAAIAAAACAP//AAAAAAAAAQAAAAAA///+//7///8AAAAAAQAAAAAAAAD//wAA//8AAAAAAAABAAAA//8AAP3/AAD+////AAD+/wAA/v////////8AAAAA//8CAP7/AgD//wEAAAAAAAEAAAABAAAAAAAAAAAAAAACAAAAAgAAAAIAAQABAAIAAAABAAAAAQAAAAAAAAAAAAAA//8AAP7/AAD+/wAA/v8AAP//AQD//wEA//8BAAAAAAAAAP//AQD//wEA//8BAP7/AAD+/wAA/f8AAP3/AAD+/wAAAAD//wAA/v8AAAAAAAAAAAAAAQABAAAAAQAAAAEAAAAAAAEAAAABAAAAAAABAP//AgAAAAEAAQAAAAEAAAAAAAAA//8AAAAAAAAAAAAAAAAAAAAAAQAAAAEAAAAAAP//AAD//wAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAD/////AAD//wAAAAAAAAAAAAAAAP////8AAAAAAAACAAAAAgAAAAAA//8AAP//AQAAAAIAAAABAAAA//8BAP//AQAAAAAAAAAAAAAAAAD//wEA//8AAAAA//8AAP//AAAAAAAAAQD//wAA//8AAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAA//8AAAAAAAABAAAAAQAAAAAAAQAAAAAAAAAAAAAAAQAAAAEA//8BAP//AQD//wEA//8AAP//AAAAAAAAAAAAAAAAAAAAAP//AAD//wAAAAABAAAAAAAAAAAAAAD//wAA//8BAAAAAAAAAAAAAAD//wAAAAAAAAEAAAAAAAEA/v8BAP7/AAAAAAAAAAAAAAAAAAAAAAEAAAABAAAAAAAAAAAAAAAAAAEAAQAAAAEAAAAAAAAAAAABAAAAAQAAAP/////+//////8AAAAAAAAAAAAA//8AAP//AAAAAAEAAQAAAAEAAAAAAAAAAQAAAAIAAAABAP//AAD/////AAAAAAAAAAAAAAAAAAD//wAAAAAAAAAA//8AAAAAAAACAAAAAgAAAAAAAAAAAAAAAAAAAAEAAQABAAAAAAD/////AAD//wAA//8AAAAA//8AAP7/AAD+/wAAAAAAAAAAAAAAAAEAAAABAAEAAAADAAAAAwAAAAMAAAABAAAAAAAAAAAAAAD//wAA//8AAP7////+/wAA//8AAAAAAAAAAAAAAAAAAAAAAAABAAAAAQABAAAAAAD//wAAAAAAAAAAAQD//wEA//8AAAAA/v8BAP//AQAAAAAAAAAAAAAAAAAAAAAAAAD//wAA//8AAAAAAQAAAAEAAAAAAAEAAAADAAEAAwACAAAAAAD//////////wAAAAD//wAA/v////3/AAD+/wAAAAAAAAIAAAABAAAAAQABAAIAAAABAAAAAAAAAAAAAAD//wAA//8AAP//////////AAD//wAA//8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAABAAEAAAABAAAAAgAAAAIAAQACAAEAAAAAAAAAAAD//wAA//8AAP//AAD+/wAA//8AAAAAAAAAAAAAAQAAAAIAAAABAAAAAAAAAAAAAAAAAAAAAAAAAP//AAD9/wAA/v///wAA//8AAAAAAAAAAAAAAAABAAAAAgAAAAIAAAABAAAAAQABAAEAAQAAAAEAAAAAAAAAAAAAAAAAAAAAAP//AAD+/wAA//8AAAAAAAAAAAAA//8AAP//AAAAAAAAAAAAAAAAAAABAAAAAQABAAEAAAAAAP//AQAAAAAAAQAAAAEA//8AAP//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAEAAQD//wEA/v8AAP//AAAAAAAAAAD//wAA//8AAAAAAAAAAAEAAAABAP//AAD//wAAAAAAAAEAAAAAAAAAAAD//wEA//8BAAAAAAAAAAAA//8AAAAAAAAAAP//AAAAAP7/AQD9/wEA//8AAAAA//8AAAAAAAABAAEAAAACAAAAAgAAAAEAAAABAAAAAgAAAAEA//8AAAAAAAD//wAAAAAAAAAAAAAAAP//AAAAAAAAAQAAAAEAAAAAAAAA//8AAAAAAAAAAAAAAAAAAP//AAD//wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAABAAAAAQAAAAMAAAADAAAAAQAAAAAAAAAAAAAAAAD//wAA/////wAA//8AAP//AAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAQAAAAEAAAABAP//AQD//wEA//8BAP//AQD//wAA/////wAA//8AAAAAAAAAAAAA//8AAP7/AQD+/wAAAAAAAAAAAAAAAAEAAAABAAAAAAABAAAAAAABAAAAAAAAAAAAAAAAAAAAAAD//wAAAAD//wAA/v8AAAAAAAAAAAAAAAABAAAAAQAAAAEAAAAAAAEAAAAAAAAA//////7//v/+////AAD//wAAAAD//wAA//8BAAAAAgABAAEAAAAAAAAAAAABAAAAAQAAAAAAAAD//wAAAAAAAAEAAAAAAAEAAAABAAAAAAABAAAAAQAAAAAA//8AAP/////+/////f8AAP7/AAAAAAAAAAAAAAAAAQABAAEAAgAAAAEAAQAAAAAAAAAAAAAAAAAAAP//AAD/////AAAAAAAAAAD//wAA//8AAAAAAAABAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//8AAAAAAQAAAAEAAAACAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAD//wAA//8AAP//AAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//8AAP//AAD+/wAA/v8AAP//AAAAAAAAAAAAAAAAAAABAAEAAgABAAIAAAABAP//AAAAAAAAAAABAAAAAAD//wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//wAA//8AAP//AAD//wAA//8AAAAA/v8AAP//AAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAA//8BAAAAAQAAAAAAAAAAAP//AAAAAAEAAAABAAAAAAAAAP//AAD//wAAAAAAAAAAAAAAAAAAAAAAAAEAAAABAAAAAAAAAAAAAAAAAAAAAAABAAAAAgD//wEAAAAAAAAAAAAAAAAA//8AAP//AAAAAAAAAAAAAAAAAAD/////AAD//wAAAAAAAAAAAAD//wAA//8BAAAAAQAAAAAA//8AAP//AAAAAAAAAAAAAAAA//8AAAAAAQABAAEAAQABAAEAAAABAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//8AAP//AAAAAAAAAAAAAP7/AAD+/wAA/////wAA//8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAIAAAABAAAAAAAAAAAA//8AAAAAAAAAAAAAAAAAAAAAAQAAAAEAAQAAAAEAAAABAAAAAQAAAAAAAAAAAP7/AAD+/wAA/v8AAP//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAEAAQAAAAAAAAAAAAAAAQAAAAEA/v8BAP7/AAD//wAAAAAAAP//AAD/////AAD//wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//wAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//AAAAAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAP//AAD//wAA//8AAAAAAAD//wAA//8AAP//AAAAAAAAAAAAAAAA//8AAP//AAAAAAAAAAAAAAAAAQAAAAEAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAABAAEAAAABAAAAAAAAAAAAAAABAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAP///////wAAAAABAAAAAgAAAAEAAAABAAAAAQABAAAAAQAAAAAA//8AAP//AAD//wAA//8AAAAAAAAAAAAAAAD//wAA//8BAAAAAQAAAAAAAAAAAAAA//8BAP//AgD//wEA//8AAP//AAAAAAAAAAAAAAEAAAAAAAAAAAD//wAA//8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAP//AAD//wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//8AAP//AQD+/wEA//8BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAEAAAAAAAAAAAABAAAAAQAAAAAAAAAAAAAAAQAAAAIAAAABAAAAAAAAAAAAAAAAAAEAAAABAP7/AAD+/wAA//8AAAAAAAD//wEA//8BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/v8AAP7/AAD//wAA//8AAP//AAD//wEAAAABAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAEAAAABAP//AAAAAAAAAAAAAP//AAD+/wAA//8AAAAAAAABAAEAAAABAAAAAAAAAAAAAAABAAAAAAAAAAAAAAD+/wAA/v8AAP//AAAAAAAA//8AAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAP//AAD//wAA//8AAAAAAQAAAAAAAAAAAAAAAAAAAAEAAQAAAAEAAAABAAAAAAABAAAAAQAAAAAAAAD//wAAAAAAAAAAAAAAAAAAAAABAAAAAQAAAAEAAAAAAAAAAAD//wAA//8AAP////////////8AAAAAAAAAAAAAAAAAAAAAAAABAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAD//wAA//8AAP//AAD//wEAAAABAAAAAQAAAAAAAAAAAAAAAAAAAP//AAD//wEA//8AAP//AAD//wAAAAABAAEAAAABAAAAAQABAAAAAQAAAAEAAQAAAAAA//8AAAAA//8AAAAAAAAAAP//AAD//wAAAAAAAAAAAgAAAAIAAAABAP//AQD//wAA//8AAP//AAD+////////////////////AAD//wEAAAABAAAAAAD//wAA//8BAP//AgAAAAEA//8AAP//AAD//wAAAAABAAEAAAABAAAAAAABAAEAAQABAAAAAAAAAAAAAAD//wAA//8AAAAAAAAAAAAAAAAAAAEAAAABAAAAAQAAAAEAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAA//8AAP//AAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAABAAAAAAAAAAAA//8AAP7/AAD+/wAA/v8AAP//AAAAAAAAAAAAAAAAAAAAAAEAAQAAAAEAAAAAAAAAAAABAAAAAAAAAAAAAAD//wAAAAAAAAAAAAAAAAEAAAABAAAAAAAAAAAAAAAAAAAAAAD///////////////8AAAAAAAD//wAA//8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//AAD//wAA//8AAAAAAAAAAAAAAAAAAAEAAgADAAEAAwAAAAEAAAAAAAAAAQAAAAAAAAAAAAAA//8AAP7/AAD//wEAAAABAP//AAD+/wAA//8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQD//wEA//8BAAAAAgD//wEA/v8AAP7/AAD//wAA//8AAP//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAQAAAAAA//8AAP//AQD//wEA//8AAAAAAAAAAAAA//8AAAAAAQAAAAEAAAABAAAAAAD//wAAAAAAAAEAAAABAP//AAD+/wAA/v8BAP//AQD//wAA//8AAP//AAAAAAEAAAAAAAAAAAABAAEAAQABAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAD//wAA//8AAP//AAD+/////f8AAP3/AAD+/wAA//8AAAAAAAD//wAAAAAAAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAAABAAAAAAD//wAAAAAAAAAAAQAAAAAAAAD//wAA//8AAAAAAQABAAAAAAAAAAAA//8AAP//AQD//wAA/////wAA/////////v/+/////v8AAP//AAAAAAAAAAAAAAAAAAAAAAAAAQAAAAEAAAAAAAAAAAABAAAAAAAAAAAAAAABAAAAAQAAAAEAAAAAAAEA//8AAAAAAAAAAAAAAAAAAAAAAAAAAP//AAD+/wAA//8BAAAAAQABAAAAAQAAAAEAAAAAAAAAAAAAAAAAAAD//////v//////AAAAAAAAAAAAAAAAAAAAAP//AQD//wEAAAABAAAAAQAAAAAA//8AAP//AAAAAAAAAAAAAAAA//8AAAAAAAAAAAAAAAABAAAAAgABAAEAAQAAAAAAAAAAAAAAAAAAAAAAAAD+/wEA/v8BAAAAAAAAAAAA//8AAP//AAAAAAAAAQAAAAAA//////////8AAAAAAAAAAAAAAAD//wAA//8BAAAAAgAAAAIAAAACAAAAAgD//wEA/v8AAP7/AAD//wAAAAAAAAAAAAAAAAAAAAAAAAEAAAACAAAAAQAAAAAA//8AAP//AQAAAAAA//8AAP7////+//////8AAAAAAAAAAAAAAAAAAP//AQAAAAEAAAABAAAAAAAAAAEAAAAAAAEAAAACAP//AwD//wIAAAABAAAAAQAAAAAA//8AAP////8AAP7/AAD+/wAAAAAAAAAAAAAAAP//AAD//wAAAAABAAAAAAAAAAAAAAAAAAAA//8AAP//AAD//wAA//8AAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAIAAAADAAEAAgABAAAAAQAAAAIAAAACAAAAAgD//wAA//8AAAAAAAAAAAAAAAD+/wEA/v8BAP7/AQAAAAAAAAAAAAAAAAAAAAAAAQD//wEA//8BAP7/AAD//wAAAAD//wAA/v8AAP7/AAD//wAA//8AAAAAAAAAAAAAAQAAAAIAAAACAAAAAQAAAAAAAQABAAIAAQACAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAD//////////wAA//8AAP7/AAD+/wAA//8BAAAAAAAAAAAAAQAAAAEAAAABAAAAAQD//wEAAAABAAAAAAAAAP//AAD+/wAA//8AAAAAAAAAAAAAAAAAAAAAAAABAP//AQD//wEA//8AAAAAAAAAAAAAAAAAAAAAAAABAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAD//wAA/////wAA//8BAAAAAQAAAAAA//8BAP//AgAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAIA//8CAP7/AQD+/wAA//8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//wAAAAAAAAAAAAAAAAAA//////7/AAD//wAAAAAAAAAAAAAAAAAAAAABAAAAAgAAAAEAAAAAAAAAAQAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAEAAAACAAAAAQAAAAAAAAAAAAAAAAD//wAA//8AAAAAAAAAAAAA//8AAP//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAEAAQABAAAAAAD//wEAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//AAD//wAA//8AAP//AAAAAAAAAAAAAAEAAAABAAAAAAAAAAEAAAABAAAAAAAAAP//////////AAD//wAA//8AAAAAAAAAAAAAAAABAAAAAQAAAAAAAQABAAIAAQABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//AAAAAAAAAAAAAAAAAQD//wEA//8AAP//AAD+/wAA/v8AAAAAAAAAAP//AAAAAAAAAAABAAAAAQAAAAEAAAAAAAAAAAAAAAAAAAAAAP//AAAAAAAAAAAAAP//AAAAAAAAAAABAAAAAgAAAAIAAAABAAAAAAAAAAAA//8AAAAA//8AAP//AAD//wAAAAAAAAAAAAAAAAEAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAP//AAD//wAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAP//AQD//wAA//8AAAAAAAAAAAAAAAAAAAAA//8AAP//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAA//8AAAAAAAAAAAEAAAABAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAABAAAAAAAAAAAAAAAAAP//AAD//wAAAAAAAAAAAAAAAP///////wAA//8AAP//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//8BAAAAAQAAAAAAAAAAAAAAAAABAAAAAQAAAAEAAAABAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAEA//8BAAAAAAAAAAAAAQAAAAAA//8AAP//AAD//wAA//8AAP//AAD//wAAAAAAAAAA//8AAAAAAAAAAAEAAAABAAAAAAD//wAAAAAAAAAAAAD//wAA/v8AAP//AAD//wAAAAAAAAAAAAAAAAEAAAABAAAAAAAAAP//AQAAAAEAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//AAD//wAAAAAAAAAAAQD//wEA//8AAP////8AAAAAAAAAAAEAAAABAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/////////v8AAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAABAAAAAAAAAAAAAAABAAAAAQD//wAA////////AAAAAAAAAAAAAAAA//8AAP//AQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAQAAAAAAAAD//wAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAQAAAAIAAAABAAAAAAD//wAA/////wAAAAAAAAAAAAD//wAA//8AAAAAAAAAAP//AAAAAAAAAQABAAEAAQAAAAEAAAAAAAAAAAABAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA////////AAD//wEAAAACAAAAAgAAAAEAAQABAAAAAQAAAAAAAAAAAAEAAAAAAAAA//////7//////wAAAAAAAAAAAAD//wAAAAAAAAEAAAABAAAAAAAAAAEAAAACAAAAAgAAAAAAAAD//wAA//8AAAAAAAAAAAAA//8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAIAAAABAAAAAAAAAAAAAAABAAAAAQAAAAAAAAD////////+/////v///wAAAAAAAAAAAAAAAAAAAAABAAAAAQAAAAIAAAADAAAAAgD+/wEA//8AAAAAAAD//////////wAA//8AAP//AAAAAAAAAAAAAAAAAQAAAAIAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//AAD//wAAAAAAAAAAAAAAAP//AAD//wAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAIAAAACAAAAAQAAAAEAAAAAAP////////7/AAD//wAA//8AAP//AAD+/wAA/v8AAAAAAAABAAAAAQAAAAIAAAACAAAAAgD//wAAAAAAAAAAAAAAAAAA/////wAA//8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAQAAAAIAAAABAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAD//wAAAAD//wAA//8AAAAAAAAAAAAA//8AAAAAAAAAAAAAAQAAAAEAAAACAAAAAgAAAAEAAAAAAAAAAAAAAAAAAAAAAAAA//8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAQABAAEAAAAAAAAAAAAAAAAAAAD//wAA/////wAAAAAAAAAAAAAAAAAA//8AAP//AQAAAAEAAAABAAAAAQD//wEAAAAAAAAAAAAAAAAAAAAAAAEAAAABAAAAAAAAAAAAAAABAAAAAQD//wAA//8AAAAA//8AAAAA//8BAAAAAQAAAAAAAAABAAAAAQAAAAAAAQAAAAEAAAAAAAAAAAD//wAA//8AAP//AAD//wAA/v8AAP//AAD//wAAAAABAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//AAD//wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAEAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAEAAAABAAAAAQAAAAAAAQAAAAEAAAAAAAAAAAAAAAAA//8AAP////8AAP//AAD//wAAAAAAAAAAAAD//wAAAAAAAAAAAAAAAAAAAQAAAAEAAAABAAAAAAAAAAAAAAAAAAAAAAAAAP//AAD+/wAA/v8AAP//AAAAAAAAAAAAAAAAAAAAAAAAAQABAAEAAAABAAAAAQAAAAAA//8AAP//AAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAQAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//wAAAAAAAP//AAD//wAAAAAAAAAAAAABAAAAAgAAAAIAAAACAAAAAgAAAAIAAAABAAAAAAAAAAAAAAAAAAAAAAAAAP///////wAA/v8AAP//AQAAAAAAAAAAAP//AAD//wAAAAAAAAAA//8AAP//AAAAAAAA//8AAP//AAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEA//8BAAAAAQAAAAAAAQAAAAEAAAABAAAAAQAAAAEAAAAAAAAAAAD//wAA//8AAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAEA//8BAP//AAD//wAAAAAAAAAAAAAAAAAAAAD+/wAA//8AAP//AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAABAAAAAQD//wAAAAAAAAAAAQAAAAEAAAAAAAAA//8AAP//AQAAAAEAAAABAP//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP////8AAP//AAD//wAAAAAAAAEAAAABAAAAAAAAAP//AAAAAAAAAAAAAP//AAD+/wAA//8AAAAAAAAAAAAAAAAAAAAAAAABAAAAAgAAAAIAAAABAAEAAAABAAAAAAD//wAA//8AAAAAAAAAAAAAAAAAAAAA//8CAP7/AgD//wEAAAAAAAAAAAAAAAAAAAAAAAAA//8AAP//AAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//AAD//wAA//8AAAAAAAAAAAAAAAAAAAAAAAABAAAAAQAAAAEAAAAAAAAA//8AAP7/AAD//wAAAAAAAAAAAAAAAAAAAAAAAAEAAAACAAAAAgAAAAIAAAABAAAAAAAAAAAAAAAAAAEA//8BAP//AAD//wAA//8AAAAAAAABAAAAAAAAAAAA//8AAP//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAA/////wAAAAAAAAAAAAAAAAAA//8AAP//AAAAAAEAAAABAAAAAAABAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//8AAP7/AAAAAAAAAAAAAAAAAAAAAAAAAAD//wEAAAABAAAAAQAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///////////////8AAAAAAAAAAAAAAAAAAAAAAAABAAAAAgAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//AAD+////////////AAAAAAAAAAD//wAA//8AAP//AAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAABAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//wAA//8AAAAAAQAAAAEAAAABAAAAAQAAAAEAAAAAAAAAAAAAAAAAAAAAAP//AAD+//////8AAAAAAQAAAAAAAAAAAAAA//8BAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//8BAAAAAQAAAAEAAAAAAAAAAAABAAAAAgAAAAEAAAAAAP//AAD//wAAAAAAAAAA//8AAP//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//8AAP//AAD///////8AAP//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAQAAAAEAAAABAAAAAQABAAAAAAAAAAAA//8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAP//AQAAAAEAAAAAAAAA//8AAP//AAAAAAEA//8AAP7/AAD//wAAAAAAAAAAAAAAAP//AAD//wAAAAAAAAAAAAD//wAA//8AAAAAAQAAAAEAAAAAAAAAAAAAAAAAAQABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAQAAAAAAAAAAAAAA//8AAAAAAAAAAP//AAD//wAA//8AAAAAAQAAAAEAAAABAAAAAAAAAAAAAAD//wAA//8AAP7/AAD+/wAA/////wAAAAAAAAAAAAAAAAAAAAABAAAAAQAAAAAAAQAAAAEAAAAAAP//AAD//wAA//8AAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAACAAAAAgAAAAEAAAAAAAAAAAAAAAAAAAD+/wAA/v8AAP//AAD//////////wAAAAAAAAAAAQAAAAAAAAABAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//8AAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAEAAAABAAAAAQAAAAEAAQAAAAAAAAAAAAAAAAAAAAAA/////////////wAA//8AAAAAAAAAAAAAAAABAAAAAQAAAAEAAAAAAAAAAAAAAAAAAAAAAP////8AAAAAAAAAAAAAAAAAAP//AAAAAAAAAAAAAAEAAQAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//AAD//wAA//8AAP//AAD//wAAAAAAAAAAAAAAAAAAAAABAAAAAQAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAP//AAD//wAA//8AAAAAAAAAAAAAAAAAAAAAAQAAAAEAAAAAAAAAAAD//wAA/v8AAP//AAAAAP////8AAP//AAAAAAAAAQAAAAEAAAAAAAAAAQAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAEAAAAAAAAAAAAAAAAAAAAAAAAA//8AAP//AAAAAAAAAAAAAAAAAAD//wAAAAAAAAAAAAAAAAAA//8AAP//AAD//wAA/////wAA//8AAP//AAAAAAAAAAABAAAAAQAAAAEAAAABAAAAAAAAAAAAAAAAAAAA//8AAP//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//wAA//8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//AAD//wAA//8BAAAAAQAAAAAAAAAAAAAAAAABAAAAAQAAAAAA//8AAP//AAAAAAAAAAAAAAAA//8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAEAAAABAAAAAAAAAAAAAAAAAAAA//8AAP//AAAAAAAAAAAAAP//AAD//wAAAAABAAAAAAAAAAEAAAABAP//AAD//wAAAAAAAAAAAAAAAAAA/////wAA//8AAAAAAAAAAAAAAAAAAP//AAAAAAAAAAAAAAAAAAD//wAAAAAAAAAAAAAAAAAAAAACAAAAAgAAAAIAAAACAAAAAQABAAAAAAAAAAAA//8AAP//AAD//wAA//8AAP//AAAAAAAAAAAAAAEAAAABAAAAAQAAAAEAAAAAAAAAAAD//wAA/////wAA//8AAP//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAEAAAAAAAEAAAACAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//8AAAAAAAAAAAAAAQAAAAEAAAABAAAAAQAAAAEAAAAAAAAAAAD//wAA//8AAP////8AAP//AAAAAAAAAAAAAAAAAAD//wAAAAAAAAEAAAAAAAAAAAAAAP//AAAAAAAAAAAAAAAAAAD//wEAAAABAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAD//wAA//8AAAAAAAAAAAAA//8AAAAAAQAAAAEAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//8AAAAAAAAAAAAAAAAAAAAAAAABAAAAAQAAAAEAAAAAAAAAAAAAAAAAAAAAAAAA//8AAP//AAAAAAAAAAD//wAA//8AAP//AQAAAAAAAAAAAAAAAAD//wAAAAAAAAEA//8BAP//AAD//wAAAAAAAAAAAQAAAAAAAQAAAAEAAQABAAEAAQABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAD//wAA//8AAAAAAQAAAAAA//8AAP//AAAAAAAAAAAAAP////////////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//8BAAAAAAAAAAAAAAAAAP//AQAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAEAAAAAAAAAAAAAAAAAAAAAAP//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAP//AAD//wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAP///////wAAAAAAAAAA//8AAP//AAAAAAAAAQABAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//wEA//8AAAAAAAAAAAAAAAAAAAEAAAABAP//AAD//wAAAAAAAAAAAQAAAAAAAAD//wAA//8AAAAAAAD//wAA//8AAAAAAAAAAAAAAQAAAAEAAQABAAEAAQAAAAEAAAAAAAEAAAABAAAAAAAAAAAAAAD//wAA//8AAP//AAAAAAAAAAAAAAAAAAAAAAAAAAD//wEA//8AAP//AAD//wAA//8AAP//AAAAAP//AQD//wIAAAACAAAAAQAAAAAAAAAAAAEAAAABAP//AAD//wAAAAABAAAAAAAAAAAAAQD//wEAAAACAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAD+/wAA//8AAP//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//AAD//wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//wAA//8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//8AAAAAAAAAAAAAAAD//wAAAAAAAAAAAAABAAAAAAD//wAA//8AAAAAAgAAAAEAAAAAAAAAAAAAAAAAAAAAAAEAAAABAP//AAD//wAAAAAAAAAAAAAAAAAAAAAAAAEAAAABAAAAAQAAAAAAAAAAAAAA//8AAAAAAAD//wAA//8AAP//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAEAAAAAAAEAAAABAAEAAQABAAEAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//wAA//8AAP//AAAAAAAAAAAAAP////////7/AAD//wAA//8AAP//AAD//wAAAAAAAAAAAAAAAAAAAAAAAAEAAAABAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAgAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//wAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAQAAAAAAAAABAAAAAQAAAAAAAAAAAAAA//8AAAAAAAAAAP////8AAP//AAAAAAAAAAD//wAA//8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAEAAAAAAAAAAAAAAAAAAAAAAAEAAAABAAAAAAD//wAA//8AAAAAAAABAP//AQAAAAAA//8AAP7/AAD//wAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAQAAAAAAAQAAAAEAAAABAAEAAQABAAAAAAAAAAAAAAAAAAAAAQD//wEA//8AAP//AAAAAP//AAD//wAA//8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//8AAAAAAAAAAAEAAAABAAAAAAAAAAAAAQD//wEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//AAD//wAA//8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//AAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAABAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//8AAP7/AAD+/wAA//8AAAAAAAAAAAAAAAAAAAAAAAAAAP//AQAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAABAAAAAQD//wAAAAAAAAAAAAAAAAAA//8AAAAAAAABAP//AQAAAAEAAAABAAAAAAD//wAA//8AAP//AAD//wAAAAD//wAA//8AAAAAAAAAAAEA//8AAP//AAAAAAAAAAABAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAP//AAAAAAAAAAABAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//wAA//8AAAAAAAAAAP7/AAD+/wAA//8AAAAAAQAAAAEA//8BAAAAAQABAAEAAgABAAEAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAA//8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//AAAAAAAAAAAAAAAAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEA//8AAAAAAAABAAAAAgAAAAAAAAAAAAAAAAD//wEA//8AAAAAAAAAAP//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP////8AAP7/AAD//wAA//8AAP//AAAAAAAAAAAAAAAAAAAAAAEAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAQAAAAEAAAAAAAAAAAAAAAEAAAAAAAAA//8AAP//AAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAP//AAD//wAA//8AAP//AAAAAAAAAAAAAP//AQAAAAEAAAAAAAEAAAABAAAAAAAAAAAAAAAAAP//AAD//wAAAAAAAAAA//8AAP//AAAAAAAAAAAAAAEAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAA//8AAP//AAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAEAAQAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//AAD//wAA//8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//AAD//wAA//8AAAAAAAAAAAAAAQAAAAEAAAAAAAAAAQAAAAEAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAABAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//////7/AAD//wAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAA/v8AAP7/AAD//wAAAAAAAAAAAAAAAAAAAAAAAAEAAQABAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQD//wEA//8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//wAA//8AAAAAAAAAAP//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//wAA//8AAAAAAAAAAAAAAAAAAAAAAQAAAAEAAAAAAAEAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAABAAAAAQAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//wAA//8AAAAAAAAAAP//AAAAAAAAAAAAAAAAAAD//wAA//8AAAAAAAABAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//AAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//8AAAAAAAAAAP//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAEAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//wAAAAAAAAAA//8AAP//AAD//wAAAAAAAAAAAAAAAAAAAAAAAAEAAAABAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//8AAP//AAD//wAA//8AAP//AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAQAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//8AAP//AAAAAP//AAD//wAA//8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAABAAAAAQAAAAAAAAAAAAAAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAAAAAAAAAAAAAP//////////AAD//wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAQAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAABAP//AQAAAAEAAAAAAAAAAAAAAAAAAQD//wAA//8AAP//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAQAAAAAA//8AAAAAAAAAAAAAAAD//wAA//8AAP//AAD//wAA//8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAEAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//8AAP//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//wAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//wAA//8AAAAAAAAAAAEAAAAAAAAAAAAAAAEAAAABAAAAAQAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//wAA//8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAQAAAAAAAAABAAAAAgAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//8AAP//AAAAAAAAAAAAAAAAAAAAAP//AAD//wAA//8BAP//AQD//wEA//8BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQD//wAA//8AAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAA/v8AAP7/AQD//wEAAAAAAP//AAD//wAAAAAAAAEAAAABAAAAAAAAAAEAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//8AAAAAAAAAAAAAAAAAAAAA//8AAP//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//wAAAAABAAAAAQAAAAAAAAAAAAAAAAAAAAEAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//wAA//8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//AAD//wAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAQAAAAEA//8BAP7/AgD//wEAAAAAAAAAAAAAAAAAAAAAAAAA//8AAP//AAD//wAAAAAAAAAAAAAAAAAAAAD//wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//AAD//wAAAAAAAAAAAAAAAAAA//8AAP//AAAAAAAAAQAAAAEAAAAAAAAAAAAAAAEAAAABAAAAAAD//wAA//8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEA//8BAP7/AQD//wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAEAAAABAAAAAAAAAAAAAAABAP//AAAAAAAAAAD//wAAAAAAAAAAAAAAAAAA//8AAP//AAAAAAAAAAAAAAAAAAD//wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAQAAAAAAAAAAAAAA//8AAP//AAD//wAA/v8AAP3/AAD//wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAEAAAABAAEAAQABAAEAAAABAAAAAAAAAP//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAABAAAAAAAAAAAAAAAAAAAA//8AAP//AAD//wAA////////AAAAAAAAAAAAAAEAAAABAAEAAAABAAAAAAAAAAAAAAAAAP//AQD+/wAA//8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAD//wAA//8AAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAD//wAA//8AAP//AAAAAAAAAAAAAAAAAAAAAAAAAQAAAAIAAAABAAAAAAAAAAAAAAAAAAAAAAABAP//AQD//wAA//8AAAAAAAAAAAAAAAAAAAEAAAABAAAAAQAAAAEAAAAAAAAAAAAAAP//AAAAAP//AAD/////AAD//wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAgAAAAEAAAAAAAAAAAD//wAAAAAAAAAAAAABAAAAAAAAAAAA//8AAP//AAAAAAAAAAAAAAAA/////wAAAAAAAAAAAAAAAP//AAAAAAAAAAAAAAAAAAABAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//wAA//8AAP//AAAAAAAA//8AAAAAAAAAAAAAAQAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//AAD//wAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAP//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//wAA///////////+/wAA//8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//8AAAAAAAAAAAEAAAAAAAAAAAAAAP//AAD//wAA//8AAP//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAQABAAEAAAAAAAAAAAAAAAAA//8AAP7/AAD+/wAA//8AAAAAAAAAAAAAAAAAAAEAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//wAA//8AAP//AAAAAAAAAAAAAAAAAAAAAAAAAQAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//AAD+/wAAAAD//wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAEAAAABAAAAAQAAAAAAAAAAAAAAAAAAAP//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//wAA////////AAD//wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAQAAAAEAAAAAAAAAAAAAAAAAAAAAAAAA//8AAP//AAD//wAAAAAAAP//AAD//wEAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//wAA//8AAP////8AAP//AAAAAP//AAAAAAAAAAAAAAAAAAAAAAAAAQAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAEAAAABAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//AAD//wAAAAAAAAAAAQAAAAEAAAAAAAAAAAABAAAAAAD//wAA/v8AAP7/AAD//wAAAAD//wAAAAAAAAAAAQAAAAEAAAABAAAAAAABAAAAAQAAAAEA//8AAP//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//////////8AAAAAAAAAAAEAAAAAAAAAAQAAAAIAAAABAAAAAAAAAAAAAAAAAAAAAAAAAP//AAD+/wAA//8AAAAAAAABAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAA//8AAP//AAD//wAAAAAAAAAAAAAAAAAAAQAAAAEAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//AAAAAAAA//8AAP//AAD//wAAAAD//wAA//8BAP//AgAAAAIAAAABAAAAAAAAAAAAAAAAAAAA//8AAP//AQD//wAA//8AAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//AAD//wAAAAAAAAAAAAAAAAAAAAAAAAEAAAABAAEAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAP//AAD//wEAAAABAAAAAAAAAAAA//8AAAAAAAAAAAAAAAD//wAA//8AAP//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//AAD//wEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEA//8BAP//AAAAAAAAAAABAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//wAA//8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAEAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//wEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//8AAP//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//AAD//wAAAAAAAAAAAQAAAAEAAAAAAAAAAAAAAAAAAAAAAP//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAP//AAD//wAA//8AAAAAAQAAAAEAAAAAAAAAAAAAAAEAAAABAAAAAAAAAAAAAAD//wAAAAAAAAAAAAD//wAA//8AAP//AQAAAAAAAAABAAAAAQAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//AAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAQAAAAEAAAABAAAAAAAAAAAA//8AAP//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAABAAAAAAAAAAAAAAAAAAAAAAD//wAA//8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//AAD//wEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//AAD//wAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//AAD//wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAA//8AAP//AAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAQABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//wAA/////wAAAAAAAAAA//8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//wAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//wAAAAAAAAAAAAAAAAAA//8AAP//AAD//wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//AQD//wEA//8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQABAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//wAA//8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//AAD//wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//8AAP//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//wAA//8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//AAD//wAAAAAAAAAAAAAAAAAA//8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//AAD//wAA//8AAP//AAD//wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//wAA//8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//AAD//wAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAP//AAD//wAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAQAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//8AAP//AAD//wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAABAP//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//8AAP//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//wAAAAAAAAAAAAAAAAAA//8AAAAAAAAAAAAAAAAAAAAAAAAAAP//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//AAD//wAA//8AAP//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAEAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAP//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//wAAAAAAAAAAAAAAAAAA";

  const TOKEN_RECIPES = Object.freeze([
    Object.freeze({
      id: "polyflora-hexbloom-bloom-token",
      sourceName: "Polyflora Hexbloom",
      sourceArtworkUrl: "https://res.cloudinary.com/vosvpv50/image/upload/v1787780606/Gemini_Generated_Image_b597fgb597fgb597_1.png",
      effectText: "During your Main Phase: You can send 1 Spell/Trap from your Deck to your GY; Special Summon 2 \"Bloom Token\" (Plant/WIND/Level 2/ATK 0/DEF 0) in Defense Position.",
      token: Object.freeze({ name: "Bloom Token", level: 2, attribute: "WIND", monsterType: "Plant", atk: 0, def: 0, position: "Defense" }),
      count: 2,
      variants: BLOOM_TOKEN_VARIANTS
    }),
    Object.freeze({
      id: "the-dragon-scroll-dragon-warrior-token",
      sourceName: "The Dragon Scroll",
      sourceArtworkUrl: "https://res.cloudinary.com/vosvpv50/image/upload/v1787783783/Gemini_Generated_Image__34.png",
      effectText: "During your Main Phase or either players Battle Phase: You can banish this face-up card until the End Phase; Special Summon 1 “Dragon Warrior Token” (Warrior/LIGHT/Tuner/Level 1/ATK 0/DEF 0), then, immediately after this effect resolves, you can Synchro Summon 1 Synchro Monster using that Token you control, and if you do, place 1 Chi Counter on it.",
      token: Object.freeze({ name: "Dragon Warrior Token", level: 1, attribute: "LIGHT", monsterType: "Warrior / Tuner", atk: 0, def: 0, position: "Attack or Defense" }),
      count: 1,
      variants: DRAGON_WARRIOR_TOKEN_VARIANTS
    })
  ]);

  const TOKEN_MACRO_STYLE = `
    #${APP.ids.tokenButton} { position: fixed; right: 14px; top: calc(50% - 49px); z-index: 2147483645; transform: translateY(-50%); border: 1px solid #86efac; border-radius: 9px 0 0 9px; background: linear-gradient(145deg,#064e3b,#312e81); color: #f0fdf4; padding: 11px 9px; writing-mode: vertical-rl; letter-spacing: .12em; font: 900 12px/1 Arial,sans-serif; box-shadow: 0 5px 20px #000a,0 0 16px #86efac44; cursor: pointer; }
    #${APP.ids.tokenButton}[hidden] { display: none; }
    #${APP.ids.tokenButton}:disabled { cursor: wait; opacity: .65; }
    #${APP.ids.tokenModal} { position: fixed; inset: 0; z-index: 2147483647; display: grid; place-items: center; box-sizing: border-box; padding: 18px; background: #020617bd; color: #f8fafc; font: 14px/1.45 Arial,sans-serif; }
    #${APP.ids.tokenModal} * { box-sizing: border-box; }
    #${APP.ids.tokenModal} .yf-token-dialog { width: min(720px,calc(100vw - 32px)); max-height: calc(100vh - 32px); overflow: auto; border: 1px solid #86efac; border-radius: 15px; padding: 18px; background: linear-gradient(145deg,#061b17fa,#172554fa 58%,#3b1750fa); box-shadow: 0 24px 80px #000e,0 0 32px #86efac33; }
    #${APP.ids.tokenModal} .yf-token-dialog.yf-token-recipe-dialog { width: min(600px,calc(100vw - 32px)); }
    #${APP.ids.tokenModal} header { display: flex; align-items: center; justify-content: space-between; gap: 12px; border-bottom: 1px solid #86efac55; padding-bottom: 10px; }
    #${APP.ids.tokenModal} h2 { margin: 0; color: #ecfdf5; font-family: Georgia,serif; }
    #${APP.ids.tokenModal} p { color: #dbeafe; }
    #${APP.ids.tokenModal} button { border: 1px solid #64748b; border-radius: 8px; background: #1e293b; color: #fff; padding: 9px 13px; cursor: pointer; font-weight: 750; }
    #${APP.ids.tokenModal} button:disabled { cursor: wait; opacity: .62; }
    #${APP.ids.tokenModal} .yf-token-close { border: 0; background: transparent; padding: 1px 7px; color: #cbd5e1; font-size: 28px; line-height: 1; }
    #${APP.ids.tokenModal} .yf-token-gallery { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 11px; margin-top: 16px; }
    #${APP.ids.tokenModal} .yf-token-source { display: grid; align-content: start; gap: 7px; width: 100%; min-width: 0; border-color: #86efac88; padding: 7px; text-align: left; background: linear-gradient(145deg,#064e3b99,#312e8199); }
    #${APP.ids.tokenModal} .yf-token-source img { width: 100%; aspect-ratio: 1; border-radius: 6px; object-fit: cover; object-position: center 32%; box-shadow: 0 5px 13px #0009; }
    #${APP.ids.tokenModal} .yf-token-source strong { display: block; min-width: 0; overflow-wrap: anywhere; color: #f0fdf4; font-size: 12px; line-height: 1.2; }
    #${APP.ids.tokenModal} .yf-token-pair { display: grid; grid-template-columns: repeat(2,minmax(0,160px)); justify-content: center; gap: 12px; margin: 14px 0; }
    #${APP.ids.tokenModal} .yf-token-preview { overflow: hidden; border: 1px solid #86efac88; border-radius: 11px; background: #0f172a; }
    #${APP.ids.tokenModal} .yf-token-preview img { display: block; width: 100%; aspect-ratio: 1; object-fit: cover; }
    #${APP.ids.tokenModal} .yf-token-preview span { display: block; padding: 9px; color: #dcfce7; text-align: center; font-weight: 800; }
    #${APP.ids.tokenModal} .yf-token-details { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; margin: 12px 0; }
    #${APP.ids.tokenModal} .yf-token-details div { border: 1px solid #334155; border-radius: 7px; background: #0f172aaa; padding: 8px; color: #e2e8f0; text-align: center; }
    #${APP.ids.tokenModal} .yf-token-notice { border: 1px solid #facc1566; border-radius: 8px; background: #713f123d; padding: 10px; color: #fef3c7; }
    #${APP.ids.tokenModal} .yf-token-actions { display: flex; justify-content: flex-end; gap: 9px; margin-top: 15px; }
    #${APP.ids.tokenModal} .yf-token-primary { border-color: #bbf7d0; background: linear-gradient(135deg,#047857,#4338ca); }
    #${APP.ids.tokenToast} { position: fixed; left: 50%; top: 18px; z-index: 2147483647; width: min(520px,calc(100vw - 32px)); transform: translateX(-50%); border: 1px solid #86efac; border-radius: 9px; background: #052e2bec; color: #ecfdf5; padding: 12px 16px; text-align: center; font: 800 14px/1.4 Arial,sans-serif; box-shadow: 0 10px 28px #000c; }
    #${APP.ids.tokenToast}.yf-token-error { border-color: #f87171; background: #450a0aec; color: #fee2e2; }
    @media (max-width: 650px) { #${APP.ids.tokenButton} { right: 4px; } #${APP.ids.tokenModal} .yf-token-gallery { grid-template-columns: repeat(2,minmax(0,1fr)); } #${APP.ids.tokenModal} .yf-token-pair { grid-template-columns: minmax(0,160px); } #${APP.ids.tokenModal} .yf-token-details { grid-template-columns: 1fr 1fr; } }
  `;

  function chooseDistinctTokenVariants(variants, count, random = Math.random) {
    if (!Array.isArray(variants) || variants.length < count || count < 1) return [];
    const pool = [...variants];
    const chosen = [];
    while (chosen.length < count) {
      const index = Math.min(pool.length - 1, Math.max(0, Math.floor(random() * pool.length)));
      chosen.push(pool.splice(index, 1)[0]);
    }
    return chosen;
  }

  function tokenCarrierFromUrl(value) {
    const match = String(value ?? "").match(/images\.duelingbook\.com\/(?:card-)?tokens\/(\d+)\.jpg(?:[?#]|$)/i);
    return match ? Number(match[1]) : null;
  }

  class TokenMacros {
    constructor(diagnostics, getSettings) {
      this.diagnostics = diagnostics;
      this.getSettings = getSettings;
      this.button = null;
      this.modal = null;
      this.toast = null;
      this.active = false;
      this.drafts = new Map();
      this.variantByCarrier = new Map();
      this.previewTimer = null;
      this.tokenSummonAudio = null;
      this.audioUnlocked = false;
      this.unlockingAudio = false;
      this.lastSoundRecipe = "";
      this.lastSoundAt = 0;
      for (const recipe of TOKEN_RECIPES) for (const variant of recipe.variants) this.variantByCarrier.set(variant.carrierId, { recipe, variant });
    }

    mount() {
      if (document.getElementById(APP.ids.tokenButton)) return;
      const style = document.createElement("style");
      style.textContent = TOKEN_MACRO_STYLE;
      document.head.append(style);
      this.button = document.createElement("button");
      this.button.id = APP.ids.tokenButton;
      this.button.type = "button";
      this.button.textContent = "TOKENS";
      this.button.title = "Open YugiFaux Token macros";
      this.button.addEventListener("click", () => this.open());
      document.body.append(this.button);
      const observer = new MutationObserver((records) => this.#observeTokenChanges(records));
      observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["src"] });
      document.addEventListener("mouseover", (event) => this.#handleFieldPreviewRequest(event), true);
      document.addEventListener("mousemove", (event) => this.#handleFieldPreviewRequest(event), true);
      document.addEventListener("click", (event) => this.#handleFieldPreviewRequest(event), true);
      document.addEventListener("pointerdown", () => this.#unlockAudio(), { capture: true });
      document.addEventListener("keydown", () => this.#unlockAudio(), { capture: true });
      this.#scanForTokenCarriers(document);
      setInterval(() => this.refresh(), 750);
      this.refresh();
    }

    refresh() {
      if (!this.button) return;
      const enabled = Boolean(this.getSettings()?.enabled);
      this.button.hidden = !enabled || !this.#isVisible(document.querySelector("#duel"));
      this.button.disabled = this.active;
    }

    close() {
      this.modal?.remove();
      this.modal = null;
    }

    open() {
      if (this.active) return;
      if (!this.getSettings()?.enabled || !this.#isVisible(document.querySelector("#duel"))) return this.#showToast("Enter an active duel before using Token macros.", true);
      this.#renderGallery();
    }

    #renderGallery() {
      this.close();
      this.modal = this.#createModal("Summon Tokens");
      const intro = document.createElement("p");
      intro.textContent = "Choose the card whose effect is summoning the Tokens.";
      const gallery = document.createElement("div");
      gallery.className = "yf-token-gallery";
      for (const recipe of TOKEN_RECIPES) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "yf-token-source";
        const image = document.createElement("img");
        image.src = recipe.sourceArtworkUrl;
        image.alt = recipe.sourceName;
        const name = document.createElement("strong");
        name.textContent = recipe.sourceName;
        button.append(image, name);
        button.addEventListener("click", () => this.#renderRecipe(recipe));
        gallery.append(button);
      }
      this.modal.querySelector(".yf-token-dialog").append(intro, gallery);
    }

    #renderRecipe(recipe) {
      const chosen = this.drafts.get(recipe.id) ?? chooseDistinctTokenVariants(recipe.variants, recipe.count);
      this.drafts.set(recipe.id, chosen);
      this.close();
      this.modal = this.#createModal(recipe.sourceName);
      const card = this.modal.querySelector(".yf-token-dialog");
      card.classList.add("yf-token-recipe-dialog");
      const effect = document.createElement("p");
      effect.textContent = recipe.effectText;
      const pair = document.createElement("div");
      pair.className = "yf-token-pair";
      chosen.forEach((variant, index) => {
        const preview = document.createElement("div");
        preview.className = "yf-token-preview";
        const image = document.createElement("img");
        image.src = variant.artworkUrl;
        image.alt = `${recipe.token.name} artwork ${index + 1}`;
        const label = document.createElement("span");
        label.textContent = `${recipe.token.name} ${index + 1}`;
        preview.append(image, label);
        pair.append(preview);
      });
      const details = document.createElement("div");
      details.className = "yf-token-details";
      for (const value of [`Level ${recipe.token.level}`, recipe.token.attribute, recipe.token.monsterType, `${recipe.token.atk} ATK`, `${recipe.token.def} DEF`, `${recipe.token.position} Position`]) {
        const item = document.createElement("div");
        item.textContent = value;
        details.append(item);
      }
      const notice = document.createElement("p");
      notice.className = "yf-token-notice";
      const zoneCount = recipe.count === 1 ? "one" : String(recipe.count);
      notice.textContent = `After confirmation, DuelingBook will highlight your open Monster Zones ${recipe.count === 1 ? "once" : `${recipe.count} times`}. Click one zone for each Token. The summon is cancelled unless ${zoneCount} zone${recipe.count === 1 ? " is" : "s are"} available.${recipe.token.position === "Attack or Defense" ? " DuelingBook initially places native Tokens in Defense Position; use its To ATK action after placement when desired." : ""}`;
      const actions = document.createElement("div");
      actions.className = "yf-token-actions";
      const back = document.createElement("button");
      back.type = "button";
      back.textContent = "Back";
      back.addEventListener("click", () => this.#renderGallery());
      const confirm = document.createElement("button");
      confirm.type = "button";
      confirm.className = "yf-token-primary";
      confirm.textContent = `Confirm & Summon ${recipe.count}`;
      confirm.addEventListener("click", () => this.#runRecipe(recipe, chosen));
      actions.append(back, confirm);
      card.append(effect, pair, details, notice, actions);
    }

    #createModal(titleText) {
      const root = document.createElement("section");
      root.id = APP.ids.tokenModal;
      root.setAttribute("role", "dialog");
      root.setAttribute("aria-modal", "true");
      root.setAttribute("aria-label", titleText);
      const card = document.createElement("div");
      card.className = "yf-token-dialog";
      const header = document.createElement("header");
      const title = document.createElement("h2");
      title.textContent = titleText;
      const close = document.createElement("button");
      close.type = "button";
      close.className = "yf-token-close";
      close.setAttribute("aria-label", "Close Token macros");
      close.textContent = "×";
      close.addEventListener("click", () => this.close());
      header.append(title, close);
      card.append(header);
      root.append(card);
      root.addEventListener("click", (event) => { if (event.target === root) this.close(); });
      document.body.append(root);
      queueMicrotask(() => close.focus());
      return root;
    }

    async #runRecipe(recipe, chosen) {
      if (this.active) return;
      this.active = true;
      this.close();
      this.refresh();
      try {
        const chooseZones = document.querySelector("#choose_zones_cb");
        if (!(chooseZones instanceof HTMLInputElement)) throw new Error("DuelingBook’s Choose Zones control is unavailable.");
        if (!chooseZones.checked) {
          chooseZones.checked = true;
          chooseZones.dispatchEvent(new Event("change", { bubbles: true }));
        }
        for (let index = 0; index < chosen.length; index++) {
          const variant = chosen[index];
          const added = this.#waitForNewCarrier(variant.carrierId, 30000);
          void added.catch(() => {});
          await this.#beginNativeTokenSummon(variant.carrierId, chosen.length - index);
          this.#showToast(`Choose an open Monster Zone for ${recipe.token.name} ${index + 1} of ${chosen.length}.`);
          await added;
          await this.#waitFor(() => !this.#visibleZoneSelectors().length, 5000);
          if (index + 1 < chosen.length) await this.#delay(1050);
        }
        this.drafts.delete(recipe.id);
        const plural = recipe.count === 1 ? "" : "s";
        const positionReminder = recipe.token.position === "Attack or Defense" ? " Use DuelingBook’s To ATK action if you want Attack Position." : "";
        this.#showToast(`${recipe.count} ${recipe.token.name}${plural} summoned with YugiFaux artwork.${positionReminder}`);
        this.diagnostics.info("token-macro", "token recipe completed", { recipe: recipe.id, count: recipe.count });
      } catch (error) {
        this.#cancelNativeSelection();
        this.#showToast(String(error?.message ?? error), true);
        this.diagnostics.warn("token-macro", "token recipe stopped safely", { reason: String(error?.message ?? error) });
      } finally {
        this.active = false;
        this.refresh();
      }
    }

    async #beginNativeTokenSummon(carrierId, requiredOpenZones) {
      const nativeButton = document.querySelector("#duel .token_btn");
      if (!this.#isVisible(nativeButton)) throw new Error("DuelingBook’s native Token button is unavailable.");
      nativeButton.dispatchEvent(new MouseEvent("dblclick", { bubbles: true, cancelable: true }));
      if (!await this.#waitFor(() => this.#isVisible(document.querySelector("#token_select")), 4000)) throw new Error("DuelingBook did not open its native Token selector.");
      if (!await this.#waitFor(() => this.#findCarrierThumbnail(carrierId), 4000)) throw new Error(`DuelingBook Token carrier ${carrierId} is unavailable.`);
      this.#findCarrierThumbnail(carrierId).click();
      if (!await this.#waitFor(() => this.#visibleZoneSelectors().length > 0, 4000)) throw new Error("DuelingBook did not offer an open Monster Zone.");
      if (this.#visibleZoneSelectors().length < requiredOpenZones) throw new Error(`This effect requires ${requiredOpenZones} open Monster Zones.`);
    }

    #findCarrierThumbnail(carrierId) {
      for (const image of document.querySelectorAll("#token_select .thumbnail img")) if (tokenCarrierFromUrl(image.src) === carrierId) return image.closest(".thumbnail");
      return null;
    }

    #visibleZoneSelectors() {
      return [1, 2, 3, 4, 5].map((zone) => document.getElementById(`m${zone}_select`)).filter((element) => this.#isVisible(element));
    }

    #cancelNativeSelection() {
      const cancel = document.querySelector("#duel .cancel_btn");
      if (this.#isVisible(cancel)) cancel.click();
      const tokenSelect = document.querySelector("#token_select");
      if (this.#isVisible(tokenSelect)) tokenSelect.querySelector(".exit_btn")?.click();
    }

    #waitForNewCarrier(carrierId, timeoutMs) {
      return new Promise((resolve, reject) => {
        const field = document.querySelector("#field");
        if (!field) return reject(new Error("DuelingBook’s field is unavailable."));
        let timer;
        const observer = new MutationObserver((records) => {
          for (const record of records) for (const node of record.addedNodes) {
            if (!(node instanceof Element)) continue;
            const card = this.#findCarrierCard(node, carrierId);
            if (!card) continue;
            clearTimeout(timer);
            observer.disconnect();
            this.#applyTokenSkin(card, this.variantByCarrier.get(carrierId));
            resolve(card);
            return;
          }
        });
        observer.observe(field, { childList: true, subtree: true });
        timer = setTimeout(() => { observer.disconnect(); reject(new Error("Token summon timed out or was cancelled.")); }, timeoutMs);
      });
    }

    #findCarrierCard(root, carrierId) {
      const cards = [];
      if (root.matches?.(".card")) cards.push(root);
      cards.push(...(root.querySelectorAll?.(".card") ?? []));
      return cards.find((card) => Number(card.dataset.yfTokenCarrier ?? 0) === carrierId || [...card.querySelectorAll("img")].some((image) => tokenCarrierFromUrl(image.src) === carrierId)) ?? null;
    }

    #observeTokenChanges(records) {
      for (const record of records) {
        if (record.type === "attributes") {
          const card = record.target.closest?.(".card");
          const carrierId = Number(card?.dataset?.yfTokenCarrier ?? 0);
          if (carrierId && this.variantByCarrier.has(carrierId)) this.#applyTokenSkin(card, this.variantByCarrier.get(carrierId));
          else this.#scanForTokenCarriers(record.target);
        } else {
          for (const node of record.addedNodes) if (node instanceof Element) this.#scanForTokenCarriers(node, true);
        }
      }
    }

    #scanForTokenCarriers(root, announceSummon = false) {
      const images = [];
      const announcedRecipes = new Set();
      if (root.matches?.("#field .card img")) images.push(root);
      images.push(...(root.querySelectorAll?.("#field .card img") ?? []));
      for (const image of images) {
        const carrierId = tokenCarrierFromUrl(image.src);
        const definition = this.variantByCarrier.get(carrierId);
        const card = image.closest(".card");
        if (!definition || !card) continue;
        const wasSkinned = card.dataset.yfTokenCarrier === String(carrierId);
        this.#applyTokenSkin(card, definition);
        if (announceSummon && !wasSkinned) announcedRecipes.add(definition.recipe);
      }
      for (const recipe of announcedRecipes) this.#announceTokenSummon(recipe);
    }

    #announceTokenSummon(recipe) {
      const now = Date.now();
      if (recipe.count > 1 && this.lastSoundRecipe === recipe.id && now - this.lastSoundAt < 15000) return;
      this.lastSoundRecipe = recipe.id;
      this.lastSoundAt = now;
      void this.#playTokenSummonSound();
    }

    #getTokenSummonAudio() {
      if (this.tokenSummonAudio) return this.tokenSummonAudio;
      try {
        this.tokenSummonAudio = new Audio(TOKEN_SUMMON_SOUND_DATA_URL);
        this.tokenSummonAudio.preload = "auto";
        this.tokenSummonAudio.volume = 0.85;
      } catch {
        this.tokenSummonAudio = null;
      }
      return this.tokenSummonAudio;
    }

    #unlockAudio() {
      if (this.audioUnlocked || this.unlockingAudio) return;
      const audio = this.#getTokenSummonAudio();
      if (!audio) return;
      this.unlockingAudio = true;
      const previousVolume = audio.volume;
      audio.volume = 0;
      const attempt = audio.play();
      if (!attempt?.then) {
        audio.pause();
        audio.currentTime = 0;
        audio.volume = previousVolume;
        this.audioUnlocked = true;
        this.unlockingAudio = false;
        return;
      }
      void attempt.then(() => {
        audio.pause();
        audio.currentTime = 0;
        audio.volume = previousVolume;
        this.audioUnlocked = true;
      }).catch(() => {
        audio.volume = previousVolume;
      }).finally(() => { this.unlockingAudio = false; });
    }

    async #playTokenSummonSound() {
      if (this.getSettings()?.muted) return;
      try {
        const audio = this.#getTokenSummonAudio();
        if (!audio) return;
        audio.pause();
        audio.currentTime = 0;
        audio.volume = 0.85;
        await audio.play();
        this.audioUnlocked = true;
        this.diagnostics.info("token-sound", "recorded Token summon sound played");
      } catch (error) {
        this.diagnostics.warn("token-sound", "browser prevented Token summon sound", { reason: String(error?.message ?? error) });
      }
    }

    #applyTokenSkin(card, definition) {
      if (!card || !definition) return;
      const { recipe, variant } = definition;
      card.dataset.yfTokenCarrier = String(variant.carrierId);
      card.dataset.yfTokenRecipe = recipe.id;
      const art = card.querySelector("img.image") ?? [...card.querySelectorAll("img")].find((image) => tokenCarrierFromUrl(image.src) !== null) ?? card.querySelector("img");
      if (art && art.src !== variant.artworkUrl) art.src = variant.artworkUrl;
      card.title = `${recipe.token.name} — ${recipe.token.monsterType}/${recipe.token.attribute}/Level ${recipe.token.level} — ATK ${recipe.token.atk}/DEF ${recipe.token.def}`;
      card.querySelector(":scope > .yf-token-badge")?.remove();
    }

    #handleFieldPreviewRequest(event) {
      const card = event.target?.closest?.(".card");
      if (!card) return;
      const definition = this.variantByCarrier.get(Number(card.dataset.yfTokenCarrier ?? 0));
      clearTimeout(this.previewTimer);
      if (!definition) {
        document.getElementById("preview_txt")?.classList.remove("yf-token-preview-details");
        return;
      }
      // Let DuelingBook populate its normal preview first, then replace only its presentation.
      this.previewTimer = setTimeout(() => this.#showTokenInNativePreview(definition), 0);
    }

    #showTokenInNativePreview(definition) {
      const preview = document.getElementById("preview");
      const details = document.getElementById("preview_txt");
      if (!preview || !details || !definition) return;
      const { recipe, variant } = definition;
      const token = recipe.token;
      const artwork = preview.querySelector("img.pic");
      if (artwork) artwork.setAttribute("src", variant.artworkUrl);
      for (const name of preview.querySelectorAll(".name_txt, .name2_txt")) name.textContent = token.name;
      for (const type of preview.querySelectorAll(".type_txt")) type.textContent = `[${token.monsterType.toUpperCase()} / TOKEN]`;
      for (const attack of preview.querySelectorAll(".card_atk_txt")) attack.textContent = String(token.atk);
      for (const defense of preview.querySelectorAll(".card_def_txt")) defense.textContent = String(token.def);
      for (const effect of preview.querySelectorAll(".effect_txt")) effect.textContent = `This Token was Special Summoned by ${recipe.sourceName}.`;

      details.classList.remove("yf-token-preview-details");
      const scrollViewport = details.querySelector("[data-overlayscrollbars-viewport]");
      const content = scrollViewport ?? details;
      content.replaceChildren();
      const lines = [
        token.name,
        `${token.attribute} • ${token.monsterType} / Token • Level ${token.level}`,
        `ATK ${token.atk} / DEF ${token.def} • ${token.position} Position`,
        `Special Summoned by ${recipe.sourceName}.`
      ];
      lines.forEach((line, index) => {
        content.append(document.createTextNode(line));
        if (index + 1 < lines.length) content.append(document.createElement("br"));
      });
      if (scrollViewport) scrollViewport.scrollTop = 0;
    }

    #showToast(message, error = false) {
      this.toast?.remove();
      this.toast = document.createElement("div");
      this.toast.id = APP.ids.tokenToast;
      this.toast.className = error ? "yf-token-error" : "";
      this.toast.textContent = message;
      document.body.append(this.toast);
      const current = this.toast;
      setTimeout(() => { if (this.toast === current) { current.remove(); this.toast = null; } }, error ? 6500 : 4200);
    }

    #waitFor(predicate, timeoutMs) {
      return new Promise((resolve) => {
        const started = Date.now();
        const check = () => {
          let value = null;
          try { value = predicate(); } catch { value = null; }
          if (value) return resolve(value);
          if (Date.now() - started >= timeoutMs) return resolve(null);
          setTimeout(check, 100);
        };
        check();
      });
    }

    #delay(milliseconds) { return new Promise((resolve) => setTimeout(resolve, milliseconds)); }

    #isVisible(element) {
      if (!(element instanceof HTMLElement) || element.hidden) return false;
      const style = getComputedStyle(element);
      return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0" && element.getClientRects().length > 0;
    }
  }

  const CHAIN_LINKS = Object.freeze([1, 2, 3, 4, 5, 6, 7, 8]);
  const CHAIN_SOUND_DATA_URL = "data:audio/mpeg;base64,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wxrik6i7oqCq0+2ug4JjqejoNAVjlzmLfbBFYg/bGodcFhDmF5HUTrc6Kx6MKmalTP4ttJ4LgJouO/cLyWmjZlPzFmH44qo8Sg7JE4RGApxUahD7avq78ORibu5RONLddXJXbT38UAW7G325Fqr6QI+kjvS+Lxixd7SHhcIASUBwkU26LdSTd104egOMww9BUVS6UDeVMe5SWKPb0pfpev3Q5peo1LMWKl0nAF2VKGcF3H0TEdpUk5DrqUcxc1P41HcgR64pN3c6WGZd+VvU7lZaYzeDpE+TW5i5hYnJ6kjd/7sv7rHv////////////////////////////////4/SYVwyvzda+Z6N6EXAwBAMBAMDA0SQ4VwTFSErDs1Mt81mB5VKQumj8dWpoAraAwYONLZFgGo8j+nikVAIOLiwtK1HqVM4cBeifc9CVntinYhF2MS2MrIewvIxAvm98VrYsSfOfa4juVQANCI2uXA7rydW9Gy/fmMZfMIIG7JXqWJQioRcEoaBJ2SwC48ORiV18t0ytLBa661rvwmIx2bbtWc+bfSDnQkV6fgeWYXeWDgPBEJKoJcxd90FwCwOHZLFn3kLocITKYyc72J71KTC3XfUtWia49LbSFT6UgnSnkX4EaVuCmBbBxFSQ0uyEQl1JfYran6uEORRhMCXZLQyl2ZF2mkeEhuUq6Fa4RB7UGHvpKLFicnrETt///DFm3/////////////////////////////////00Y+vM5f6rq4dVNQADTSQ+VrMQI+gSUNRRTVcpEFYRkTFJLH4ecV2zQIC7W1Zu8DF74xX53nECDvLZakONAUafxeFXD+C1UcKs/a32r/Ueyv1mXGzz1b3k1v414kGLrXtiySCPCWJLJd+knGLFtXMOK4y2tSBjXza9IO9Z09pl5e+6wmSG2u6LSoQA+xtYe4mfysWmiVnck43v41H9Xbg7bLuUTcB9i+I1X7JLS9HL1s9j29Z8qcDia0rhZP9V1cOyJEAEAIPoToxgFhTiIkxFxGKdQnpKDeMRvb1chLtmYIks8Tw6Yv3mHurz58CDarZakPdGdjtfFferd4lY/lhav9Xs/1802t6tiG2a3v67yDB1q08m2oW4pjhtd+3OotbZrDixZd2xjf+d7pX6+q4zS991hMkNrc6LUywX8rbVtM/zC045c3zBDjz0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";

  function chainLinkMessage(link) {
    return CHAIN_LINKS.includes(Number(link)) ? `⛓️ Chain Link ${Number(link)}` : "";
  }

  const CHAIN_MACRO_STYLE = `
    #${APP.ids.chainButton} { position: fixed; right: 14px; top: calc(50% + 49px); z-index: 2147483645; transform: translateY(-50%); border: 1px solid #f9a8d4; border-radius: 9px 0 0 9px; background: linear-gradient(145deg,#831843,#312e81); color: #fff1f2; padding: 11px 9px; writing-mode: vertical-rl; letter-spacing: .12em; font: 900 12px/1 Arial,sans-serif; box-shadow: 0 5px 20px #000a,0 0 16px #f472b644; cursor: pointer; }
    #${APP.ids.chainButton}[hidden] { display: none; }
    #${APP.ids.chainMenu} { position: fixed; right: 58px; top: 50%; z-index: 2147483646; width: 218px; transform: translateY(-50%); border: 1px solid #f9a8d4; border-radius: 12px; background: linear-gradient(145deg,#190b20f5,#172554f5); color: #fff; padding: 12px; box-shadow: 0 16px 44px #000d,0 0 24px #f472b633; font: 14px/1.3 Arial,sans-serif; }
    #${APP.ids.chainMenu}[hidden] { display: none; }
    #${APP.ids.chainMenu} strong { display: block; margin-bottom: 9px; color: #fce7f3; text-align: center; font-size: 16px; }
    #${APP.ids.chainMenu} .yf-chain-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    #${APP.ids.chainMenu} button { border: 1px solid #a78bfa; border-radius: 8px; background: linear-gradient(135deg,#4c1d95,#9d174d); color: #fff; padding: 9px 7px; cursor: pointer; font-weight: 850; }
    #${APP.ids.chainMenu} button:hover, #${APP.ids.chainMenu} button:focus-visible { border-color: #fbcfe8; filter: brightness(1.16); }
    #${APP.ids.chainToast} { position: fixed; right: 58px; top: calc(50% + 140px); z-index: 2147483647; width: min(330px,calc(100vw - 80px)); border: 1px solid #f9a8d4; border-radius: 9px; background: #500724ee; color: #fff1f2; padding: 10px 12px; text-align: center; font: 750 13px/1.35 Arial,sans-serif; box-shadow: 0 8px 24px #000c; }
    .duel_avatar > .yf-chain-flash { pointer-events: none; position: absolute; inset: 0; z-index: 9999; display: grid; place-items: center; color: #fff; font-size: 68px; line-height: 1; text-shadow: 0 0 7px #fff,0 0 17px #f472b6,0 0 30px #7c3aed; filter: drop-shadow(0 5px 5px #000b); animation: yf-chain-avatar-flash 1050ms ease-out both; }
    .duel_avatar > .yf-chain-flash.yf-chain-reduced { animation: yf-chain-avatar-fade 900ms ease-out both; }
    @keyframes yf-chain-avatar-flash { 0% { opacity: 0; transform: scale(.25) rotate(-25deg); } 22% { opacity: 1; transform: scale(1.24) rotate(8deg); } 45% { transform: scale(.92) rotate(-4deg); } 68% { opacity: 1; transform: scale(1.1) rotate(3deg); } 100% { opacity: 0; transform: scale(.72) rotate(0); } }
    @keyframes yf-chain-avatar-fade { 0%,100% { opacity: 0; } 20%,70% { opacity: 1; } }
    @media (max-width: 650px) { #${APP.ids.chainButton} { right: 4px; } #${APP.ids.chainMenu} { right: 48px; } }
  `;

  class ChainMacros {
    constructor(diagnostics, getSettings) {
      this.diagnostics = diagnostics;
      this.getSettings = getSettings;
      this.button = null;
      this.menu = null;
      this.toast = null;
      this.chatObserver = null;
      this.seenMessageIds = new Set();
      this.chainAudio = null;
      this.audioUnlocked = false;
      this.unlockingAudio = false;
    }

    mount() {
      if (document.getElementById(APP.ids.chainButton)) return;
      const style = document.createElement("style");
      style.textContent = CHAIN_MACRO_STYLE;
      document.head.append(style);

      this.button = document.createElement("button");
      this.button.id = APP.ids.chainButton;
      this.button.type = "button";
      this.button.textContent = "CHAIN";
      this.button.title = "Open YugiFaux Chain messages";
      this.button.addEventListener("click", () => this.toggle());
      document.body.append(this.button);

      this.menu = document.createElement("section");
      this.menu.id = APP.ids.chainMenu;
      this.menu.hidden = true;
      this.menu.setAttribute("aria-label", "Chain messages");
      const title = document.createElement("strong");
      title.textContent = "⛓️ Declare Chain Link";
      const grid = document.createElement("div");
      grid.className = "yf-chain-grid";
      for (const link of CHAIN_LINKS) {
        const command = document.createElement("button");
        command.type = "button";
        command.textContent = `Chain Link ${link}`;
        command.addEventListener("click", () => this.#send(link));
        grid.append(command);
      }
      this.menu.append(title, grid);
      document.body.append(this.menu);

      document.addEventListener("pointerdown", () => this.#unlockAudio(), { capture: true });
      document.addEventListener("keydown", (event) => {
        this.#unlockAudio();
        if (event.key === "Escape") this.close();
      });
      this.#observeChat();
      setInterval(() => this.refresh(), 750);
      this.refresh();
    }

    refresh() {
      if (!this.button) return;
      const enabled = Boolean(this.getSettings()?.enabled);
      const inDuel = this.#isVisible(document.querySelector("#duel"));
      this.button.hidden = !enabled || !inDuel;
      if (this.button.hidden) this.close();
    }

    toggle() {
      if (!this.menu || this.button?.hidden) return;
      this.menu.hidden = !this.menu.hidden;
      this.button.setAttribute("aria-expanded", String(!this.menu.hidden));
    }

    close() {
      if (!this.menu) return;
      this.menu.hidden = true;
      this.button?.setAttribute("aria-expanded", "false");
    }

    #send(link) {
      const message = chainLinkMessage(link);
      const input = this.#findChatInput();
      if (!message || !input) {
        this.#showToast("DuelingBook’s duel chat is unavailable.");
        return;
      }
      if (input.value.trim()) {
        this.#showToast("Your chat box already contains text. Send or clear it before using a Chain message.");
        input.focus();
        return;
      }

      input.focus();
      input.value = message;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new KeyboardEvent("keydown", {
        key: "Enter",
        code: "Enter",
        keyCode: 13,
        which: 13,
        bubbles: true,
        cancelable: true
      }));
      this.close();
      setTimeout(() => {
        if (input.value !== message) return;
        this.#showToast("The message is ready in DuelingBook’s chat box. Press Enter to send it.");
        input.focus();
      }, 120);
      this.diagnostics.info("chain-macro", "player requested visible chain message", { link: Number(link) });
    }

    #findChatInput() {
      const selectors = [
        "#duel #cin_txt",
        "#duel .cin_txt",
        "#cin_txt",
        ".cin_txt"
      ];
      const candidates = [];
      for (const selector of selectors) {
        for (const candidate of document.querySelectorAll(selector)) {
          if (!candidates.includes(candidate)) candidates.push(candidate);
        }
      }
      return candidates.find((candidate) => this.#isUsableChatInput(candidate)) ?? null;
    }

    #isUsableChatInput(candidate) {
      if (!(candidate instanceof Element) || !candidate.matches('input[type="text"], textarea')) return false;
      if (candidate.disabled || candidate.readOnly || candidate.getClientRects().length === 0) return false;
      const style = getComputedStyle(candidate);
      // DuelingBook deliberately sets the native input's opacity to zero and
      // renders the visible white chat field through its custom UI layer.
      return style.display !== "none" && style.visibility !== "hidden";
    }

    #observeChat() {
      const chat = document.querySelector("#duel .cout_txt");
      if (!chat || this.chatObserver) return;
      for (const message of chat.querySelectorAll("font[message-id]")) {
        const id = message.getAttribute("message-id");
        if (id) this.#rememberMessage(id);
      }
      this.chatObserver = new MutationObserver((records) => {
        for (const record of records) for (const node of record.addedNodes) this.#inspectChatNode(node);
      });
      this.chatObserver.observe(chat, { childList: true, subtree: true });
    }

    #inspectChatNode(node) {
      if (!(node instanceof Element) || !this.getSettings()?.enabled) return;
      const rows = [];
      if (node.matches("span")) rows.push(node);
      rows.push(...node.querySelectorAll("span"));
      for (const row of rows) {
        const messageElement = row.querySelector("font[message-id]");
        if (!messageElement) continue;
        const messageId = messageElement.getAttribute("message-id");
        if (messageId && this.seenMessageIds.has(messageId)) continue;
        if (messageId) this.#rememberMessage(messageId);
        const message = messageElement.textContent.trim();
        if (!/^⛓️\s*Chain Link [1-8]$/iu.test(message)) continue;
        void this.#playChainSound();
        const username = row.querySelector("b font")?.textContent?.replace(/:\s*$/, "").trim();
        if (username) this.#flashAvatar(username);
      }
    }

    #getChainAudio() {
      if (this.chainAudio) return this.chainAudio;
      try {
        this.chainAudio = new Audio(CHAIN_SOUND_DATA_URL);
        this.chainAudio.preload = "auto";
        this.chainAudio.volume = 0.85;
      } catch {
        this.chainAudio = null;
      }
      return this.chainAudio;
    }

    #unlockAudio() {
      if (this.audioUnlocked || this.unlockingAudio) return;
      const audio = this.#getChainAudio();
      if (!audio) return;
      this.unlockingAudio = true;
      const previousVolume = audio.volume;
      audio.volume = 0;
      const attempt = audio.play();
      if (!attempt?.then) {
        audio.pause();
        audio.currentTime = 0;
        audio.volume = previousVolume;
        this.audioUnlocked = true;
        this.unlockingAudio = false;
        return;
      }
      void attempt.then(() => {
        audio.pause();
        audio.currentTime = 0;
        audio.volume = previousVolume;
        this.audioUnlocked = true;
      }).catch(() => {
        audio.volume = previousVolume;
      }).finally(() => { this.unlockingAudio = false; });
    }

    async #playChainSound() {
      if (this.getSettings()?.muted) return;
      try {
        const audio = this.#getChainAudio();
        if (!audio) return;
        audio.pause();
        audio.currentTime = 0;
        audio.volume = 0.85;
        await audio.play();
        this.audioUnlocked = true;
        this.diagnostics.info("chain-sound", "recorded synchronized chain sound played");
      } catch (error) {
        this.diagnostics.warn("chain-sound", "browser prevented chain sound", { reason: String(error?.message ?? error) });
      }
    }

    #rememberMessage(messageId) {
      this.seenMessageIds.add(String(messageId));
      if (this.seenMessageIds.size <= 150) return;
      this.seenMessageIds.delete(this.seenMessageIds.values().next().value);
    }

    #flashAvatar(username) {
      const normalized = username.trim().toLowerCase();
      let avatar = null;
      for (const candidate of document.querySelectorAll("#avatar1, #avatar2, #avatar3, #avatar4")) {
        const names = (candidate.querySelector(".username_txt")?.textContent ?? "")
          .split(/\s*(?:&|\/)\s*/)
          .map((name) => name.trim().toLowerCase());
        if (names.includes(normalized)) { avatar = candidate; break; }
      }
      if (!avatar) return;
      avatar.querySelector(":scope > .yf-chain-flash")?.remove();
      const flash = document.createElement("div");
      flash.className = "yf-chain-flash";
      if (this.getSettings()?.reducedMotion) flash.classList.add("yf-chain-reduced");
      flash.textContent = "⛓️";
      avatar.append(flash);
      flash.addEventListener("animationend", () => flash.remove(), { once: true });
      setTimeout(() => flash.remove(), 1400);
    }

    #showToast(message) {
      this.toast?.remove();
      this.toast = document.createElement("div");
      this.toast.id = APP.ids.chainToast;
      this.toast.textContent = message;
      document.body.append(this.toast);
      const current = this.toast;
      setTimeout(() => { if (this.toast === current) { current.remove(); this.toast = null; } }, 5200);
    }

    #isVisible(element) {
      if (!(element instanceof HTMLElement) || element.hidden) return false;
      const style = getComputedStyle(element);
      return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0" && element.getClientRects().length > 0;
    }
  }

  const MARKER_PRESETS = Object.freeze([
    Object.freeze({ id: "negated", label: "Effect Negated", shortLabel: "NEG", icon: "Ø" }),
    Object.freeze({ id: "cannot-attack", label: "Cannot Attack", shortLabel: "NO ATK", icon: "⚔" }),
    Object.freeze({ id: "cannot-activate", label: "Cannot Activate Effects", shortLabel: "NO FX", icon: "✦" }),
    Object.freeze({ id: "position-locked", label: "Cannot Change Battle Position", shortLabel: "LOCK", icon: "◆" }),
    Object.freeze({ id: "return-end-phase", label: "Return in End Phase", shortLabel: "RETURN EP", icon: "↶" }),
    Object.freeze({ id: "custom", label: "Custom Reminder", shortLabel: "NOTE", icon: "!" })
  ]);

  function normalizeMarkerText(value, maximum = 100, replaceDash = true) {
    const normalized = String(value ?? "")
      .replace(/[\r\n]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return (replaceDash ? normalized.replaceAll("—", "-") : normalized).slice(0, maximum);
  }

  function formatMarkerChatMessage(marker, action = "apply") {
    const controller = normalizeMarkerText(marker?.controller, 40);
    const zone = String(marker?.zone ?? "").toUpperCase();
    const cardName = normalizeMarkerText(marker?.cardName, 120, false);
    const label = normalizeMarkerText(marker?.label, 60);
    if (!cardName || !label) return "";
    const hasLocation = controller && /^(?:M[1-5]|S[1-5]|F|EL|ER)$/.test(zone);
    if (marker?.includeLocation && !hasLocation) return "";
    const location = marker?.includeLocation ? ` [${controller} ${zone}]` : "";
    if (action === "clear") return `✅ ${cardName}${location} — ${label} (Cleared)`;
    const expiration = marker?.expiration === "end-phase" ? "Until End Phase" : "Manual";
    return `‼️ ${cardName}${location} — ${label} (${expiration})`;
  }

  function parseMarkerChatMessage(value) {
    const text = String(value ?? "").replace(/\s+/g, " ").trim();
    const appliedLocated = text.match(/^‼️ (.+) \[([^\]]{1,40}) (M[1-5]|S[1-5]|F|EL|ER)\] — (.{1,60}) \((Until End Phase|Manual)\)$/u);
    const appliedSimple = appliedLocated ? null : text.match(/^‼️ (.+) — (.{1,60}) \((Until End Phase|Manual)\)$/u);
    if (appliedLocated || appliedSimple) {
      return {
        action: "apply",
        cardName: (appliedLocated?.[1] ?? appliedSimple[1]).trim(),
        controller: appliedLocated?.[2]?.trim() ?? "",
        zone: appliedLocated?.[3] ?? "",
        label: (appliedLocated?.[4] ?? appliedSimple[2]).trim(),
        expiration: (appliedLocated?.[5] ?? appliedSimple[3]) === "Until End Phase" ? "end-phase" : "manual"
      };
    }
    const clearedLocated = text.match(/^✅ (.+) \[([^\]]{1,40}) (M[1-5]|S[1-5]|F|EL|ER)\] — (.{1,60}) \(Cleared\)$/u);
    const clearedSimple = clearedLocated ? null : text.match(/^✅ (.+) — (.{1,60}) \(Cleared\)$/u);
    return clearedLocated || clearedSimple ? {
      action: "clear",
      cardName: (clearedLocated?.[1] ?? clearedSimple[1]).trim(),
      controller: clearedLocated?.[2]?.trim() ?? "",
      zone: clearedLocated?.[3] ?? "",
      label: (clearedLocated?.[4] ?? clearedSimple[2]).trim(),
      expiration: "manual"
    } : null;
  }

  const MARKER_STYLE = `
    #${APP.ids.markerButton} { position: fixed; right: 14px; top: calc(50% + 245px); z-index: 2147483645; transform: translateY(-50%); border: 1px solid #fcd34d; border-radius: 9px 0 0 9px; background: linear-gradient(145deg,#78350f,#4c1d95); color: #fffbeb; padding: 11px 9px; writing-mode: vertical-rl; letter-spacing: .1em; font: 900 12px/1 Arial,sans-serif; box-shadow: 0 5px 20px #000a,0 0 16px #facc1544; cursor: pointer; }
    #${APP.ids.markerButton}[hidden] { display: none; }
    #${APP.ids.markerPanel} { position: fixed; right: 58px; top: 50%; z-index: 2147483646; box-sizing: border-box; width: min(360px,calc(100vw - 78px)); max-height: min(78vh,720px); overflow: auto; transform: translateY(-50%); border: 1px solid #fcd34d; border-radius: 13px; background: linear-gradient(145deg,#1c1209f8,#172554f8 58%,#3b1654f8); color: #fff; padding: 13px; box-shadow: 0 18px 50px #000e,0 0 25px #facc1530; font: 13px/1.35 Arial,sans-serif; }
    #${APP.ids.markerPanel} * { box-sizing: border-box; }
    #${APP.ids.markerPanel} header { display: flex; align-items: center; justify-content: space-between; gap: 10px; border-bottom: 1px solid #fcd34d55; padding-bottom: 8px; }
    #${APP.ids.markerPanel} h2, #${APP.ids.markerPanel} h3 { margin: 0; }
    #${APP.ids.markerPanel} h2 { color: #fef3c7; font-size: 17px; }
    #${APP.ids.markerPanel} h3 { margin-top: 13px; color: #fde68a; font-size: 12px; text-transform: uppercase; letter-spacing: .08em; }
    #${APP.ids.markerPanel} button, #${APP.ids.markerPanel} select, #${APP.ids.markerPanel} input { border: 1px solid #64748b; border-radius: 7px; background: #111827; color: #fff; padding: 8px; font: inherit; }
    #${APP.ids.markerPanel} button { cursor: pointer; font-weight: 750; }
    #${APP.ids.markerPanel} button:hover, #${APP.ids.markerPanel} button:focus-visible { border-color: #fde68a; filter: brightness(1.14); }
    #${APP.ids.markerPanel} .yf-marker-close { border: 0; background: transparent; padding: 0 4px; color: #e2e8f0; font-size: 25px; line-height: 1; }
    #${APP.ids.markerPanel} .yf-marker-presets { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; margin-top: 8px; }
    #${APP.ids.markerPanel} .yf-marker-presets button { display: flex; align-items: center; gap: 7px; min-width: 0; overflow-wrap: anywhere; text-align: left; background: linear-gradient(135deg,#312e81,#713f12); }
    #${APP.ids.markerPanel} .yf-marker-preset-icon { display: grid; flex: 0 0 25px; width: 25px; height: 25px; place-items: center; border: 1px solid #fff7; border-radius: 50%; background: #02061777; color: #fff; font: 900 15px/1 Georgia,serif; box-shadow: 0 0 9px #facc1533; }
    #${APP.ids.markerPanel} .yf-marker-presets button[aria-pressed="true"] { border-color: #fef08a; background: linear-gradient(135deg,#6d28d9,#b45309); box-shadow: 0 0 0 1px #facc1566 inset; }
    #${APP.ids.markerPanel} .yf-marker-custom { display: block; width: 100%; margin-top: 8px; }
    #${APP.ids.markerPanel} .yf-marker-options { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px; }
    #${APP.ids.markerPanel} label { display: grid; gap: 4px; color: #e2e8f0; }
    #${APP.ids.markerPanel} .yf-marker-share { display: flex; align-items: center; gap: 7px; margin-top: 10px; }
    #${APP.ids.markerPanel} .yf-marker-share input { width: auto; }
    #${APP.ids.markerPanel} .yf-marker-selected { margin-top: 10px; border: 1px solid #60a5fa66; border-radius: 8px; background: #172554aa; padding: 9px; color: #dbeafe; }
    #${APP.ids.markerPanel} .yf-marker-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px; }
    #${APP.ids.markerPanel} .yf-marker-select { background: linear-gradient(135deg,#1d4ed8,#6d28d9); }
    #${APP.ids.markerPanel} .yf-marker-apply { border-color: #fde68a; background: linear-gradient(135deg,#b45309,#6d28d9); }
    #${APP.ids.markerPanel} .yf-marker-active-list { display: grid; gap: 7px; margin-top: 8px; }
    #${APP.ids.markerPanel} .yf-marker-active { display: grid; grid-template-columns: 1fr auto; gap: 8px; align-items: center; border: 1px solid #475569; border-radius: 8px; background: #0f172acc; padding: 8px; }
    #${APP.ids.markerPanel} .yf-marker-active strong, #${APP.ids.markerPanel} .yf-marker-active small { display: block; }
    #${APP.ids.markerPanel} .yf-marker-active small { margin-top: 2px; color: #cbd5e1; }
    #${APP.ids.markerPanel} .yf-marker-empty { color: #94a3b8; text-align: center; }
    #${APP.ids.markerToast} { position: fixed; right: 58px; bottom: 18px; z-index: 2147483647; width: min(390px,calc(100vw - 80px)); border: 1px solid #fcd34d; border-radius: 9px; background: #451a03ef; color: #fffbeb; padding: 10px 12px; text-align: center; font: 750 13px/1.35 Arial,sans-serif; box-shadow: 0 8px 24px #000c; }
    #${APP.ids.markerToast}.yf-marker-error { border-color: #f87171; background: #450a0aef; color: #fee2e2; }
    #${APP.ids.markerBadgeLayer} { position: fixed; inset: 0; z-index: 2147483642; pointer-events: none; }
    #${APP.ids.markerBadgeLayer} .yf-marker-stack { position: fixed; display: flex; align-items: center; gap: 3px; }
    #${APP.ids.markerBadgeLayer} .yf-marker-stack[data-orientation="attack"] { flex-direction: column; width: 22px; }
    #${APP.ids.markerBadgeLayer} .yf-marker-stack[data-orientation="defense"] { flex-direction: row; width: auto; height: 22px; }
    #${APP.ids.markerBadgeLayer} .yf-marker-chip { --yf-marker-color: 180,83,9; pointer-events: auto; position: relative; display: grid; flex: 0 0 21px; width: 21px; height: 21px; place-items: center; border: 1px solid #fff9; border-radius: 50%; background: linear-gradient(145deg,rgba(var(--yf-marker-color),.94),rgba(15,23,42,.9)); color: #fff; font: 900 13px/1 Georgia,serif; text-shadow: 0 1px 2px #000; box-shadow: 0 2px 6px #000c,0 0 8px rgba(var(--yf-marker-color),.65),inset 0 1px 2px #fff5; backdrop-filter: blur(4px); }
    #${APP.ids.markerBadgeLayer} .yf-marker-chip::after { content: ""; position: absolute; inset: 2px; border: 1px solid #ffffff42; border-radius: inherit; }
    #${APP.ids.markerBadgeLayer} .yf-marker-chip[data-status="negated"] { --yf-marker-color: 185,28,28; }
    #${APP.ids.markerBadgeLayer} .yf-marker-chip[data-status="cannot-attack"] { --yf-marker-color: 220,38,38; }
    #${APP.ids.markerBadgeLayer} .yf-marker-chip[data-status="cannot-activate"] { --yf-marker-color: 126,34,206; }
    #${APP.ids.markerBadgeLayer} .yf-marker-chip[data-status="position-locked"] { --yf-marker-color: 29,78,216; }
    #${APP.ids.markerBadgeLayer} .yf-marker-chip[data-status="return-end-phase"] { --yf-marker-color: 5,150,105; }
    #${APP.ids.markerBadgeLayer} .yf-marker-tooltip { pointer-events: none; position: absolute; right: 26px; top: 50%; width: max-content; max-width: 190px; transform: translateY(-50%) translateX(4px); border: 1px solid rgba(var(--yf-marker-color),.8); border-radius: 7px; background: #07111ff2; color: #f8fafc; padding: 6px 8px; opacity: 0; visibility: hidden; white-space: normal; text-align: left; font: 700 11px/1.25 Arial,sans-serif; text-shadow: none; box-shadow: 0 6px 18px #000d,0 0 12px rgba(var(--yf-marker-color),.35); transition: opacity 120ms ease,transform 120ms ease,visibility 120ms; }
    #${APP.ids.markerBadgeLayer} .yf-marker-tooltip strong, #${APP.ids.markerBadgeLayer} .yf-marker-tooltip small { display: block; }
    #${APP.ids.markerBadgeLayer} .yf-marker-tooltip small { margin-top: 2px; color: #cbd5e1; font-weight: 600; }
    #${APP.ids.markerBadgeLayer} .yf-marker-chip:hover .yf-marker-tooltip { opacity: 1; visibility: visible; transform: translateY(-50%) translateX(0); }
    @media (prefers-reduced-motion: reduce) { #${APP.ids.markerBadgeLayer} .yf-marker-tooltip { transition: none; } }
    .yf-marker-selectable { outline: 3px solid #facc15 !important; outline-offset: 3px; filter: drop-shadow(0 0 8px #facc15) !important; cursor: crosshair !important; }
    @media (max-width: 650px) { #${APP.ids.markerButton} { right: 4px; top: calc(50% + 215px); } #${APP.ids.markerPanel} { right: 48px; } }
  `;

  class MarkerTracker {
    constructor(diagnostics, getSettings) {
      this.diagnostics = diagnostics;
      this.getSettings = getSettings;
      this.button = null;
      this.panel = null;
      this.toast = null;
      this.badgeLayer = null;
      this.markers = new Map();
      this.selectedCardId = "";
      this.selecting = false;
      this.draftStatusId = "negated";
      this.draftCustomText = "";
      this.draftExpiration = "manual";
      this.draftPublic = true;
      this.chatRoot = null;
      this.chatObserver = null;
      this.seenMessageIds = new Set();
    }

    mount() {
      if (document.getElementById(APP.ids.markerButton)) return;
      const style = document.createElement("style");
      style.textContent = MARKER_STYLE;
      document.head.append(style);

      this.button = document.createElement("button");
      this.button.id = APP.ids.markerButton;
      this.button.type = "button";
      this.button.textContent = "MARKERS";
      this.button.title = "Open YugiFaux card reminders";
      this.button.addEventListener("click", () => this.toggle());
      document.body.append(this.button);

      this.badgeLayer = document.createElement("div");
      this.badgeLayer.id = APP.ids.markerBadgeLayer;
      this.badgeLayer.setAttribute("aria-hidden", "true");
      document.body.append(this.badgeLayer);

      document.addEventListener("click", (event) => this.#handleCardSelection(event), true);
      document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        if (this.selecting) this.#stopSelecting();
        else this.close();
      });
      setInterval(() => this.refresh(), 500);
      this.refresh();
    }

    refresh() {
      if (!this.button) return;
      const inDuel = this.#isVisible(document.querySelector("#duel"));
      this.button.hidden = !this.getSettings()?.enabled || !inDuel;
      if (!inDuel) {
        this.close();
        this.#clearAll(false);
        return;
      }
      if (this.button.hidden) this.close();
      this.#attachChat();
      const changed = this.#syncMarkers();
      this.#renderBadges();
      if (changed && this.panel) this.#renderPanel();
    }

    handlePublicEvent(event) {
      if (event?.type !== "end-phase" || !this.getSettings()?.enabled) return;
      let removed = 0;
      for (const [key, marker] of this.markers) {
        if (marker.expiration !== "end-phase") continue;
        this.markers.delete(key);
        removed += 1;
      }
      if (!removed) return;
      this.#renderBadges();
      if (this.panel) this.#renderPanel();
      this.#showToast(`${removed} End Phase reminder${removed === 1 ? "" : "s"} expired.`);
      this.diagnostics.info("markers", "End Phase reminders expired", { count: removed });
    }

    toggle() {
      if (this.panel) this.close();
      else this.#renderPanel();
    }

    close() {
      this.panel?.remove();
      this.panel = null;
      this.#stopSelecting(false);
    }

    #renderPanel() {
      this.panel?.remove();
      const panel = document.createElement("section");
      panel.id = APP.ids.markerPanel;
      panel.setAttribute("aria-label", "Card markers and reminders");
      const header = document.createElement("header");
      const title = document.createElement("h2");
      title.textContent = "🏷️ Card Markers";
      const close = document.createElement("button");
      close.type = "button";
      close.className = "yf-marker-close";
      close.setAttribute("aria-label", "Close Markers");
      close.textContent = "×";
      close.addEventListener("click", () => this.close());
      header.append(title, close);

      const markerHeading = document.createElement("h3");
      markerHeading.textContent = "Choose a reminder";
      const presets = document.createElement("div");
      presets.className = "yf-marker-presets";
      for (const preset of MARKER_PRESETS) {
        const button = document.createElement("button");
        button.type = "button";
        const icon = document.createElement("span");
        icon.className = "yf-marker-preset-icon";
        icon.textContent = preset.icon;
        const buttonLabel = document.createElement("span");
        buttonLabel.textContent = preset.label;
        button.append(icon, buttonLabel);
        button.setAttribute("aria-pressed", String(this.draftStatusId === preset.id));
        button.addEventListener("click", () => {
          this.draftStatusId = preset.id;
          if (preset.id === "return-end-phase") this.draftExpiration = "end-phase";
          this.#renderPanel();
        });
        presets.append(button);
      }

      panel.append(header, markerHeading, presets);
      if (this.draftStatusId === "custom") {
        const custom = document.createElement("input");
        custom.className = "yf-marker-custom";
        custom.type = "text";
        custom.maxLength = 60;
        custom.placeholder = "Short reminder (60 characters maximum)";
        custom.value = this.draftCustomText;
        custom.addEventListener("input", () => { this.draftCustomText = custom.value; });
        panel.append(custom);
      }

      const options = document.createElement("div");
      options.className = "yf-marker-options";
      const durationLabel = document.createElement("label");
      durationLabel.append(document.createTextNode("Duration"));
      const duration = document.createElement("select");
      for (const [value, label] of [["manual", "Manual removal"], ["end-phase", "Until End Phase"]]) {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = label;
        option.selected = this.draftExpiration === value;
        duration.append(option);
      }
      duration.disabled = this.draftStatusId === "return-end-phase";
      duration.addEventListener("change", () => { this.draftExpiration = duration.value; });
      durationLabel.append(duration);
      options.append(durationLabel);
      panel.append(options);

      const share = document.createElement("label");
      share.className = "yf-marker-share";
      const shareInput = document.createElement("input");
      shareInput.type = "checkbox";
      shareInput.checked = this.draftPublic;
      shareInput.addEventListener("change", () => { this.draftPublic = shareInput.checked; });
      share.append(shareInput, document.createTextNode("Visible to both players (uses duel chat)"));
      panel.append(share);

      const selected = this.#fieldEntries().find((entry) => entry.cardId === this.selectedCardId);
      const selectedBox = document.createElement("div");
      selectedBox.className = "yf-marker-selected";
      selectedBox.textContent = selected
        ? `Selected: ${selected.cardName} — ${selected.controller} ${selected.zone}`
        : this.selecting ? "Selection active: click a face-up field card." : "No card selected.";
      panel.append(selectedBox);

      const actions = document.createElement("div");
      actions.className = "yf-marker-actions";
      const selectCard = document.createElement("button");
      selectCard.type = "button";
      selectCard.className = "yf-marker-select";
      selectCard.textContent = this.selecting ? "Cancel Selection" : "Select Field Card";
      selectCard.addEventListener("click", () => this.selecting ? this.#stopSelecting() : this.#startSelecting());
      const apply = document.createElement("button");
      apply.type = "button";
      apply.className = "yf-marker-apply";
      apply.textContent = "Apply Marker";
      apply.disabled = !selected;
      apply.addEventListener("click", () => this.#applyDraft());
      actions.append(selectCard, apply);
      panel.append(actions);

      const activeHeading = document.createElement("h3");
      activeHeading.textContent = `Active reminders (${this.markers.size})`;
      const activeList = document.createElement("div");
      activeList.className = "yf-marker-active-list";
      if (!this.markers.size) {
        const empty = document.createElement("p");
        empty.className = "yf-marker-empty";
        empty.textContent = "No active reminders.";
        activeList.append(empty);
      }
      for (const marker of this.markers.values()) {
        const item = document.createElement("div");
        item.className = "yf-marker-active";
        const copy = document.createElement("div");
        const name = document.createElement("strong");
        name.textContent = `${marker.icon ?? "!"} ${marker.label}`;
        const details = document.createElement("small");
        const location = marker.offField ? "Banished / off field" : `${marker.controller} ${marker.zone}`;
        details.textContent = `${marker.cardName} — ${location} — ${marker.expiration === "end-phase" ? "until End Phase" : "manual"}${marker.public ? " — public" : " — private"}`;
        copy.append(name, details);
        const remove = document.createElement("button");
        remove.type = "button";
        remove.textContent = "Remove";
        remove.addEventListener("click", () => this.#removeMarker(marker));
        item.append(copy, remove);
        activeList.append(item);
      }
      panel.append(activeHeading, activeList);
      document.body.append(panel);
      this.panel = panel;
    }

    #startSelecting() {
      const entries = this.#fieldEntries();
      if (!entries.length) return this.#showToast("No face-up field cards are available to mark.", true);
      this.selecting = true;
      for (const entry of entries) (entry.visualElement ?? entry.element).classList.add("yf-marker-selectable");
      this.#showToast("Click a face-up card on the field.");
      this.#renderPanel();
    }

    #stopSelecting(render = true) {
      this.selecting = false;
      for (const element of document.querySelectorAll(".yf-marker-selectable")) element.classList.remove("yf-marker-selectable");
      if (render && this.panel) this.#renderPanel();
    }

    #handleCardSelection(event) {
      if (!this.selecting || this.panel?.contains(event.target) || event.target === this.button) return;
      const target = event.target instanceof Element ? event.target : null;
      const selected = this.#fieldEntries().find((entry) => entry.element === target?.closest(".card") || entry.element.contains(target));
      if (!selected) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      this.selectedCardId = selected.cardId;
      this.#stopSelecting(false);
      this.#showToast(`Selected ${selected.cardName}.`);
      if (this.panel) this.#renderPanel();
    }

    #applyDraft() {
      const entry = this.#fieldEntries().find((candidate) => candidate.cardId === this.selectedCardId);
      if (!entry) return this.#showToast("Select a face-up card that is still on the field.", true);
      const preset = MARKER_PRESETS.find((candidate) => candidate.id === this.draftStatusId) ?? MARKER_PRESETS[0];
      const label = preset.id === "custom" ? normalizeMarkerText(this.draftCustomText, 60) : preset.label;
      if (!label) return this.#showToast("Enter a custom reminder before applying it.", true);
      const marker = {
        cardId: entry.cardId,
        cardName: entry.cardName,
        controller: entry.controller,
        zone: entry.zone,
        element: entry.element,
        statusId: preset.id,
        shortLabel: preset.id === "custom" ? "NOTE" : preset.shortLabel,
        icon: preset.icon,
        label,
        expiration: preset.id === "return-end-phase" ? "end-phase" : this.draftExpiration,
        public: this.draftPublic,
        offField: false,
        includeLocation: this.#fieldEntries().filter((candidate) => candidate.cardName.toLowerCase() === entry.cardName.toLowerCase()).length > 1
      };
      if (marker.public && !this.#sendChatLine(formatMarkerChatMessage(marker))) return;
      this.#upsertMarker(marker);
      this.selectedCardId = "";
      this.#showToast(`${label} applied to ${entry.cardName}.${marker.public ? " Shared in duel chat." : ""}`);
      this.diagnostics.info("markers", "player applied card reminder", { status: preset.id, expiration: marker.expiration, public: marker.public });
      this.#renderBadges();
      if (this.panel) this.#renderPanel();
    }

    #upsertMarker(marker) {
      const key = this.#markerKey(marker.cardId, marker.label);
      this.markers.set(key, marker);
      while (this.markers.size > 30) this.markers.delete(this.markers.keys().next().value);
    }

    #removeMarker(marker) {
      if (marker.public && !this.#sendChatLine(formatMarkerChatMessage(marker, "clear"))) return;
      this.markers.delete(this.#markerKey(marker.cardId, marker.label));
      this.#renderBadges();
      if (this.panel) this.#renderPanel();
      this.#showToast(`${marker.label} removed from ${marker.cardName}.`);
    }

    #clearAll(render = true) {
      if (!this.markers.size && !this.selectedCardId) return;
      this.markers.clear();
      this.selectedCardId = "";
      this.#renderBadges();
      if (render && this.panel) this.#renderPanel();
    }

    #markerKey(cardId, label) { return `${String(cardId)}:${String(label).toLowerCase()}`; }

    #syncMarkers() {
      let changed = false;
      const entries = this.#fieldEntries();
      const byId = new Map(entries.map((entry) => [entry.cardId, entry]));
      for (const [key, marker] of this.markers) {
        const entry = byId.get(marker.cardId);
        if (entry) {
          if (marker.zone !== entry.zone || marker.controller !== entry.controller || marker.element !== entry.element || marker.offField) changed = true;
          Object.assign(marker, entry, { offField: false, missingSince: 0 });
          continue;
        }
        if (marker.statusId === "return-end-phase") {
          if (this.#isCardBanished(marker.cardId)) {
            if (!marker.offField || marker.element) changed = true;
            marker.offField = true;
            marker.element = null;
            marker.missingSince = 0;
            continue;
          }
          marker.missingSince ||= Date.now();
          if (Date.now() - marker.missingSince < 2000) {
            marker.element = null;
            changed = true;
            continue;
          }
        }
        this.markers.delete(key);
        changed = true;
      }
      if (this.selectedCardId && !byId.has(this.selectedCardId)) {
        this.selectedCardId = "";
        changed = true;
      }
      return changed;
    }

    #renderBadges() {
      if (!this.badgeLayer) return;
      const groups = new Map();
      for (const marker of this.markers.values()) {
        const visual = marker.visualElement instanceof Element ? marker.visualElement : marker.element;
        if (!(visual instanceof Element) || !visual.isConnected || marker.offField) continue;
        if (!groups.has(marker.cardId)) groups.set(marker.cardId, []);
        groups.get(marker.cardId).push(marker);
      }
      const existing = new Map([...this.badgeLayer.children].map((stack) => [stack.dataset.cardId, stack]));
      for (const [cardId, markers] of groups) {
        let visual = markers[0].visualElement instanceof Element ? markers[0].visualElement : markers[0].element;
        let rect = visual.getBoundingClientRect();
        if ((!rect.width || !rect.height) && visual !== markers[0].element) {
          visual = markers[0].element;
          rect = visual.getBoundingClientRect();
        }
        if (!rect.width || !rect.height) continue;
        const defense = rect.width > rect.height;
        const stack = existing.get(cardId) ?? document.createElement("div");
        stack.className = "yf-marker-stack";
        stack.dataset.cardId = cardId;
        stack.dataset.orientation = defense ? "defense" : "attack";
        stack.style.left = defense
          ? `${Math.max(2, Math.min(innerWidth - (markers.length * 24), rect.left + 5))}px`
          : `${Math.max(2, Math.min(innerWidth - 24, rect.right - 9))}px`;
        stack.style.top = defense
          ? `${Math.max(2, rect.top - 8)}px`
          : `${Math.max(2, rect.top + 6)}px`;
        const signature = markers.map((marker) => [marker.statusId, marker.label, marker.expiration, marker.public, marker.icon].join(":")).join("|");
        if (stack.dataset.signature !== signature) {
          stack.replaceChildren();
          stack.dataset.signature = signature;
          for (const marker of markers) {
            const chip = document.createElement("div");
            chip.className = "yf-marker-chip";
            chip.dataset.status = marker.statusId;
            chip.append(document.createTextNode(marker.icon ?? MARKER_PRESETS.find((preset) => preset.id === marker.statusId)?.icon ?? "!"));
            const tooltip = document.createElement("div");
            tooltip.className = "yf-marker-tooltip";
            const tooltipLabel = document.createElement("strong");
            tooltipLabel.textContent = marker.label;
            const tooltipDetails = document.createElement("small");
            tooltipDetails.textContent = `${marker.expiration === "end-phase" ? "Until End Phase" : "Manual removal"} · ${marker.public ? "Public" : "Private"}`;
            tooltip.append(tooltipLabel, tooltipDetails);
            chip.append(tooltip);
            stack.append(chip);
          }
        }
        if (!stack.isConnected) this.badgeLayer.append(stack);
        existing.delete(cardId);
      }
      for (const stale of existing.values()) stale.remove();
    }

    #attachChat() {
      const root = document.querySelector("#duel .cout_txt");
      if (!root || root === this.chatRoot) return;
      this.chatObserver?.disconnect();
      this.chatRoot = root;
      this.seenMessageIds.clear();
      for (const message of root.querySelectorAll("font[message-id]")) {
        const id = message.getAttribute("message-id");
        if (id) this.#rememberMessage(id);
      }
      this.chatObserver = new MutationObserver((records) => {
        for (const record of records) for (const node of record.addedNodes) this.#inspectChatNode(node);
      });
      this.chatObserver.observe(root, { childList: true, subtree: true });
    }

    #inspectChatNode(node) {
      if (!(node instanceof Element) || !this.getSettings()?.enabled) return;
      const rows = [];
      if (node.matches("span")) rows.push(node);
      rows.push(...node.querySelectorAll("span"));
      for (const row of rows) {
        const messageElement = row.querySelector("font[message-id]");
        if (!messageElement) continue;
        const messageId = messageElement.getAttribute("message-id");
        if (messageId && this.seenMessageIds.has(messageId)) continue;
        if (messageId) this.#rememberMessage(messageId);
        const parsed = parseMarkerChatMessage(messageElement.textContent);
        if (!parsed) continue;
        if (parsed.action === "clear") this.#applyPublicClear(parsed);
        else this.#applyPublicMarker(parsed);
      }
    }

    #applyPublicMarker(parsed) {
      let candidates = this.#fieldEntries().filter((candidate) => candidate.cardName.toLowerCase() === parsed.cardName.toLowerCase());
      if (parsed.controller && parsed.zone) candidates = candidates.filter((candidate) =>
        candidate.controller.toLowerCase() === parsed.controller.toLowerCase() && candidate.zone === parsed.zone
      );
      if (candidates.length !== 1) return this.diagnostics.warn("markers", "public marker did not uniquely match a visible field card", { controller: parsed.controller, zone: parsed.zone, cardName: parsed.cardName, matches: candidates.length });
      const entry = candidates[0];
      const preset = MARKER_PRESETS.find((candidate) => candidate.label.toLowerCase() === parsed.label.toLowerCase()) ?? MARKER_PRESETS.at(-1);
      this.#upsertMarker({
        ...entry,
        statusId: preset.id,
        shortLabel: preset.id === "custom" ? "NOTE" : preset.shortLabel,
        icon: preset.icon,
        label: parsed.label,
        expiration: parsed.expiration,
        public: true,
        offField: false,
        includeLocation: Boolean(parsed.controller && parsed.zone)
      });
      this.#renderBadges();
      if (this.panel) this.#renderPanel();
    }

    #applyPublicClear(parsed) {
      let changed = false;
      for (const [key, marker] of this.markers) {
        if (parsed.controller && marker.controller.toLowerCase() !== parsed.controller.toLowerCase()) continue;
        if (parsed.zone && marker.zone !== parsed.zone) continue;
        if (marker.cardName.toLowerCase() !== parsed.cardName.toLowerCase()) continue;
        if (marker.label.toLowerCase() !== parsed.label.toLowerCase()) continue;
        this.markers.delete(key);
        changed = true;
      }
      if (!changed) return;
      this.#renderBadges();
      if (this.panel) this.#renderPanel();
    }

    #rememberMessage(messageId) {
      this.seenMessageIds.add(String(messageId));
      if (this.seenMessageIds.size <= 200) return;
      this.seenMessageIds.delete(this.seenMessageIds.values().next().value);
    }

    #sendChatLine(message) {
      const input = this.#findChatInput();
      if (!message || !input) {
        this.#showToast("DuelingBook’s duel chat is unavailable, so the public marker was not applied.", true);
        return false;
      }
      if (input.value.trim()) {
        this.#showToast("Your chat box already contains text. Send or clear it before sharing a marker.", true);
        input.focus();
        return false;
      }
      input.focus();
      input.value = message;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new KeyboardEvent("keydown", {
        key: "Enter", code: "Enter", keyCode: 13, which: 13, bubbles: true, cancelable: true
      }));
      setTimeout(() => {
        if (input.value !== message) return;
        this.#showToast("The public marker message is ready in chat. Press Enter to send it.");
        input.focus();
      }, 120);
      return true;
    }

    #findChatInput() {
      const candidates = [];
      for (const selector of ["#duel #cin_txt", "#duel .cin_txt", "#cin_txt", ".cin_txt"]) {
        for (const candidate of document.querySelectorAll(selector)) if (!candidates.includes(candidate)) candidates.push(candidate);
      }
      return candidates.find((candidate) => {
        if (!(candidate instanceof Element) || !candidate.matches('input[type="text"], textarea')) return false;
        if (candidate.disabled || candidate.readOnly || candidate.getClientRects().length === 0) return false;
        const style = getComputedStyle(candidate);
        return style.display !== "none" && style.visibility !== "hidden";
      }) ?? null;
    }

    #fieldEntries() {
      const page = this.#page();
      const players = this.#duelPlayers();
      const entries = [];
      const seen = new Set();
      const add = (card, controller, zone) => {
        if (!card || !this.#isExplicitlyFaceUp(card)) return;
        const cardId = this.#cardId(card);
        const element = this.#cardElement(card);
        if (cardId === null || !(element instanceof Element) || seen.has(String(cardId))) return;
        const cardName = this.#cardName(card);
        if (!cardName) return;
        seen.add(String(cardId));
        entries.push({
          cardId: String(cardId),
          cardName,
          controller: String(controller ?? ""),
          zone,
          element,
          visualElement: this.#cardFrontElement(card) ?? element
        });
      };
      for (const player of players) {
        for (let zone = 1; zone <= 5; zone++) add(player[`m${zone}`], player.username, `M${zone}`);
        for (let zone = 1; zone <= 5; zone++) add(player[`s${zone}`], player.username, `S${zone}`);
        add(player.fieldSpell, player.username, "F");
      }
      for (const [card, zone] of [[page.linkLeft, "EL"], [page.linkRight, "ER"]]) {
        const controller = this.#cardData(card, "controller")?.username;
        add(card, controller, zone);
      }
      for (const element of document.querySelectorAll("#field .card")) {
        const card = this.#jqueryCard(element);
        if (!card) continue;
        const controller = this.#cardData(card, "controller")?.username ?? "Visible field";
        add(card, controller, this.#inferDomZone(card, element));
      }
      return entries;
    }

    #isCardBanished(cardId) {
      for (const player of this.#duelPlayers()) {
        for (const card of player?.banished_arr ?? []) if (String(this.#cardId(card)) === String(cardId)) return true;
      }
      return false;
    }

    #page() { return typeof unsafeWindow !== "undefined" ? unsafeWindow : window; }
    #duelPlayers() {
      const page = this.#page();
      const direct = [page.player1, page.player2, page.player3, page.player4].filter(Boolean);
      const candidates = direct.flatMap((player) => [player, player?.opponent]).filter((player) => player?.username);
      const seen = new Set();
      return candidates.filter((player) => {
        const key = String(player.username).toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }
    #cardElement(card) { try { return card?.[0] ?? card?.get?.(0) ?? null; } catch { return null; } }
    #cardFrontElement(card) { try { return this.#cardElement(card?.data?.("cardfront")); } catch { return null; } }
    #cardId(card) { try { return card?.data?.("id") ?? this.#cardElement(card)?.dataset?.id ?? null; } catch { return null; } }
    #cardData(card, key) { try { return card?.data?.(key) ?? null; } catch { return null; } }
    #cardName(card) { try { return String(card?.data?.("cardfront")?.data?.("name") ?? "").trim(); } catch { return ""; } }
    #jqueryCard(element) {
      try {
        const jquery = this.#page()?.$;
        return typeof jquery === "function" ? jquery(element) : null;
      } catch { return null; }
    }
    #isExplicitlyFaceUp(card) {
      const value = this.#cardData(card, "face_down");
      return value === false || value === 0 || value === "false";
    }
    #inferDomZone(card, element) {
      const rawZone = String(this.#cardData(card, "zone") ?? "").trim();
      const normalized = rawZone.replaceAll("-", "").toUpperCase();
      if (/^[MS][1-5]$/.test(normalized)) return normalized;
      if (/^(?:EL|ER|F)$/.test(normalized)) return normalized;
      for (let current = element; current && current !== document.body; current = current.parentElement) {
        const values = [current.id, current.dataset?.zone, ...current.classList].filter(Boolean);
        for (const value of values) {
          const match = String(value).match(/(?:^|[_-])([ms])[_-]?([1-5])(?:$|[_-])/i);
          if (match) return `${match[1].toUpperCase()}${match[2]}`;
        }
        if (current.id === "field") break;
      }
      return "FIELD";
    }

    #showToast(message, error = false) {
      this.toast?.remove();
      const toast = document.createElement("div");
      toast.id = APP.ids.markerToast;
      if (error) toast.className = "yf-marker-error";
      toast.textContent = message;
      document.body.append(toast);
      this.toast = toast;
      setTimeout(() => { if (this.toast === toast) { toast.remove(); this.toast = null; } }, error ? 6500 : 4500);
    }

    #isVisible(element) {
      if (!(element instanceof HTMLElement) || element.hidden) return false;
      const style = getComputedStyle(element);
      return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0" && element.getClientRects().length > 0;
    }
  }

  const DEFAULT_CUSTOM_MACROS = `-- General
Good Luck | Good luck, have fun.
Thinking | Thinking...`;

  const CUSTOM_MACRO_FUNCTIONS = Object.freeze([
    "addFromDeckToHand", "sendFromDeckToGY",
    "specialFromHandInAtk", "specialFromHandInDef", "specialFromHandInAtkRandomZone", "specialFromHandInDefRandomZone", "specialFromHandInAtkToZone", "specialFromHandInDefToZone",
    "specialFromDeckInAtk", "specialFromDeckInDef", "specialFromDeckInAtkRandomZone", "specialFromDeckInDefRandomZone", "specialFromDeckInAtkToZone", "specialFromDeckInDefToZone",
    "specialFromExtraDeckInAtk", "specialFromExtraDeckInDef", "specialFromExtraDeckInAtkRandomZone", "specialFromExtraDeckInDefRandomZone", "specialFromExtraDeckInAtkToZone", "specialFromExtraDeckInDefToZone", "sendFromExtraDeckToGY",
    "specialSummonToken", "specialSummonTokenToZone", "specialSummonMultipleTokens",
    "sendAllControllingMonstersFromFieldToGY", "sendAllOwnSpellTrapsFromFieldToGY", "sendFromFieldToGY",
    "banishFromGY", "banishFromHand", "banishFromDeck", "activateSpellTrapFromDeck", "activateSpellTrapFromDeckToZone",
    "specialFromGYInAtk", "specialFromGYInDef", "specialFromGYInAtkRandomZone", "specialFromGYInDefRandomZone", "specialFromGYInAtkToZone", "specialFromGYInDefToZone",
    "discard", "addFromGYToHand", "fromBanishToTopOfDeck", "fromGYToTopOfDeck", "fromFieldToTopOfDeck", "returnAllFromHandToTopOfDeck", "shuffleDeck",
    "moveZone", "overlayMonsters", "flipDownMonsters", "flipUpMonsters", "changeToAtk", "changeToDef",
    "normalSetToRandomZone", "normalSetToZone", "normalSummonToRandomZone", "normalSummonToZone",
    "addCountersToCards", "removeCountersFromCards", "setCardsFromDeckToSpellTrapZone",
    "banishCardsFromTopOfDeckFD", "returnRandomBanishedCardToHand", "waitInMs"
  ]);
  const CUSTOM_MACRO_FUNCTION_SET = new Set(CUSTOM_MACRO_FUNCTIONS);
  const CUSTOM_MACRO_VARIABLES = Object.freeze([
    "currentLP", "halfOfLP", "topUsername", "botUsername",
    "atkAllMonsters", "defAllMonsters", "atkAllFaceUpMonsters", "defAllFaceUpMonsters"
  ]);

  function parseCustomMacroAction(value) {
    const text = String(value ?? "").trim();
    const match = text.match(/^\$\{([A-Za-z][A-Za-z0-9]*)\((.*)\)\}$/s);
    return match ? { type: "function", name: match[1], param: match[2].trim(), raw: text } : { type: "message", text };
  }

  function parseCustomMacroDefinitions(source) {
    const text = String(source ?? "");
    const errors = [];
    const groups = [];
    let group = { name: "Macros", macros: [] };
    groups.push(group);
    if (text.length > 30000) errors.push("Macro definitions must be 30,000 characters or fewer.");
    const lines = text.split(/\r?\n/);
    for (let index = 0; index < lines.length; index++) {
      const raw = lines[index].trim();
      if (!raw) continue;
      if (raw.startsWith("--")) {
        const name = raw.slice(2).trim();
        if (!name) errors.push(`Line ${index + 1}: category name is missing.`);
        else {
          group = { name: name.slice(0, 50), macros: [] };
          groups.push(group);
        }
        continue;
      }
      const parts = raw.split("|");
      if (parts.length < 2) {
        errors.push(`Line ${index + 1}: expected Button Name | action.`);
        continue;
      }
      const label = parts.shift().trim();
      const actions = parts.map(parseCustomMacroAction).filter((action) => action.type === "function" || action.text);
      if (!label) errors.push(`Line ${index + 1}: button name is missing.`);
      if (label.length > 50) errors.push(`Line ${index + 1}: button name must be 50 characters or fewer.`);
      if (!actions.length) errors.push(`Line ${index + 1}: macro has no actions.`);
      if (actions.length > 20) errors.push(`Line ${index + 1}: a macro can contain at most 20 actions.`);
      for (const action of actions) {
        if (action.type === "function" && !CUSTOM_MACRO_FUNCTION_SET.has(action.name)) errors.push(`Line ${index + 1}: unknown function ${action.name}().`);
        if (action.type === "message") {
          for (const variable of action.text.matchAll(/\$\{([^}]+)\}/g)) {
            if (!CUSTOM_MACRO_VARIABLES.includes(variable[1])) errors.push(`Line ${index + 1}: unknown variable \${${variable[1]}}.`);
          }
          if (action.text.includes("${") && !/\$\{[^}]+\}/.test(action.text)) errors.push(`Line ${index + 1}: incomplete variable or function expression.`);
        }
      }
      group.macros.push({ label, actions, line: index + 1 });
    }
    const macros = groups.flatMap((entry) => entry.macros);
    if (macros.length > 100) errors.push("A maximum of 100 macros is supported.");
    return { groups: groups.filter((entry) => entry.macros.length), macros, errors: [...new Set(errors)] };
  }

  const CUSTOM_MACRO_STYLE = `
    #${APP.ids.customMacroButton} { position: fixed; right: 14px; top: calc(50% + 147px); z-index: 2147483645; transform: translateY(-50%); border: 1px solid #c4b5fd; border-radius: 9px 0 0 9px; background: linear-gradient(145deg,#4c1d95,#1e3a8a); color: #f5f3ff; padding: 11px 9px; writing-mode: vertical-rl; letter-spacing: .1em; font: 900 12px/1 Arial,sans-serif; box-shadow: 0 5px 20px #000a,0 0 16px #a78bfa44; cursor: pointer; }
    #${APP.ids.customMacroButton}[hidden] { display: none; }
    #${APP.ids.customMacroButton}:disabled { cursor: wait; opacity: .65; }
    #${APP.ids.customMacroMenu} { position: fixed; right: 58px; top: 50%; z-index: 2147483646; box-sizing: border-box; width: min(300px,calc(100vw - 78px)); max-height: min(70vh,620px); overflow: auto; transform: translateY(-50%); border: 1px solid #c4b5fd; border-radius: 12px; background: linear-gradient(145deg,#170b2af7,#10224df7); color: #fff; padding: 12px; box-shadow: 0 16px 44px #000d,0 0 24px #8b5cf633; font: 13px/1.3 Arial,sans-serif; }
    #${APP.ids.customMacroMenu}[hidden] { display: none; }
    #${APP.ids.customMacroMenu} > strong { display: block; margin-bottom: 8px; color: #ede9fe; text-align: center; font-size: 16px; }
    #${APP.ids.customMacroMenu} h3 { margin: 10px 0 6px; border-bottom: 1px solid #8b5cf666; padding-bottom: 4px; color: #ddd6fe; font-size: 12px; text-transform: uppercase; letter-spacing: .08em; }
    #${APP.ids.customMacroMenu} .yf-custom-macro-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
    #${APP.ids.customMacroMenu} button { min-width: 0; overflow-wrap: anywhere; border: 1px solid #8b5cf6; border-radius: 7px; background: linear-gradient(135deg,#312e81,#6d28d9); color: #fff; padding: 8px 6px; cursor: pointer; font-weight: 750; }
    #${APP.ids.customMacroMenu} button:hover, #${APP.ids.customMacroMenu} button:focus-visible { border-color: #f5d0fe; filter: brightness(1.15); }
    #${APP.ids.customMacroMenu} .yf-custom-empty { margin: 8px 0 0; color: #cbd5e1; text-align: center; }
    #${APP.ids.customMacroEditor} { position: fixed; inset: 0; z-index: 2147483647; display: grid; place-items: center; box-sizing: border-box; padding: 18px; background: #020617c7; color: #f8fafc; font: 14px/1.4 Arial,sans-serif; }
    #${APP.ids.customMacroEditor} * { box-sizing: border-box; }
    #${APP.ids.customMacroEditor} .yf-custom-editor-card { width: min(900px,calc(100vw - 32px)); max-height: calc(100vh - 32px); overflow: auto; border: 1px solid #c4b5fd; border-radius: 15px; padding: 17px; background: linear-gradient(145deg,#111827fb,#172554fb 58%,#3b1654fb); box-shadow: 0 24px 80px #000e,0 0 32px #a78bfa33; }
    #${APP.ids.customMacroEditor} header { display: flex; align-items: center; justify-content: space-between; gap: 12px; border-bottom: 1px solid #a78bfa66; padding-bottom: 10px; }
    #${APP.ids.customMacroEditor} h2 { margin: 0; color: #f5f3ff; font-family: Georgia,serif; }
    #${APP.ids.customMacroEditor} .yf-custom-close { border: 0; background: transparent; color: #cbd5e1; font-size: 28px; cursor: pointer; }
    #${APP.ids.customMacroEditor} textarea { display: block; width: 100%; min-height: 330px; resize: vertical; margin: 12px 0; border: 1px solid #64748b; border-radius: 8px; background: #020617; color: #f8fafc; padding: 11px; font: 13px/1.45 Consolas,monospace; }
    #${APP.ids.customMacroEditor} details { margin: 10px 0; border: 1px solid #475569; border-radius: 8px; background: #0f172aaa; padding: 9px 11px; }
    #${APP.ids.customMacroEditor} summary { cursor: pointer; color: #ddd6fe; font-weight: 800; }
    #${APP.ids.customMacroEditor} code { color: #a7f3d0; }
    #${APP.ids.customMacroEditor} .yf-custom-errors { white-space: pre-wrap; margin: 8px 0; border: 1px solid #f87171; border-radius: 7px; background: #7f1d1d77; color: #fee2e2; padding: 9px; }
    #${APP.ids.customMacroEditor} .yf-custom-errors[hidden] { display: none; }
    #${APP.ids.customMacroEditor} .yf-custom-editor-actions { display: flex; justify-content: flex-end; gap: 8px; }
    #${APP.ids.customMacroEditor} .yf-custom-editor-actions button { border: 1px solid #64748b; border-radius: 7px; background: #1e293b; color: #fff; padding: 9px 13px; cursor: pointer; font-weight: 750; }
    #${APP.ids.customMacroEditor} .yf-custom-editor-actions .yf-custom-save { border-color: #ddd6fe; background: linear-gradient(135deg,#5b21b6,#1d4ed8); }
    #${APP.ids.customMacroToast} { position: fixed; right: 58px; top: calc(50% + 238px); z-index: 2147483647; width: min(380px,calc(100vw - 80px)); border: 1px solid #c4b5fd; border-radius: 9px; background: #2e1065ee; color: #f5f3ff; padding: 10px 12px; text-align: center; font: 750 13px/1.35 Arial,sans-serif; box-shadow: 0 8px 24px #000c; }
    #${APP.ids.customMacroToast}.yf-custom-error { border-color: #f87171; background: #450a0aee; color: #fee2e2; }
    @media (max-width: 650px) { #${APP.ids.customMacroButton} { right: 4px; } #${APP.ids.customMacroMenu} { right: 48px; } #${APP.ids.customMacroMenu} .yf-custom-macro-grid { grid-template-columns: 1fr; } }
  `;

  class CustomMacroEngine {
    constructor(diagnostics) {
      this.diagnostics = diagnostics;
      this.cancelled = false;
    }

    cancel() { this.cancelled = true; }

    async execute(macro) {
      this.cancelled = false;
      this.#requireDuel();
      for (let index = 0; index < macro.actions.length; index++) {
        if (this.cancelled) throw new Error("Macro stopped.");
        const action = macro.actions[index];
        let wait = 250;
        let stop = false;
        if (action.type === "message") await this.#sendMessage(this.#replaceVariables(action.text));
        else {
          const result = await this.#executeFunction(action.name, action.param);
          wait = result?.wait ?? wait;
          stop = Boolean(result?.stop);
        }
        if (stop) break;
        if (index + 1 < macro.actions.length && wait > 0) await this.#wait(wait);
      }
    }

    #page() { return typeof unsafeWindow !== "undefined" ? unsafeWindow : window; }

    #requireDuel() {
      const page = this.#page();
      if (!page?.Send || !this.#player()) throw new Error("Enter an active duel before running a macro.");
    }

    #player() {
      const page = this.#page();
      return [page.player1, page.player2, page.player3, page.player4].find((player) => player?.username === page.user_username) ?? null;
    }

    #send(play, extra = {}) {
      const allowed = new Set(["Duel message", "View deck", "View ED", "To hand", "To T Deck", "To GY", "To ED FU", "Remove Token", "Banish", "Banish FD", "SS ATK", "SS DEF", "Normal Summon", "Set monster", "Flip", "To ATK", "To DEF", "To ST", "Set ST", "Summon token", "Add counter", "Remove counter", "Shuffle deck", "Move", "Overlay"]);
      if (!allowed.has(play)) throw new Error(`Blocked unsupported DuelingBook action: ${play}`);
      this.#page().Send({ action: "Duel", play, ...extra });
    }

    #sendMessage(message) {
      const text = String(message ?? "").trim();
      if (!text) return;
      if (text.length > 500) throw new Error("Chat messages must be 500 characters or fewer.");
      this.#send("Duel message", { message: text, html: 0 });
    }

    async #executeFunction(name, param) {
      const args = this.#args(param);
      switch (name) {
        case "waitInMs": return { wait: Math.min(30000, Math.max(0, Number(param) || 100)) };
        case "addFromDeckToHand": return this.#withDeck((cards) => this.#actNames(cards, param, "To hand"));
        case "sendFromDeckToGY": return this.#withDeck((cards) => this.#actNames(cards, param, "To GY"));
        case "sendFromExtraDeckToGY": return this.#withExtra((cards) => this.#actNames(cards, param, "To GY"));
        case "banishFromDeck": return this.#withDeck((cards) => this.#actNames(cards, param, "Banish"));
        case "banishFromGY": return this.#actNames(this.#player()?.grave_arr, param, "Banish");
        case "banishFromHand": return this.#actNames(this.#player()?.hand_arr, param, "Banish");
        case "discard": return this.#actNames(this.#player()?.hand_arr, param, "To GY");
        case "addFromGYToHand": return this.#actNames(this.#player()?.grave_arr, param, "To hand");
        case "fromBanishToTopOfDeck": return this.#actNames(this.#player()?.banished_arr, param, "To T Deck");
        case "fromGYToTopOfDeck": return this.#actNames(this.#player()?.grave_arr, param, "To T Deck");
        case "fromFieldToTopOfDeck": return this.#actNames(this.#ownFieldCards(), param, "To T Deck");
        case "sendFromFieldToGY": return this.#actFieldNames(param);
        case "specialFromHandInAtk": return this.#selectFromPile("hand", param, "SS ATK");
        case "specialFromHandInDef": return this.#selectFromPile("hand", param, "SS DEF");
        case "specialFromDeckInAtk": return this.#selectFromPile("deck", param, "SS ATK");
        case "specialFromDeckInDef": return this.#selectFromPile("deck", param, "SS DEF");
        case "specialFromExtraDeckInAtk": return this.#selectFromPile("extra", param, "SS ATK");
        case "specialFromExtraDeckInDef": return this.#selectFromPile("extra", param, "SS DEF");
        case "specialFromGYInAtk": return this.#selectFromPile("grave", param, "SS ATK");
        case "specialFromGYInDef": return this.#selectFromPile("grave", param, "SS DEF");
        case "specialFromHandInAtkRandomZone": return this.#actNames(this.#player()?.hand_arr, param, "SS ATK");
        case "specialFromHandInDefRandomZone": return this.#actNames(this.#player()?.hand_arr, param, "SS DEF");
        case "specialFromDeckInAtkRandomZone": return this.#pileAction("deck", param, "SS ATK");
        case "specialFromDeckInDefRandomZone": return this.#pileAction("deck", param, "SS DEF");
        case "specialFromExtraDeckInAtkRandomZone": return this.#pileAction("extra", param, "SS ATK");
        case "specialFromExtraDeckInDefRandomZone": return this.#pileAction("extra", param, "SS DEF");
        case "specialFromGYInAtkRandomZone": return this.#actNames(this.#player()?.grave_arr, param, "SS ATK");
        case "specialFromGYInDefRandomZone": return this.#actNames(this.#player()?.grave_arr, param, "SS DEF");
        case "specialFromHandInAtkToZone": return this.#zoneAction(this.#player()?.hand_arr, args, "SS ATK");
        case "specialFromHandInDefToZone": return this.#zoneAction(this.#player()?.hand_arr, args, "SS DEF");
        case "specialFromDeckInAtkToZone": return this.#pileZoneAction("deck", args, "SS ATK");
        case "specialFromDeckInDefToZone": return this.#pileZoneAction("deck", args, "SS DEF");
        case "specialFromExtraDeckInAtkToZone": return this.#pileZoneAction("extra", args, "SS ATK");
        case "specialFromExtraDeckInDefToZone": return this.#pileZoneAction("extra", args, "SS DEF");
        case "specialFromGYInAtkToZone": return this.#zoneAction(this.#player()?.grave_arr, args, "SS ATK");
        case "specialFromGYInDefToZone": return this.#zoneAction(this.#player()?.grave_arr, args, "SS DEF");
        case "activateSpellTrapFromDeck": return this.#selectFromPile("deck", param, "To ST");
        case "activateSpellTrapFromDeckToZone": return this.#pileZoneAction("deck", args, "To ST");
        case "setCardsFromDeckToSpellTrapZone": return this.#withDeck((cards) => this.#actNames(cards, param, "Set ST"));
        case "specialSummonToken": this.#page().tokenE(); return { stop: true };
        case "specialSummonTokenToZone": return this.#tokenToZone(args);
        case "specialSummonMultipleTokens": return this.#multipleTokens(param);
        case "sendAllControllingMonstersFromFieldToGY": return this.#sendAllMonsters(args);
        case "sendAllOwnSpellTrapsFromFieldToGY": return this.#sendAllSpellTraps();
        case "returnAllFromHandToTopOfDeck": return this.#sendAll(this.#player()?.hand_arr, "To T Deck", 80);
        case "shuffleDeck": return this.#shuffleDeck();
        case "moveZone": return this.#moveZone(args);
        case "overlayMonsters": return this.#overlay(args);
        case "flipDownMonsters": return this.#actNames(this.#ownMonsters(), param, "Set monster");
        case "flipUpMonsters": return this.#actNames(this.#ownMonsters(), param, "Flip");
        case "changeToAtk": return this.#actNames(this.#ownMonsters(), param, "To ATK");
        case "changeToDef": return this.#actNames(this.#ownMonsters(), param, "To DEF");
        case "normalSetToRandomZone": return this.#actNames(this.#player()?.hand_arr, param, "Set monster");
        case "normalSetToZone": return this.#zoneAction(this.#player()?.hand_arr, args, "Set monster");
        case "normalSummonToRandomZone": return this.#actNames(this.#player()?.hand_arr, param, "Normal Summon");
        case "normalSummonToZone": return this.#zoneAction(this.#player()?.hand_arr, args, "Normal Summon");
        case "addCountersToCards": return this.#counters(args, "Add counter");
        case "removeCountersFromCards": return this.#counters(args, "Remove counter");
        case "banishCardsFromTopOfDeckFD": return this.#banishTop(param);
        case "returnRandomBanishedCardToHand": return this.#randomBanishedToHand();
        default: throw new Error(`Unsupported macro function: ${name}()`);
      }
    }

    #args(value) { return String(value ?? "").split("~").map((item) => item.trim()).filter(Boolean); }
    #cardName(card) { try { return String(card.data("cardfront").data("name") ?? ""); } catch { return ""; } }
    #cardId(card) { try { return card.data("id"); } catch { return null; } }
    #cardData(card, key) { try { return card.data(key); } catch { return null; } }
    #frontData(card, key) { try { return card.data("cardfront").data(key); } catch { return null; } }

    #find(cards, name, used = new Set()) {
      const wanted = String(name ?? "").toLowerCase();
      return [...(cards ?? [])].find((card) => this.#cardName(card).toLowerCase() === wanted && !used.has(this.#cardId(card))) ?? null;
    }

    async #actNames(cards, names, play) {
      const used = new Set();
      for (const name of this.#args(names)) {
        const card = this.#find(cards, name, used);
        if (!card) continue;
        used.add(this.#cardId(card));
        this.#send(play, { card: this.#cardId(card) });
        await this.#wait(80);
      }
    }

    async #actFieldNames(names) {
      const used = new Set();
      for (const name of this.#args(names)) {
        const card = this.#find(this.#ownFieldCards(), name, used);
        if (!card) continue;
        used.add(this.#cardId(card));
        this.#sendFieldCardToGY(card);
        await this.#wait(80);
      }
    }

    #sendFieldCardToGY(card) {
      if (this.#frontData(card, "pendulum")) this.#send("To ED FU", { card: this.#cardId(card) });
      else if (this.#frontData(card, "monster_color") === "Token") this.#send("Remove Token", { card: this.#cardId(card) });
      else this.#send("To GY", { card: this.#cardId(card) });
    }

    async #sendAll(cards, play, delay = 80) {
      for (const card of [...(cards ?? [])]) {
        this.#send(play, { card: this.#cardId(card) });
        await this.#wait(delay);
      }
    }

    async #withDeck(callback) {
      const cards = this.#player()?.main_arr ?? [];
      if (!cards.length) return;
      this.#send("View deck", { card: this.#cardId(cards[0]) });
      await this.#wait(500);
      await callback(cards);
      await this.#wait(250);
    }

    async #withExtra(callback) {
      const cards = this.#player()?.extra_arr ?? [];
      if (!cards.length) return;
      this.#send("View ED", { card: this.#cardId(cards[0]) });
      await this.#wait(500);
      await callback(cards);
      await this.#wait(250);
    }

    #pile(name) {
      const player = this.#player();
      return name === "hand" ? player?.hand_arr : name === "deck" ? player?.main_arr : name === "extra" ? player?.extra_arr : player?.grave_arr;
    }

    async #pileAction(pile, names, play) {
      const callback = (cards) => this.#actNames(cards, names, play);
      return pile === "deck" ? this.#withDeck(callback) : pile === "extra" ? this.#withExtra(callback) : callback(this.#pile(pile));
    }

    async #selectFromPile(pile, name, play) {
      const open = async () => {
        const card = this.#find(this.#pile(pile), name);
        if (!card) throw new Error(`Card not found: ${name}`);
        const page = this.#page();
        if (typeof page.cardMenuClicked !== "function") throw new Error("DuelingBook's native card menu is unavailable.");
        page.menu_card = card;
        page.cardMenuClicked(card, play);
      };
      if (pile === "deck") await this.#withDeck(open);
      else if (pile === "extra") await this.#withExtra(open);
      else await open();
      return { stop: true };
    }

    async #pileZoneAction(pile, args, play) {
      const callback = (cards) => this.#zoneAction(cards, args, play);
      return pile === "deck" ? this.#withDeck(callback) : this.#withExtra(callback);
    }

    async #zoneAction(cards, args, play) {
      if (args.length < 2) throw new Error(`${play} requires a card name and at least one zone.`);
      const card = this.#find(cards, args[0]);
      if (!card) throw new Error(`Card not found: ${args[0]}`);
      const zone = this.#firstOpenZone(args.slice(1));
      if (!zone) throw new Error("None of the requested zones is available.");
      this.#send(play, { card: this.#cardId(card), zone });
    }

    #normalizeZone(value) {
      const zone = String(value ?? "").trim().toLowerCase();
      if (/^om[1-5]$/.test(zone)) return `M2-${zone.at(-1)}`;
      if (/^m[1-5]$/.test(zone)) return `M-${zone.at(-1)}`;
      if (/^s[1-5]$/.test(zone)) return `S-${zone.at(-1)}`;
      if (zone === "el") return "Left Extra Monster Zone";
      if (zone === "er") return "Right Extra Monster Zone";
      return null;
    }

    #firstOpenZone(values) {
      return values.map((value) => this.#normalizeZone(value)).filter(Boolean).find((zone) => this.#zoneEmpty(zone)) ?? null;
    }

    #zoneEmpty(zone) {
      const player = this.#player();
      const own = { "M-1": "m1", "M-2": "m2", "M-3": "m3", "M-4": "m4", "M-5": "m5", "S-1": "s1", "S-2": "s2", "S-3": "s3", "S-4": "s4", "S-5": "s5" };
      const opponent = { "M2-1": "m1", "M2-2": "m2", "M2-3": "m3", "M2-4": "m4", "M2-5": "m5" };
      if (own[zone]) return !player?.[own[zone]];
      if (opponent[zone]) return !player?.opponent?.[opponent[zone]];
      if (zone === "Left Extra Monster Zone") return !this.#page().linkLeft;
      if (zone === "Right Extra Monster Zone") return !this.#page().linkRight;
      return false;
    }

    #tokenToZone(zones) {
      const zone = this.#firstOpenZone(zones);
      if (!zone) throw new Error("None of the requested Token zones is available.");
      this.#send("Summon token", { zone });
    }

    async #multipleTokens(value) {
      const count = Math.min(5, Math.max(0, Number.parseInt(value, 10) || 0));
      for (let index = 0; index < count; index++) {
        this.#send("Summon token");
        await this.#wait(500);
      }
    }

    #ownMonsters(face = "") {
      const player = this.#player();
      const cards = [player?.m1, player?.m2, player?.m3, player?.m4, player?.m5, this.#page().linkLeft, this.#page().linkRight].filter(Boolean);
      return cards.filter((card) => this.#cardData(card, "controller")?.username === player?.username && (!face || Boolean(this.#cardData(card, "face_down")) === (face === "facedown")));
    }

    #opponentMonsters(face = "") {
      const player = this.#player();
      const opponent = player?.opponent;
      const cards = [opponent?.m1, opponent?.m2, opponent?.m3, opponent?.m4, opponent?.m5, this.#page().linkLeft, this.#page().linkRight].filter(Boolean);
      return cards.filter((card) => this.#cardData(card, "controller")?.username === opponent?.username && (!face || Boolean(this.#cardData(card, "face_down")) === (face === "facedown")));
    }

    #ownSpellTraps() {
      const player = this.#player();
      return [player?.s1, player?.s2, player?.s3, player?.s4, player?.s5, player?.fieldSpell].filter(Boolean);
    }
    #ownFieldCards() { return [...this.#ownMonsters(), ...this.#ownSpellTraps()]; }

    async #sendAllMonsters(args) {
      const position = String(args[0] ?? "").toLowerCase();
      const face = String(args[1] ?? (position === "faceup" || position === "facedown" ? position : "")).toLowerCase();
      for (const card of this.#ownMonsters(face)) {
        if (position === "atk" && !this.#cardData(card, "inATK")) continue;
        if (position === "def" && !this.#cardData(card, "inDEF")) continue;
        this.#sendFieldCardToGY(card);
        await this.#wait(80);
      }
    }

    async #sendAllSpellTraps() {
      for (const card of this.#ownSpellTraps()) {
        this.#sendFieldCardToGY(card);
        await this.#wait(80);
      }
    }

    #shuffleDeck() {
      const card = this.#player()?.main_arr?.[0];
      if (card) this.#send("Shuffle deck", { card: this.#cardId(card) });
    }

    #moveZone(args) {
      if (args.length < 2) throw new Error("moveZone requires a card name and at least one zone.");
      const card = this.#find(this.#ownFieldCards(), args[0]);
      if (!card) throw new Error(`Card not found: ${args[0]}`);
      const zone = this.#firstOpenZone(args.slice(1));
      if (!zone) throw new Error("None of the requested zones is available.");
      this.#send("Move", { card: this.#cardId(card), zone });
    }

    async #overlay(args) {
      if (args.length < 2) throw new Error("overlayMonsters requires a target and at least one material.");
      const cards = this.#ownMonsters();
      const target = this.#find(cards, args[0]);
      if (!target) throw new Error(`Overlay target not found: ${args[0]}`);
      for (const name of args.slice(1)) {
        const material = this.#find(cards, name);
        if (!material || this.#cardId(material) === this.#cardId(target)) continue;
        this.#send("Overlay", { start_card: this.#cardId(target), end_card: this.#cardId(material) });
        await this.#wait(100);
      }
    }

    async #counters(args, play) {
      if (args.length < 2) throw new Error(`${play} requires a count and at least one card name.`);
      const count = Math.min(20, Math.max(1, Number.parseInt(args.shift(), 10) || 1));
      for (let index = 0; index < count; index++) {
        await this.#actNames(this.#ownFieldCards(), args.join("~"), play);
        if (index + 1 < count) await this.#wait(500);
      }
    }

    async #banishTop(value) {
      const count = Math.min(60, Math.max(0, Number.parseInt(value, 10) || 0));
      for (const card of [...(this.#player()?.main_arr ?? [])].slice(0, count)) {
        this.#send("Banish FD", { card: this.#cardId(card) });
        await this.#wait(80);
      }
    }

    #randomBanishedToHand() {
      const cards = this.#player()?.banished_arr ?? [];
      if (!cards.length) return;
      const card = cards[Math.floor(Math.random() * cards.length)];
      this.#send("To hand", { card: this.#cardId(card) });
    }

    #replaceVariables(message) {
      return String(message ?? "").replace(/\$\{([A-Za-z][A-Za-z0-9]*)\}/g, (_whole, name) => {
        const player = this.#player();
        switch (name) {
          case "topUsername": return document.querySelector("#avatar2 .username_txt")?.textContent?.trim() ?? "";
          case "botUsername": return document.querySelector("#avatar1 .username_txt")?.textContent?.trim() ?? "";
          case "currentLP": return String(player?.lifepoints ?? 0);
          case "halfOfLP": return String(Math.floor((player?.lifepoints ?? 0) / 2));
          case "atkAllMonsters": return String(this.#sumStats("atk"));
          case "defAllMonsters": return String(this.#sumStats("def"));
          case "atkAllFaceUpMonsters": return String(this.#sumStats("atk", "faceup"));
          case "defAllFaceUpMonsters": return String(this.#sumStats("def", "faceup"));
          default: return "";
        }
      });
    }

    #sumStats(stat, face = "") {
      return [...this.#ownMonsters(face), ...this.#opponentMonsters(face)].reduce((sum, card) => sum + (Number.parseInt(this.#frontData(card, stat), 10) || 0), 0);
    }

    #wait(milliseconds) {
      const duration = Math.max(0, Number(milliseconds) || 0);
      return new Promise((resolve, reject) => {
        const started = Date.now();
        const tick = () => {
          if (this.cancelled) return reject(new Error("Macro stopped."));
          const remaining = duration - (Date.now() - started);
          if (remaining <= 0) return resolve();
          setTimeout(tick, Math.min(remaining, 100));
        };
        tick();
      });
    }
  }

  class CustomMacros {
    constructor(storage, diagnostics, getSettings) {
      this.storage = storage;
      this.diagnostics = diagnostics;
      this.getSettings = getSettings;
      this.source = DEFAULT_CUSTOM_MACROS;
      this.parsed = parseCustomMacroDefinitions(this.source);
      this.engine = new CustomMacroEngine(diagnostics);
      this.button = null;
      this.menu = null;
      this.editor = null;
      this.toast = null;
      this.running = false;
    }

    async mount() {
      if (document.getElementById(APP.ids.customMacroButton)) return;
      this.source = await this.storage.get("custom-macros", DEFAULT_CUSTOM_MACROS);
      this.parsed = parseCustomMacroDefinitions(this.source);
      const style = document.createElement("style");
      style.textContent = CUSTOM_MACRO_STYLE;
      document.head.append(style);
      this.button = document.createElement("button");
      this.button.id = APP.ids.customMacroButton;
      this.button.type = "button";
      this.button.textContent = "MACROS";
      this.button.title = "Open player-created macros";
      this.button.addEventListener("click", () => this.toggle());
      document.body.append(this.button);
      document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        if (this.running) this.engine.cancel();
        else if (this.editor) this.#closeEditor();
        else this.#closeMenu();
      });
      setInterval(() => this.refresh(), 750);
      this.refresh();
    }

    refresh() {
      if (!this.button) return;
      const settings = this.getSettings();
      this.button.hidden = !settings?.enabled || !settings?.customMacrosEnabled || !this.#isVisible(document.querySelector("#duel"));
      this.button.disabled = this.running;
      if (this.button.hidden) this.#closeMenu();
    }

    close() {
      this.engine.cancel();
      this.#closeMenu();
      this.#closeEditor();
    }

    toggle() {
      if (!this.menu) this.#renderMenu();
      else this.#closeMenu();
    }

    openEditor() {
      this.#closeEditor();
      const root = document.createElement("section");
      root.id = APP.ids.customMacroEditor;
      root.setAttribute("role", "dialog");
      root.setAttribute("aria-modal", "true");
      root.setAttribute("aria-label", "Custom macro editor");
      const card = document.createElement("div");
      card.className = "yf-custom-editor-card";
      const header = document.createElement("header");
      const title = document.createElement("h2");
      title.textContent = "Custom Macros";
      const close = document.createElement("button");
      close.type = "button";
      close.className = "yf-custom-close";
      close.setAttribute("aria-label", "Close macro editor");
      close.textContent = "×";
      close.addEventListener("click", () => this.#closeEditor());
      header.append(title, close);
      const intro = document.createElement("p");
      intro.textContent = "Custom DB-compatible format: Button Name | message or ${function(arguments)}. Separate function arguments with ~ and actions with |.";
      const textarea = document.createElement("textarea");
      textarea.value = this.source;
      textarea.spellcheck = false;
      const guide = document.createElement("details");
      const summary = document.createElement("summary");
      summary.textContent = "Syntax, variables, functions, and zones";
      const help = document.createElement("p");
      help.append(
        document.createTextNode("Categories: "), this.#code("-- Category Name"), document.createElement("br"),
        document.createTextNode("Variables: "), this.#code(CUSTOM_MACRO_VARIABLES.map((name) => `\${${name}}`).join(", ")), document.createElement("br"),
        document.createTextNode("Zones: M1–M5, S1–S5, OM1–OM5, EL, ER"), document.createElement("br"),
        document.createTextNode("Hand summon examples: "), this.#code("${specialFromHandInAtk(Card Name)} or ${specialFromHandInDefToZone(Card Name~M1~M2)}"), document.createElement("br"),
        document.createTextNode("Functions: "), this.#code(CUSTOM_MACRO_FUNCTIONS.map((name) => `${name}()`).join(", "))
      );
      guide.append(summary, help);
      const errors = document.createElement("div");
      errors.className = "yf-custom-errors";
      errors.hidden = true;
      const actions = document.createElement("div");
      actions.className = "yf-custom-editor-actions";
      const validate = document.createElement("button");
      validate.type = "button";
      validate.textContent = "Validate";
      validate.addEventListener("click", () => this.#showValidation(textarea.value, errors, false));
      const save = document.createElement("button");
      save.type = "button";
      save.className = "yf-custom-save";
      save.textContent = "Save Macros";
      save.addEventListener("click", () => this.#saveEditor(textarea.value, errors));
      actions.append(validate, save);
      card.append(header, intro, textarea, guide, errors, actions);
      root.append(card);
      root.addEventListener("click", (event) => { if (event.target === root) this.#closeEditor(); });
      document.body.append(root);
      this.editor = root;
      queueMicrotask(() => textarea.focus());
    }

    #code(text) { const code = document.createElement("code"); code.textContent = text; return code; }

    #showValidation(source, output, successToast) {
      const parsed = parseCustomMacroDefinitions(source);
      output.hidden = !parsed.errors.length;
      output.textContent = parsed.errors.join("\n");
      if (!parsed.errors.length && successToast) this.#showToast(`${parsed.macros.length} macro${parsed.macros.length === 1 ? "" : "s"} saved.`);
      else if (!parsed.errors.length) this.#showToast(`Valid: ${parsed.macros.length} macro${parsed.macros.length === 1 ? "" : "s"}.`);
      return parsed;
    }

    async #saveEditor(source, errors) {
      const parsed = this.#showValidation(source, errors, false);
      if (parsed.errors.length) return;
      try {
        await this.storage.set("custom-macros", String(source));
        this.source = String(source);
        this.parsed = parsed;
        this.#closeMenu();
        this.#showToast(`${parsed.macros.length} macro${parsed.macros.length === 1 ? "" : "s"} saved.`);
        this.diagnostics.info("custom-macros", "player macro definitions saved", { macroCount: parsed.macros.length });
        this.#closeEditor();
      } catch (error) {
        errors.hidden = false;
        errors.textContent = `Could not save macros: ${String(error?.message ?? error)}`;
      }
    }

    #renderMenu() {
      this.#closeMenu();
      const menu = document.createElement("section");
      menu.id = APP.ids.customMacroMenu;
      menu.setAttribute("aria-label", "Player-created macros");
      const title = document.createElement("strong");
      title.textContent = "⚙ Custom Macros";
      menu.append(title);
      if (!this.parsed.macros.length) {
        const empty = document.createElement("p");
        empty.className = "yf-custom-empty";
        empty.textContent = "No macros saved. Open YF → Manage Custom Macros.";
        menu.append(empty);
      }
      for (const group of this.parsed.groups) {
        const heading = document.createElement("h3");
        heading.textContent = group.name;
        const grid = document.createElement("div");
        grid.className = "yf-custom-macro-grid";
        for (const macro of group.macros) {
          const button = document.createElement("button");
          button.type = "button";
          button.textContent = macro.label;
          button.title = macro.actions.map((action) => action.raw ?? action.text).join(" | ");
          button.addEventListener("click", () => this.#run(macro));
          grid.append(button);
        }
        menu.append(heading, grid);
      }
      document.body.append(menu);
      this.menu = menu;
    }

    async #run(macro) {
      if (this.running) return;
      this.running = true;
      this.#closeMenu();
      this.refresh();
      this.#showToast(`Running ${macro.label}… Press Escape to stop.`);
      try {
        await this.engine.execute(macro);
        this.#showToast(`${macro.label} completed.`);
        this.diagnostics.info("custom-macros", "player macro completed", { label: macro.label, actionCount: macro.actions.length });
      } catch (error) {
        this.#showToast(String(error?.message ?? error), true);
        this.diagnostics.warn("custom-macros", "player macro stopped", { label: macro.label, reason: String(error?.message ?? error) });
      } finally {
        this.running = false;
        this.refresh();
      }
    }

    #closeMenu() { this.menu?.remove(); this.menu = null; }
    #closeEditor() { this.editor?.remove(); this.editor = null; }

    #showToast(message, error = false) {
      this.toast?.remove();
      this.toast = document.createElement("div");
      this.toast.id = APP.ids.customMacroToast;
      if (error) this.toast.className = "yf-custom-error";
      this.toast.textContent = message;
      document.body.append(this.toast);
      const current = this.toast;
      setTimeout(() => { if (this.toast === current) { current.remove(); this.toast = null; } }, error ? 6500 : 4200);
    }

    #isVisible(element) {
      if (!(element instanceof HTMLElement) || element.hidden) return false;
      const style = getComputedStyle(element);
      return style.display !== "none" && style.visibility !== "hidden" && element.getClientRects().length > 0;
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
    #${APP.ids.panel} .yf-start-match { display: block; width: 100%; margin: 10px 0 7px; border-color: #d6b55b; background: linear-gradient(135deg,#713f12,#9f1239); color: #fff7d6; font-weight: 800; }
    #${APP.ids.panel} .yf-manage-macros { display: block; width: 100%; margin: 7px 0; border-color: #c4b5fd; background: linear-gradient(135deg,#4c1d95,#1e3a8a); font-weight: 800; }
    #${APP.ids.launcher} { position: fixed; inset: 0; z-index: 2147483647; display: grid; place-items: center; box-sizing: border-box; padding: 20px; background: #020617b8; color: #f8fafc; font: 14px/1.4 Arial,sans-serif; pointer-events: auto; }
    #${APP.ids.launcher} * { box-sizing: border-box; }
    #${APP.ids.launcher} .yf-launcher-card { width: min(610px,calc(100vw - 32px)); max-height: calc(100vh - 32px); overflow: auto; border: 1px solid #d6b55b; border-radius: 14px; padding: 18px; background: linear-gradient(145deg,#111827fa,#172554fa 58%,#3f1237fa); box-shadow: 0 24px 80px #000d,0 0 30px #d6b55b33; }
    #${APP.ids.launcher} header { display: flex; align-items: center; justify-content: space-between; gap: 12px; border-bottom: 1px solid #d6b55b66; padding-bottom: 10px; }
    #${APP.ids.launcher} h2 { margin: 0; color: #fff7d6; font: 800 clamp(21px,4vw,30px)/1.1 Georgia,serif; }
    #${APP.ids.launcher} button { border: 1px solid #64748b; border-radius: 7px; background: #1e293b; color: #fff; padding: 9px 13px; cursor: pointer; font-weight: 700; }
    #${APP.ids.launcher} button:disabled { cursor: wait; opacity: .62; }
    #${APP.ids.launcher} .yf-launcher-close { border: 0; background: transparent; padding: 1px 7px; color: #cbd5e1; font-size: 28px; line-height: 1; }
    #${APP.ids.launcher} .yf-launcher-intro { margin: 14px 0; color: #cbd5e1; }
    #${APP.ids.launcher} .yf-launcher-form { display: grid; grid-template-columns: 1fr 1fr; gap: 13px; }
    #${APP.ids.launcher} .yf-launcher-form > label:not(.yf-launcher-check) { display: grid; gap: 6px; color: #f8e7aa; font-weight: 700; }
    #${APP.ids.launcher} input[type="text"], #${APP.ids.launcher} select { width: 100%; border: 1px solid #64748b; border-radius: 6px; background: #0f172a; color: #fff; padding: 9px; font: inherit; }
    #${APP.ids.launcher} .yf-launcher-check { display: flex; align-items: center; gap: 8px; border: 1px solid #334155; border-radius: 7px; padding: 9px; color: #e2e8f0; }
    #${APP.ids.launcher} .yf-launcher-summary { grid-column: 1/-1; display: grid; grid-template-columns: minmax(110px,.7fr) 1.5fr; gap: 0; margin: 2px 0; border: 1px solid #334155; border-radius: 8px; overflow: hidden; }
    #${APP.ids.launcher} .yf-launcher-summary dt, #${APP.ids.launcher} .yf-launcher-summary dd { margin: 0; border-bottom: 1px solid #334155; padding: 8px 10px; overflow-wrap: anywhere; }
    #${APP.ids.launcher} .yf-launcher-summary dt { color: #f8e7aa; background: #0f172a99; font-weight: 700; }
    #${APP.ids.launcher} .yf-launcher-summary dd { color: #f8fafc; }
    #${APP.ids.launcher} .yf-launcher-summary > :nth-last-child(-n+2) { border-bottom: 0; }
    #${APP.ids.launcher} .yf-launcher-review { margin: 14px 0; }
    #${APP.ids.launcher} .yf-launcher-error { grid-column: 1/-1; margin: 0; border: 1px solid #f87171; border-radius: 7px; background: #7f1d1d88; color: #fee2e2; padding: 9px; }
    #${APP.ids.launcher} .yf-launcher-error[hidden] { display: none; }
    #${APP.ids.launcher} .yf-launcher-ready { margin: 14px 0 8px; border: 1px solid #34d39988; border-radius: 7px; background: #064e3b88; color: #d1fae5; padding: 10px; }
    #${APP.ids.launcher} .yf-launcher-actions { grid-column: 1/-1; display: flex; justify-content: flex-end; gap: 9px; margin-top: 4px; }
    #${APP.ids.launcher} .yf-primary { border-color: #f8e7aa; background: linear-gradient(135deg,#92400e,#9f1239); color: #fff7d6; }
    @media (max-width: 560px) { #${APP.ids.launcher} .yf-launcher-form { grid-template-columns: 1fr; } #${APP.ids.launcher} .yf-launcher-summary { grid-template-columns: 1fr; } #${APP.ids.launcher} .yf-launcher-summary dt, #${APP.ids.launcher} .yf-launcher-summary dd { border-bottom: 1px solid #334155; } }
    #${APP.ids.overlay} { --yf-accent: #f8d36b; pointer-events: none; position: fixed; inset: 0; z-index: 2147483644; display: grid; place-items: center; overflow: hidden; background: radial-gradient(circle at 50% 45%, color-mix(in srgb, var(--yf-accent) 28%, transparent) 0, #020617e8 66%); animation: yf-overlay-in .3s ease-out both; }
    #${APP.ids.overlay}.yf-preset-petal-bloom-v1::before { content: ""; position: absolute; inset: -20%; background: conic-gradient(from 100deg at 50% 50%, transparent, #f9a8d455, transparent 30%, #fbcfe855, transparent 60%); filter: blur(28px); animation: yf-pink-light 3.6s ease-in-out both; }
    #${APP.ids.overlay}.yf-preset-arcane-bloom-v1 { background: radial-gradient(circle at 50% 56%, #ecfccb22 0 18%, transparent 48%), radial-gradient(circle at 24% 35%, #60a5fa2e, transparent 32%), radial-gradient(circle at 78% 38%, #c084fc2b, transparent 34%), linear-gradient(150deg, #04140df2, #0d1230f4 54%, #27103bf2); }
    #${APP.ids.overlay}.yf-preset-arcane-bloom-v1::before { content: ""; position: absolute; width: 105vmin; aspect-ratio: 1; border-radius: 50%; background: conic-gradient(from 20deg, #86efac00, #86efac4d, #f9a8d44d, #fb923c4d, #60a5fa4d, #c084fc4d, #86efac00); filter: blur(34px); opacity: 0; animation: yf-arcane-aura 4.6s ease-in-out both; }
    #${APP.ids.overlay}.yf-preset-trap-chase-v1 { background: #020103; }
    #${APP.ids.overlay}.yf-preset-trap-chase-v1::before { content: ""; position: absolute; inset: 0; z-index: 2; background: repeating-linear-gradient(0deg,#0000 0 4px,#f973160b 5px),radial-gradient(circle at 50% 48%,transparent 38%,#180307a8 76%,#020103f2 100%); mix-blend-mode: screen; animation: yf-trap-flash var(--yf-overlay-duration) ease-out both; }
    #${APP.ids.overlay}.yf-preset-trap-chase-v1::after { content: ""; position: absolute; inset: 0; z-index: 2; border: 0 solid #050102; box-shadow: inset 0 0 80px 24px #000b; animation: yf-no-escape var(--yf-overlay-duration) cubic-bezier(.7,0,.3,1) both; }
    #${APP.ids.overlay}.yf-preset-celestial-excavate-v1 { background: radial-gradient(circle at 50% 44%,#dbeafe2b 0 10%,#312e8130 32%,transparent 58%),radial-gradient(circle at 14% 18%,#67e8f92b,transparent 26%),radial-gradient(circle at 86% 24%,#c084fc2e,transparent 30%),linear-gradient(145deg,#020617c7,#11133dcc 50%,#240b3dc7); }
    #${APP.ids.overlay}.yf-preset-celestial-excavate-v1::before { content: ""; position: absolute; left: 50%; top: 43%; width: 118vmin; aspect-ratio: 1; border-radius: 50%; background: repeating-conic-gradient(from 0deg,#a5f3fc00 0 8deg,#a5f3fc24 9deg 10deg,#c084fc00 11deg 23deg,#f0abfc24 24deg 25deg); filter: blur(1px); opacity: 0; animation: yf-prism-wheel 6.2s cubic-bezier(.2,.8,.2,1) both; }
    #${APP.ids.overlay}.yf-preset-celestial-excavate-v1::after { content: ""; position: absolute; left: 50%; top: 43%; width: min(76vmin,760px); height: min(33vmin,330px); border: 3px solid #a5f3fc99; border-radius: 50%; box-shadow: 0 0 22px #67e8f9,inset 0 0 30px #c084fc66,0 0 70px #818cf866; opacity: 0; transform: translate(-50%,-50%) scale(.2); animation: yf-celestial-eye 6.2s ease-in-out both; }
    #${APP.ids.overlay}.yf-preset-concert-rise-v1 { background: radial-gradient(circle at 50% 48%,#facc1530 0 12%,transparent 44%),radial-gradient(circle at 20% 28%,#2563eb38,transparent 32%),radial-gradient(circle at 80% 28%,#dc262638,transparent 32%),linear-gradient(145deg,#070719cc,#1e1b4bcc 52%,#310a36c9); }
    #${APP.ids.overlay}.yf-preset-concert-rise-v1::before { content: ""; position: absolute; inset: 0; background: repeating-radial-gradient(ellipse at 50% 100%,transparent 0 8vmin,#facc1509 8.4vmin 8.8vmin); opacity: 0; animation: yf-concert-house-lights 4.8s ease-in-out both; }
    #${APP.ids.overlay}.yf-preset-ice-cream-choice-v1 { background: radial-gradient(circle at 50% 43%,#fff7d62b 0 15%,transparent 46%),radial-gradient(circle at 18% 34%,#7c3f2238,transparent 32%),radial-gradient(circle at 82% 34%,#f9a8c43d,transparent 32%),linear-gradient(145deg,#422006c7,#4c1d45c9 52%,#164e63c4); }
    #${APP.ids.overlay}.yf-preset-ice-cream-choice-v1::before { content: ""; position: absolute; inset: -12%; background: conic-gradient(from -25deg at 50% 48%,transparent 0 8%,#fff7d61f 10% 13%,transparent 15% 30%,#f9a8c424 32% 35%,transparent 37% 54%,#7c3f222d 56% 60%,transparent 62%); filter: blur(8px); opacity: 0; animation: yf-flavor-rays 5.2s ease-in-out both; }
    #${APP.ids.overlay} .yf-animation-stage { position: relative; width: min(1040px, 92vw); height: min(760px, 78vh); display: grid; place-items: center; }
    #${APP.ids.overlay} .yf-animation-art { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 12px 18px #000a) drop-shadow(0 0 24px color-mix(in srgb, var(--yf-accent) 75%, transparent)); will-change: transform, opacity, filter; animation: yf-art-bloom 3.6s cubic-bezier(.16,.78,.22,1) both; }
    #${APP.ids.overlay} .yf-animation-video { position: absolute; inset: 0; z-index: 1; width: 100%; height: 100%; object-fit: cover; opacity: 0; filter: saturate(1.08) contrast(1.08) brightness(.88); animation: yf-trap-video var(--yf-overlay-duration) ease-in-out both; }
    #${APP.ids.overlay} .yf-animation-nameplate { position: absolute; left: 50%; bottom: 3%; width: min(900px, 88vw); transform: translateX(-50%); border-block: 2px solid var(--yf-accent); padding: 15px 28px; color: white; background: linear-gradient(90deg, transparent, #831843dd 18%, #111827f2 50%, #831843dd 82%, transparent); text-align: center; animation: yf-nameplate 3.6s cubic-bezier(.2,.8,.2,1) both; }
    #${APP.ids.overlay} strong { display: block; color: #fff1f7; font: 800 clamp(25px,4.5vw,54px)/1.05 Georgia,serif; text-shadow: 0 2px 2px #000,0 0 22px var(--yf-accent); }
    #${APP.ids.overlay} span { display: block; margin-top: 10px; color: #ffe4ef; letter-spacing: .25em; text-transform: uppercase; font: 700 14px/1 Arial,sans-serif; }
    #${APP.ids.overlay} .yf-petals { position: absolute; inset: 0; overflow: hidden; }
    #${APP.ids.overlay} .yf-petal { --yf-size: 13px; position: absolute; left: -8vw; top: var(--yf-start-y); width: var(--yf-size); height: calc(var(--yf-size) * 1.55); border-radius: 90% 12% 85% 18%; background: radial-gradient(circle at 35% 30%, #fff 0 8%, #fbcfe8 30%, #f472b6 78%, #be185d); box-shadow: 0 0 7px #f9a8d4; opacity: 0; will-change: transform, opacity; animation: yf-petal-flow var(--yf-duration) linear var(--yf-delay) infinite; }
    #${APP.ids.overlay} .yf-arcane-field { position: absolute; inset: 0; overflow: hidden; }
    #${APP.ids.overlay} .yf-wisp-ring { position: absolute; left: 50%; top: 48%; width: var(--yf-ring); height: calc(var(--yf-ring) * .52); margin: calc(var(--yf-ring) * -.26) 0 0 calc(var(--yf-ring) * -.5); border: 3px solid transparent; border-top-color: var(--yf-color); border-right-color: color-mix(in srgb, var(--yf-color) 55%, transparent); border-radius: 50%; filter: drop-shadow(0 0 7px var(--yf-color)); opacity: 0; transform: rotate(var(--yf-tilt)) scale(.35); animation: yf-wisp-swirl 4.6s cubic-bezier(.2,.8,.2,1) var(--yf-delay) both; }
    #${APP.ids.overlay} .yf-magic-bloom { position: absolute; left: 50%; top: 48%; color: var(--yf-color); font: 700 clamp(30px,5vmin,62px)/1 Georgia,serif; text-shadow: 0 0 7px #fff,0 0 18px var(--yf-color),0 0 38px var(--yf-color); opacity: 0; transform: translate(-50%,-50%) rotate(var(--yf-angle)) translateY(-29vmin) rotate(var(--yf-counter-angle)) scale(.1); animation: yf-magic-flower 4.6s cubic-bezier(.18,.85,.2,1) var(--yf-delay) both; }
    #${APP.ids.overlay} .yf-fairy-dust { position: absolute; left: var(--yf-x); top: var(--yf-y); width: var(--yf-size); height: var(--yf-size); border-radius: 50%; background: #fff; box-shadow: 0 0 4px #fff,0 0 11px var(--yf-color),0 0 22px var(--yf-color); opacity: 0; animation: yf-fairy-rise 2.7s ease-in-out var(--yf-delay) infinite; }
    #${APP.ids.overlay}.yf-preset-arcane-bloom-v1 .yf-animation-art { animation: yf-polyflora-unfurl 4.6s cubic-bezier(.16,.84,.22,1) both; transform-origin: 50% 88%; }
    #${APP.ids.overlay}.yf-preset-arcane-bloom-v1 .yf-animation-nameplate { border-image: linear-gradient(90deg,#86efac,#f9a8d4,#fb923c,#60a5fa,#c084fc) 1; background: linear-gradient(90deg,transparent,#064e3bdd 20%,#172554ed 50%,#4c1d95dd 80%,transparent); animation-duration: 4.6s; }
    #${APP.ids.overlay}.yf-preset-arcane-bloom-v1 strong { color: #f0fdf4; text-shadow: 0 2px 2px #000,0 0 12px #86efac,0 0 28px #c084fc; }
    #${APP.ids.overlay}.yf-preset-trap-chase-v1 .yf-animation-stage { width: 100vw; height: 100vh; }
    #${APP.ids.overlay}.yf-preset-trap-chase-v1 .yf-animation-nameplate { z-index: 4; bottom: 4%; border-block-color: #fb923c; background: linear-gradient(90deg,transparent,#431407ed 16%,#111827f4 50%,#431407ed 84%,transparent); animation-duration: var(--yf-overlay-duration); }
    #${APP.ids.overlay}.yf-preset-trap-chase-v1 strong { color: #fff7ed; letter-spacing: .035em; text-shadow: 0 3px 2px #000,0 0 12px #f97316,0 0 30px #dc2626; }
    #${APP.ids.overlay}.yf-preset-celestial-excavate-v1 .yf-animation-stage { z-index: auto; width: 100vw; height: 100vh; }
    #${APP.ids.overlay}.yf-preset-celestial-excavate-v1 .yf-animation-art { inset: 4vh 24vw 15vh; width: 52vw; height: 80vh; transform-origin: 50% 55%; animation: yf-iris-reveal 6.2s cubic-bezier(.16,.84,.22,1) both; }
    #${APP.ids.overlay}.yf-preset-celestial-excavate-v1 .yf-animation-nameplate { z-index: 6; bottom: 1.8%; width: min(1040px,94vw); border-image: linear-gradient(90deg,#67e8f9,#c4b5fd,#f0abfc,#67e8f9) 1; background: linear-gradient(90deg,transparent,#164e63e8 14%,#312e81f2 50%,#581c87e8 86%,transparent); animation-duration: 6.2s; }
    #${APP.ids.overlay}.yf-preset-celestial-excavate-v1 strong { color: #f8fafc; font-size: clamp(20px,3.2vw,42px); text-shadow: 0 2px 2px #000,0 0 12px #67e8f9,0 0 28px #c084fc; }
    #${APP.ids.overlay} .yf-celestial-field { position: absolute; inset: 0; z-index: 4; overflow: hidden; perspective: 900px; }
    #${APP.ids.overlay} .yf-celestial-halo { position: absolute; left: 50%; top: 43%; width: min(68vmin,680px); aspect-ratio: 1; border: 2px solid #a5f3fc99; border-radius: 50%; box-shadow: 0 0 20px #67e8f9,inset 0 0 42px #8b5cf666; opacity: 0; transform: translate(-50%,-50%); animation: yf-celestial-halo 6.2s ease-in-out both; }
    #${APP.ids.overlay} .yf-celestial-halo::before, #${APP.ids.overlay} .yf-celestial-halo::after { content: ""; position: absolute; inset: 8%; border: 2px dashed #f0abfcaa; border-radius: 50%; animation: yf-halo-orbit 5s linear infinite; }
    #${APP.ids.overlay} .yf-celestial-halo::after { inset: 19%; border-color: #67e8f9aa; animation-direction: reverse; animation-duration: 3.8s; }
    #${APP.ids.overlay} .yf-iris-reflection { position: absolute; top: 9%; width: 38vw; height: 68vh; object-fit: contain; opacity: 0; filter: blur(2px) saturate(1.35) drop-shadow(0 0 18px #c084fc); animation: yf-iris-reflection 6.2s ease-in-out both; }
    #${APP.ids.overlay} .yf-iris-reflection-left { left: -5%; transform: scaleX(-1) rotate(-8deg); }
    #${APP.ids.overlay} .yf-iris-reflection-right { right: -5%; transform: rotate(8deg); animation-delay: .12s; }
    #${APP.ids.overlay} .yf-mirror-shard { position: absolute; left: 50%; top: 43%; width: clamp(12px,1.8vw,25px); height: clamp(42px,8vh,82px); clip-path: polygon(50% 0,100% 28%,72% 100%,0 74%); background: linear-gradient(145deg,#fff,#67e8f9 32%,#c4b5fd 64%,#f0abfc); box-shadow: 0 0 12px #a5f3fc; opacity: 0; transform: translate(-50%,-50%) rotate(var(--yf-angle)) translateY(var(--yf-radius)); animation: yf-mirror-orbit 6.2s cubic-bezier(.2,.8,.2,1) var(--yf-delay) both; }
    #${APP.ids.overlay} .yf-celestial-star { position: absolute; left: var(--yf-x); top: var(--yf-y); width: var(--yf-size); height: var(--yf-size); border-radius: 50%; background: #fff; box-shadow: 0 0 5px #fff,0 0 13px #67e8f9,0 0 22px #c084fc; opacity: 0; animation: yf-star-reflect 2.2s ease-in-out var(--yf-delay) infinite; }
    #${APP.ids.overlay} .yf-card-destination { position: absolute; opacity: 0; color: #fff; text-align: center; font: 800 clamp(11px,1.4vw,17px)/1 Arial,sans-serif; letter-spacing: .14em; text-shadow: 0 2px 2px #000,0 0 12px currentColor; animation: yf-destination-label 6.2s ease-in-out both; }
    #${APP.ids.overlay} .yf-card-destination span { margin: 0; color: inherit; letter-spacing: inherit; font: inherit; }
    #${APP.ids.overlay} .yf-destination-hand { left: 4%; top: 14%; width: 25vw; height: 27vh; border: 2px solid #67e8f9aa; border-radius: 50%; color: #a5f3fc; box-shadow: inset 0 0 34px #0891b244,0 0 22px #67e8f955; }
    #${APP.ids.overlay} .yf-destination-graveyard { left: 5%; bottom: 3%; width: 27vw; height: 17vh; border-bottom: 5px solid #a78bfa; border-radius: 50%; color: #c4b5fd; background: radial-gradient(ellipse at bottom,#4c1d9577,transparent 65%); filter: drop-shadow(0 0 14px #7c3aed); }
    #${APP.ids.overlay} .yf-destination-graveyard span { position: absolute; left: 50%; top: -28px; width: max-content; transform: translateX(-50%); }
    #${APP.ids.overlay} .yf-destination-banished { right: 3%; top: 24%; display: grid; place-items: center; width: min(29vw,390px); aspect-ratio: 1; border: 3px solid #f0abfc; border-radius: 50%; color: #f5d0fe; background: radial-gradient(circle,#000 0 18%,#312e81cc 31%,#a855f766 42%,transparent 64%); box-shadow: 0 0 22px #c084fc,inset 0 0 32px #000; animation-name: yf-destination-label,yf-banish-void; }
    #${APP.ids.overlay} .yf-excavate-card { position: absolute; left: 50%; top: 71%; z-index: 5; width: clamp(70px,8.2vw,112px); aspect-ratio: 813/1185; border: 2px solid #fed7aa; border-radius: 7px; object-fit: cover; box-shadow: 0 8px 18px #000b,0 0 18px #f59e0b88; opacity: 0; backface-visibility: hidden; transform-origin: center; }
    #${APP.ids.overlay} .yf-excavate-hand { animation: yf-card-to-hand 6.2s cubic-bezier(.2,.8,.2,1) both; }
    #${APP.ids.overlay} .yf-excavate-graveyard { animation: yf-card-to-graveyard 6.2s cubic-bezier(.2,.8,.2,1) both; }
    #${APP.ids.overlay} .yf-excavate-banished { animation: yf-card-to-banished 6.2s cubic-bezier(.2,.8,.2,1) both; }
    #${APP.ids.overlay} .yf-excavate-deck { position: absolute; left: 50%; top: 76%; z-index: 3; width: clamp(70px,8.2vw,112px); aspect-ratio: 813/1185; transform: translateX(-50%) rotate(2deg); filter: drop-shadow(0 9px 10px #000b); animation: yf-deck-summon 6.2s ease-in-out both; }
    #${APP.ids.overlay} .yf-excavate-deck img { position: absolute; inset: var(--yf-stack) 0 0 var(--yf-stack); width: 100%; height: 100%; border: 2px solid #fed7aa; border-radius: 7px; object-fit: cover; }
    #${APP.ids.overlay}.yf-preset-concert-rise-v1 .yf-animation-stage { z-index: auto; width: 100vw; height: 100vh; }
    #${APP.ids.overlay}.yf-preset-concert-rise-v1 .yf-animation-art { inset: 2vh 18vw 14vh; width: 64vw; height: 84vh; transform-origin: 50% 78%; animation: yf-band-entrance 4.8s cubic-bezier(.16,.84,.22,1) both; }
    #${APP.ids.overlay}.yf-preset-concert-rise-v1 .yf-animation-nameplate { z-index: 6; bottom: 1.8%; width: min(1050px,94vw); border-image: linear-gradient(90deg,#2563eb,#f8fafc,#dc2626,#facc15,#2563eb) 1; background: linear-gradient(90deg,transparent,#172554eb 13%,#3f0b42f2 50%,#7f1d1deb 87%,transparent); animation-duration: 4.8s; }
    #${APP.ids.overlay}.yf-preset-concert-rise-v1 strong { color: #fffbea; font-size: clamp(20px,3.7vw,48px); text-shadow: 0 3px 2px #000,0 0 12px #facc15,0 0 26px #f97316; }
    #${APP.ids.overlay}.yf-preset-concert-rise-v1 span { color: #dbeafe; }
    #${APP.ids.overlay} .yf-concert-field { position: absolute; inset: 0; z-index: 4; overflow: hidden; }
    #${APP.ids.overlay} .yf-concert-spotlight { position: absolute; left: var(--yf-origin-x); top: -10%; width: 22vw; height: 105vh; transform-origin: 50% 0; transform: translateX(-50%) rotate(var(--yf-angle)); clip-path: polygon(44% 0,56% 0,100% 100%,0 100%); background: linear-gradient(to bottom,color-mix(in srgb,var(--yf-color) 65%,#fff),color-mix(in srgb,var(--yf-color) 18%,transparent) 60%,transparent); filter: blur(10px); opacity: 0; mix-blend-mode: screen; animation: yf-spotlight-sweep 4.8s ease-in-out var(--yf-delay) both; }
    #${APP.ids.overlay} .yf-concert-equalizer { position: absolute; left: 4%; right: 4%; bottom: 7%; height: 27vh; display: flex; align-items: end; justify-content: space-between; gap: .55vw; opacity: 0; animation: yf-equalizer-reveal 4.8s ease-in-out both; }
    #${APP.ids.overlay} .yf-concert-equalizer i { flex: 1 1 0; min-width: 3px; height: var(--yf-height); border-radius: 4px 4px 0 0; background: linear-gradient(to top,var(--yf-color),#fff); box-shadow: 0 0 8px var(--yf-color),0 0 18px color-mix(in srgb,var(--yf-color) 70%,transparent); transform-origin: 50% 100%; animation: yf-equalizer-beat .62s ease-in-out var(--yf-delay) infinite alternate; }
    #${APP.ids.overlay} .yf-music-note { position: absolute; left: var(--yf-x); bottom: -10vh; color: var(--yf-color); text-shadow: 0 2px 2px #000,0 0 8px #fff,0 0 18px var(--yf-color); opacity: 0; font: 800 var(--yf-size)/1 Georgia,serif; animation: yf-note-rise var(--yf-duration) ease-in var(--yf-delay) infinite; }
    #${APP.ids.overlay} .yf-concert-pulse { position: absolute; left: 50%; top: 59%; width: 20vmin; aspect-ratio: 1; border: 4px solid var(--yf-color); border-radius: 50%; box-shadow: 0 0 16px var(--yf-color),inset 0 0 12px var(--yf-color); opacity: 0; transform: translate(-50%,-50%) scale(.2); animation: yf-concert-pulse 1.3s ease-out var(--yf-delay) infinite; }
    #${APP.ids.overlay}.yf-preset-ice-cream-choice-v1 .yf-animation-stage { z-index: auto; width: 100vw; height: 100vh; }
    #${APP.ids.overlay}.yf-preset-ice-cream-choice-v1 .yf-animation-art { inset: 1vh 22vw 14vh; z-index: 2; width: 56vw; height: 82vh; transform-origin: 50% 66%; animation: yf-painful-choice 5.2s cubic-bezier(.16,.84,.22,1) both; }
    #${APP.ids.overlay}.yf-preset-ice-cream-choice-v1 .yf-animation-nameplate { z-index: 7; bottom: 1.8%; width: min(980px,94vw); border-image: linear-gradient(90deg,#fff7d6,#7c3f22,#f9a8c4,#fff7d6) 1; background: linear-gradient(90deg,transparent,#713f12e8 14%,#4c1d45f2 50%,#9d174de8 86%,transparent); animation-duration: 5.2s; }
    #${APP.ids.overlay}.yf-preset-ice-cream-choice-v1 strong { color: #fff7ed; font-size: clamp(24px,4.2vw,52px); text-shadow: 0 3px 2px #3f1d12,0 0 12px #f9a8c4,0 0 26px #fff7d6; }
    #${APP.ids.overlay}.yf-preset-ice-cream-choice-v1 span { color: #fff7d6; }
    #${APP.ids.overlay} .yf-ice-cream-field { position: absolute; inset: 0; z-index: 4; overflow: hidden; perspective: 900px; }
    #${APP.ids.overlay} .yf-flavor-question { position: absolute; left: var(--yf-x); top: var(--yf-y); color: var(--yf-color); opacity: 0; transform: translate(-50%,-50%) rotate(var(--yf-tilt)); font: 900 clamp(40px,var(--yf-size),96px)/1 Georgia,serif; text-shadow: 0 3px 2px #3f1d12,0 0 9px #fff,0 0 25px var(--yf-color); animation: yf-flavor-question 5.2s cubic-bezier(.18,.85,.2,1) var(--yf-delay) both; }
    #${APP.ids.overlay} .yf-flavor-dilemma { position: absolute; left: 50%; top: 10%; color: #fff7d6; opacity: 0; transform: translateX(-50%); font: 900 clamp(70px,12vw,170px)/1 Georgia,serif; text-shadow: 0 4px 3px #3f1d12,0 0 16px #f9a8c4,0 0 42px #fff7d6; animation: yf-flavor-dilemma 5.2s ease-in-out both; }
    #${APP.ids.overlay} .yf-sprinkle { position: absolute; left: var(--yf-x); bottom: -5vh; width: 5px; height: 17px; border-radius: 4px; background: var(--yf-color); box-shadow: 0 0 6px var(--yf-color); opacity: 0; animation: yf-sprinkle-pop var(--yf-duration) linear var(--yf-delay) infinite; }
    #${APP.ids.overlay} .yf-trap-field { position: absolute; inset: 0; z-index: 3; overflow: hidden; }
    #${APP.ids.overlay} .yf-trap-stamp { position: absolute; top: 7%; left: 50%; transform: translateX(-50%) rotate(-3deg); border: 4px double #fb923c; padding: 8px 18px; color: #fff7ed; background: #450a0ae8; box-shadow: 0 0 18px #f97316, inset 0 0 14px #7f1d1d; opacity: 0; letter-spacing: .26em; font: 900 clamp(15px,2.2vw,28px)/1 Arial,sans-serif; animation: yf-trap-stamp var(--yf-overlay-duration) cubic-bezier(.2,.8,.2,1) both; }
    #${APP.ids.overlay} .yf-trap-page { position: absolute; left: -12vw; top: var(--yf-y); width: 38px; height: 26px; border: 1px solid #7c5b36; background: repeating-linear-gradient(0deg,#ead9ae 0 5px,#8b6b4538 6px); box-shadow: 0 2px 8px #0008,0 0 9px #fb923c66; opacity: 0; animation: yf-trap-page var(--yf-duration) linear var(--yf-delay) infinite; }
    #${APP.ids.overlay} .yf-trap-frame { position: absolute; inset: 2.4vmin; border: 2px solid #fb923c80; background: linear-gradient(90deg,#fb923c 0 9%,transparent 9% 91%,#fb923c 91%) top/100% 4px no-repeat,linear-gradient(90deg,#fb923c 0 9%,transparent 9% 91%,#fb923c 91%) bottom/100% 4px no-repeat,linear-gradient(#fb923c 0 14%,transparent 14% 86%,#fb923c 86%) left/4px 100% no-repeat,linear-gradient(#fb923c 0 14%,transparent 14% 86%,#fb923c 86%) right/4px 100% no-repeat; box-shadow: inset 0 0 42px #7f1d1d66,0 0 18px #f9731666; animation: yf-trap-frame var(--yf-overlay-duration) ease-in-out both; }
    #${APP.ids.overlay} .yf-trap-seal { position: absolute; right: 2.3%; bottom: 4.2%; display: grid; place-items: center; width: 78px; aspect-ratio: 1; border: 4px double #fed7aa; border-radius: 50%; color: #fff7ed; background: radial-gradient(circle,#991b1b 0 48%,#450a0a 52% 66%,#f97316 69% 73%,#450a0a 76%); box-shadow: 0 0 15px #000,0 0 24px #f97316; opacity: 0; transform: rotate(12deg) scale(1.8); text-align: center; letter-spacing: .08em; font: 900 12px/1 Arial,sans-serif; animation: yf-trap-seal var(--yf-overlay-duration) cubic-bezier(.2,.8,.2,1) both; }
    #${APP.ids.overlay}.yf-reduced-motion { animation: none; background: #020617dd; }
    #${APP.ids.overlay}.yf-reduced-motion .yf-animation-art, #${APP.ids.overlay}.yf-reduced-motion .yf-animation-video, #${APP.ids.overlay}.yf-reduced-motion .yf-animation-nameplate { animation: none; opacity: 1; }
    #${APP.ids.overlay}.yf-reduced-motion .yf-arcane-field, #${APP.ids.overlay}.yf-reduced-motion .yf-trap-field, #${APP.ids.overlay}.yf-reduced-motion .yf-celestial-field, #${APP.ids.overlay}.yf-reduced-motion .yf-concert-field, #${APP.ids.overlay}.yf-reduced-motion .yf-ice-cream-field { display: none; }
    @keyframes yf-overlay-in { from { opacity: 0 } to { opacity: 1 } }
    @keyframes yf-art-bloom { 0% { opacity: 0; transform: translate3d(0,12vh,0) scale(.64) rotate(-4deg); filter: blur(12px) brightness(1.8) } 18% { opacity: 1 } 42%,76% { opacity: 1; transform: translate3d(0,-1vh,0) scale(1.02) rotate(0); filter: blur(0) brightness(1.08) } 100% { opacity: 0; transform: translate3d(0,-3vh,0) scale(1.08); filter: blur(2px) brightness(1.25) } }
    @keyframes yf-nameplate { 0%,18% { opacity: 0; transform: translate3d(-50%,28px,0) scaleX(.72) } 32%,78% { opacity: 1; transform: translate3d(-50%,0,0) scaleX(1) } 100% { opacity: 0; transform: translate3d(-50%,-10px,0) scaleX(1.02) } }
    @keyframes yf-petal-flow { 0% { opacity: 0; transform: translate3d(-8vw,0,0) rotate(0deg) } 10%,82% { opacity: .94 } 100% { opacity: 0; transform: translate3d(118vw,var(--yf-curve),0) rotate(820deg) } }
    @keyframes yf-pink-light { 0% { opacity: 0; transform: rotate(-9deg) scale(.82) } 25%,70% { opacity: 1; transform: rotate(4deg) scale(1.04) } 100% { opacity: 0; transform: rotate(12deg) scale(1.12) } }
    @keyframes yf-arcane-aura { 0% { opacity: 0; transform: rotate(-45deg) scale(.35) } 28%,72% { opacity: .82; transform: rotate(85deg) scale(1) } 100% { opacity: 0; transform: rotate(160deg) scale(1.18) } }
    @keyframes yf-wisp-swirl { 0% { opacity: 0; transform: rotate(var(--yf-tilt)) scale(.25) } 24% { opacity: .9 } 58% { opacity: .72; transform: rotate(calc(var(--yf-tilt) + 280deg)) scale(1) } 100% { opacity: 0; transform: rotate(calc(var(--yf-tilt) + 520deg)) scale(1.2) } }
    @keyframes yf-magic-flower { 0%,14% { opacity: 0; transform: translate(-50%,-50%) rotate(var(--yf-angle)) translateY(-8vmin) rotate(var(--yf-counter-angle)) scale(.1) } 38%,72% { opacity: .95; transform: translate(-50%,-50%) rotate(var(--yf-angle)) translateY(-29vmin) rotate(var(--yf-counter-angle)) scale(1) } 100% { opacity: 0; transform: translate(-50%,-50%) rotate(var(--yf-final-angle)) translateY(-36vmin) rotate(var(--yf-final-counter-angle)) scale(1.3) } }
    @keyframes yf-fairy-rise { 0% { opacity: 0; transform: translate3d(0,4vh,0) scale(.2) } 28%,70% { opacity: .95 } 100% { opacity: 0; transform: translate3d(var(--yf-drift-x),var(--yf-drift-y),0) scale(1.5) } }
    @keyframes yf-polyflora-unfurl { 0% { opacity: 0; transform: translate3d(0,25vh,0) scale(.18,.05); filter: blur(15px) brightness(2) } 22% { opacity: .92; transform: translate3d(0,4vh,0) scale(.78,1.05); filter: blur(2px) brightness(1.45) } 42%,78% { opacity: 1; transform: translate3d(0,-1vh,0) scale(1); filter: blur(0) brightness(1.08) drop-shadow(0 0 24px #86efac) } 100% { opacity: 0; transform: translate3d(0,-5vh,0) scale(1.08); filter: blur(3px) brightness(1.35) } }
    @keyframes yf-trap-video { 0% { opacity: 0; transform: scale(1.08); filter: saturate(.8) contrast(1.25) brightness(.35) } 7%,88% { opacity: 1; transform: scale(1); filter: saturate(1.08) contrast(1.08) brightness(.9) } 96% { opacity: 1; filter: saturate(.7) contrast(1.3) brightness(.62) } 100% { opacity: 0; transform: scale(1.035); filter: saturate(.2) contrast(1.4) brightness(.18) } }
    @keyframes yf-trap-flash { 0% { opacity: 0 } 3% { opacity: 1; background-color: #fff7ed99 } 8%,84% { opacity: .56; background-color: transparent } 90% { opacity: .9; background-color: #7f1d1d55 } 100% { opacity: 0 } }
    @keyframes yf-no-escape { 0%,78% { border-width: 0; opacity: .55 } 92% { border-width: 7vmin; opacity: .88 } 100% { border-width: 28vmin; opacity: 1 } }
    @keyframes yf-trap-stamp { 0%,5% { opacity: 0; transform: translateX(-50%) rotate(-8deg) scale(2.4) } 11%,66% { opacity: .96; transform: translateX(-50%) rotate(-3deg) scale(1) } 75%,100% { opacity: 0; transform: translateX(-50%) rotate(2deg) scale(.9) } }
    @keyframes yf-trap-page { 0% { opacity: 0; transform: translate3d(-8vw,0,0) rotate(0) } 10%,82% { opacity: .82 } 100% { opacity: 0; transform: translate3d(122vw,var(--yf-curve),0) rotate(var(--yf-spin)) } }
    @keyframes yf-trap-frame { 0% { opacity: 0; transform: scale(1.14) } 9%,82% { opacity: .8; transform: scale(1) } 94% { opacity: 1; transform: scale(.96) } 100% { opacity: 0; transform: scale(.82) } }
    @keyframes yf-trap-seal { 0%,12% { opacity: 0; transform: rotate(35deg) scale(2.1) } 18%,82% { opacity: .96; transform: rotate(12deg) scale(1) } 94%,100% { opacity: 0; transform: rotate(-6deg) scale(.72) } }
    @keyframes yf-prism-wheel { 0% { opacity: 0; transform: translate(-50%,-50%) rotate(-40deg) scale(.25) } 22%,78% { opacity: .72; transform: translate(-50%,-50%) rotate(120deg) scale(1) } 100% { opacity: 0; transform: translate(-50%,-50%) rotate(210deg) scale(1.15) } }
    @keyframes yf-celestial-eye { 0%,8% { opacity: 0; transform: translate(-50%,-50%) scale(.2,.06) } 24%,76% { opacity: .9; transform: translate(-50%,-50%) scale(1) } 100% { opacity: 0; transform: translate(-50%,-50%) scale(1.2,.2) } }
    @keyframes yf-celestial-halo { 0%,8% { opacity: 0; transform: translate(-50%,-50%) scale(.25) rotate(-40deg) } 24%,80% { opacity: .8; transform: translate(-50%,-50%) scale(1) rotate(20deg) } 100% { opacity: 0; transform: translate(-50%,-50%) scale(1.18) rotate(75deg) } }
    @keyframes yf-halo-orbit { to { transform: rotate(360deg) } }
    @keyframes yf-iris-reveal { 0% { opacity: 0; transform: scale(.35) rotateY(70deg); filter: blur(16px) brightness(2) } 18% { opacity: .92; transform: scale(.92) rotateY(0); filter: blur(1px) brightness(1.35) } 34%,80% { opacity: 1; transform: scale(1); filter: blur(0) brightness(1.08) drop-shadow(0 0 22px #67e8f9) } 100% { opacity: 0; transform: scale(1.08); filter: blur(4px) brightness(1.5) } }
    @keyframes yf-iris-reflection { 0%,12% { opacity: 0 } 28%,70% { opacity: .14 } 84%,100% { opacity: 0 } }
    @keyframes yf-mirror-orbit { 0%,8% { opacity: 0; transform: translate(-50%,-50%) rotate(var(--yf-angle)) translateY(var(--yf-near-radius)) scale(.2) } 25%,76% { opacity: .72; transform: translate(-50%,-50%) rotate(calc(var(--yf-angle) + 170deg)) translateY(var(--yf-radius)) scale(1) } 100% { opacity: 0; transform: translate(-50%,-50%) rotate(calc(var(--yf-angle) + 330deg)) translateY(var(--yf-far-radius)) scale(.55) } }
    @keyframes yf-star-reflect { 0%,100% { opacity: 0; transform: scale(.2) } 45% { opacity: .95; transform: scale(1.45) } }
    @keyframes yf-destination-label { 0%,38% { opacity: 0; transform: scale(.6) } 48%,78% { opacity: .86; transform: scale(1) } 92%,100% { opacity: 0; transform: scale(1.08) } }
    @keyframes yf-banish-void { 0%,35% { filter: brightness(.2); transform: rotate(-90deg) scale(.2) } 52%,80% { filter: brightness(1.2); transform: rotate(25deg) scale(1) } 100% { filter: brightness(0); transform: rotate(100deg) scale(.05) } }
    @keyframes yf-card-to-hand { 0%,10% { opacity: 0; transform: translate(-50%,18vh) rotate(0) scale(.4) } 25% { opacity: 1; transform: translate(calc(-50% - 9vw),-18vh) rotate(-13deg) scale(1) } 43% { opacity: 1; transform: translate(calc(-50% - 9vw),-18vh) rotate(-13deg) scale(1.06) } 72%,82% { opacity: 1; transform: translate(calc(-50% - 40vw),-51vh) rotate(-9deg) scale(.74) } 100% { opacity: 0; transform: translate(calc(-50% - 43vw),-55vh) rotate(-5deg) scale(.66) } }
    @keyframes yf-card-to-graveyard { 0%,12% { opacity: 0; transform: translate(-50%,18vh) rotate(0) scale(.4) } 27% { opacity: 1; transform: translate(-50%,-20vh) rotate(0) scale(1) } 43% { opacity: 1; transform: translate(-50%,-20vh) rotate(0) scale(1.06) } 72% { opacity: 1; transform: translate(calc(-50% - 35vw),12vh) rotate(-24deg) scale(.7) } 88%,100% { opacity: 0; transform: translate(calc(-50% - 37vw),32vh) rotate(-42deg) scale(.45) } }
    @keyframes yf-card-to-banished { 0%,14% { opacity: 0; transform: translate(-50%,18vh) rotate(0) scale(.4) } 29% { opacity: 1; transform: translate(calc(-50% + 9vw),-18vh) rotate(13deg) scale(1) } 43% { opacity: 1; transform: translate(calc(-50% + 9vw),-18vh) rotate(13deg) scale(1.06) } 70% { opacity: 1; transform: translate(calc(-50% + 37vw),-28vh) rotate(230deg) rotateY(0) scale(.72) } 88%,100% { opacity: 0; transform: translate(calc(-50% + 38vw),-28vh) rotate(590deg) rotateY(88deg) scale(.04) } }
    @keyframes yf-deck-summon { 0%,8% { opacity: 0; transform: translateX(-50%) translateY(20vh) rotate(2deg) } 18%,46% { opacity: 1; transform: translateX(-50%) translateY(0) rotate(2deg) } 58%,100% { opacity: 0; transform: translateX(-50%) translateY(9vh) rotate(-4deg) } }
    @keyframes yf-concert-house-lights { 0% { opacity: 0; transform: scale(.7) } 18%,78% { opacity: 1; transform: scale(1) } 100% { opacity: 0; transform: scale(1.15) } }
    @keyframes yf-band-entrance { 0% { opacity: 0; transform: translate3d(0,22vh,0) scale(.55); filter: blur(12px) saturate(1.8) brightness(1.6) } 18% { opacity: 1; transform: translate3d(0,-1vh,0) scale(1.04); filter: blur(0) saturate(1.25) brightness(1.18) } 32%,74% { opacity: 1; transform: translate3d(0,0,0) scale(1); filter: blur(0) saturate(1.12) brightness(1.05) drop-shadow(0 0 20px #facc15) } 82% { transform: translate3d(0,-1.2vh,0) scale(1.025) rotate(.4deg) } 90% { transform: translate3d(0,0,0) scale(1) rotate(-.35deg) } 100% { opacity: 0; transform: translate3d(0,-4vh,0) scale(1.06); filter: blur(3px) saturate(1.4) brightness(1.35) } }
    @keyframes yf-spotlight-sweep { 0% { opacity: 0; transform: translateX(-50%) rotate(calc(var(--yf-angle) - 16deg)) } 18%,72% { opacity: .42; transform: translateX(-50%) rotate(calc(var(--yf-angle) + 12deg)) } 100% { opacity: 0; transform: translateX(-50%) rotate(calc(var(--yf-angle) - 8deg)) } }
    @keyframes yf-equalizer-reveal { 0%,10% { opacity: 0; transform: translateY(15vh) } 24%,80% { opacity: .72; transform: translateY(0) } 100% { opacity: 0; transform: translateY(8vh) } }
    @keyframes yf-equalizer-beat { from { transform: scaleY(.2); filter: brightness(.75) } to { transform: scaleY(1); filter: brightness(1.4) } }
    @keyframes yf-note-rise { 0% { opacity: 0; transform: translate3d(0,8vh,0) rotate(-18deg) scale(.35) } 12%,78% { opacity: .92 } 100% { opacity: 0; transform: translate3d(var(--yf-drift),-118vh,0) rotate(42deg) scale(1.18) } }
    @keyframes yf-concert-pulse { 0% { opacity: .8; transform: translate(-50%,-50%) scale(.15) } 100% { opacity: 0; transform: translate(-50%,-50%) scale(5.2) } }
    @keyframes yf-flavor-rays { 0% { opacity: 0; transform: rotate(-18deg) scale(.65) } 22%,78% { opacity: 1; transform: rotate(7deg) scale(1) } 100% { opacity: 0; transform: rotate(20deg) scale(1.18) } }
    @keyframes yf-painful-choice { 0% { opacity: 0; transform: translateY(16vh) scale(.55); filter: blur(12px) saturate(1.6) brightness(1.5) } 19% { opacity: 1; transform: translateY(-1vh) scale(1.04); filter: blur(0) saturate(1.2) brightness(1.14) } 34%,76% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0) saturate(1.08) brightness(1.04) drop-shadow(0 0 22px #f9a8c4) } 84% { transform: translateX(-1.1vw) rotate(-.5deg) } 90% { transform: translateX(1.1vw) rotate(.5deg) } 100% { opacity: 0; transform: translateY(-3vh) scale(1.06); filter: blur(3px) brightness(1.3) } }
    @keyframes yf-flavor-question { 0%,10% { opacity: 0; transform: translate(-50%,-50%) translateY(15vh) rotate(var(--yf-tilt)) scale(.25) } 25%,68% { opacity: .86; transform: translate(-50%,-50%) translateY(0) rotate(var(--yf-tilt)) scale(1) } 78% { opacity: 1; transform: translate(-50%,-50%) translateY(-2vh) rotate(calc(var(--yf-tilt) + 12deg)) scale(1.18) } 100% { opacity: 0; transform: translate(-50%,-50%) translateY(-18vh) rotate(calc(var(--yf-tilt) - 10deg)) scale(.65) } }
    @keyframes yf-flavor-dilemma { 0%,14% { opacity: 0; transform: translateX(-50%) scale(2.2) rotate(-14deg) } 27%,72% { opacity: .9; transform: translateX(-50%) scale(1) rotate(0) } 80% { transform: translateX(-50%) scale(1.15) rotate(8deg) } 100% { opacity: 0; transform: translateX(-50%) scale(.7) rotate(-12deg) } }
    @keyframes yf-sprinkle-pop { 0% { opacity: 0; transform: translate3d(0,6vh,0) rotate(0) } 12%,78% { opacity: .9 } 100% { opacity: 0; transform: translate3d(var(--yf-drift),-112vh,0) rotate(var(--yf-spin)) } }
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
      intro.textContent = "League presentation and guided match tools.";
      this.status = document.createElement("div");
      this.status.className = "yf-status";
      panel.append(heading, intro, this.status);

      const settings = this.getState().settings;
      panel.append(
        this.#checkbox("Companion enabled", "enabled", settings.enabled),
        this.#checkbox("Animations enabled", "animationsEnabled", settings.animationsEnabled),
        this.#checkbox("Mute audio", "muted", settings.muted),
        this.#checkbox("Reduced motion", "reducedMotion", settings.reducedMotion),
        this.#checkbox("Custom macros enabled", "customMacrosEnabled", settings.customMacrosEnabled),
        this.#checkbox("Diagnostics", "diagnosticsEnabled", settings.diagnosticsEnabled)
      );

      const manageMacros = document.createElement("button");
      manageMacros.type = "button";
      manageMacros.className = "yf-manage-macros";
      manageMacros.textContent = "Manage Custom Macros";
      manageMacros.addEventListener("click", () => { panel.hidden = true; this.actions.openCustomMacros(); });

      const startMatch = document.createElement("button");
      startMatch.type = "button";
      startMatch.className = "yf-start-match";
      startMatch.textContent = "Start YugiFAUX Match";
      startMatch.addEventListener("click", () => { panel.hidden = true; this.actions.startLeagueMatch(); });

      const testAsh = document.createElement("button");
      testAsh.type = "button";
      testAsh.textContent = "Preview Ash Blossom";
      testAsh.addEventListener("click", () => { panel.hidden = true; this.actions.preview("Ash Blossom & Lonely Spring"); });
      const testPolyflora = document.createElement("button");
      testPolyflora.type = "button";
      testPolyflora.textContent = "Preview Polyflora";
      testPolyflora.addEventListener("click", () => { panel.hidden = true; this.actions.preview("Polyflora Hexbloom"); });
      const testNoWayOut = document.createElement("button");
      testNoWayOut.type = "button";
      testNoWayOut.textContent = "Preview No Way Out!";
      testNoWayOut.addEventListener("click", () => { panel.hidden = true; this.actions.preview("No Way Out!"); });
      const testIris = document.createElement("button");
      testIris.type = "button";
      testIris.textContent = "Preview Iris";
      testIris.addEventListener("click", () => { panel.hidden = true; this.actions.preview("Iris the Radiant, the Celestial Eye of Infinite Reflections"); });
      const testPepper = document.createElement("button");
      testPepper.type = "button";
      testPepper.textContent = "Preview Sgt. Pepper";
      testPepper.addEventListener("click", () => { panel.hidden = true; this.actions.preview("Sgt. Pepper's Lonely Hearts Club Band"); });
      const testPainfulPreference = document.createElement("button");
      testPainfulPreference.type = "button";
      testPainfulPreference.textContent = "Preview Painful Preference";
      testPainfulPreference.addEventListener("click", () => { panel.hidden = true; this.actions.preview("Painful Preference", "activation"); });
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
      panel.append(startMatch, manageMacros, testAsh, testPolyflora, testNoWayOut, testIris, testPepper, testPainfulPreference, reload, disable, this.diagnosticOutput);
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
  let matchLauncher;
  let tokenMacros;
  let chainMacros;
  let customMacros;
  let markerTracker;

  async function persistSettings() {
    await storage.set("settings", state.settings);
  }

  async function reloadConfig() {
    state.configState = await new ConfigLoader(storage, diagnostics).load();
    ui?.refresh();
  }

  function handlePublicEvent(event) {
    if (!state.settings.enabled) return;
    markerTracker?.handlePublicEvent(event);
    animationPlayer.handle(event, state.configState?.config ?? BUNDLED_CONFIG);
  }

  async function start() {
    state.settings = { ...DEFAULT_SETTINGS, ...(await storage.get("settings", {})) };
    diagnostics.setEnabled(state.settings.diagnosticsEnabled);
    animationPlayer = new AnimationPlayer(diagnostics, () => state.settings);
    matchLauncher = new MatchLauncher(diagnostics);
    tokenMacros = new TokenMacros(diagnostics, () => state.settings);
    chainMacros = new ChainMacros(diagnostics, () => state.settings);
    markerTracker = new MarkerTracker(diagnostics, () => state.settings);
    customMacros = new CustomMacros(storage, diagnostics, () => state.settings);
    logObserver = new PublicDuelLogObserver(diagnostics, handlePublicEvent);
    logObserver.start();

    ui = new CompanionUI(storage, diagnostics, () => state, {
      startLeagueMatch() {
        if (!state.settings.enabled) {
          diagnostics.warn("launcher", "match launcher unavailable while companion is disabled");
          return;
        }
        matchLauncher.open();
      },
      openCustomMacros() {
        customMacros.openEditor();
      },
      preview(cardName, eventType = "effect-declaration") {
        animationPlayer.resetDuel();
        const text = eventType === "activation"
          ? `Test Player Activated "${cardName}"`
          : `Test Player declared the effect of ${cardName}`;
        handlePublicEvent({ type: eventType, text });
      },
      reloadConfig,
      async emergencyDisable() {
        state.settings.enabled = false;
        state.settings.animationsEnabled = false;
        document.getElementById(APP.ids.overlay)?.remove();
        matchLauncher.close();
        tokenMacros.close();
        chainMacros.close();
        markerTracker.close();
        customMacros.close();
        await persistSettings();
        tokenMacros.refresh();
        chainMacros.refresh();
        markerTracker.refresh();
        customMacros.refresh();
        diagnostics.warn("safety", "companion disabled by player");
        ui.refresh();
      },
      async updateSetting(key, value) {
        state.settings[key] = value;
        if (key === "diagnosticsEnabled") diagnostics.setEnabled(value);
        if (key === "enabled" && !value) document.getElementById(APP.ids.overlay)?.remove();
        await persistSettings();
        tokenMacros.refresh();
        chainMacros.refresh();
        markerTracker.refresh();
        customMacros.refresh();
        ui.refresh();
      }
    });
    ui.mount();
    tokenMacros.mount();
    chainMacros.mount();
    markerTracker.mount();
    await customMacros.mount();
    await reloadConfig();
    diagnostics.info("bootstrap", "companion initialized", { coreVersion: APP.version });
  }

  start().catch((error) => {
    console.warn("YugiFaux Companion failed safely:", error);
  });

})();
