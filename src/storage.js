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
