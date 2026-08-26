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
