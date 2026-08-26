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
