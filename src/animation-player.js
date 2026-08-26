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
