  const CHAIN_LINKS = Object.freeze([1, 2, 3, 4, 5, 6, 7, 8]);
  const CHAIN_SOUND_DATA_URL = "data:audio/mpeg;base64,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wxrik6i7oqCq0+2ug4JjqejoNAVjlzmLfbBFYg/bGodcFhDmF5HUTrc6Kx6MKmalTP4ttJ4LgJouO/cLyWmjZlPzFmH44qo8Sg7JE4RGApxUahD7avq78ORibu5RONLddXJXbT38UAW7G325Fqr6QI+kjvS+Lxixd7SHhcIASUBwkU26LdSTd104egOMww9BUVS6UDeVMe5SWKPb0pfpev3Q5peo1LMWKl0nAF2VKGcF3H0TEdpUk5DrqUcxc1P41HcgR64pN3c6WGZd+VvU7lZaYzeDpE+TW5i5hYnJ6kjd/7sv7rHv////////////////////////////////4/SYVwyvzda+Z6N6EXAwBAMBAMDA0SQ4VwTFSErDs1Mt81mB5VKQumj8dWpoAraAwYONLZFgGo8j+nikVAIOLiwtK1HqVM4cBeifc9CVntinYhF2MS2MrIewvIxAvm98VrYsSfOfa4juVQANCI2uXA7rydW9Gy/fmMZfMIIG7JXqWJQioRcEoaBJ2SwC48ORiV18t0ytLBa661rvwmIx2bbtWc+bfSDnQkV6fgeWYXeWDgPBEJKoJcxd90FwCwOHZLFn3kLocITKYyc72J71KTC3XfUtWia49LbSFT6UgnSnkX4EaVuCmBbBxFSQ0uyEQl1JfYran6uEORRhMCXZLQyl2ZF2mkeEhuUq6Fa4RB7UGHvpKLFicnrETt///DFm3/////////////////////////////////00Y+vM5f6rq4dVNQADTSQ+VrMQI+gSUNRRTVcpEFYRkTFJLH4ecV2zQIC7W1Zu8DF74xX53nECDvLZakONAUafxeFXD+C1UcKs/a32r/Ueyv1mXGzz1b3k1v414kGLrXtiySCPCWJLJd+knGLFtXMOK4y2tSBjXza9IO9Z09pl5e+6wmSG2u6LSoQA+xtYe4mfysWmiVnck43v41H9Xbg7bLuUTcB9i+I1X7JLS9HL1s9j29Z8qcDia0rhZP9V1cOyJEAEAIPoToxgFhTiIkxFxGKdQnpKDeMRvb1chLtmYIks8Tw6Yv3mHurz58CDarZakPdGdjtfFferd4lY/lhav9Xs/1802t6tiG2a3v67yDB1q08m2oW4pjhtd+3OotbZrDixZd2xjf+d7pX6+q4zS991hMkNrc6LUywX8rbVtM/zC045c3zBDjz0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";

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
      this.chainAudio = null;
      this.audioUnlocked = false;
      this.unlockingAudio = false;
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

    #getChainAudio() {
      if (this.chainAudio) return this.chainAudio;
      try {
        this.chainAudio = new Audio(CHAIN_SOUND_DATA_URL);
        this.chainAudio.preload = "auto";
        this.chainAudio.volume = 0.85;
      } catch {
        this.chainAudio = null;
      }
      return this.chainAudio;
    }

    #unlockAudio() {
      if (this.audioUnlocked || this.unlockingAudio) return;
      const audio = this.#getChainAudio();
      if (!audio) return;
      this.unlockingAudio = true;
      const previousVolume = audio.volume;
      audio.volume = 0;
      const attempt = audio.play();
      if (!attempt?.then) {
        audio.pause();
        audio.currentTime = 0;
        audio.volume = previousVolume;
        this.audioUnlocked = true;
        this.unlockingAudio = false;
        return;
      }
      void attempt.then(() => {
        audio.pause();
        audio.currentTime = 0;
        audio.volume = previousVolume;
        this.audioUnlocked = true;
      }).catch(() => {
        audio.volume = previousVolume;
      }).finally(() => { this.unlockingAudio = false; });
    }

    async #playChainSound() {
      if (this.getSettings()?.muted) return;
      try {
        const audio = this.#getChainAudio();
        if (!audio) return;
        audio.pause();
        audio.currentTime = 0;
        audio.volume = 0.85;
        await audio.play();
        this.audioUnlocked = true;
        this.diagnostics.info("chain-sound", "recorded synchronized chain sound played");
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
