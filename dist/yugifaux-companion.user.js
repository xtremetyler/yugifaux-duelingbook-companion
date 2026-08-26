// ==UserScript==
// @name         YugiFaux DuelingBook Companion (Phase 1 POC)
// @namespace    https://github.com/xtremetyler/yugifaux-duelingbook-companion
// @version      0.6.0
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
    version: "0.6.0",
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
    dataVersion: "bundled-poc-6",
    minimumCoreVersion: "0.6.0",
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
          subtitle: "Live Effect Performance",
          accentColor: "#facc15",
          durationMs: 4800
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
      if (!["title-card-v1", "petal-bloom-v1", "arcane-bloom-v1", "trap-chase-v1", "celestial-excavate-v1", "concert-rise-v1"].includes(item?.presentation?.preset ?? "title-card-v1")) {
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
      const supportedPresets = new Set(["title-card-v1", "petal-bloom-v1", "arcane-bloom-v1", "trap-chase-v1", "celestial-excavate-v1", "concert-rise-v1"]);
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
    #${APP.ids.overlay} .yf-trap-field { position: absolute; inset: 0; z-index: 3; overflow: hidden; }
    #${APP.ids.overlay} .yf-trap-stamp { position: absolute; top: 7%; left: 50%; transform: translateX(-50%) rotate(-3deg); border: 4px double #fb923c; padding: 8px 18px; color: #fff7ed; background: #450a0ae8; box-shadow: 0 0 18px #f97316, inset 0 0 14px #7f1d1d; opacity: 0; letter-spacing: .26em; font: 900 clamp(15px,2.2vw,28px)/1 Arial,sans-serif; animation: yf-trap-stamp var(--yf-overlay-duration) cubic-bezier(.2,.8,.2,1) both; }
    #${APP.ids.overlay} .yf-trap-page { position: absolute; left: -12vw; top: var(--yf-y); width: 38px; height: 26px; border: 1px solid #7c5b36; background: repeating-linear-gradient(0deg,#ead9ae 0 5px,#8b6b4538 6px); box-shadow: 0 2px 8px #0008,0 0 9px #fb923c66; opacity: 0; animation: yf-trap-page var(--yf-duration) linear var(--yf-delay) infinite; }
    #${APP.ids.overlay} .yf-trap-frame { position: absolute; inset: 2.4vmin; border: 2px solid #fb923c80; background: linear-gradient(90deg,#fb923c 0 9%,transparent 9% 91%,#fb923c 91%) top/100% 4px no-repeat,linear-gradient(90deg,#fb923c 0 9%,transparent 9% 91%,#fb923c 91%) bottom/100% 4px no-repeat,linear-gradient(#fb923c 0 14%,transparent 14% 86%,#fb923c 86%) left/4px 100% no-repeat,linear-gradient(#fb923c 0 14%,transparent 14% 86%,#fb923c 86%) right/4px 100% no-repeat; box-shadow: inset 0 0 42px #7f1d1d66,0 0 18px #f9731666; animation: yf-trap-frame var(--yf-overlay-duration) ease-in-out both; }
    #${APP.ids.overlay} .yf-trap-seal { position: absolute; right: 2.3%; bottom: 4.2%; display: grid; place-items: center; width: 78px; aspect-ratio: 1; border: 4px double #fed7aa; border-radius: 50%; color: #fff7ed; background: radial-gradient(circle,#991b1b 0 48%,#450a0a 52% 66%,#f97316 69% 73%,#450a0a 76%); box-shadow: 0 0 15px #000,0 0 24px #f97316; opacity: 0; transform: rotate(12deg) scale(1.8); text-align: center; letter-spacing: .08em; font: 900 12px/1 Arial,sans-serif; animation: yf-trap-seal var(--yf-overlay-duration) cubic-bezier(.2,.8,.2,1) both; }
    #${APP.ids.overlay}.yf-reduced-motion { animation: none; background: #020617dd; }
    #${APP.ids.overlay}.yf-reduced-motion .yf-animation-art, #${APP.ids.overlay}.yf-reduced-motion .yf-animation-video, #${APP.ids.overlay}.yf-reduced-motion .yf-animation-nameplate { animation: none; opacity: 1; }
    #${APP.ids.overlay}.yf-reduced-motion .yf-arcane-field, #${APP.ids.overlay}.yf-reduced-motion .yf-trap-field, #${APP.ids.overlay}.yf-reduced-motion .yf-celestial-field, #${APP.ids.overlay}.yf-reduced-motion .yf-concert-field { display: none; }
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
      panel.append(testAsh, testPolyflora, testNoWayOut, testIris, testPepper, reload, disable, this.diagnosticOutput);
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
      preview(cardName) {
        animationPlayer.resetDuel();
        handlePublicEvent({ type: "effect-declaration", text: `Test Player declared the effect of ${cardName}` });
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
