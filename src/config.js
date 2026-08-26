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
