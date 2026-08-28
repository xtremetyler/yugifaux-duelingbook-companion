  const SECRET_RARE_ASSET = "https://res.cloudinary.com/vosvpv50/image/upload/v1787890399/secretrare.gif";
  const RARITY_STORAGE_KEY = "rarity:secret-rare-card-names";

  function normalizeRarityCardName(value) {
    return String(value ?? "").replace(/\s+/g, " ").trim().toLocaleLowerCase();
  }

  const RARITY_OVERLAY_STYLE = `
    #deck_constructor .yf-secret-rare-overlay {
      position: absolute !important;
      left: 0 !important;
      top: 0 !important;
      width: 813px !important;
      height: 1185px !important;
      z-index: 80 !important;
      object-fit: fill !important;
      pointer-events: none !important;
      user-select: none !important;
    }
    #${APP.ids.rarityToggle} {
      position: absolute !important;
      left: 3px !important;
      top: 272px !important;
      width: 190px !important;
      height: 24px !important;
      z-index: 85 !important;
      border: 1px solid #c084fc !important;
      border-radius: 5px !important;
      background: linear-gradient(90deg,#312e81,#7e22ce) !important;
      color: #fff !important;
      box-shadow: 0 2px 8px #0009, inset 0 0 10px #e879f944 !important;
      font: 700 13px/20px Arial,sans-serif !important;
      cursor: pointer !important;
    }
    #${APP.ids.rarityToggle}[data-active="true"] {
      border-color: #fde68a !important;
      background: linear-gradient(90deg,#7c2d12,#a21caf) !important;
      color: #fff7cc !important;
    }
    #${APP.ids.rarityToggle}:disabled {
      opacity: .62 !important;
      cursor: default !important;
    }
  `;

  class RarityOverlays {
    constructor(storage, diagnostics, getSettings) {
      this.storage = storage;
      this.diagnostics = diagnostics;
      this.getSettings = getSettings;
      this.selectedNames = new Map();
      this.observer = null;
      this.refreshQueued = false;
      this.toggleButton = null;
    }

    async mount() {
      const stored = await this.storage.get(RARITY_STORAGE_KEY, []);
      for (const name of Array.isArray(stored) ? stored : []) {
        const normalized = normalizeRarityCardName(name);
        if (normalized) this.selectedNames.set(normalized, String(name).trim());
      }
      if (!document.getElementById("yf-rarity-overlays-style")) {
        const style = document.createElement("style");
        style.id = "yf-rarity-overlays-style";
        style.textContent = RARITY_OVERLAY_STYLE;
        document.head.append(style);
      }
      this.observer = new MutationObserver(() => this.#queueRefresh());
      this.observer.observe(document.body, { childList: true, subtree: true, characterData: true });
      this.refresh();
    }

    refresh() {
      const root = document.getElementById("deck_constructor");
      const enabled = Boolean(this.getSettings()?.enabled && this.getSettings()?.rarityOverlaysEnabled);
      if (!root || !enabled) {
        document.querySelectorAll(".yf-secret-rare-overlay").forEach((overlay) => overlay.remove());
        if (this.toggleButton) this.toggleButton.hidden = true;
        return;
      }

      this.#mountToggle(root);
      this.toggleButton.hidden = !this.#isVisible(root);
      this.#refreshToggle();

      for (const cardFront of root.querySelectorAll(".cardfront")) {
        const cardName = this.#cardName(cardFront);
        const shouldShow = this.selectedNames.has(normalizeRarityCardName(cardName));
        const existing = cardFront.querySelector(":scope > .yf-secret-rare-overlay");
        if (!shouldShow) {
          existing?.remove();
          continue;
        }
        if (existing) continue;
        const overlay = document.createElement("img");
        overlay.className = "yf-secret-rare-overlay";
        overlay.src = SECRET_RARE_ASSET;
        overlay.alt = "";
        overlay.draggable = false;
        overlay.setAttribute("aria-hidden", "true");
        cardFront.append(overlay);
      }
    }

    #mountToggle(root) {
      if (this.toggleButton?.isConnected) return;
      const button = document.createElement("button");
      button.id = APP.ids.rarityToggle;
      button.type = "button";
      button.addEventListener("pointerdown", (event) => event.stopPropagation());
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        void this.#togglePreviewCard();
      });
      root.append(button);
      this.toggleButton = button;
    }

    async #togglePreviewCard() {
      const name = this.#previewCardName();
      const normalized = normalizeRarityCardName(name);
      if (!normalized) return;
      if (this.selectedNames.has(normalized)) this.selectedNames.delete(normalized);
      else this.selectedNames.set(normalized, name);
      await this.storage.set(RARITY_STORAGE_KEY, [...this.selectedNames.values()].sort((a, b) => a.localeCompare(b)));
      this.diagnostics.info("rarity", this.selectedNames.has(normalized) ? "Secret Rare overlay enabled" : "Secret Rare overlay disabled", { cardName: name });
      this.refresh();
    }

    #refreshToggle() {
      if (!this.toggleButton) return;
      const name = this.#previewCardName();
      const selected = this.selectedNames.has(normalizeRarityCardName(name));
      this.toggleButton.disabled = !name;
      this.toggleButton.dataset.active = String(selected);
      const label = !name ? "◇ Hover a card" : selected ? "✦ Secret Rare: ON" : "◇ Secret Rare: OFF";
      const title = name
        ? `${selected ? "Remove" : "Apply"} Secret Rare animation for every copy of ${name}`
        : "Hover a card in the Deck Constructor first";
      if (this.toggleButton.textContent !== label) this.toggleButton.textContent = label;
      if (this.toggleButton.title !== title) this.toggleButton.title = title;
    }

    #previewCardName() {
      const preview = document.querySelector("#deck_constructor #preview");
      const cardFront = preview?.matches?.(".cardfront") ? preview : preview?.querySelector?.(".cardfront");
      return this.#cardName(cardFront ?? preview);
    }

    #cardName(cardFront) {
      if (!(cardFront instanceof Element)) return "";
      const candidates = cardFront.querySelectorAll(".name_txt,.name2_txt");
      for (const candidate of candidates) {
        const name = String(candidate.textContent ?? "").replace(/\s+/g, " ").trim();
        if (name) return name;
      }
      return "";
    }

    #isVisible(element) {
      const style = getComputedStyle(element);
      return style.display !== "none" && style.visibility !== "hidden" && element.getClientRects().length > 0;
    }

    #queueRefresh() {
      if (this.refreshQueued) return;
      this.refreshQueued = true;
      requestAnimationFrame(() => {
        this.refreshQueued = false;
        this.refresh();
      });
    }
  }
