// ==UserScript==
// @name         YugiFaux DuelingBook Companion (Phase 1 POC)
// @namespace    https://github.com/xtremetyler/yugifaux-duelingbook-companion
// @version      0.9.4
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
// @connect      raw.githubusercontent.com
// ==/UserScript==

(() => {
  "use strict";

  const APP = Object.freeze({
    name: "YugiFaux Companion",
    version: "0.9.4",
    configUrl: "https://raw.githubusercontent.com/xtremetyler/yugifaux-duelingbook-companion/main/config/companion.sample.json",
    ids: Object.freeze({
      button: "yf-companion-button",
      panel: "yf-companion-panel",
      overlay: "yf-animation-overlay",
      launcher: "yf-match-launcher",
      tokenButton: "yf-token-macros-button",
      tokenModal: "yf-token-macros-modal",
      tokenToast: "yf-token-macros-toast"
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

  const TOKEN_RECIPES = Object.freeze([
    Object.freeze({
      id: "polyflora-hexbloom-bloom-token",
      sourceName: "Polyflora Hexbloom",
      sourceArtworkUrl: "https://res.cloudinary.com/vosvpv50/image/upload/v1787780606/Gemini_Generated_Image_b597fgb597fgb597_1.png",
      effectText: "During your Main Phase: You can send 1 Spell/Trap from your Deck to your GY; Special Summon 2 \"Bloom Token\" (Plant/WIND/Level 2/ATK 0/DEF 0) in Defense Position.",
      token: Object.freeze({ name: "Bloom Token", level: 2, attribute: "WIND", monsterType: "Plant", atk: 0, def: 0, position: "Defense" }),
      count: 2,
      variants: BLOOM_TOKEN_VARIANTS
    })
  ]);

  const TOKEN_MACRO_STYLE = `
    #${APP.ids.tokenButton} { position: fixed; right: 14px; top: 50%; z-index: 2147483645; transform: translateY(-50%); border: 1px solid #86efac; border-radius: 9px 0 0 9px; background: linear-gradient(145deg,#064e3b,#312e81); color: #f0fdf4; padding: 11px 9px; writing-mode: vertical-rl; letter-spacing: .12em; font: 900 12px/1 Arial,sans-serif; box-shadow: 0 5px 20px #000a,0 0 16px #86efac44; cursor: pointer; }
    #${APP.ids.tokenButton}[hidden] { display: none; }
    #${APP.ids.tokenButton}:disabled { cursor: wait; opacity: .65; }
    #${APP.ids.tokenModal} { position: fixed; inset: 0; z-index: 2147483647; display: grid; place-items: center; box-sizing: border-box; padding: 18px; background: #020617bd; color: #f8fafc; font: 14px/1.45 Arial,sans-serif; }
    #${APP.ids.tokenModal} * { box-sizing: border-box; }
    #${APP.ids.tokenModal} .yf-token-dialog { width: min(720px,calc(100vw - 32px)); max-height: calc(100vh - 32px); overflow: auto; border: 1px solid #86efac; border-radius: 15px; padding: 18px; background: linear-gradient(145deg,#061b17fa,#172554fa 58%,#3b1750fa); box-shadow: 0 24px 80px #000e,0 0 32px #86efac33; }
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
    #${APP.ids.tokenModal} .yf-token-pair { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin: 16px 0; }
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
    @media (max-width: 650px) { #${APP.ids.tokenButton} { right: 4px; } #${APP.ids.tokenModal} .yf-token-gallery { grid-template-columns: repeat(2,minmax(0,1fr)); } #${APP.ids.tokenModal} .yf-token-pair { grid-template-columns: 1fr; } #${APP.ids.tokenModal} .yf-token-details { grid-template-columns: 1fr 1fr; } }
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
      document.addEventListener("click", (event) => this.#handleFieldPreviewRequest(event), true);
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
      notice.textContent = "After confirmation, DuelingBook will highlight your open Monster Zones twice. Click one zone for each Token. The summon is cancelled unless two zones are available.";
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
        this.#showToast(`${recipe.count} ${recipe.token.name}s summoned with YugiFaux artwork.`);
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
          for (const node of record.addedNodes) if (node instanceof Element) this.#scanForTokenCarriers(node);
        }
      }
    }

    #scanForTokenCarriers(root) {
      const images = [];
      if (root.matches?.("#field .card img")) images.push(root);
      images.push(...(root.querySelectorAll?.("#field .card img") ?? []));
      for (const image of images) {
        const carrierId = tokenCarrierFromUrl(image.src);
        const definition = this.variantByCarrier.get(carrierId);
        const card = image.closest(".card");
        if (definition && card) this.#applyTokenSkin(card, definition);
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
      this.previewTimer = setTimeout(() => this.#showTokenInNativePreview(definition), 35);
    }

    #showTokenInNativePreview(definition) {
      const preview = document.getElementById("preview");
      const details = document.getElementById("preview_txt");
      if (!preview || !details || !definition) return;
      const { recipe, variant } = definition;
      const token = recipe.token;
      const artwork = preview.querySelector("img.image, .image img");
      if (artwork instanceof HTMLImageElement) artwork.src = variant.artworkUrl;
      for (const name of preview.querySelectorAll(".name_txt, .name2_txt")) name.textContent = token.name;
      for (const type of preview.querySelectorAll(".type_txt")) type.textContent = `[${token.monsterType.toUpperCase()} / TOKEN]`;
      for (const attack of preview.querySelectorAll(".atk_txt")) attack.textContent = String(token.atk);
      for (const defense of preview.querySelectorAll(".def_txt")) defense.textContent = String(token.def);
      for (const effect of preview.querySelectorAll(".effect_txt")) effect.textContent = `This Token was Special Summoned by ${recipe.sourceName}.`;

      details.classList.remove("yf-token-preview-details");
      details.replaceChildren();
      const lines = [
        token.name,
        `${token.attribute} • ${token.monsterType} / Token • Level ${token.level}`,
        `ATK ${token.atk} / DEF ${token.def} • ${token.position} Position`,
        `Special Summoned by ${recipe.sourceName}.`
      ];
      lines.forEach((line, index) => {
        details.append(document.createTextNode(line));
        if (index + 1 < lines.length) details.append(document.createElement("br"));
      });
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
        this.#checkbox("Diagnostics", "diagnosticsEnabled", settings.diagnosticsEnabled)
      );

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
      panel.append(startMatch, testAsh, testPolyflora, testNoWayOut, testIris, testPepper, testPainfulPreference, reload, disable, this.diagnosticOutput);
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
    matchLauncher = new MatchLauncher(diagnostics);
    tokenMacros = new TokenMacros(diagnostics, () => state.settings);
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
        await persistSettings();
        tokenMacros.refresh();
        diagnostics.warn("safety", "companion disabled by player");
        ui.refresh();
      },
      async updateSetting(key, value) {
        state.settings[key] = value;
        if (key === "diagnosticsEnabled") diagnostics.setEnabled(value);
        if (key === "enabled" && !value) document.getElementById(APP.ids.overlay)?.remove();
        await persistSettings();
        tokenMacros.refresh();
        ui.refresh();
      }
    });
    ui.mount();
    tokenMacros.mount();
    await reloadConfig();
    diagnostics.info("bootstrap", "companion initialized", { coreVersion: APP.version });
  }

  start().catch((error) => {
    console.warn("YugiFaux Companion failed safely:", error);
  });

})();
