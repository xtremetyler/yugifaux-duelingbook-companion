  const LEGACY_SECRET_RARE_STORAGE_KEY = "rarity:secret-rare-card-names";
  const RARITY_STORAGE_KEY = "rarity:card-selections:v1";
  const RARITY_DEFINITIONS = Object.freeze({
    "super-rare": Object.freeze({
      label: "Super Rare",
      assetUrl: "https://duelingnexus.com/assets/rarity/super-rare.webp",
      opacity: .76,
      blendMode: "screen"
    }),
    "ghost-rare": Object.freeze({
      label: "Ghost Rare",
      assetUrl: "https://duelingnexus.com/assets/rarity/ghost-rare.webp",
      opacity: .96,
      blendMode: "screen",
      artworkFilter: "grayscale(1) saturate(0) contrast(.66) brightness(1.62)",
      artworkOpacity: .82
    }),
    "nexus-rare": Object.freeze({ label: "Nexus Rare", assetUrl: "https://duelingnexus.com/assets/rarity/nexus-rare.webp", opacity: .82, blendMode: "screen" }),
    "ultra-rare": Object.freeze({ label: "Ultra Rare", assetUrl: "https://duelingnexus.com/assets/rarity/ultra-rare.webp", opacity: .86, blendMode: "screen" }),
    "secret-rare": Object.freeze({ label: "Secret Rare", assetUrl: "https://duelingnexus.com/assets/rarity/secret-rare.webp", opacity: .9, blendMode: "screen" }),
    "prismatic-rare": Object.freeze({ label: "Prismatic Rare", assetUrl: "https://duelingnexus.com/assets/rarity/prismatic-rare.webp", opacity: .8, blendMode: "screen" }),
    "ultimate-rare": Object.freeze({ label: "Ultimate Rare", assetUrl: "https://duelingnexus.com/assets/rarity/ultimate-rare.webp", opacity: .86, blendMode: "screen", artworkFilter: "saturate(1.08) contrast(1.04)" }),
    "gold-rare": Object.freeze({ label: "Gold Rare", assetUrl: "https://duelingnexus.com/assets/rarity/gold-rare.webp", opacity: .94, blendMode: "normal" }),
    "shatterfoil-rare": Object.freeze({ label: "Shatterfoil Rare", assetUrl: "https://duelingnexus.com/assets/rarity/shatterfoil-rare.webp", opacity: .76, blendMode: "screen" }),
    "starfoil-rare": Object.freeze({ label: "Starfoil Rare", assetUrl: "https://duelingnexus.com/assets/rarity/starfoil-rare.webp", opacity: .76, blendMode: "screen" }),
    "anniversary-rare": Object.freeze({ label: "Anniversary Rare", assetUrl: "https://duelingnexus.com/assets/rarity/anniversary-rare.webp", opacity: .84, blendMode: "screen" }),
    "platinum-rare": Object.freeze({ label: "Platinum Rare", assetUrl: "https://duelingnexus.com/assets/rarity/platinum-rare.webp", opacity: .88, blendMode: "screen", artworkFilter: "saturate(.82) contrast(1.06) brightness(1.04)" }),
    "collectors-rare": Object.freeze({ label: "Collector's Rare", assetUrl: "https://duelingnexus.com/assets/rarity/collectors-rare.webp", opacity: .84, blendMode: "screen" }),
    "rare": Object.freeze({ label: "Rare", assetUrl: "https://duelingnexus.com/assets/rarity/rare.webp", opacity: .94, blendMode: "normal" }),
    "grand-master-rare": Object.freeze({ label: "Grand Master Rare", assetUrl: "https://duelingnexus.com/assets/rarity/grand-master-rare-overframe.webp", opacity: 1, blendMode: "normal", overframeOnly: true })
  });

  function normalizeRarityCardName(value) {
    return String(value ?? "").replace(/\s+/g, " ").trim().toLocaleLowerCase();
  }

  function pendulumRarityVariant(value) {
    const template = Number(value);
    if (template === 2) return "small";
    if (template === 1 || template === 3) return "normal";
    if (template === 4) return "large";
    return "";
  }

  function rarityAssetUrl(rarity, definition, pendulumTemplate) {
    const variant = pendulumRarityVariant(pendulumTemplate);
    if (!variant || definition?.overframeOnly) return definition?.assetUrl ?? "";
    return `https://duelingnexus.com/assets/rarity/${rarity}-pendulum-${variant}.webp`;
  }

  const RARITY_OVERLAY_STYLE = `
    @property --yf-ghost-brightness {
      syntax: "<number>";
      inherits: false;
      initial-value: 1.56;
    }
    @property --yf-ghost-art-opacity {
      syntax: "<number>";
      inherits: false;
      initial-value: .79;
    }
    #deck_constructor .yf-rarity-overlay,
    #duel .yf-rarity-overlay {
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
    #deck_constructor .cardfront.yf-rarity-artwork-effect .pic,
    #deck_constructor .cardfront.yf-rarity-artwork-effect .black_pic,
    #deck_constructor .cardfront.yf-rarity-artwork-effect .rush_pic,
    #duel .cardfront.yf-rarity-artwork-effect .pic,
    #duel .cardfront.yf-rarity-artwork-effect .black_pic,
    #duel .cardfront.yf-rarity-artwork-effect .rush_pic {
      filter: var(--yf-rarity-artwork-filter,none) !important;
      opacity: var(--yf-rarity-artwork-opacity,1) !important;
    }
    #deck_constructor .cardfront[data-yf-rarity="ghost-rare"] .pic,
    #deck_constructor .cardfront[data-yf-rarity="ghost-rare"] .black_pic,
    #deck_constructor .cardfront[data-yf-rarity="ghost-rare"] .rush_pic,
    #duel .cardfront[data-yf-rarity="ghost-rare"] .pic,
    #duel .cardfront[data-yf-rarity="ghost-rare"] .black_pic,
    #duel .cardfront[data-yf-rarity="ghost-rare"] .rush_pic {
      filter: grayscale(1) saturate(0) contrast(.64) brightness(var(--yf-ghost-brightness)) drop-shadow(0 0 6px #d9f7ff) !important;
      opacity: var(--yf-ghost-art-opacity) !important;
      animation: yf-ghost-rare-breathe 4.8s ease-in-out infinite !important;
    }
    #deck_constructor .cardfront[data-yf-rarity="ultra-rare"] :is(.name_txt,.name2_txt),
    #duel .cardfront[data-yf-rarity="ultra-rare"] :is(.name_txt,.name2_txt) {
      color: #f6d365 !important;
      -webkit-text-fill-color: #f6d365 !important;
      text-shadow: 0 1px 0 #704100,0 0 3px #fff2a8,0 0 8px #d89a18 !important;
    }
    #deck_constructor .cardfront[data-yf-rarity="rare"] :is(.name_txt,.name2_txt),
    #duel .cardfront[data-yf-rarity="rare"] :is(.name_txt,.name2_txt) {
      color: #e7edf3 !important;
      -webkit-text-fill-color: #e7edf3 !important;
      text-shadow: 0 1px 0 #475569,0 0 3px #fff,0 0 7px #aebdca !important;
    }
    #deck_constructor .cardfront[data-yf-rarity="ghost-rare"] :is(.name_txt,.name2_txt),
    #deck_constructor .cardfront[data-yf-rarity="platinum-rare"] :is(.name_txt,.name2_txt),
    #duel .cardfront[data-yf-rarity="ghost-rare"] :is(.name_txt,.name2_txt),
    #duel .cardfront[data-yf-rarity="platinum-rare"] :is(.name_txt,.name2_txt) {
      color: #edfaff !important;
      -webkit-text-fill-color: #edfaff !important;
      text-shadow: 0 0 2px #fff,0 0 7px #b9efff,0 0 13px #c4b5fd !important;
    }
    #deck_constructor .cardfront[data-yf-rarity="gold-rare"] :is(.name_txt,.name2_txt),
    #duel .cardfront[data-yf-rarity="gold-rare"] :is(.name_txt,.name2_txt) {
      color: #d99b20 !important;
      -webkit-text-fill-color: #d99b20 !important;
      text-shadow: 0 1px 0 #4a2a00,0 0 2px #ffe09a,0 0 7px #9a5b00 !important;
    }
    #deck_constructor .cardfront[data-yf-rarity="secret-rare"] :is(.name_txt,.name2_txt),
    #deck_constructor .cardfront[data-yf-rarity="prismatic-rare"] :is(.name_txt,.name2_txt),
    #duel .cardfront[data-yf-rarity="secret-rare"] :is(.name_txt,.name2_txt),
    #duel .cardfront[data-yf-rarity="prismatic-rare"] :is(.name_txt,.name2_txt) {
      color: #f8fafc !important;
      background: linear-gradient(105deg,#f8fafc 0%,#dbeafe 20%,#f5d0fe 40%,#fef3c7 60%,#ccfbf1 80%,#f8fafc 100%) !important;
      background-size: 220% 100% !important;
      background-clip: text !important;
      -webkit-background-clip: text !important;
      -webkit-text-fill-color: transparent !important;
      text-shadow: 0 0 3px #fff9,0 0 8px #c4b5fd99 !important;
      animation: yf-iridescent-rarity-name 5.5s linear infinite !important;
    }
    @keyframes yf-ghost-rare-breathe {
      0%,100% {
        --yf-ghost-brightness: 1.56;
        --yf-ghost-art-opacity: .79;
      }
      50% {
        --yf-ghost-brightness: 1.76;
        --yf-ghost-art-opacity: .87;
      }
    }
    @keyframes yf-iridescent-rarity-name {
      from { background-position: 100% 50%; }
      to { background-position: -120% 50%; }
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
      max-height: 310px !important;
      overflow-x: hidden !important;
      overflow-y: auto !important;
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
        document.querySelectorAll(".cardfront.yf-rarity-artwork-effect,.cardfront[data-yf-rarity]").forEach((cardFront) => {
          delete cardFront.dataset.yfRarity;
          delete cardFront.dataset.yfRarityAssetFallback;
          this.#applyArtworkFilter(cardFront, null);
        });
        if (this.rarityButton) this.rarityButton.hidden = true;
        if (this.rarityMenu) this.rarityMenu.hidden = true;
        return;
      }

      this.#mountToggle(root);
      this.rarityButton.hidden = false;
      if (!this.#isVisible(root)) this.rarityMenu.hidden = true;
      this.#refreshToggle();

      for (const cardFront of root.querySelectorAll(".cardfront")) {
        this.#applySelectionToCardFront(cardFront);
      }
      this.#refreshDuelCards();
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
      const choices = [["", "No Foil"], ...Object.entries(RARITY_DEFINITIONS).map(([rarity, definition]) => [rarity, definition.label])];
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
      const label = !name ? "◇ Hover a card" : value ? `✦ ${RARITY_DEFINITIONS[value].label}` : "◇ No Foil";
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

    #applyArtworkFilter(cardFront, filter, opacity = null) {
      const active = Boolean(filter);
      if (cardFront.classList.contains("yf-rarity-artwork-effect") !== active) cardFront.classList.toggle("yf-rarity-artwork-effect", active);
      const current = cardFront.style.getPropertyValue("--yf-rarity-artwork-filter");
      if (filter && current !== filter) cardFront.style.setProperty("--yf-rarity-artwork-filter", filter);
      else if (!filter && current) cardFront.style.removeProperty("--yf-rarity-artwork-filter");
      const currentOpacity = cardFront.style.getPropertyValue("--yf-rarity-artwork-opacity");
      if (active && opacity != null && currentOpacity !== String(opacity)) cardFront.style.setProperty("--yf-rarity-artwork-opacity", String(opacity));
      else if ((!active || opacity == null) && currentOpacity) cardFront.style.removeProperty("--yf-rarity-artwork-opacity");
    }

    #applySelectionToCardFront(cardFront) {
      const cardName = this.#cardName(cardFront);
      const selection = this.selections.get(normalizeRarityCardName(cardName));
      const definition = selection ? RARITY_DEFINITIONS[selection.rarity] : null;
      const existing = cardFront.querySelector(":scope > .yf-rarity-overlay");
      if (!definition) {
        existing?.remove();
        delete cardFront.dataset.yfRarity;
        delete cardFront.dataset.yfRarityAssetFallback;
        this.#applyArtworkFilter(cardFront, null);
        return;
      }
      cardFront.dataset.yfRarity = selection.rarity;
      this.#applyArtworkFilter(cardFront, definition.artworkFilter ?? null, definition.artworkOpacity ?? null);
      const pendulumTemplate = this.#pendulumTemplate(cardFront);
      const requestedVariant = pendulumRarityVariant(pendulumTemplate) || "standard";
      const fallbackKey = `${selection.rarity}:${requestedVariant}`;
      const useFallback = cardFront.dataset.yfRarityAssetFallback === fallbackKey;
      const variant = useFallback ? "standard-fallback" : requestedVariant;
      const assetUrl = useFallback ? definition.assetUrl : rarityAssetUrl(selection.rarity, definition, pendulumTemplate);
      if (existing?.dataset.rarity === selection.rarity && existing.dataset.variant === variant) return;
      existing?.remove();
      const overlay = document.createElement("img");
      overlay.className = "yf-rarity-overlay";
      overlay.dataset.rarity = selection.rarity;
      overlay.dataset.variant = variant;
      overlay.src = assetUrl;
      overlay.style.setProperty("--yf-rarity-opacity", String(definition.opacity));
      overlay.style.setProperty("--yf-rarity-blend", definition.blendMode);
      overlay.alt = "";
      overlay.draggable = false;
      overlay.setAttribute("aria-hidden", "true");
      if (assetUrl !== definition.assetUrl) {
        overlay.addEventListener("error", () => {
          cardFront.dataset.yfRarityAssetFallback = fallbackKey;
          overlay.dataset.variant = "standard-fallback";
          overlay.src = definition.assetUrl;
        }, { once: true });
      }
      cardFront.append(overlay);
    }

    #pendulumTemplate(cardFront) {
      const direct = cardFront.dataset?.pendulum;
      if (direct != null && direct !== "") return direct;
      try {
        const page = typeof unsafeWindow !== "undefined" ? unsafeWindow : window;
        const jquery = page?.$;
        if (typeof jquery !== "function") return null;
        const ownValue = jquery(cardFront)?.data?.("pendulum");
        if (ownValue != null) return ownValue;
        const card = cardFront.closest(".card");
        const liveFront = card ? jquery(card)?.data?.("cardfront") : null;
        const liveValue = liveFront?.data?.("pendulum");
        if (liveValue != null) return liveValue;
      } catch {}
      return null;
    }

    #refreshDuelCards() {
      const eligible = new Set();
      for (const card of document.querySelectorAll("#duel #field .card")) {
        const cardFront = card.querySelector(".cardfront");
        if (!(cardFront instanceof Element) || !this.#isExplicitlyFaceUp(card)) continue;
        eligible.add(cardFront);
        this.#applySelectionToCardFront(cardFront);
      }
      for (const cardFront of document.querySelectorAll("#duel .cardfront")) {
        if (eligible.has(cardFront)) continue;
        cardFront.querySelector(":scope > .yf-rarity-overlay")?.remove();
        delete cardFront.dataset.yfRarity;
        delete cardFront.dataset.yfRarityAssetFallback;
        this.#applyArtworkFilter(cardFront, null);
      }
    }

    #isExplicitlyFaceUp(card) {
      try {
        const page = typeof unsafeWindow !== "undefined" ? unsafeWindow : window;
        const jquery = page?.$;
        const value = typeof jquery === "function" ? jquery(card)?.data?.("face_down") : null;
        if (value === false || value === 0 || value === "false") return true;
      } catch {}
      const value = card.dataset?.faceDown;
      return value === "false" || card.classList.contains("face_up") || card.classList.contains("face-up");
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
