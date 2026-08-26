  const diagnostics = new Diagnostics();
  const storage = new SafeStorage();
  const state = { settings: { ...DEFAULT_SETTINGS }, configState: null };
  let ui;
  let logObserver;
  let animationPlayer;
  let matchLauncher;
  let tokenMacros;
  let chainMacros;

  async function persistSettings() {
    await storage.set("settings", state.settings);
  }

  async function reloadConfig() {
    state.configState = await new ConfigLoader(storage, diagnostics).load();
    ui?.refresh();
  }

  function handlePublicEvent(event) {
    if (!state.settings.enabled) return;
    animationPlayer.handle(event, state.configState?.config ?? BUNDLED_CONFIG);
  }

  async function start() {
    state.settings = { ...DEFAULT_SETTINGS, ...(await storage.get("settings", {})) };
    diagnostics.setEnabled(state.settings.diagnosticsEnabled);
    animationPlayer = new AnimationPlayer(diagnostics, () => state.settings);
    matchLauncher = new MatchLauncher(diagnostics);
    tokenMacros = new TokenMacros(diagnostics, () => state.settings);
    chainMacros = new ChainMacros(diagnostics, () => state.settings);
    logObserver = new PublicDuelLogObserver(diagnostics, handlePublicEvent);
    logObserver.start();

    ui = new CompanionUI(storage, diagnostics, () => state, {
      startLeagueMatch() {
        if (!state.settings.enabled) {
          diagnostics.warn("launcher", "match launcher unavailable while companion is disabled");
          return;
        }
        matchLauncher.open();
      },
      preview(cardName, eventType = "effect-declaration") {
        animationPlayer.resetDuel();
        const text = eventType === "activation"
          ? `Test Player Activated "${cardName}"`
          : `Test Player declared the effect of ${cardName}`;
        handlePublicEvent({ type: eventType, text });
      },
      reloadConfig,
      async emergencyDisable() {
        state.settings.enabled = false;
        state.settings.animationsEnabled = false;
        document.getElementById(APP.ids.overlay)?.remove();
        matchLauncher.close();
        tokenMacros.close();
        chainMacros.close();
        await persistSettings();
        tokenMacros.refresh();
        chainMacros.refresh();
        diagnostics.warn("safety", "companion disabled by player");
        ui.refresh();
      },
      async updateSetting(key, value) {
        state.settings[key] = value;
        if (key === "diagnosticsEnabled") diagnostics.setEnabled(value);
        if (key === "enabled" && !value) document.getElementById(APP.ids.overlay)?.remove();
        await persistSettings();
        tokenMacros.refresh();
        chainMacros.refresh();
        ui.refresh();
      }
    });
    ui.mount();
    tokenMacros.mount();
    chainMacros.mount();
    await reloadConfig();
    diagnostics.info("bootstrap", "companion initialized", { coreVersion: APP.version });
  }

  start().catch((error) => {
    console.warn("YugiFaux Companion failed safely:", error);
  });
