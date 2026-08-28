  const LEGACY_SECRET_RARE_STORAGE_KEY = "rarity:secret-rare-card-names";
  const RARITY_STORAGE_KEY = "rarity:card-selections:v1";
  const RARITY_DEFINITIONS = Object.freeze({
    "secret-rare": Object.freeze({
      label: "Secret Rare",
      assetUrl: "https://res.cloudinary.com/vosvpv50/image/upload/v1787890399/secretrare.gif",
      opacity: 1,
      blendMode: "normal"
    }),
    "super-rare": Object.freeze({
      label: "Super Rare",
      assetUrl: "https://res.cloudinary.com/vosvpv50/image/upload/v1787891533/superRare.gif",
      opacity: .76,
      blendMode: "screen"
    })
  });

  function normalizeRarityCardName(value) {
    return String(value ?? "").replace(/\s+/g, " ").trim().toLocaleLowerCase();
  }

  const RARITY_OVERLAY_STYLE = `
    #deck_constructor .yf-rarity-overlay {
      position: absolute !important;
      left: 0 !important;
      top: 0 !important;
      width: 813px !important;
      height: 1185px !important;
      z-index: 80 !important;
      object-fit: fill !important;
      opacity: var(--yf-rarity-opacity,1) !important;
      mix-blend-mode: var(--yf-rarity-blend,normal) !important;
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
    #${APP.ids.rarityToggle}:disabled {
      opacity: .62 !important;
      cursor: default !important;
    }
    #${APP.ids.rarityMenu} {
      position: absolute !important;
      left: 3px !important;
      top: 298px !important;
      width: 190px !important;
      z-index: 90 !important;
      box-sizing: border-box !important;
      padding: 5px !important;
      border: 1px solid #c084fc !important;
      border-radius: 6px !important;
      background: rgba(24,24,27,.98) !important;
      box-shadow: 0 8px 20px #000c !important;
    }
    #${APP.ids.rarityMenu}[hidden] { display: none !important; }
    #${APP.ids.rarityMenu} button {
      position: relative !important;
      display: block !important;
      width: 100% !important;
      height: 27px !important;
      margin: 0 0 4px !important;
      border: 1px solid #6d28d9 !important;
      border-radius: 4px !important;
      background: linear-gradient(90deg,#27272a,#4c1d95) !important;
      color: #fff !important;
      font: 700 12px/23px Arial,sans-serif !important;
      cursor: pointer !important;
    }
    #${APP.ids.rarityMenu} button:last-child { margin-bottom: 0 !important; }
    #${APP.ids.rarityMenu} button[data-selected="true"] {
      border-color: #fde68a !important;
      color: #fff7cc !important;
      background: linear-gradient(90deg,#7c2d12,#a21caf) !important;
    }
  `;

  class RarityOverlays {
    constructor(storage, diagnostics, getSettings) {
      this.storage = storage;
      this.diagnostics = diagnostics;
      this.getSettings = getSettings;
      this.selections = new Map();
      this.observer = null;
      this.refreshQueued = false;
      this.rarityButton = null;
      this.rarityMenu = null;
    }

    async mount() {
      const stored = await this.storage.get(RARITY_STORAGE_KEY, null);
      if (Array.isArray(stored)) {
        for (const selection of stored) {
          const name = String(selection?.name ?? "").trim();
          const rarity = String(selection?.rarity ?? "");
          const normalized = normalizeRarityCardName(name);
          if (normalized && RARITY_DEFINITIONS[rarity]) this.selections.set(normalized, { name, rarity });
        }
      } else {
        const legacyNames = await this.storage.get(LEGACY_SECRET_RARE_STORAGE_KEY, []);
        for (const nameValue of Array.isArray(legacyNames) ? legacyNames : []) {
          const name = String(nameValue ?? "").trim();
          const normalized = normalizeRarityCardName(name);
          if (normalized) this.selections.set(normalized, { name, rarity: "secret-rare" });
        }
        await this.#persistSelections();
      }
      if (!document.getElementById("yf-rarity-overlays-style")) {
        const style = document.createElement("style");
        style.id = "yf-rarity-overlays-style";
        style.textContent = RARITY_OVERLAY_STYLE;
        document.head.append(style);
      }
      this.observer = new MutationObserver(() => this.#queueRefresh());
      this.observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["class", "style"] });
      this.refresh();
    }

    refresh() {
      const root = document.getElementById("deck_constructor");
      const enabled = Boolean(this.getSettings()?.enabled && this.getSettings()?.rarityOverlaysEnabled);
      if (!root || !enabled) {
        document.querySelectorAll(".yf-rarity-overlay,.yf-secret-rare-overlay").forEach((overlay) => overlay.remove());
        if (this.rarityButton) this.rarityButton.hidden = true;
        if (this.rarityMenu) this.rarityMenu.hidden = true;
        return;
      }

      this.#mountToggle(root);
      this.rarityButton.hidden = false;
      if (!this.#isVisible(root)) this.rarityMenu.hidden = true;
      this.#refreshToggle();

      for (const cardFront of root.querySelectorAll(".cardfront")) {
        const cardName = this.#cardName(cardFront);
        const selection = this.selections.get(normalizeRarityCardName(cardName));
        const definition = selection ? RARITY_DEFINITIONS[selection.rarity] : null;
        const existing = cardFront.querySelector(":scope > .yf-rarity-overlay");
        if (!definition) {
          existing?.remove();
          continue;
        }
        if (existing?.dataset.rarity === selection.rarity) continue;
        existing?.remove();
        const overlay = document.createElement("img");
        overlay.className = "yf-rarity-overlay";
        overlay.dataset.rarity = selection.rarity;
        overlay.src = definition.assetUrl;
        overlay.style.setProperty("--yf-rarity-opacity", String(definition.opacity));
        overlay.style.setProperty("--yf-rarity-blend", definition.blendMode);
        overlay.alt = "";
        overlay.draggable = false;
        overlay.setAttribute("aria-hidden", "true");
        cardFront.append(overlay);
      }
    }

    #mountToggle(root) {
      if (this.rarityButton?.isConnected && this.rarityMenu?.isConnected) return;
      const button = document.createElement("button");
      button.id = APP.ids.rarityToggle;
      button.type = "button";
      button.addEventListener("pointerdown", (event) => event.stopPropagation());
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        if (!button.disabled) this.rarityMenu.hidden = !this.rarityMenu.hidden;
      });

      const menu = document.createElement("div");
      menu.id = APP.ids.rarityMenu;
      menu.hidden = true;
      const choices = [["", "No Rarity"], ...Object.entries(RARITY_DEFINITIONS).map(([rarity, definition]) => [rarity, definition.label])];
      for (const [rarity, label] of choices) {
        const choice = document.createElement("button");
        choice.type = "button";
        choice.dataset.rarity = rarity;
        choice.textContent = label;
        choice.addEventListener("pointerdown", (event) => event.stopPropagation());
        choice.addEventListener("click", (event) => {
          event.stopPropagation();
          menu.hidden = true;
          void this.#setPreviewRarity(rarity);
        });
        menu.append(choice);
      }
      document.addEventListener("pointerdown", (event) => {
        if (!menu.hidden && !menu.contains(event.target) && event.target !== button) menu.hidden = true;
      });
      root.append(button, menu);
      this.rarityButton = button;
      this.rarityMenu = menu;
    }

    async #setPreviewRarity(rarity) {
      const name = this.#previewCardName();
      const normalized = normalizeRarityCardName(name);
      if (!normalized) return;
      if (!RARITY_DEFINITIONS[rarity]) this.selections.delete(normalized);
      else this.selections.set(normalized, { name, rarity });
      await this.#persistSelections();
      this.diagnostics.info("rarity", rarity ? `${RARITY_DEFINITIONS[rarity].label} overlay selected` : "rarity overlay removed", { cardName: name });
      this.refresh();
    }

    #refreshToggle() {
      if (!this.rarityButton || !this.rarityMenu) return;
      const name = this.#previewCardName();
      const selection = this.selections.get(normalizeRarityCardName(name));
      const value = selection?.rarity ?? "";
      this.rarityButton.disabled = !name;
      this.rarityButton.dataset.active = String(Boolean(value));
      const label = !name ? "◇ Hover a card" : value ? `✦ ${RARITY_DEFINITIONS[value].label}` : "◇ No Rarity";
      if (this.rarityButton.textContent !== label) this.rarityButton.textContent = label;
      for (const choice of this.rarityMenu.querySelectorAll("button[data-rarity]")) {
        choice.dataset.selected = String(choice.dataset.rarity === value);
      }
      const title = name
        ? `Choose the local rarity treatment for every copy of ${name}`
        : "Hover a card in the Deck Constructor first";
      if (this.rarityButton.title !== title) this.rarityButton.title = title;
    }

    async #persistSelections() {
      const selections = [...this.selections.values()].sort((a, b) => a.name.localeCompare(b.name));
      await this.storage.set(RARITY_STORAGE_KEY, selections);
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
