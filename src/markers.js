  const MARKER_PRESETS = Object.freeze([
    Object.freeze({ id: "negated", label: "Effect Negated", shortLabel: "NEG", icon: "Ø" }),
    Object.freeze({ id: "cannot-attack", label: "Cannot Attack", shortLabel: "NO ATK", icon: "⚔" }),
    Object.freeze({ id: "cannot-activate", label: "Cannot Activate Effects", shortLabel: "NO FX", icon: "✦" }),
    Object.freeze({ id: "position-locked", label: "Cannot Change Battle Position", shortLabel: "LOCK", icon: "◆" }),
    Object.freeze({ id: "return-end-phase", label: "Return in End Phase", shortLabel: "RETURN EP", icon: "↶" }),
    Object.freeze({ id: "custom", label: "Custom Reminder", shortLabel: "NOTE", icon: "!" })
  ]);

  function normalizeMarkerText(value, maximum = 100, replaceDash = true) {
    const normalized = String(value ?? "")
      .replace(/[\r\n]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return (replaceDash ? normalized.replaceAll("—", "-") : normalized).slice(0, maximum);
  }

  function formatMarkerChatMessage(marker, action = "apply") {
    const controller = normalizeMarkerText(marker?.controller, 40);
    const zone = String(marker?.zone ?? "").toUpperCase();
    const cardName = normalizeMarkerText(marker?.cardName, 120, false);
    const label = normalizeMarkerText(marker?.label, 60);
    if (!controller || !/^(?:M[1-5]|S[1-5]|F|EL|ER)$/.test(zone) || !cardName || !label) return "";
    const location = marker?.includeLocation ? ` [${controller} ${zone}]` : "";
    if (action === "clear") return `✅ ${cardName}${location} — ${label} (Cleared)`;
    const expiration = marker?.expiration === "end-phase" ? "Until End Phase" : "Manual";
    return `‼️ ${cardName}${location} — ${label} (${expiration})`;
  }

  function parseMarkerChatMessage(value) {
    const text = String(value ?? "").replace(/\s+/g, " ").trim();
    const appliedLocated = text.match(/^‼️ (.+) \[([^\]]{1,40}) (M[1-5]|S[1-5]|F|EL|ER)\] — (.{1,60}) \((Until End Phase|Manual)\)$/u);
    const appliedSimple = appliedLocated ? null : text.match(/^‼️ (.+) — (.{1,60}) \((Until End Phase|Manual)\)$/u);
    if (appliedLocated || appliedSimple) {
      return {
        action: "apply",
        cardName: (appliedLocated?.[1] ?? appliedSimple[1]).trim(),
        controller: appliedLocated?.[2]?.trim() ?? "",
        zone: appliedLocated?.[3] ?? "",
        label: (appliedLocated?.[4] ?? appliedSimple[2]).trim(),
        expiration: (appliedLocated?.[5] ?? appliedSimple[3]) === "Until End Phase" ? "end-phase" : "manual"
      };
    }
    const clearedLocated = text.match(/^✅ (.+) \[([^\]]{1,40}) (M[1-5]|S[1-5]|F|EL|ER)\] — (.{1,60}) \(Cleared\)$/u);
    const clearedSimple = clearedLocated ? null : text.match(/^✅ (.+) — (.{1,60}) \(Cleared\)$/u);
    return clearedLocated || clearedSimple ? {
      action: "clear",
      cardName: (clearedLocated?.[1] ?? clearedSimple[1]).trim(),
      controller: clearedLocated?.[2]?.trim() ?? "",
      zone: clearedLocated?.[3] ?? "",
      label: (clearedLocated?.[4] ?? clearedSimple[2]).trim(),
      expiration: "manual"
    } : null;
  }

  const MARKER_STYLE = `
    #${APP.ids.markerButton} { position: fixed; right: 14px; top: calc(50% + 245px); z-index: 2147483645; transform: translateY(-50%); border: 1px solid #fcd34d; border-radius: 9px 0 0 9px; background: linear-gradient(145deg,#78350f,#4c1d95); color: #fffbeb; padding: 11px 9px; writing-mode: vertical-rl; letter-spacing: .1em; font: 900 12px/1 Arial,sans-serif; box-shadow: 0 5px 20px #000a,0 0 16px #facc1544; cursor: pointer; }
    #${APP.ids.markerButton}[hidden] { display: none; }
    #${APP.ids.markerPanel} { position: fixed; right: 58px; top: 50%; z-index: 2147483646; box-sizing: border-box; width: min(360px,calc(100vw - 78px)); max-height: min(78vh,720px); overflow: auto; transform: translateY(-50%); border: 1px solid #fcd34d; border-radius: 13px; background: linear-gradient(145deg,#1c1209f8,#172554f8 58%,#3b1654f8); color: #fff; padding: 13px; box-shadow: 0 18px 50px #000e,0 0 25px #facc1530; font: 13px/1.35 Arial,sans-serif; }
    #${APP.ids.markerPanel} * { box-sizing: border-box; }
    #${APP.ids.markerPanel} header { display: flex; align-items: center; justify-content: space-between; gap: 10px; border-bottom: 1px solid #fcd34d55; padding-bottom: 8px; }
    #${APP.ids.markerPanel} h2, #${APP.ids.markerPanel} h3 { margin: 0; }
    #${APP.ids.markerPanel} h2 { color: #fef3c7; font-size: 17px; }
    #${APP.ids.markerPanel} h3 { margin-top: 13px; color: #fde68a; font-size: 12px; text-transform: uppercase; letter-spacing: .08em; }
    #${APP.ids.markerPanel} button, #${APP.ids.markerPanel} select, #${APP.ids.markerPanel} input { border: 1px solid #64748b; border-radius: 7px; background: #111827; color: #fff; padding: 8px; font: inherit; }
    #${APP.ids.markerPanel} button { cursor: pointer; font-weight: 750; }
    #${APP.ids.markerPanel} button:hover, #${APP.ids.markerPanel} button:focus-visible { border-color: #fde68a; filter: brightness(1.14); }
    #${APP.ids.markerPanel} .yf-marker-close { border: 0; background: transparent; padding: 0 4px; color: #e2e8f0; font-size: 25px; line-height: 1; }
    #${APP.ids.markerPanel} .yf-marker-presets { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; margin-top: 8px; }
    #${APP.ids.markerPanel} .yf-marker-presets button { display: flex; align-items: center; gap: 7px; min-width: 0; overflow-wrap: anywhere; text-align: left; background: linear-gradient(135deg,#312e81,#713f12); }
    #${APP.ids.markerPanel} .yf-marker-preset-icon { display: grid; flex: 0 0 25px; width: 25px; height: 25px; place-items: center; border: 1px solid #fff7; border-radius: 50%; background: #02061777; color: #fff; font: 900 15px/1 Georgia,serif; box-shadow: 0 0 9px #facc1533; }
    #${APP.ids.markerPanel} .yf-marker-presets button[aria-pressed="true"] { border-color: #fef08a; background: linear-gradient(135deg,#6d28d9,#b45309); box-shadow: 0 0 0 1px #facc1566 inset; }
    #${APP.ids.markerPanel} .yf-marker-custom { display: block; width: 100%; margin-top: 8px; }
    #${APP.ids.markerPanel} .yf-marker-options { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px; }
    #${APP.ids.markerPanel} label { display: grid; gap: 4px; color: #e2e8f0; }
    #${APP.ids.markerPanel} .yf-marker-share { display: flex; align-items: center; gap: 7px; margin-top: 10px; }
    #${APP.ids.markerPanel} .yf-marker-share input { width: auto; }
    #${APP.ids.markerPanel} .yf-marker-selected { margin-top: 10px; border: 1px solid #60a5fa66; border-radius: 8px; background: #172554aa; padding: 9px; color: #dbeafe; }
    #${APP.ids.markerPanel} .yf-marker-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px; }
    #${APP.ids.markerPanel} .yf-marker-select { background: linear-gradient(135deg,#1d4ed8,#6d28d9); }
    #${APP.ids.markerPanel} .yf-marker-apply { border-color: #fde68a; background: linear-gradient(135deg,#b45309,#6d28d9); }
    #${APP.ids.markerPanel} .yf-marker-active-list { display: grid; gap: 7px; margin-top: 8px; }
    #${APP.ids.markerPanel} .yf-marker-active { display: grid; grid-template-columns: 1fr auto; gap: 8px; align-items: center; border: 1px solid #475569; border-radius: 8px; background: #0f172acc; padding: 8px; }
    #${APP.ids.markerPanel} .yf-marker-active strong, #${APP.ids.markerPanel} .yf-marker-active small { display: block; }
    #${APP.ids.markerPanel} .yf-marker-active small { margin-top: 2px; color: #cbd5e1; }
    #${APP.ids.markerPanel} .yf-marker-empty { color: #94a3b8; text-align: center; }
    #${APP.ids.markerToast} { position: fixed; right: 58px; bottom: 18px; z-index: 2147483647; width: min(390px,calc(100vw - 80px)); border: 1px solid #fcd34d; border-radius: 9px; background: #451a03ef; color: #fffbeb; padding: 10px 12px; text-align: center; font: 750 13px/1.35 Arial,sans-serif; box-shadow: 0 8px 24px #000c; }
    #${APP.ids.markerToast}.yf-marker-error { border-color: #f87171; background: #450a0aef; color: #fee2e2; }
    #${APP.ids.markerBadgeLayer} { position: fixed; inset: 0; z-index: 2147483642; pointer-events: none; }
    #${APP.ids.markerBadgeLayer} .yf-marker-stack { position: fixed; display: flex; align-items: center; gap: 3px; }
    #${APP.ids.markerBadgeLayer} .yf-marker-stack[data-orientation="attack"] { flex-direction: column; width: 22px; }
    #${APP.ids.markerBadgeLayer} .yf-marker-stack[data-orientation="defense"] { flex-direction: row; width: auto; height: 22px; }
    #${APP.ids.markerBadgeLayer} .yf-marker-chip { --yf-marker-color: 180,83,9; pointer-events: auto; position: relative; display: grid; flex: 0 0 21px; width: 21px; height: 21px; place-items: center; border: 1px solid #fff9; border-radius: 50%; background: linear-gradient(145deg,rgba(var(--yf-marker-color),.94),rgba(15,23,42,.9)); color: #fff; font: 900 13px/1 Georgia,serif; text-shadow: 0 1px 2px #000; box-shadow: 0 2px 6px #000c,0 0 8px rgba(var(--yf-marker-color),.65),inset 0 1px 2px #fff5; backdrop-filter: blur(4px); }
    #${APP.ids.markerBadgeLayer} .yf-marker-chip::after { content: ""; position: absolute; inset: 2px; border: 1px solid #ffffff42; border-radius: inherit; }
    #${APP.ids.markerBadgeLayer} .yf-marker-chip[data-status="negated"] { --yf-marker-color: 185,28,28; }
    #${APP.ids.markerBadgeLayer} .yf-marker-chip[data-status="cannot-attack"] { --yf-marker-color: 220,38,38; }
    #${APP.ids.markerBadgeLayer} .yf-marker-chip[data-status="cannot-activate"] { --yf-marker-color: 126,34,206; }
    #${APP.ids.markerBadgeLayer} .yf-marker-chip[data-status="position-locked"] { --yf-marker-color: 29,78,216; }
    #${APP.ids.markerBadgeLayer} .yf-marker-chip[data-status="return-end-phase"] { --yf-marker-color: 5,150,105; }
    #${APP.ids.markerBadgeLayer} .yf-marker-tooltip { pointer-events: none; position: absolute; right: 26px; top: 50%; width: max-content; max-width: 190px; transform: translateY(-50%) translateX(4px); border: 1px solid rgba(var(--yf-marker-color),.8); border-radius: 7px; background: #07111ff2; color: #f8fafc; padding: 6px 8px; opacity: 0; visibility: hidden; white-space: normal; text-align: left; font: 700 11px/1.25 Arial,sans-serif; text-shadow: none; box-shadow: 0 6px 18px #000d,0 0 12px rgba(var(--yf-marker-color),.35); transition: opacity 120ms ease,transform 120ms ease,visibility 120ms; }
    #${APP.ids.markerBadgeLayer} .yf-marker-tooltip strong, #${APP.ids.markerBadgeLayer} .yf-marker-tooltip small { display: block; }
    #${APP.ids.markerBadgeLayer} .yf-marker-tooltip small { margin-top: 2px; color: #cbd5e1; font-weight: 600; }
    #${APP.ids.markerBadgeLayer} .yf-marker-chip:hover .yf-marker-tooltip { opacity: 1; visibility: visible; transform: translateY(-50%) translateX(0); }
    @media (prefers-reduced-motion: reduce) { #${APP.ids.markerBadgeLayer} .yf-marker-tooltip { transition: none; } }
    .yf-marker-selectable { outline: 3px solid #facc15 !important; outline-offset: 3px; filter: drop-shadow(0 0 8px #facc15) !important; cursor: crosshair !important; }
    @media (max-width: 650px) { #${APP.ids.markerButton} { right: 4px; top: calc(50% + 215px); } #${APP.ids.markerPanel} { right: 48px; } }
  `;

  class MarkerTracker {
    constructor(diagnostics, getSettings) {
      this.diagnostics = diagnostics;
      this.getSettings = getSettings;
      this.button = null;
      this.panel = null;
      this.toast = null;
      this.badgeLayer = null;
      this.markers = new Map();
      this.selectedCardId = "";
      this.selecting = false;
      this.draftStatusId = "negated";
      this.draftCustomText = "";
      this.draftExpiration = "manual";
      this.draftPublic = true;
      this.chatRoot = null;
      this.chatObserver = null;
      this.seenMessageIds = new Set();
    }

    mount() {
      if (document.getElementById(APP.ids.markerButton)) return;
      const style = document.createElement("style");
      style.textContent = MARKER_STYLE;
      document.head.append(style);

      this.button = document.createElement("button");
      this.button.id = APP.ids.markerButton;
      this.button.type = "button";
      this.button.textContent = "MARKERS";
      this.button.title = "Open YugiFaux card reminders";
      this.button.addEventListener("click", () => this.toggle());
      document.body.append(this.button);

      this.badgeLayer = document.createElement("div");
      this.badgeLayer.id = APP.ids.markerBadgeLayer;
      this.badgeLayer.setAttribute("aria-hidden", "true");
      document.body.append(this.badgeLayer);

      document.addEventListener("click", (event) => this.#handleCardSelection(event), true);
      document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        if (this.selecting) this.#stopSelecting();
        else this.close();
      });
      setInterval(() => this.refresh(), 500);
      this.refresh();
    }

    refresh() {
      if (!this.button) return;
      const inDuel = this.#isVisible(document.querySelector("#duel"));
      this.button.hidden = !this.getSettings()?.enabled || !inDuel;
      if (!inDuel) {
        this.close();
        this.#clearAll(false);
        return;
      }
      if (this.button.hidden) this.close();
      this.#attachChat();
      const changed = this.#syncMarkers();
      this.#renderBadges();
      if (changed && this.panel) this.#renderPanel();
    }

    handlePublicEvent(event) {
      if (event?.type !== "end-phase" || !this.getSettings()?.enabled) return;
      let removed = 0;
      for (const [key, marker] of this.markers) {
        if (marker.expiration !== "end-phase") continue;
        this.markers.delete(key);
        removed += 1;
      }
      if (!removed) return;
      this.#renderBadges();
      if (this.panel) this.#renderPanel();
      this.#showToast(`${removed} End Phase reminder${removed === 1 ? "" : "s"} expired.`);
      this.diagnostics.info("markers", "End Phase reminders expired", { count: removed });
    }

    toggle() {
      if (this.panel) this.close();
      else this.#renderPanel();
    }

    close() {
      this.panel?.remove();
      this.panel = null;
      this.#stopSelecting(false);
    }

    #renderPanel() {
      this.panel?.remove();
      const panel = document.createElement("section");
      panel.id = APP.ids.markerPanel;
      panel.setAttribute("aria-label", "Card markers and reminders");
      const header = document.createElement("header");
      const title = document.createElement("h2");
      title.textContent = "🏷️ Card Markers";
      const close = document.createElement("button");
      close.type = "button";
      close.className = "yf-marker-close";
      close.setAttribute("aria-label", "Close Markers");
      close.textContent = "×";
      close.addEventListener("click", () => this.close());
      header.append(title, close);

      const markerHeading = document.createElement("h3");
      markerHeading.textContent = "Choose a reminder";
      const presets = document.createElement("div");
      presets.className = "yf-marker-presets";
      for (const preset of MARKER_PRESETS) {
        const button = document.createElement("button");
        button.type = "button";
        const icon = document.createElement("span");
        icon.className = "yf-marker-preset-icon";
        icon.textContent = preset.icon;
        const buttonLabel = document.createElement("span");
        buttonLabel.textContent = preset.label;
        button.append(icon, buttonLabel);
        button.setAttribute("aria-pressed", String(this.draftStatusId === preset.id));
        button.addEventListener("click", () => {
          this.draftStatusId = preset.id;
          if (preset.id === "return-end-phase") this.draftExpiration = "end-phase";
          this.#renderPanel();
        });
        presets.append(button);
      }

      panel.append(header, markerHeading, presets);
      if (this.draftStatusId === "custom") {
        const custom = document.createElement("input");
        custom.className = "yf-marker-custom";
        custom.type = "text";
        custom.maxLength = 60;
        custom.placeholder = "Short reminder (60 characters maximum)";
        custom.value = this.draftCustomText;
        custom.addEventListener("input", () => { this.draftCustomText = custom.value; });
        panel.append(custom);
      }

      const options = document.createElement("div");
      options.className = "yf-marker-options";
      const durationLabel = document.createElement("label");
      durationLabel.append(document.createTextNode("Duration"));
      const duration = document.createElement("select");
      for (const [value, label] of [["manual", "Manual removal"], ["end-phase", "Until End Phase"]]) {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = label;
        option.selected = this.draftExpiration === value;
        duration.append(option);
      }
      duration.disabled = this.draftStatusId === "return-end-phase";
      duration.addEventListener("change", () => { this.draftExpiration = duration.value; });
      durationLabel.append(duration);
      options.append(durationLabel);
      panel.append(options);

      const share = document.createElement("label");
      share.className = "yf-marker-share";
      const shareInput = document.createElement("input");
      shareInput.type = "checkbox";
      shareInput.checked = this.draftPublic;
      shareInput.addEventListener("change", () => { this.draftPublic = shareInput.checked; });
      share.append(shareInput, document.createTextNode("Visible to both players (uses duel chat)"));
      panel.append(share);

      const selected = this.#fieldEntries().find((entry) => entry.cardId === this.selectedCardId);
      const selectedBox = document.createElement("div");
      selectedBox.className = "yf-marker-selected";
      selectedBox.textContent = selected
        ? `Selected: ${selected.cardName} — ${selected.controller} ${selected.zone}`
        : this.selecting ? "Selection active: click a face-up field card." : "No card selected.";
      panel.append(selectedBox);

      const actions = document.createElement("div");
      actions.className = "yf-marker-actions";
      const selectCard = document.createElement("button");
      selectCard.type = "button";
      selectCard.className = "yf-marker-select";
      selectCard.textContent = this.selecting ? "Cancel Selection" : "Select Field Card";
      selectCard.addEventListener("click", () => this.selecting ? this.#stopSelecting() : this.#startSelecting());
      const apply = document.createElement("button");
      apply.type = "button";
      apply.className = "yf-marker-apply";
      apply.textContent = "Apply Marker";
      apply.disabled = !selected;
      apply.addEventListener("click", () => this.#applyDraft());
      actions.append(selectCard, apply);
      panel.append(actions);

      const activeHeading = document.createElement("h3");
      activeHeading.textContent = `Active reminders (${this.markers.size})`;
      const activeList = document.createElement("div");
      activeList.className = "yf-marker-active-list";
      if (!this.markers.size) {
        const empty = document.createElement("p");
        empty.className = "yf-marker-empty";
        empty.textContent = "No active reminders.";
        activeList.append(empty);
      }
      for (const marker of this.markers.values()) {
        const item = document.createElement("div");
        item.className = "yf-marker-active";
        const copy = document.createElement("div");
        const name = document.createElement("strong");
        name.textContent = `${marker.icon ?? "!"} ${marker.label}`;
        const details = document.createElement("small");
        const location = marker.offField ? "Banished / off field" : `${marker.controller} ${marker.zone}`;
        details.textContent = `${marker.cardName} — ${location} — ${marker.expiration === "end-phase" ? "until End Phase" : "manual"}${marker.public ? " — public" : " — private"}`;
        copy.append(name, details);
        const remove = document.createElement("button");
        remove.type = "button";
        remove.textContent = "Remove";
        remove.addEventListener("click", () => this.#removeMarker(marker));
        item.append(copy, remove);
        activeList.append(item);
      }
      panel.append(activeHeading, activeList);
      document.body.append(panel);
      this.panel = panel;
    }

    #startSelecting() {
      const entries = this.#fieldEntries();
      if (!entries.length) return this.#showToast("No face-up field cards are available to mark.", true);
      this.selecting = true;
      for (const entry of entries) (entry.visualElement ?? entry.element).classList.add("yf-marker-selectable");
      this.#showToast("Click a face-up card on the field.");
      this.#renderPanel();
    }

    #stopSelecting(render = true) {
      this.selecting = false;
      for (const element of document.querySelectorAll(".yf-marker-selectable")) element.classList.remove("yf-marker-selectable");
      if (render && this.panel) this.#renderPanel();
    }

    #handleCardSelection(event) {
      if (!this.selecting || this.panel?.contains(event.target) || event.target === this.button) return;
      const target = event.target instanceof Element ? event.target : null;
      const selected = this.#fieldEntries().find((entry) => entry.element === target?.closest(".card") || entry.element.contains(target));
      if (!selected) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      this.selectedCardId = selected.cardId;
      this.#stopSelecting(false);
      this.#showToast(`Selected ${selected.cardName}.`);
      if (this.panel) this.#renderPanel();
    }

    #applyDraft() {
      const entry = this.#fieldEntries().find((candidate) => candidate.cardId === this.selectedCardId);
      if (!entry) return this.#showToast("Select a face-up card that is still on the field.", true);
      const preset = MARKER_PRESETS.find((candidate) => candidate.id === this.draftStatusId) ?? MARKER_PRESETS[0];
      const label = preset.id === "custom" ? normalizeMarkerText(this.draftCustomText, 60) : preset.label;
      if (!label) return this.#showToast("Enter a custom reminder before applying it.", true);
      const marker = {
        cardId: entry.cardId,
        cardName: entry.cardName,
        controller: entry.controller,
        zone: entry.zone,
        element: entry.element,
        statusId: preset.id,
        shortLabel: preset.id === "custom" ? "NOTE" : preset.shortLabel,
        icon: preset.icon,
        label,
        expiration: preset.id === "return-end-phase" ? "end-phase" : this.draftExpiration,
        public: this.draftPublic,
        offField: false,
        includeLocation: this.#fieldEntries().filter((candidate) => candidate.cardName.toLowerCase() === entry.cardName.toLowerCase()).length > 1
      };
      if (marker.public && !this.#sendChatLine(formatMarkerChatMessage(marker))) return;
      this.#upsertMarker(marker);
      this.selectedCardId = "";
      this.#showToast(`${label} applied to ${entry.cardName}.${marker.public ? " Shared in duel chat." : ""}`);
      this.diagnostics.info("markers", "player applied card reminder", { status: preset.id, expiration: marker.expiration, public: marker.public });
      this.#renderBadges();
      if (this.panel) this.#renderPanel();
    }

    #upsertMarker(marker) {
      const key = this.#markerKey(marker.cardId, marker.label);
      this.markers.set(key, marker);
      while (this.markers.size > 30) this.markers.delete(this.markers.keys().next().value);
    }

    #removeMarker(marker) {
      if (marker.public && !this.#sendChatLine(formatMarkerChatMessage(marker, "clear"))) return;
      this.markers.delete(this.#markerKey(marker.cardId, marker.label));
      this.#renderBadges();
      if (this.panel) this.#renderPanel();
      this.#showToast(`${marker.label} removed from ${marker.cardName}.`);
    }

    #clearAll(render = true) {
      if (!this.markers.size && !this.selectedCardId) return;
      this.markers.clear();
      this.selectedCardId = "";
      this.#renderBadges();
      if (render && this.panel) this.#renderPanel();
    }

    #markerKey(cardId, label) { return `${String(cardId)}:${String(label).toLowerCase()}`; }

    #syncMarkers() {
      let changed = false;
      const entries = this.#fieldEntries();
      const byId = new Map(entries.map((entry) => [entry.cardId, entry]));
      for (const [key, marker] of this.markers) {
        const entry = byId.get(marker.cardId);
        if (entry) {
          if (marker.zone !== entry.zone || marker.controller !== entry.controller || marker.element !== entry.element || marker.offField) changed = true;
          Object.assign(marker, entry, { offField: false, missingSince: 0 });
          continue;
        }
        if (marker.statusId === "return-end-phase") {
          if (this.#isCardBanished(marker.cardId)) {
            if (!marker.offField || marker.element) changed = true;
            marker.offField = true;
            marker.element = null;
            marker.missingSince = 0;
            continue;
          }
          marker.missingSince ||= Date.now();
          if (Date.now() - marker.missingSince < 2000) {
            marker.element = null;
            changed = true;
            continue;
          }
        }
        this.markers.delete(key);
        changed = true;
      }
      if (this.selectedCardId && !byId.has(this.selectedCardId)) {
        this.selectedCardId = "";
        changed = true;
      }
      return changed;
    }

    #renderBadges() {
      if (!this.badgeLayer) return;
      const groups = new Map();
      for (const marker of this.markers.values()) {
        const visual = marker.visualElement instanceof Element ? marker.visualElement : marker.element;
        if (!(visual instanceof Element) || !visual.isConnected || marker.offField) continue;
        if (!groups.has(marker.cardId)) groups.set(marker.cardId, []);
        groups.get(marker.cardId).push(marker);
      }
      const existing = new Map([...this.badgeLayer.children].map((stack) => [stack.dataset.cardId, stack]));
      for (const [cardId, markers] of groups) {
        let visual = markers[0].visualElement instanceof Element ? markers[0].visualElement : markers[0].element;
        let rect = visual.getBoundingClientRect();
        if ((!rect.width || !rect.height) && visual !== markers[0].element) {
          visual = markers[0].element;
          rect = visual.getBoundingClientRect();
        }
        if (!rect.width || !rect.height) continue;
        const defense = rect.width > rect.height;
        const stack = existing.get(cardId) ?? document.createElement("div");
        stack.className = "yf-marker-stack";
        stack.dataset.cardId = cardId;
        stack.dataset.orientation = defense ? "defense" : "attack";
        stack.style.left = defense
          ? `${Math.max(2, Math.min(innerWidth - (markers.length * 24), rect.left + 5))}px`
          : `${Math.max(2, Math.min(innerWidth - 24, rect.right - 9))}px`;
        stack.style.top = defense
          ? `${Math.max(2, rect.top - 8)}px`
          : `${Math.max(2, rect.top + 6)}px`;
        const signature = markers.map((marker) => [marker.statusId, marker.label, marker.expiration, marker.public, marker.icon].join(":")).join("|");
        if (stack.dataset.signature !== signature) {
          stack.replaceChildren();
          stack.dataset.signature = signature;
          for (const marker of markers) {
            const chip = document.createElement("div");
            chip.className = "yf-marker-chip";
            chip.dataset.status = marker.statusId;
            chip.append(document.createTextNode(marker.icon ?? MARKER_PRESETS.find((preset) => preset.id === marker.statusId)?.icon ?? "!"));
            const tooltip = document.createElement("div");
            tooltip.className = "yf-marker-tooltip";
            const tooltipLabel = document.createElement("strong");
            tooltipLabel.textContent = marker.label;
            const tooltipDetails = document.createElement("small");
            tooltipDetails.textContent = `${marker.expiration === "end-phase" ? "Until End Phase" : "Manual removal"} · ${marker.public ? "Public" : "Private"}`;
            tooltip.append(tooltipLabel, tooltipDetails);
            chip.append(tooltip);
            stack.append(chip);
          }
        }
        if (!stack.isConnected) this.badgeLayer.append(stack);
        existing.delete(cardId);
      }
      for (const stale of existing.values()) stale.remove();
    }

    #attachChat() {
      const root = document.querySelector("#duel .cout_txt");
      if (!root || root === this.chatRoot) return;
      this.chatObserver?.disconnect();
      this.chatRoot = root;
      this.seenMessageIds.clear();
      for (const message of root.querySelectorAll("font[message-id]")) {
        const id = message.getAttribute("message-id");
        if (id) this.#rememberMessage(id);
      }
      this.chatObserver = new MutationObserver((records) => {
        for (const record of records) for (const node of record.addedNodes) this.#inspectChatNode(node);
      });
      this.chatObserver.observe(root, { childList: true, subtree: true });
    }

    #inspectChatNode(node) {
      if (!(node instanceof Element) || !this.getSettings()?.enabled) return;
      const rows = [];
      if (node.matches("span")) rows.push(node);
      rows.push(...node.querySelectorAll("span"));
      for (const row of rows) {
        const messageElement = row.querySelector("font[message-id]");
        if (!messageElement) continue;
        const messageId = messageElement.getAttribute("message-id");
        if (messageId && this.seenMessageIds.has(messageId)) continue;
        if (messageId) this.#rememberMessage(messageId);
        const parsed = parseMarkerChatMessage(messageElement.textContent);
        if (!parsed) continue;
        if (parsed.action === "clear") this.#applyPublicClear(parsed);
        else this.#applyPublicMarker(parsed);
      }
    }

    #applyPublicMarker(parsed) {
      let candidates = this.#fieldEntries().filter((candidate) => candidate.cardName.toLowerCase() === parsed.cardName.toLowerCase());
      if (parsed.controller && parsed.zone) candidates = candidates.filter((candidate) =>
        candidate.controller.toLowerCase() === parsed.controller.toLowerCase() && candidate.zone === parsed.zone
      );
      if (candidates.length !== 1) return this.diagnostics.warn("markers", "public marker did not uniquely match a visible field card", { controller: parsed.controller, zone: parsed.zone, cardName: parsed.cardName, matches: candidates.length });
      const entry = candidates[0];
      const preset = MARKER_PRESETS.find((candidate) => candidate.label.toLowerCase() === parsed.label.toLowerCase()) ?? MARKER_PRESETS.at(-1);
      this.#upsertMarker({
        ...entry,
        statusId: preset.id,
        shortLabel: preset.id === "custom" ? "NOTE" : preset.shortLabel,
        icon: preset.icon,
        label: parsed.label,
        expiration: parsed.expiration,
        public: true,
        offField: false,
        includeLocation: Boolean(parsed.controller && parsed.zone)
      });
      this.#renderBadges();
      if (this.panel) this.#renderPanel();
    }

    #applyPublicClear(parsed) {
      let changed = false;
      for (const [key, marker] of this.markers) {
        if (parsed.controller && marker.controller.toLowerCase() !== parsed.controller.toLowerCase()) continue;
        if (parsed.zone && marker.zone !== parsed.zone) continue;
        if (marker.cardName.toLowerCase() !== parsed.cardName.toLowerCase()) continue;
        if (marker.label.toLowerCase() !== parsed.label.toLowerCase()) continue;
        this.markers.delete(key);
        changed = true;
      }
      if (!changed) return;
      this.#renderBadges();
      if (this.panel) this.#renderPanel();
    }

    #rememberMessage(messageId) {
      this.seenMessageIds.add(String(messageId));
      if (this.seenMessageIds.size <= 200) return;
      this.seenMessageIds.delete(this.seenMessageIds.values().next().value);
    }

    #sendChatLine(message) {
      const input = this.#findChatInput();
      if (!message || !input) {
        this.#showToast("DuelingBook’s duel chat is unavailable, so the public marker was not applied.", true);
        return false;
      }
      if (input.value.trim()) {
        this.#showToast("Your chat box already contains text. Send or clear it before sharing a marker.", true);
        input.focus();
        return false;
      }
      input.focus();
      input.value = message;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new KeyboardEvent("keydown", {
        key: "Enter", code: "Enter", keyCode: 13, which: 13, bubbles: true, cancelable: true
      }));
      setTimeout(() => {
        if (input.value !== message) return;
        this.#showToast("The public marker message is ready in chat. Press Enter to send it.");
        input.focus();
      }, 120);
      return true;
    }

    #findChatInput() {
      const candidates = [];
      for (const selector of ["#duel #cin_txt", "#duel .cin_txt", "#cin_txt", ".cin_txt"]) {
        for (const candidate of document.querySelectorAll(selector)) if (!candidates.includes(candidate)) candidates.push(candidate);
      }
      return candidates.find((candidate) => {
        if (!(candidate instanceof Element) || !candidate.matches('input[type="text"], textarea')) return false;
        if (candidate.disabled || candidate.readOnly || candidate.getClientRects().length === 0) return false;
        const style = getComputedStyle(candidate);
        return style.display !== "none" && style.visibility !== "hidden";
      }) ?? null;
    }

    #fieldEntries() {
      const page = this.#page();
      const players = [page.player1, page.player2, page.player3, page.player4].filter((player) => player?.username);
      const entries = [];
      const seen = new Set();
      const add = (card, controller, zone) => {
        if (!card || this.#cardData(card, "face_down")) return;
        const cardId = this.#cardId(card);
        const element = this.#cardElement(card);
        if (cardId === null || !(element instanceof Element) || seen.has(String(cardId))) return;
        const cardName = this.#cardName(card);
        if (!cardName) return;
        seen.add(String(cardId));
        entries.push({
          cardId: String(cardId),
          cardName,
          controller: String(controller ?? ""),
          zone,
          element,
          visualElement: this.#cardFrontElement(card) ?? element
        });
      };
      for (const player of players) {
        for (let zone = 1; zone <= 5; zone++) add(player[`m${zone}`], player.username, `M${zone}`);
        for (let zone = 1; zone <= 5; zone++) add(player[`s${zone}`], player.username, `S${zone}`);
        add(player.fieldSpell, player.username, "F");
      }
      for (const [card, zone] of [[page.linkLeft, "EL"], [page.linkRight, "ER"]]) {
        const controller = this.#cardData(card, "controller")?.username;
        add(card, controller, zone);
      }
      return entries;
    }

    #isCardBanished(cardId) {
      const page = this.#page();
      for (const player of [page.player1, page.player2, page.player3, page.player4]) {
        for (const card of player?.banished_arr ?? []) if (String(this.#cardId(card)) === String(cardId)) return true;
      }
      return false;
    }

    #page() { return typeof unsafeWindow !== "undefined" ? unsafeWindow : window; }
    #cardElement(card) { try { return card?.[0] ?? card?.get?.(0) ?? null; } catch { return null; } }
    #cardFrontElement(card) { try { return this.#cardElement(card?.data?.("cardfront")); } catch { return null; } }
    #cardId(card) { try { return card?.data?.("id") ?? null; } catch { return null; } }
    #cardData(card, key) { try { return card?.data?.(key) ?? null; } catch { return null; } }
    #cardName(card) { try { return String(card?.data?.("cardfront")?.data?.("name") ?? "").trim(); } catch { return ""; } }

    #showToast(message, error = false) {
      this.toast?.remove();
      const toast = document.createElement("div");
      toast.id = APP.ids.markerToast;
      if (error) toast.className = "yf-marker-error";
      toast.textContent = message;
      document.body.append(toast);
      this.toast = toast;
      setTimeout(() => { if (this.toast === toast) { toast.remove(); this.toast = null; } }, error ? 6500 : 4500);
    }

    #isVisible(element) {
      if (!(element instanceof HTMLElement) || element.hidden) return false;
      const style = getComputedStyle(element);
      return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0" && element.getClientRects().length > 0;
    }
  }
