  const STYLE = `
    #${APP.ids.button} { position: fixed; left: 18px; bottom: 18px; z-index: 2147483645; border: 1px solid #d6b55b; border-radius: 999px; background: #111827; color: #f8e7aa; padding: 9px 13px; font: 700 13px/1 Arial,sans-serif; cursor: pointer; box-shadow: 0 4px 16px #0008; }
    #${APP.ids.panel} { position: fixed; left: 18px; bottom: 62px; z-index: 2147483646; box-sizing: border-box; width: min(350px, calc(100vw - 36px)); max-height: min(570px, calc(100vh - 90px)); overflow: auto; border: 1px solid #d6b55b; border-radius: 10px; background: #111827f5; color: #f8fafc; padding: 14px; font: 13px/1.4 Arial,sans-serif; box-shadow: 0 10px 34px #000b; }
    #${APP.ids.panel}[hidden] { display: none; }
    #${APP.ids.panel} h2 { margin: 0 0 4px; color: #f8e7aa; font-size: 18px; }
    #${APP.ids.panel} p { margin: 4px 0 10px; color: #cbd5e1; }
    #${APP.ids.panel} label { display: flex; gap: 8px; align-items: center; margin: 8px 0; }
    #${APP.ids.panel} button { margin: 7px 6px 0 0; border: 1px solid #64748b; border-radius: 5px; background: #1e293b; color: #fff; padding: 7px 9px; cursor: pointer; }
    #${APP.ids.panel} .yf-status { margin: 10px 0; padding: 8px; border-radius: 5px; background: #0f172a; }
    #${APP.ids.panel} .yf-diagnostics { max-height: 150px; overflow: auto; white-space: pre-wrap; color: #a7f3d0; font: 11px/1.35 Consolas,monospace; }
    #${APP.ids.overlay} { pointer-events: none; position: fixed; inset: 0; z-index: 2147483644; display: grid; place-items: center; overflow: hidden; background: radial-gradient(circle, #fff2 0, #020617cc 60%); animation: yf-overlay-in .3s ease-out both; }
    #${APP.ids.overlay} .yf-animation-flare { display: grid; place-items: center; min-width: min(680px, 90vw); min-height: 180px; border-block: 2px solid #f8d36b; color: white; background: linear-gradient(90deg, transparent, #7c2d12dd 20%, #111827ee 50%, #7c2d12dd 80%, transparent); text-align: center; animation: yf-flare 2.6s cubic-bezier(.2,.8,.2,1) both; }
    #${APP.ids.overlay} strong { display: block; color: #fff3bd; font: 800 clamp(26px,5vw,58px)/1.05 Georgia,serif; text-shadow: 0 2px 2px #000,0 0 22px #f59e0b; }
    #${APP.ids.overlay} span { display: block; margin-top: 10px; letter-spacing: .25em; text-transform: uppercase; font: 700 14px/1 Arial,sans-serif; }
    #${APP.ids.overlay}.yf-reduced-motion { animation: none; background: #020617dd; }
    #${APP.ids.overlay}.yf-reduced-motion .yf-animation-flare { animation: none; }
    @keyframes yf-overlay-in { from { opacity: 0 } to { opacity: 1 } }
    @keyframes yf-flare { 0% { opacity: 0; transform: scale(.82) } 18%,75% { opacity: 1; transform: scale(1) } 100% { opacity: 0; transform: scale(1.04) } }
  `;

  class CompanionUI {
    constructor(storage, diagnostics, getState, actions) {
      this.storage = storage;
      this.diagnostics = diagnostics;
      this.getState = getState;
      this.actions = actions;
      this.status = null;
      this.diagnosticOutput = null;
    }

    mount() {
      if (document.getElementById(APP.ids.button)) return;
      const style = document.createElement("style");
      style.textContent = STYLE;
      document.head.append(style);

      const button = document.createElement("button");
      button.id = APP.ids.button;
      button.type = "button";
      button.textContent = "YF";
      button.title = "Open YugiFaux Companion";

      const panel = document.createElement("section");
      panel.id = APP.ids.panel;
      panel.hidden = true;
      panel.setAttribute("aria-label", "YugiFaux Companion controls");

      const heading = document.createElement("h2");
      heading.textContent = APP.name;
      const intro = document.createElement("p");
      intro.textContent = "Phase 1 passive event-observation proof of concept.";
      this.status = document.createElement("div");
      this.status.className = "yf-status";
      panel.append(heading, intro, this.status);

      const settings = this.getState().settings;
      panel.append(
        this.#checkbox("Companion enabled", "enabled", settings.enabled),
        this.#checkbox("Animations enabled", "animationsEnabled", settings.animationsEnabled),
        this.#checkbox("Mute audio", "muted", settings.muted),
        this.#checkbox("Reduced motion", "reducedMotion", settings.reducedMotion),
        this.#checkbox("Diagnostics", "diagnosticsEnabled", settings.diagnosticsEnabled)
      );

      const test = document.createElement("button");
      test.type = "button";
      test.textContent = "Simulate test summon";
      test.addEventListener("click", () => this.actions.simulate());
      const reload = document.createElement("button");
      reload.type = "button";
      reload.textContent = "Check league data";
      reload.addEventListener("click", () => this.actions.reloadConfig());
      const disable = document.createElement("button");
      disable.type = "button";
      disable.textContent = "Emergency disable";
      disable.addEventListener("click", () => this.actions.emergencyDisable());

      this.diagnosticOutput = document.createElement("div");
      this.diagnosticOutput.className = "yf-diagnostics";
      panel.append(test, reload, disable, this.diagnosticOutput);
      button.addEventListener("click", () => { panel.hidden = !panel.hidden; });
      document.body.append(button, panel);
      this.diagnostics.subscribe((entries) => this.#renderDiagnostics(entries));
      this.refresh();
    }

    refresh() {
      if (!this.status) return;
      const { configState, settings } = this.getState();
      this.status.textContent = `Core ${APP.version} • Data ${configState?.config?.dataVersion ?? "loading"} • ${configState?.source ?? "loading"} • ${settings.enabled ? "active" : "disabled"}`;
      for (const input of document.querySelectorAll(`#${APP.ids.panel} input[data-setting]`)) {
        input.checked = Boolean(settings[input.dataset.setting]);
      }
      this.#renderDiagnostics(this.diagnostics.list());
    }

    #checkbox(labelText, key, checked) {
      const label = document.createElement("label");
      const input = document.createElement("input");
      input.type = "checkbox";
      input.dataset.setting = key;
      input.checked = checked;
      input.addEventListener("change", () => this.actions.updateSetting(key, input.checked));
      label.append(input, document.createTextNode(labelText));
      return label;
    }

    #renderDiagnostics(entries) {
      if (!this.diagnosticOutput) return;
      const enabled = this.getState().settings.diagnosticsEnabled;
      this.diagnosticOutput.hidden = !enabled;
      this.diagnosticOutput.textContent = enabled
        ? entries.slice(-12).map((entry) => `${entry.at.slice(11, 19)} ${entry.level.toUpperCase()} ${entry.area}: ${entry.message}`).join("\n")
        : "";
    }
  }
