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
      const supportedPresets = new Set(["title-card-v1", "petal-bloom-v1", "arcane-bloom-v1"]);
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
