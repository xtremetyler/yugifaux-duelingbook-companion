  const VISUAL_ASSETS = Object.freeze({
    logo: "https://res.cloudinary.com/vosvpv50/image/upload/v1787885076/yugifaux_icon.png",
    background: "https://res.cloudinary.com/vosvpv50/image/upload/v1787885326/Gemini_Generated_Image_pmss9epmss9epmss.jpg",
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
    body.yf-visual-theme #deck_constructor > .deck_bg {
      background: linear-gradient(145deg,rgba(24,24,27,.97),rgba(46,16,101,.92)) !important;
      box-shadow: inset 0 0 28px #a855f72b;
    }
    body.yf-visual-theme #deck_constructor > .side_bg {
      background: linear-gradient(145deg,rgba(8,47,73,.97),rgba(14,116,144,.9)) !important;
      box-shadow: inset 0 0 22px #22d3ee26;
    }
    body.yf-visual-theme #deck_constructor > .extra_bg {
      background: linear-gradient(145deg,rgba(67,20,7,.97),rgba(154,52,18,.9)) !important;
      box-shadow: inset 0 0 22px #fb923c26;
    }
    body.yf-visual-theme #search > .search_bg {
      background: linear-gradient(160deg,rgba(24,24,27,.98),rgba(49,46,129,.94)) !important;
      box-shadow: inset 0 0 30px #a78bfa24;
    }
    body.yf-visual-theme #search .more_options_btn { color: #16c6fa !important; }
    body.yf-visual-theme .bypass_background { background-color: #18181b !important; }
    body.yf-visual-theme #deck_constructor .bypass_background2 {
      background: linear-gradient(0deg,#18181b,#312e8100) !important;
      opacity: 1 !important;
    }
    body.yf-visual-theme #deck_constructor #banlists {
      border: 1px solid #8b5cf6 !important;
      border-radius: 4px;
      background: #18181b !important;
      color: #f8fafc !important;
      color-scheme: dark;
    }
    body.yf-visual-theme #deck_constructor #banlists option { background: #18181b; color: #f8fafc; }
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
