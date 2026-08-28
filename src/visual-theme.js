  const VISUAL_ASSETS = Object.freeze({
    logo: "https://res.cloudinary.com/vosvpv50/image/upload/v1787885076/yugifaux_icon.png",
    background: "https://res.cloudinary.com/vosvpv50/image/upload/v1787885326/Gemini_Generated_Image_pmss9epmss9epmss.jpg",
    deckConstructor: "https://custom-db.yugioh.app/assets/deck_constructor.svg",
    deckSearch: "https://custom-db.yugioh.app/assets/search.svg",
    startMonsters: Object.freeze([
      Object.freeze({ name: "Beltza", url: "https://res.cloudinary.com/vosvpv50/image/upload/v1787885319/beltza.png", scale: .6, x: "0px", y: "0px" }),
      Object.freeze({ name: "Cheepflight", url: "https://res.cloudinary.com/vosvpv50/image/upload/v1787786834/cheepflight.png", scale: .55, x: "0px", y: "-48px" })
    ])
  });

  function chooseStartMonster(options, random = Math.random) {
    if (!Array.isArray(options) || options.length === 0) return null;
    const index = Math.min(options.length - 1, Math.floor(Math.max(0, random()) * options.length));
    return options[index];
  }

  const VISUAL_THEME_STYLE = `
    body.yf-visual-theme {
      background-color: #160d1d !important;
      background-image: linear-gradient(#14091f24,#14091f24),url("${VISUAL_ASSETS.background}") !important;
      background-position: center center !important;
      background-repeat: no-repeat !important;
      background-size: cover !important;
      background-attachment: fixed !important;
    }
    body.yf-visual-theme #circuit_board,
    body.yf-visual-theme #greenlines { display: none !important; }
    body.yf-visual-theme #brionac_large {
      object-fit: contain;
      scale: var(--yf-start-monster-scale,.6) !important;
      translate: var(--yf-start-monster-x,0px) var(--yf-start-monster-y,0px) !important;
      transform-origin: 50% 50% !important;
      filter: drop-shadow(0 12px 12px #000b) drop-shadow(0 0 16px #c084fc55);
    }
    body.yf-visual-theme #search { color: #efeff1 !important; }
    body.yf-visual-theme #deck_constructor {
      background-image: url("${VISUAL_ASSETS.deckConstructor}") !important;
      background-position: 0 0 !important;
      background-repeat: no-repeat !important;
      background-size: 1024px 640px !important;
    }
    body.yf-visual-theme #deck_constructor > .deck_bg,
    body.yf-visual-theme #deck_constructor > .side_bg,
    body.yf-visual-theme #deck_constructor > .extra_bg { background: transparent !important; }
    body.yf-visual-theme #search {
      background-image: url("${VISUAL_ASSETS.deckSearch}") !important;
      background-position: 0 0 !important;
      background-repeat: no-repeat !important;
      background-size: 100% 100% !important;
    }
    body.yf-visual-theme #search > .search_bg { background: transparent !important; }
    body.yf-visual-theme #search .more_options_btn { color: #16c6fa !important; }
    body.yf-visual-theme .bypass_background { background-color: #18181b !important; }
    body.yf-visual-theme .bypass_limit_lbl,
    body.yf-visual-theme .tcg_limit_lbl,
    body.yf-visual-theme .ocg_limit_lbl { color: #efeff1 !important; }
  `;

  class VisualTheme {
    constructor(diagnostics, getSettings) {
      this.diagnostics = diagnostics;
      this.getSettings = getSettings;
      this.startMonster = chooseStartMonster(VISUAL_ASSETS.startMonsters);
      this.observer = null;
      this.refreshQueued = false;
    }

    mount() {
      if (!document.getElementById("yf-visual-theme-style")) {
        const style = document.createElement("style");
        style.id = "yf-visual-theme-style";
        style.textContent = VISUAL_THEME_STYLE;
        document.head.append(style);
      }
      this.observer = new MutationObserver(() => this.#queueRefresh());
      this.observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["src"] });
      this.refresh();
    }

    refresh() {
      const active = Boolean(this.getSettings()?.enabled && this.getSettings()?.visualThemeEnabled);
      document.body.classList.toggle("yf-visual-theme", active);
      if (active) {
        this.#applyStartMonster();
      } else {
        this.#restoreStartMonster();
      }
    }

    #queueRefresh() {
      if (this.refreshQueued) return;
      this.refreshQueued = true;
      requestAnimationFrame(() => {
        this.refreshQueued = false;
        this.refresh();
      });
    }

    #applyStartMonster() {
      const monster = document.getElementById("brionac_large");
      if (!(monster instanceof HTMLImageElement) || !this.startMonster) return;
      if (!monster.hasAttribute("data-yf-original-src")) {
        monster.setAttribute("data-yf-original-src", monster.getAttribute("src") ?? "");
        monster.setAttribute("data-yf-original-alt", monster.getAttribute("alt") ?? "");
      }
      monster.style.setProperty("--yf-start-monster-scale", String(this.startMonster.scale));
      monster.style.setProperty("--yf-start-monster-x", this.startMonster.x ?? "0px");
      monster.style.setProperty("--yf-start-monster-y", this.startMonster.y ?? "0px");
      monster.setAttribute("alt", this.startMonster.name);
      if (monster.getAttribute("src") !== this.startMonster.url) {
        monster.setAttribute("src", this.startMonster.url);
      }
    }

    #restoreStartMonster() {
      for (const monster of document.querySelectorAll("#brionac_large[data-yf-original-src]")) {
        const original = monster.getAttribute("data-yf-original-src") ?? "";
        const originalAlt = monster.getAttribute("data-yf-original-alt") ?? "";
        if (original) monster.setAttribute("src", original);
        else monster.removeAttribute("src");
        if (originalAlt) monster.setAttribute("alt", originalAlt);
        else monster.removeAttribute("alt");
        monster.style.removeProperty("--yf-start-monster-scale");
        monster.style.removeProperty("--yf-start-monster-x");
        monster.style.removeProperty("--yf-start-monster-y");
        monster.removeAttribute("data-yf-original-src");
        monster.removeAttribute("data-yf-original-alt");
      }
    }

  }
