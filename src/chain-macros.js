  const CHAIN_LINKS = Object.freeze([1, 2, 3, 4, 5, 6, 7, 8]);

  function chainLinkMessage(link) {
    return CHAIN_LINKS.includes(Number(link)) ? `⛓️ Chain Link ${Number(link)}` : "";
  }

  const CHAIN_MACRO_STYLE = `
    #${APP.ids.chainButton} { position: fixed; right: 14px; top: calc(50% + 49px); z-index: 2147483645; transform: translateY(-50%); border: 1px solid #f9a8d4; border-radius: 9px 0 0 9px; background: linear-gradient(145deg,#831843,#312e81); color: #fff1f2; padding: 11px 9px; writing-mode: vertical-rl; letter-spacing: .12em; font: 900 12px/1 Arial,sans-serif; box-shadow: 0 5px 20px #000a,0 0 16px #f472b644; cursor: pointer; }
    #${APP.ids.chainButton}[hidden] { display: none; }
    #${APP.ids.chainMenu} { position: fixed; right: 58px; top: 50%; z-index: 2147483646; width: 218px; transform: translateY(-50%); border: 1px solid #f9a8d4; border-radius: 12px; background: linear-gradient(145deg,#190b20f5,#172554f5); color: #fff; padding: 12px; box-shadow: 0 16px 44px #000d,0 0 24px #f472b633; font: 14px/1.3 Arial,sans-serif; }
    #${APP.ids.chainMenu}[hidden] { display: none; }
    #${APP.ids.chainMenu} strong { display: block; margin-bottom: 9px; color: #fce7f3; text-align: center; font-size: 16px; }
    #${APP.ids.chainMenu} .yf-chain-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    #${APP.ids.chainMenu} button { border: 1px solid #a78bfa; border-radius: 8px; background: linear-gradient(135deg,#4c1d95,#9d174d); color: #fff; padding: 9px 7px; cursor: pointer; font-weight: 850; }
    #${APP.ids.chainMenu} button:hover, #${APP.ids.chainMenu} button:focus-visible { border-color: #fbcfe8; filter: brightness(1.16); }
    #${APP.ids.chainToast} { position: fixed; right: 58px; top: calc(50% + 140px); z-index: 2147483647; width: min(330px,calc(100vw - 80px)); border: 1px solid #f9a8d4; border-radius: 9px; background: #500724ee; color: #fff1f2; padding: 10px 12px; text-align: center; font: 750 13px/1.35 Arial,sans-serif; box-shadow: 0 8px 24px #000c; }
    .duel_avatar > .yf-chain-flash { pointer-events: none; position: absolute; inset: 0; z-index: 9999; display: grid; place-items: center; color: #fff; font-size: 68px; line-height: 1; text-shadow: 0 0 7px #fff,0 0 17px #f472b6,0 0 30px #7c3aed; filter: drop-shadow(0 5px 5px #000b); animation: yf-chain-avatar-flash 1050ms ease-out both; }
    .duel_avatar > .yf-chain-flash.yf-chain-reduced { animation: yf-chain-avatar-fade 900ms ease-out both; }
    @keyframes yf-chain-avatar-flash { 0% { opacity: 0; transform: scale(.25) rotate(-25deg); } 22% { opacity: 1; transform: scale(1.24) rotate(8deg); } 45% { transform: scale(.92) rotate(-4deg); } 68% { opacity: 1; transform: scale(1.1) rotate(3deg); } 100% { opacity: 0; transform: scale(.72) rotate(0); } }
    @keyframes yf-chain-avatar-fade { 0%,100% { opacity: 0; } 20%,70% { opacity: 1; } }
    @media (max-width: 650px) { #${APP.ids.chainButton} { right: 4px; } #${APP.ids.chainMenu} { right: 48px; } }
  `;

  class ChainMacros {
    constructor(diagnostics, getSettings) {
      this.diagnostics = diagnostics;
      this.getSettings = getSettings;
      this.button = null;
      this.menu = null;
      this.toast = null;
      this.chatObserver = null;
      this.seenMessageIds = new Set();
      this.audioContext = null;
    }

    mount() {
      if (document.getElementById(APP.ids.chainButton)) return;
      const style = document.createElement("style");
      style.textContent = CHAIN_MACRO_STYLE;
      document.head.append(style);

      this.button = document.createElement("button");
      this.button.id = APP.ids.chainButton;
      this.button.type = "button";
      this.button.textContent = "CHAIN";
      this.button.title = "Open YugiFaux Chain messages";
      this.button.addEventListener("click", () => this.toggle());
      document.body.append(this.button);

      this.menu = document.createElement("section");
      this.menu.id = APP.ids.chainMenu;
      this.menu.hidden = true;
      this.menu.setAttribute("aria-label", "Chain messages");
      const title = document.createElement("strong");
      title.textContent = "⛓️ Declare Chain Link";
      const grid = document.createElement("div");
      grid.className = "yf-chain-grid";
      for (const link of CHAIN_LINKS) {
        const command = document.createElement("button");
        command.type = "button";
        command.textContent = `Chain Link ${link}`;
        command.addEventListener("click", () => this.#send(link));
        grid.append(command);
      }
      this.menu.append(title, grid);
      document.body.append(this.menu);

      document.addEventListener("pointerdown", () => this.#unlockAudio(), { capture: true });
      document.addEventListener("keydown", (event) => {
        this.#unlockAudio();
        if (event.key === "Escape") this.close();
      });
      this.#observeChat();
      setInterval(() => this.refresh(), 750);
      this.refresh();
    }

    refresh() {
      if (!this.button) return;
      const enabled = Boolean(this.getSettings()?.enabled);
      const inDuel = this.#isVisible(document.querySelector("#duel"));
      this.button.hidden = !enabled || !inDuel;
      if (this.button.hidden) this.close();
    }

    toggle() {
      if (!this.menu || this.button?.hidden) return;
      this.menu.hidden = !this.menu.hidden;
      this.button.setAttribute("aria-expanded", String(!this.menu.hidden));
    }

    close() {
      if (!this.menu) return;
      this.menu.hidden = true;
      this.button?.setAttribute("aria-expanded", "false");
    }

    #send(link) {
      const message = chainLinkMessage(link);
      const input = this.#findChatInput();
      if (!message || !input) {
        this.#showToast("DuelingBook’s duel chat is unavailable.");
        return;
      }
      if (input.value.trim()) {
        this.#showToast("Your chat box already contains text. Send or clear it before using a Chain message.");
        input.focus();
        return;
      }

      input.focus();
      input.value = message;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new KeyboardEvent("keydown", {
        key: "Enter",
        code: "Enter",
        keyCode: 13,
        which: 13,
        bubbles: true,
        cancelable: true
      }));
      this.close();
      setTimeout(() => {
        if (input.value !== message) return;
        this.#showToast("The message is ready in DuelingBook’s chat box. Press Enter to send it.");
        input.focus();
      }, 120);
      this.diagnostics.info("chain-macro", "player requested visible chain message", { link: Number(link) });
    }

    #findChatInput() {
      const selectors = [
        "#duel #cin_txt",
        "#duel .cin_txt",
        "#cin_txt",
        ".cin_txt"
      ];
      const candidates = [];
      for (const selector of selectors) {
        for (const candidate of document.querySelectorAll(selector)) {
          if (!candidates.includes(candidate)) candidates.push(candidate);
        }
      }
      return candidates.find((candidate) => this.#isUsableChatInput(candidate)) ?? null;
    }

    #isUsableChatInput(candidate) {
      if (!(candidate instanceof Element) || !candidate.matches('input[type="text"], textarea')) return false;
      if (candidate.disabled || candidate.readOnly || candidate.getClientRects().length === 0) return false;
      const style = getComputedStyle(candidate);
      // DuelingBook deliberately sets the native input's opacity to zero and
      // renders the visible white chat field through its custom UI layer.
      return style.display !== "none" && style.visibility !== "hidden";
    }

    #observeChat() {
      const chat = document.querySelector("#duel .cout_txt");
      if (!chat || this.chatObserver) return;
      for (const message of chat.querySelectorAll("font[message-id]")) {
        const id = message.getAttribute("message-id");
        if (id) this.#rememberMessage(id);
      }
      this.chatObserver = new MutationObserver((records) => {
        for (const record of records) for (const node of record.addedNodes) this.#inspectChatNode(node);
      });
      this.chatObserver.observe(chat, { childList: true, subtree: true });
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
        const message = messageElement.textContent.trim();
        if (!/^⛓️\s*Chain Link [1-8]$/iu.test(message)) continue;
        void this.#playChainSound();
        const username = row.querySelector("b font")?.textContent?.replace(/:\s*$/, "").trim();
        if (username) this.#flashAvatar(username);
      }
    }

    #getAudioContext() {
      if (this.audioContext) return this.audioContext;
      const AudioContextClass = globalThis.AudioContext ?? globalThis.webkitAudioContext;
      if (!AudioContextClass) return null;
      try { this.audioContext = new AudioContextClass(); } catch { this.audioContext = null; }
      return this.audioContext;
    }

    #unlockAudio() {
      const context = this.#getAudioContext();
      if (context?.state === "suspended") void context.resume().catch(() => {});
    }

    async #playChainSound() {
      if (this.getSettings()?.muted) return;
      try {
        const context = this.#getAudioContext();
        if (!context) return;
        if (context.state === "suspended") await context.resume();
        if (context.state !== "running") return;
        const start = context.currentTime + 0.01;
        const master = context.createGain();
        master.gain.setValueAtTime(0.0001, start);
        master.gain.exponentialRampToValueAtTime(0.13, start + 0.018);
        master.gain.exponentialRampToValueAtTime(0.0001, start + 0.42);
        master.connect(context.destination);

        [430, 690, 970].forEach((frequency, index) => {
          const oscillator = context.createOscillator();
          const strike = context.createGain();
          oscillator.type = index === 1 ? "square" : "triangle";
          oscillator.frequency.setValueAtTime(frequency, start);
          oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.72, start + 0.3);
          strike.gain.setValueAtTime(0.0001, start + index * 0.028);
          strike.gain.exponentialRampToValueAtTime(0.32 / (index + 1), start + 0.015 + index * 0.028);
          strike.gain.exponentialRampToValueAtTime(0.0001, start + 0.2 + index * 0.055);
          oscillator.connect(strike);
          strike.connect(master);
          oscillator.start(start + index * 0.028);
          oscillator.stop(start + 0.36 + index * 0.055);
        });

        const length = Math.max(1, Math.floor(context.sampleRate * 0.24));
        const buffer = context.createBuffer(1, length, context.sampleRate);
        const data = buffer.getChannelData(0);
        for (let index = 0; index < length; index++) data[index] = (Math.random() * 2 - 1) * Math.pow(1 - index / length, 2.6);
        const rattle = context.createBufferSource();
        const filter = context.createBiquadFilter();
        const rattleGain = context.createGain();
        rattle.buffer = buffer;
        filter.type = "bandpass";
        filter.frequency.value = 2400;
        filter.Q.value = 2.4;
        rattleGain.gain.value = 0.22;
        rattle.connect(filter);
        filter.connect(rattleGain);
        rattleGain.connect(master);
        rattle.start(start + 0.025);
        this.diagnostics.info("chain-sound", "synchronized chain sound played");
      } catch (error) {
        this.diagnostics.warn("chain-sound", "browser prevented chain sound", { reason: String(error?.message ?? error) });
      }
    }

    #rememberMessage(messageId) {
      this.seenMessageIds.add(String(messageId));
      if (this.seenMessageIds.size <= 150) return;
      this.seenMessageIds.delete(this.seenMessageIds.values().next().value);
    }

    #flashAvatar(username) {
      const normalized = username.trim().toLowerCase();
      let avatar = null;
      for (const candidate of document.querySelectorAll("#avatar1, #avatar2, #avatar3, #avatar4")) {
        const names = (candidate.querySelector(".username_txt")?.textContent ?? "")
          .split(/\s*(?:&|\/)\s*/)
          .map((name) => name.trim().toLowerCase());
        if (names.includes(normalized)) { avatar = candidate; break; }
      }
      if (!avatar) return;
      avatar.querySelector(":scope > .yf-chain-flash")?.remove();
      const flash = document.createElement("div");
      flash.className = "yf-chain-flash";
      if (this.getSettings()?.reducedMotion) flash.classList.add("yf-chain-reduced");
      flash.textContent = "⛓️";
      avatar.append(flash);
      flash.addEventListener("animationend", () => flash.remove(), { once: true });
      setTimeout(() => flash.remove(), 1400);
    }

    #showToast(message) {
      this.toast?.remove();
      this.toast = document.createElement("div");
      this.toast.id = APP.ids.chainToast;
      this.toast.textContent = message;
      document.body.append(this.toast);
      const current = this.toast;
      setTimeout(() => { if (this.toast === current) { current.remove(); this.toast = null; } }, 5200);
    }

    #isVisible(element) {
      if (!(element instanceof HTMLElement) || element.hidden) return false;
      const style = getComputedStyle(element);
      return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0" && element.getClientRects().length > 0;
    }
  }
