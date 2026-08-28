  const VISUAL_ASSETS = Object.freeze({
    logo: "https://res.cloudinary.com/vosvpv50/image/upload/v1787885076/yugifaux_icon.png",
    background: "https://res.cloudinary.com/vosvpv50/image/upload/v1787885326/Gemini_Generated_Image_pmss9epmss9epmss.jpg",
    startMonster: "https://res.cloudinary.com/vosvpv50/image/upload/v1787885319/beltza.png"
  });

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
      position: absolute !important;
      right: 2vw !important;
      bottom: 0 !important;
      left: auto !important;
      top: auto !important;
      width: clamp(220px,18vw,320px) !important;
      height: auto !important;
      max-width: 32vw !important;
      max-height: 48vh !important;
      object-fit: contain;
      scale: 1 !important;
      transform: none !important;
      filter: drop-shadow(0 12px 12px #000b) drop-shadow(0 0 16px #c084fc55);
    }
  `;

  class VisualTheme {
    constructor(diagnostics, getSettings) {
      this.diagnostics = diagnostics;
      this.getSettings = getSettings;
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
      if (active) this.#applyStartMonster();
      else this.#restoreStartMonster();
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
      if (!(monster instanceof HTMLImageElement)) return;
      if (!monster.hasAttribute("data-yf-original-src")) {
        monster.setAttribute("data-yf-original-src", monster.getAttribute("src") ?? "");
      }
      if (monster.getAttribute("src") !== VISUAL_ASSETS.startMonster) {
        monster.setAttribute("src", VISUAL_ASSETS.startMonster);
      }
    }

    #restoreStartMonster() {
      for (const monster of document.querySelectorAll("#brionac_large[data-yf-original-src]")) {
        const original = monster.getAttribute("data-yf-original-src") ?? "";
        if (original) monster.setAttribute("src", original);
        else monster.removeAttribute("src");
        monster.removeAttribute("data-yf-original-src");
      }
    }
  }
