  const LEAGUE_MATCH_DEFAULTS = Object.freeze({
    formatValue: "cu",
    formatLabel: "Custom Cards (Unrated)",
    matchTypeValue: "m",
    matchTypeLabel: "2 out of 3 Match",
    rulesValue: "*",
    rulesLabel: "TCG + OCG",
    duelNote: "YugiFAUX League Match - DM for info",
    allowWatching: true,
    expertMode: false,
    classicMode: false,
    tagDuel: false
  });

  function validateMatchIdentifier(value) {
    const identifier = String(value ?? "").replace(/\s+/g, " ").trim();
    if (!identifier) return { valid: false, error: "Enter the league match identifier." };
    if (identifier.length > 40) return { valid: false, error: "Use a match identifier of 40 characters or fewer." };
    if (!/^[A-Za-z0-9][A-Za-z0-9 ._#:/-]*$/.test(identifier)) {
      return { valid: false, error: "Use letters, numbers, spaces, or . _ # : / - in the match identifier." };
    }
    return { valid: true, identifier };
  }

  class MatchLauncher {
    constructor(diagnostics) {
      this.diagnostics = diagnostics;
      this.root = null;
      this.currentPlan = null;
    }

    open() {
      this.close();
      this.#renderSetup();
    }

    close() {
      this.root?.remove();
      this.root = null;
      this.currentPlan = null;
    }

    #createShell(titleText) {
      const root = document.createElement("div");
      root.id = APP.ids.launcher;
      root.setAttribute("role", "dialog");
      root.setAttribute("aria-modal", "true");
      root.setAttribute("aria-label", titleText);

      const card = document.createElement("section");
      card.className = "yf-launcher-card";
      const header = document.createElement("header");
      const title = document.createElement("h2");
      title.textContent = titleText;
      const close = document.createElement("button");
      close.type = "button";
      close.className = "yf-launcher-close";
      close.textContent = "×";
      close.setAttribute("aria-label", "Close match launcher");
      close.addEventListener("click", () => this.close());
      header.append(title, close);
      card.append(header);
      root.append(card);
      document.body.append(root);
      this.root = root;
      return card;
    }

    #renderSetup(errorMessage = "") {
      this.root?.remove();
      const card = this.#createShell("Start YugiFAUX Match");
      const intro = document.createElement("p");
      intro.className = "yf-launcher-intro";
      intro.textContent = "Prepare a league-approved Custom Cards match, then review everything before hosting.";

      const form = document.createElement("form");
      form.className = "yf-launcher-form";
      const identifierLabel = document.createElement("label");
      identifierLabel.textContent = "Match identifier";
      const identifier = document.createElement("input");
      identifier.type = "text";
      identifier.maxLength = 40;
      identifier.autocomplete = "off";
      identifier.placeholder = "Example: YF-2026-001";
      identifier.required = true;
      identifierLabel.append(identifier);

      const rulesLabel = document.createElement("label");
      rulesLabel.textContent = "Card pool rules";
      const rules = document.createElement("select");
      for (const [value, labelText] of [["*", "TCG + OCG"], ["TCG", "TCG"], ["OCG", "OCG"]]) {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = labelText;
        rules.append(option);
      }
      rules.value = LEAGUE_MATCH_DEFAULTS.rulesValue;
      rulesLabel.append(rules);

      const watching = this.#checkbox("Allow spectators", LEAGUE_MATCH_DEFAULTS.allowWatching);
      const expert = this.#checkbox("Expert mode", LEAGUE_MATCH_DEFAULTS.expertMode);

      const fixed = document.createElement("dl");
      fixed.className = "yf-launcher-summary";
      this.#appendSummary(fixed, "Format", LEAGUE_MATCH_DEFAULTS.formatLabel);
      this.#appendSummary(fixed, "Match type", LEAGUE_MATCH_DEFAULTS.matchTypeLabel);
      this.#appendSummary(fixed, "Duel note", LEAGUE_MATCH_DEFAULTS.duelNote);
      this.#appendSummary(fixed, "Password", "None");

      const error = document.createElement("p");
      error.className = "yf-launcher-error";
      error.hidden = !errorMessage;
      error.textContent = errorMessage;

      const actions = document.createElement("div");
      actions.className = "yf-launcher-actions";
      const cancel = document.createElement("button");
      cancel.type = "button";
      cancel.textContent = "Cancel";
      cancel.addEventListener("click", () => this.close());
      const review = document.createElement("button");
      review.type = "submit";
      review.className = "yf-primary";
      review.textContent = "Prepare & Review";
      actions.append(cancel, review);

      form.append(identifierLabel, rulesLabel, watching.label, expert.label, fixed, error, actions);
      card.append(intro, form);
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const result = validateMatchIdentifier(identifier.value);
        if (!result.valid) {
          error.hidden = false;
          error.textContent = result.error;
          identifier.focus();
          return;
        }

        review.disabled = true;
        review.textContent = "Preparing…";
        try {
          const plan = await this.#prepareDuelingBook({
            identifier: result.identifier,
            rulesValue: rules.value,
            rulesLabel: rules.selectedOptions[0]?.textContent?.trim() ?? rules.value,
            allowWatching: watching.input.checked,
            expertMode: expert.input.checked
          });
          this.currentPlan = plan;
          this.#renderReview(plan);
        } catch (launcherError) {
          error.hidden = false;
          error.textContent = String(launcherError?.message ?? launcherError);
          review.disabled = false;
          review.textContent = "Prepare & Review";
          this.diagnostics.warn("launcher", "match preparation stopped safely", { reason: error.textContent });
        }
      });
      queueMicrotask(() => identifier.focus());
    }

    #renderReview(plan) {
      this.root?.remove();
      const card = this.#createShell("Review YugiFAUX Match");
      const notice = document.createElement("p");
      notice.className = "yf-launcher-ready";
      notice.textContent = "DuelingBook is prepared. Confirm below to create the host room.";
      const summary = document.createElement("dl");
      summary.className = "yf-launcher-summary yf-launcher-review";
      this.#appendSummary(summary, "Match identifier", plan.identifier);
      this.#appendSummary(summary, "Deck", plan.deckName);
      this.#appendSummary(summary, "Format", LEAGUE_MATCH_DEFAULTS.formatLabel);
      this.#appendSummary(summary, "Match type", LEAGUE_MATCH_DEFAULTS.matchTypeLabel);
      this.#appendSummary(summary, "Rules", plan.rulesLabel);
      this.#appendSummary(summary, "Spectators", plan.allowWatching ? "Allowed" : "Not allowed");
      this.#appendSummary(summary, "Expert mode", plan.expertMode ? "On" : "Off");
      this.#appendSummary(summary, "Classic / Tag", "Off / Off");
      this.#appendSummary(summary, "Duel note", LEAGUE_MATCH_DEFAULTS.duelNote);
      this.#appendSummary(summary, "Password", "None");

      const error = document.createElement("p");
      error.className = "yf-launcher-error";
      error.hidden = true;
      const actions = document.createElement("div");
      actions.className = "yf-launcher-actions";
      const back = document.createElement("button");
      back.type = "button";
      back.textContent = "Back";
      back.addEventListener("click", () => this.#renderSetup());
      const confirm = document.createElement("button");
      confirm.type = "button";
      confirm.className = "yf-primary yf-confirm-host";
      confirm.textContent = "Confirm & Host";
      confirm.addEventListener("click", () => {
        confirm.disabled = true;
        try {
          const hostButton = this.#applyPlan(plan);
          this.diagnostics.info("launcher", "player confirmed league host action", {});
          hostButton.click();
          this.close();
        } catch (launcherError) {
          error.hidden = false;
          error.textContent = String(launcherError?.message ?? launcherError);
          confirm.disabled = false;
          this.diagnostics.warn("launcher", "confirmed host action stopped safely", { reason: error.textContent });
        }
      });
      actions.append(back, confirm);
      card.append(notice, summary, error, actions);
      queueMicrotask(() => confirm.focus());
    }

    async #prepareDuelingBook(options) {
      if (this.#isVisible(document.querySelector("#duel"))) {
        throw new Error("Finish or leave the current duel before starting a league match.");
      }
      if (this.#isVisible(document.querySelector("#hosting")) || this.#isVisible(document.querySelector("#joining"))) {
        throw new Error("Leave the current host or join request before starting another match.");
      }

      if (!this.#isVisible(document.querySelector("#duel_room"))) {
        const roomButton = document.querySelector("#room_btn");
        if (!this.#isVisible(roomButton)) {
          throw new Error("Log in to DuelingBook and return to the main menu first.");
        }
        roomButton.click();
        const opened = await this.#waitFor(() => this.#isVisible(document.querySelector("#duel_room")), 4500);
        if (!opened) throw new Error("DuelingBook did not open the Duel Room. Open it manually and try again.");
      }

      const plan = {
        ...options,
        deckName: this.#getSelectedDeck().label,
        deckValue: this.#getSelectedDeck().value
      };
      this.#applyPlan(plan);
      this.diagnostics.info("launcher", "league match settings prepared for review", {});
      return plan;
    }

    #applyPlan(plan) {
      if (!this.#isVisible(document.querySelector("#duel_room"))) {
        throw new Error("The Duel Room is no longer open.");
      }
      const selectedDeck = this.#getSelectedDeck();
      if (selectedDeck.value !== plan.deckValue) {
        throw new Error("The selected deck changed. Go back and review the match again.");
      }

      const host = document.querySelector("#host");
      if (!host) throw new Error("DuelingBook’s host controls are unavailable.");
      this.#setSelect(host.querySelector(".format_cb"), LEAGUE_MATCH_DEFAULTS.formatValue, "Custom Cards format");
      this.#setSelect(host.querySelector(".type_cb"), LEAGUE_MATCH_DEFAULTS.matchTypeValue, "2 out of 3 match type");
      this.#setSelect(host.querySelector(".rules_cb"), plan.rulesValue, "card pool rules");
      this.#setCheckbox(host.querySelector(".expert_cb"), plan.expertMode, "Expert mode");
      this.#setCheckbox(host.querySelector(".watching_cb"), plan.allowWatching, "spectator setting");
      this.#setCheckbox(host.querySelector(".classic_cb"), LEAGUE_MATCH_DEFAULTS.classicMode, "Classic mode");
      this.#setCheckbox(host.querySelector(".tag_duel_cb"), LEAGUE_MATCH_DEFAULTS.tagDuel, "Tag Duel mode");
      this.#setText(host.querySelector(".duel_note_txt"), LEAGUE_MATCH_DEFAULTS.duelNote, "duel note");
      this.#setText(host.querySelector(".duel_password_txt"), "", "room password");

      const hostButton = host.querySelector(".host_btn");
      if (!(hostButton instanceof HTMLElement) || hostButton.matches(":disabled")) {
        throw new Error("DuelingBook’s Host button is unavailable.");
      }
      return hostButton;
    }

    #getSelectedDeck() {
      const deck = document.querySelector("#decklist_cb");
      const option = deck?.selectedOptions?.[0];
      const value = String(option?.value ?? "").trim();
      const label = String(option?.textContent ?? "").replace(/\s+/g, " ").trim();
      if (!value || !label || option?.disabled) {
        throw new Error("Select a valid deck in DuelingBook before preparing the match.");
      }
      return { value, label };
    }

    #setSelect(control, value, label) {
      if (!(control instanceof HTMLSelectElement) || ![...control.options].some((option) => option.value === value)) {
        throw new Error(`DuelingBook no longer provides the required ${label}.`);
      }
      control.value = value;
      this.#dispatch(control, "input");
      this.#dispatch(control, "change");
    }

    #setCheckbox(control, checked, label) {
      if (!(control instanceof HTMLInputElement) || control.type !== "checkbox") {
        throw new Error(`DuelingBook no longer provides the required ${label}.`);
      }
      control.checked = Boolean(checked);
      this.#dispatch(control, "input");
      this.#dispatch(control, "change");
    }

    #setText(control, value, label) {
      if (!(control instanceof HTMLInputElement)) {
        throw new Error(`DuelingBook no longer provides the required ${label}.`);
      }
      control.value = value;
      this.#dispatch(control, "input");
      this.#dispatch(control, "change");
    }

    #dispatch(control, type) {
      control.dispatchEvent(new Event(type, { bubbles: true }));
    }

    #isVisible(element) {
      if (!(element instanceof HTMLElement) || element.hidden) return false;
      const style = getComputedStyle(element);
      return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0" && element.getClientRects().length > 0;
    }

    #waitFor(predicate, timeoutMs) {
      return new Promise((resolve) => {
        const started = Date.now();
        const check = () => {
          if (predicate()) return resolve(true);
          if (Date.now() - started >= timeoutMs) return resolve(false);
          setTimeout(check, 100);
        };
        check();
      });
    }

    #checkbox(labelText, checked) {
      const label = document.createElement("label");
      label.className = "yf-launcher-check";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = checked;
      label.append(input, document.createTextNode(labelText));
      return { label, input };
    }

    #appendSummary(list, termText, detailText) {
      const term = document.createElement("dt");
      term.textContent = termText;
      const detail = document.createElement("dd");
      detail.textContent = detailText;
      list.append(term, detail);
    }
  }
