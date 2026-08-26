  const BUNDLED_CONFIG = Object.freeze({
    schemaVersion: 1,
    dataVersion: "bundled-poc-4",
    minimumCoreVersion: "0.4.0",
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
      if (!["title-card-v1", "petal-bloom-v1", "arcane-bloom-v1", "trap-chase-v1"].includes(item?.presentation?.preset ?? "title-card-v1")) {
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
