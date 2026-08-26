  const BLOOM_TOKEN_VARIANTS = Object.freeze([
    { carrierId: 1, artworkUrl: "https://res.cloudinary.com/vosvpv50/image/upload/v1787780580/Gemini_Generated_Image_npq6r3npq6r3npq6.jpg" },
    { carrierId: 2, artworkUrl: "https://res.cloudinary.com/vosvpv50/image/upload/v1787780580/a09bf7c0-4288-40d2-8ad6-7c5ebb873de2.jpg" },
    { carrierId: 3, artworkUrl: "https://res.cloudinary.com/vosvpv50/image/upload/v1787780580/579d4b8b-bafb-4723-88d0-f1c93aef848f.jpg" },
    { carrierId: 4, artworkUrl: "https://res.cloudinary.com/vosvpv50/image/upload/v1787780580/efe88690-bf51-48de-b6bb-dadef3a12dc8.jpg" },
    { carrierId: 5, artworkUrl: "https://res.cloudinary.com/vosvpv50/image/upload/v1787780580/042b472f-6020-4abf-beab-404575dc9201.jpg" },
    { carrierId: 6, artworkUrl: "https://res.cloudinary.com/vosvpv50/image/upload/v1787780941/cbfc5a0e-3546-4951-82e0-47515b6903b4.jpg" }
  ]);

  const TOKEN_RECIPES = Object.freeze([
    Object.freeze({
      id: "polyflora-hexbloom-bloom-token",
      sourceName: "Polyflora Hexbloom",
      sourceArtworkUrl: "https://res.cloudinary.com/vosvpv50/image/upload/v1787780606/Gemini_Generated_Image_b597fgb597fgb597_1.png",
      effectText: "During your Main Phase: You can send 1 Spell/Trap from your Deck to your GY; Special Summon 2 \"Bloom Token\" (Plant/WIND/Level 2/ATK 0/DEF 0) in Defense Position.",
      token: Object.freeze({ name: "Bloom Token", level: 2, attribute: "WIND", monsterType: "Plant", atk: 0, def: 0, position: "Defense" }),
      count: 2,
      variants: BLOOM_TOKEN_VARIANTS
    })
  ]);

  const TOKEN_MACRO_STYLE = `
    #${APP.ids.tokenButton} { position: fixed; right: 14px; top: 50%; z-index: 2147483645; transform: translateY(-50%); border: 1px solid #86efac; border-radius: 9px 0 0 9px; background: linear-gradient(145deg,#064e3b,#312e81); color: #f0fdf4; padding: 11px 9px; writing-mode: vertical-rl; letter-spacing: .12em; font: 900 12px/1 Arial,sans-serif; box-shadow: 0 5px 20px #000a,0 0 16px #86efac44; cursor: pointer; }
    #${APP.ids.tokenButton}[hidden] { display: none; }
    #${APP.ids.tokenButton}:disabled { cursor: wait; opacity: .65; }
    #${APP.ids.tokenModal} { position: fixed; inset: 0; z-index: 2147483647; display: grid; place-items: center; box-sizing: border-box; padding: 18px; background: #020617bd; color: #f8fafc; font: 14px/1.45 Arial,sans-serif; }
    #${APP.ids.tokenModal} * { box-sizing: border-box; }
    #${APP.ids.tokenModal} .yf-token-dialog { width: min(720px,calc(100vw - 32px)); max-height: calc(100vh - 32px); overflow: auto; border: 1px solid #86efac; border-radius: 15px; padding: 18px; background: linear-gradient(145deg,#061b17fa,#172554fa 58%,#3b1750fa); box-shadow: 0 24px 80px #000e,0 0 32px #86efac33; }
    #${APP.ids.tokenModal} header { display: flex; align-items: center; justify-content: space-between; gap: 12px; border-bottom: 1px solid #86efac55; padding-bottom: 10px; }
    #${APP.ids.tokenModal} h2 { margin: 0; color: #ecfdf5; font-family: Georgia,serif; }
    #${APP.ids.tokenModal} p { color: #dbeafe; }
    #${APP.ids.tokenModal} button { border: 1px solid #64748b; border-radius: 8px; background: #1e293b; color: #fff; padding: 9px 13px; cursor: pointer; font-weight: 750; }
    #${APP.ids.tokenModal} button:disabled { cursor: wait; opacity: .62; }
    #${APP.ids.tokenModal} .yf-token-close { border: 0; background: transparent; padding: 1px 7px; color: #cbd5e1; font-size: 28px; line-height: 1; }
    #${APP.ids.tokenModal} .yf-token-gallery { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 11px; margin-top: 16px; }
    #${APP.ids.tokenModal} .yf-token-source { display: grid; align-content: start; gap: 7px; width: 100%; min-width: 0; border-color: #86efac88; padding: 7px; text-align: left; background: linear-gradient(145deg,#064e3b99,#312e8199); }
    #${APP.ids.tokenModal} .yf-token-source img { width: 100%; aspect-ratio: 1; border-radius: 6px; object-fit: cover; object-position: center 32%; box-shadow: 0 5px 13px #0009; }
    #${APP.ids.tokenModal} .yf-token-source strong { display: block; min-width: 0; overflow-wrap: anywhere; color: #f0fdf4; font-size: 12px; line-height: 1.2; }
    #${APP.ids.tokenModal} .yf-token-pair { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin: 16px 0; }
    #${APP.ids.tokenModal} .yf-token-preview { overflow: hidden; border: 1px solid #86efac88; border-radius: 11px; background: #0f172a; }
    #${APP.ids.tokenModal} .yf-token-preview img { display: block; width: 100%; aspect-ratio: 1; object-fit: cover; }
    #${APP.ids.tokenModal} .yf-token-preview span { display: block; padding: 9px; color: #dcfce7; text-align: center; font-weight: 800; }
    #${APP.ids.tokenModal} .yf-token-details { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; margin: 12px 0; }
    #${APP.ids.tokenModal} .yf-token-details div { border: 1px solid #334155; border-radius: 7px; background: #0f172aaa; padding: 8px; color: #e2e8f0; text-align: center; }
    #${APP.ids.tokenModal} .yf-token-notice { border: 1px solid #facc1566; border-radius: 8px; background: #713f123d; padding: 10px; color: #fef3c7; }
    #${APP.ids.tokenModal} .yf-token-actions { display: flex; justify-content: flex-end; gap: 9px; margin-top: 15px; }
    #${APP.ids.tokenModal} .yf-token-primary { border-color: #bbf7d0; background: linear-gradient(135deg,#047857,#4338ca); }
    #${APP.ids.tokenToast} { position: fixed; left: 50%; top: 18px; z-index: 2147483647; width: min(520px,calc(100vw - 32px)); transform: translateX(-50%); border: 1px solid #86efac; border-radius: 9px; background: #052e2bec; color: #ecfdf5; padding: 12px 16px; text-align: center; font: 800 14px/1.4 Arial,sans-serif; box-shadow: 0 10px 28px #000c; }
    #${APP.ids.tokenToast}.yf-token-error { border-color: #f87171; background: #450a0aec; color: #fee2e2; }
    @media (max-width: 650px) { #${APP.ids.tokenButton} { right: 4px; } #${APP.ids.tokenModal} .yf-token-gallery { grid-template-columns: repeat(2,minmax(0,1fr)); } #${APP.ids.tokenModal} .yf-token-pair { grid-template-columns: 1fr; } #${APP.ids.tokenModal} .yf-token-details { grid-template-columns: 1fr 1fr; } }
  `;

  function chooseDistinctTokenVariants(variants, count, random = Math.random) {
    if (!Array.isArray(variants) || variants.length < count || count < 1) return [];
    const pool = [...variants];
    const chosen = [];
    while (chosen.length < count) {
      const index = Math.min(pool.length - 1, Math.max(0, Math.floor(random() * pool.length)));
      chosen.push(pool.splice(index, 1)[0]);
    }
    return chosen;
  }

  function tokenCarrierFromUrl(value) {
    const match = String(value ?? "").match(/images\.duelingbook\.com\/(?:card-)?tokens\/(\d+)\.jpg(?:[?#]|$)/i);
    return match ? Number(match[1]) : null;
  }

  class TokenMacros {
    constructor(diagnostics, getSettings) {
      this.diagnostics = diagnostics;
      this.getSettings = getSettings;
      this.button = null;
      this.modal = null;
      this.toast = null;
      this.active = false;
      this.drafts = new Map();
      this.variantByCarrier = new Map();
      this.previewTimer = null;
      for (const recipe of TOKEN_RECIPES) for (const variant of recipe.variants) this.variantByCarrier.set(variant.carrierId, { recipe, variant });
    }

    mount() {
      if (document.getElementById(APP.ids.tokenButton)) return;
      const style = document.createElement("style");
      style.textContent = TOKEN_MACRO_STYLE;
      document.head.append(style);
      this.button = document.createElement("button");
      this.button.id = APP.ids.tokenButton;
      this.button.type = "button";
      this.button.textContent = "TOKENS";
      this.button.title = "Open YugiFaux Token macros";
      this.button.addEventListener("click", () => this.open());
      document.body.append(this.button);
      const observer = new MutationObserver((records) => this.#observeTokenChanges(records));
      observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["src"] });
      document.addEventListener("mouseover", (event) => this.#handleFieldPreviewRequest(event), true);
      document.addEventListener("click", (event) => this.#handleFieldPreviewRequest(event), true);
      this.#scanForTokenCarriers(document);
      setInterval(() => this.refresh(), 750);
      this.refresh();
    }

    refresh() {
      if (!this.button) return;
      const enabled = Boolean(this.getSettings()?.enabled);
      this.button.hidden = !enabled || !this.#isVisible(document.querySelector("#duel"));
      this.button.disabled = this.active;
    }

    close() {
      this.modal?.remove();
      this.modal = null;
    }

    open() {
      if (this.active) return;
      if (!this.getSettings()?.enabled || !this.#isVisible(document.querySelector("#duel"))) return this.#showToast("Enter an active duel before using Token macros.", true);
      this.#renderGallery();
    }

    #renderGallery() {
      this.close();
      this.modal = this.#createModal("Summon Tokens");
      const intro = document.createElement("p");
      intro.textContent = "Choose the card whose effect is summoning the Tokens.";
      const gallery = document.createElement("div");
      gallery.className = "yf-token-gallery";
      for (const recipe of TOKEN_RECIPES) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "yf-token-source";
        const image = document.createElement("img");
        image.src = recipe.sourceArtworkUrl;
        image.alt = recipe.sourceName;
        const name = document.createElement("strong");
        name.textContent = recipe.sourceName;
        button.append(image, name);
        button.addEventListener("click", () => this.#renderRecipe(recipe));
        gallery.append(button);
      }
      this.modal.querySelector(".yf-token-dialog").append(intro, gallery);
    }

    #renderRecipe(recipe) {
      const chosen = this.drafts.get(recipe.id) ?? chooseDistinctTokenVariants(recipe.variants, recipe.count);
      this.drafts.set(recipe.id, chosen);
      this.close();
      this.modal = this.#createModal(recipe.sourceName);
      const card = this.modal.querySelector(".yf-token-dialog");
      const effect = document.createElement("p");
      effect.textContent = recipe.effectText;
      const pair = document.createElement("div");
      pair.className = "yf-token-pair";
      chosen.forEach((variant, index) => {
        const preview = document.createElement("div");
        preview.className = "yf-token-preview";
        const image = document.createElement("img");
        image.src = variant.artworkUrl;
        image.alt = `${recipe.token.name} artwork ${index + 1}`;
        const label = document.createElement("span");
        label.textContent = `${recipe.token.name} ${index + 1}`;
        preview.append(image, label);
        pair.append(preview);
      });
      const details = document.createElement("div");
      details.className = "yf-token-details";
      for (const value of [`Level ${recipe.token.level}`, recipe.token.attribute, recipe.token.monsterType, `${recipe.token.atk} ATK`, `${recipe.token.def} DEF`, `${recipe.token.position} Position`]) {
        const item = document.createElement("div");
        item.textContent = value;
        details.append(item);
      }
      const notice = document.createElement("p");
      notice.className = "yf-token-notice";
      notice.textContent = "After confirmation, DuelingBook will highlight your open Monster Zones twice. Click one zone for each Token. The summon is cancelled unless two zones are available.";
      const actions = document.createElement("div");
      actions.className = "yf-token-actions";
      const back = document.createElement("button");
      back.type = "button";
      back.textContent = "Back";
      back.addEventListener("click", () => this.#renderGallery());
      const confirm = document.createElement("button");
      confirm.type = "button";
      confirm.className = "yf-token-primary";
      confirm.textContent = `Confirm & Summon ${recipe.count}`;
      confirm.addEventListener("click", () => this.#runRecipe(recipe, chosen));
      actions.append(back, confirm);
      card.append(effect, pair, details, notice, actions);
    }

    #createModal(titleText) {
      const root = document.createElement("section");
      root.id = APP.ids.tokenModal;
      root.setAttribute("role", "dialog");
      root.setAttribute("aria-modal", "true");
      root.setAttribute("aria-label", titleText);
      const card = document.createElement("div");
      card.className = "yf-token-dialog";
      const header = document.createElement("header");
      const title = document.createElement("h2");
      title.textContent = titleText;
      const close = document.createElement("button");
      close.type = "button";
      close.className = "yf-token-close";
      close.setAttribute("aria-label", "Close Token macros");
      close.textContent = "×";
      close.addEventListener("click", () => this.close());
      header.append(title, close);
      card.append(header);
      root.append(card);
      root.addEventListener("click", (event) => { if (event.target === root) this.close(); });
      document.body.append(root);
      queueMicrotask(() => close.focus());
      return root;
    }

    async #runRecipe(recipe, chosen) {
      if (this.active) return;
      this.active = true;
      this.close();
      this.refresh();
      try {
        const chooseZones = document.querySelector("#choose_zones_cb");
        if (!(chooseZones instanceof HTMLInputElement)) throw new Error("DuelingBook’s Choose Zones control is unavailable.");
        if (!chooseZones.checked) {
          chooseZones.checked = true;
          chooseZones.dispatchEvent(new Event("change", { bubbles: true }));
        }
        for (let index = 0; index < chosen.length; index++) {
          const variant = chosen[index];
          const added = this.#waitForNewCarrier(variant.carrierId, 30000);
          void added.catch(() => {});
          await this.#beginNativeTokenSummon(variant.carrierId, chosen.length - index);
          this.#showToast(`Choose an open Monster Zone for ${recipe.token.name} ${index + 1} of ${chosen.length}.`);
          await added;
          await this.#waitFor(() => !this.#visibleZoneSelectors().length, 5000);
          if (index + 1 < chosen.length) await this.#delay(1050);
        }
        this.drafts.delete(recipe.id);
        this.#showToast(`${recipe.count} ${recipe.token.name}s summoned with YugiFaux artwork.`);
        this.diagnostics.info("token-macro", "token recipe completed", { recipe: recipe.id, count: recipe.count });
      } catch (error) {
        this.#cancelNativeSelection();
        this.#showToast(String(error?.message ?? error), true);
        this.diagnostics.warn("token-macro", "token recipe stopped safely", { reason: String(error?.message ?? error) });
      } finally {
        this.active = false;
        this.refresh();
      }
    }

    async #beginNativeTokenSummon(carrierId, requiredOpenZones) {
      const nativeButton = document.querySelector("#duel .token_btn");
      if (!this.#isVisible(nativeButton)) throw new Error("DuelingBook’s native Token button is unavailable.");
      nativeButton.dispatchEvent(new MouseEvent("dblclick", { bubbles: true, cancelable: true }));
      if (!await this.#waitFor(() => this.#isVisible(document.querySelector("#token_select")), 4000)) throw new Error("DuelingBook did not open its native Token selector.");
      if (!await this.#waitFor(() => this.#findCarrierThumbnail(carrierId), 4000)) throw new Error(`DuelingBook Token carrier ${carrierId} is unavailable.`);
      this.#findCarrierThumbnail(carrierId).click();
      if (!await this.#waitFor(() => this.#visibleZoneSelectors().length > 0, 4000)) throw new Error("DuelingBook did not offer an open Monster Zone.");
      if (this.#visibleZoneSelectors().length < requiredOpenZones) throw new Error(`This effect requires ${requiredOpenZones} open Monster Zones.`);
    }

    #findCarrierThumbnail(carrierId) {
      for (const image of document.querySelectorAll("#token_select .thumbnail img")) if (tokenCarrierFromUrl(image.src) === carrierId) return image.closest(".thumbnail");
      return null;
    }

    #visibleZoneSelectors() {
      return [1, 2, 3, 4, 5].map((zone) => document.getElementById(`m${zone}_select`)).filter((element) => this.#isVisible(element));
    }

    #cancelNativeSelection() {
      const cancel = document.querySelector("#duel .cancel_btn");
      if (this.#isVisible(cancel)) cancel.click();
      const tokenSelect = document.querySelector("#token_select");
      if (this.#isVisible(tokenSelect)) tokenSelect.querySelector(".exit_btn")?.click();
    }

    #waitForNewCarrier(carrierId, timeoutMs) {
      return new Promise((resolve, reject) => {
        const field = document.querySelector("#field");
        if (!field) return reject(new Error("DuelingBook’s field is unavailable."));
        let timer;
        const observer = new MutationObserver((records) => {
          for (const record of records) for (const node of record.addedNodes) {
            if (!(node instanceof Element)) continue;
            const card = this.#findCarrierCard(node, carrierId);
            if (!card) continue;
            clearTimeout(timer);
            observer.disconnect();
            this.#applyTokenSkin(card, this.variantByCarrier.get(carrierId));
            resolve(card);
            return;
          }
        });
        observer.observe(field, { childList: true, subtree: true });
        timer = setTimeout(() => { observer.disconnect(); reject(new Error("Token summon timed out or was cancelled.")); }, timeoutMs);
      });
    }

    #findCarrierCard(root, carrierId) {
      const cards = [];
      if (root.matches?.(".card")) cards.push(root);
      cards.push(...(root.querySelectorAll?.(".card") ?? []));
      return cards.find((card) => Number(card.dataset.yfTokenCarrier ?? 0) === carrierId || [...card.querySelectorAll("img")].some((image) => tokenCarrierFromUrl(image.src) === carrierId)) ?? null;
    }

    #observeTokenChanges(records) {
      for (const record of records) {
        if (record.type === "attributes") {
          const card = record.target.closest?.(".card");
          const carrierId = Number(card?.dataset?.yfTokenCarrier ?? 0);
          if (carrierId && this.variantByCarrier.has(carrierId)) this.#applyTokenSkin(card, this.variantByCarrier.get(carrierId));
          else this.#scanForTokenCarriers(record.target);
        } else {
          for (const node of record.addedNodes) if (node instanceof Element) this.#scanForTokenCarriers(node);
        }
      }
    }

    #scanForTokenCarriers(root) {
      const images = [];
      if (root.matches?.("#field .card img")) images.push(root);
      images.push(...(root.querySelectorAll?.("#field .card img") ?? []));
      for (const image of images) {
        const carrierId = tokenCarrierFromUrl(image.src);
        const definition = this.variantByCarrier.get(carrierId);
        const card = image.closest(".card");
        if (definition && card) this.#applyTokenSkin(card, definition);
      }
    }

    #applyTokenSkin(card, definition) {
      if (!card || !definition) return;
      const { recipe, variant } = definition;
      card.dataset.yfTokenCarrier = String(variant.carrierId);
      card.dataset.yfTokenRecipe = recipe.id;
      const art = card.querySelector("img.image") ?? [...card.querySelectorAll("img")].find((image) => tokenCarrierFromUrl(image.src) !== null) ?? card.querySelector("img");
      if (art && art.src !== variant.artworkUrl) art.src = variant.artworkUrl;
      card.title = `${recipe.token.name} — ${recipe.token.monsterType}/${recipe.token.attribute}/Level ${recipe.token.level} — ATK ${recipe.token.atk}/DEF ${recipe.token.def}`;
      card.querySelector(":scope > .yf-token-badge")?.remove();
    }

    #handleFieldPreviewRequest(event) {
      const card = event.target?.closest?.(".card");
      if (!card) return;
      const definition = this.variantByCarrier.get(Number(card.dataset.yfTokenCarrier ?? 0));
      clearTimeout(this.previewTimer);
      if (!definition) {
        document.getElementById("preview_txt")?.classList.remove("yf-token-preview-details");
        return;
      }
      // Let DuelingBook populate its normal preview first, then replace only its presentation.
      this.previewTimer = setTimeout(() => this.#showTokenInNativePreview(definition), 35);
    }

    #showTokenInNativePreview(definition) {
      const preview = document.getElementById("preview");
      const details = document.getElementById("preview_txt");
      if (!preview || !details || !definition) return;
      const { recipe, variant } = definition;
      const token = recipe.token;
      const artwork = preview.querySelector("img.image, .image img");
      if (artwork instanceof HTMLImageElement) artwork.src = variant.artworkUrl;
      for (const name of preview.querySelectorAll(".name_txt, .name2_txt")) name.textContent = token.name;
      for (const type of preview.querySelectorAll(".type_txt")) type.textContent = `[${token.monsterType.toUpperCase()} / TOKEN]`;
      for (const attack of preview.querySelectorAll(".atk_txt")) attack.textContent = String(token.atk);
      for (const defense of preview.querySelectorAll(".def_txt")) defense.textContent = String(token.def);
      for (const effect of preview.querySelectorAll(".effect_txt")) effect.textContent = `This Token was Special Summoned by ${recipe.sourceName}.`;

      details.classList.remove("yf-token-preview-details");
      details.replaceChildren();
      const lines = [
        token.name,
        `${token.attribute} • ${token.monsterType} / Token • Level ${token.level}`,
        `ATK ${token.atk} / DEF ${token.def} • ${token.position} Position`,
        `Special Summoned by ${recipe.sourceName}.`
      ];
      lines.forEach((line, index) => {
        details.append(document.createTextNode(line));
        if (index + 1 < lines.length) details.append(document.createElement("br"));
      });
    }

    #showToast(message, error = false) {
      this.toast?.remove();
      this.toast = document.createElement("div");
      this.toast.id = APP.ids.tokenToast;
      this.toast.className = error ? "yf-token-error" : "";
      this.toast.textContent = message;
      document.body.append(this.toast);
      const current = this.toast;
      setTimeout(() => { if (this.toast === current) { current.remove(); this.toast = null; } }, error ? 6500 : 4200);
    }

    #waitFor(predicate, timeoutMs) {
      return new Promise((resolve) => {
        const started = Date.now();
        const check = () => {
          let value = null;
          try { value = predicate(); } catch { value = null; }
          if (value) return resolve(value);
          if (Date.now() - started >= timeoutMs) return resolve(null);
          setTimeout(check, 100);
        };
        check();
      });
    }

    #delay(milliseconds) { return new Promise((resolve) => setTimeout(resolve, milliseconds)); }

    #isVisible(element) {
      if (!(element instanceof HTMLElement) || element.hidden) return false;
      const style = getComputedStyle(element);
      return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0" && element.getClientRects().length > 0;
    }
  }
