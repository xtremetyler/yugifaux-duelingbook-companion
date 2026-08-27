  const DEFAULT_CUSTOM_MACROS = `-- General
Good Luck | Good luck, have fun.
Thinking | Thinking...`;

  const CUSTOM_MACRO_FUNCTIONS = Object.freeze([
    "addFromDeckToHand", "sendFromDeckToGY",
    "specialFromHandInAtk", "specialFromHandInDef", "specialFromHandInAtkRandomZone", "specialFromHandInDefRandomZone", "specialFromHandInAtkToZone", "specialFromHandInDefToZone",
    "specialFromDeckInAtk", "specialFromDeckInDef", "specialFromDeckInAtkRandomZone", "specialFromDeckInDefRandomZone", "specialFromDeckInAtkToZone", "specialFromDeckInDefToZone",
    "specialFromExtraDeckInAtk", "specialFromExtraDeckInDef", "specialFromExtraDeckInAtkRandomZone", "specialFromExtraDeckInDefRandomZone", "specialFromExtraDeckInAtkToZone", "specialFromExtraDeckInDefToZone", "sendFromExtraDeckToGY",
    "specialSummonToken", "specialSummonTokenToZone", "specialSummonMultipleTokens",
    "sendAllControllingMonstersFromFieldToGY", "sendAllOwnSpellTrapsFromFieldToGY", "sendFromFieldToGY",
    "banishFromGY", "banishFromHand", "banishFromDeck", "activateSpellTrapFromDeck", "activateSpellTrapFromDeckToZone",
    "specialFromGYInAtk", "specialFromGYInDef", "specialFromGYInAtkRandomZone", "specialFromGYInDefRandomZone", "specialFromGYInAtkToZone", "specialFromGYInDefToZone",
    "discard", "addFromGYToHand", "fromBanishToTopOfDeck", "fromGYToTopOfDeck", "fromFieldToTopOfDeck", "returnAllFromHandToTopOfDeck", "shuffleDeck",
    "moveZone", "overlayMonsters", "flipDownMonsters", "flipUpMonsters", "changeToAtk", "changeToDef",
    "normalSetToRandomZone", "normalSetToZone", "normalSummonToRandomZone", "normalSummonToZone",
    "addCountersToCards", "removeCountersFromCards", "setCardsFromDeckToSpellTrapZone",
    "banishCardsFromTopOfDeckFD", "returnRandomBanishedCardToHand", "waitInMs"
  ]);
  const CUSTOM_MACRO_FUNCTION_SET = new Set(CUSTOM_MACRO_FUNCTIONS);
  const CUSTOM_MACRO_VARIABLES = Object.freeze([
    "currentLP", "halfOfLP", "topUsername", "botUsername",
    "atkAllMonsters", "defAllMonsters", "atkAllFaceUpMonsters", "defAllFaceUpMonsters"
  ]);

  function parseCustomMacroAction(value) {
    const text = String(value ?? "").trim();
    const match = text.match(/^\$\{([A-Za-z][A-Za-z0-9]*)\((.*)\)\}$/s);
    return match ? { type: "function", name: match[1], param: match[2].trim(), raw: text } : { type: "message", text };
  }

  function parseCustomMacroDefinitions(source) {
    const text = String(source ?? "");
    const errors = [];
    const groups = [];
    let group = { name: "Macros", macros: [] };
    groups.push(group);
    if (text.length > 30000) errors.push("Macro definitions must be 30,000 characters or fewer.");
    const lines = text.split(/\r?\n/);
    for (let index = 0; index < lines.length; index++) {
      const raw = lines[index].trim();
      if (!raw) continue;
      if (raw.startsWith("--")) {
        const name = raw.slice(2).trim();
        if (!name) errors.push(`Line ${index + 1}: category name is missing.`);
        else {
          group = { name: name.slice(0, 50), macros: [] };
          groups.push(group);
        }
        continue;
      }
      const parts = raw.split("|");
      if (parts.length < 2) {
        errors.push(`Line ${index + 1}: expected Button Name | action.`);
        continue;
      }
      const label = parts.shift().trim();
      const actions = parts.map(parseCustomMacroAction).filter((action) => action.type === "function" || action.text);
      if (!label) errors.push(`Line ${index + 1}: button name is missing.`);
      if (label.length > 50) errors.push(`Line ${index + 1}: button name must be 50 characters or fewer.`);
      if (!actions.length) errors.push(`Line ${index + 1}: macro has no actions.`);
      if (actions.length > 20) errors.push(`Line ${index + 1}: a macro can contain at most 20 actions.`);
      for (const action of actions) {
        if (action.type === "function" && !CUSTOM_MACRO_FUNCTION_SET.has(action.name)) errors.push(`Line ${index + 1}: unknown function ${action.name}().`);
        if (action.type === "message") {
          for (const variable of action.text.matchAll(/\$\{([^}]+)\}/g)) {
            if (!CUSTOM_MACRO_VARIABLES.includes(variable[1])) errors.push(`Line ${index + 1}: unknown variable \${${variable[1]}}.`);
          }
          if (action.text.includes("${") && !/\$\{[^}]+\}/.test(action.text)) errors.push(`Line ${index + 1}: incomplete variable or function expression.`);
        }
      }
      group.macros.push({ label, actions, line: index + 1 });
    }
    const macros = groups.flatMap((entry) => entry.macros);
    if (macros.length > 100) errors.push("A maximum of 100 macros is supported.");
    return { groups: groups.filter((entry) => entry.macros.length), macros, errors: [...new Set(errors)] };
  }

  const CUSTOM_MACRO_STYLE = `
    #${APP.ids.customMacroButton} { position: fixed; right: 14px; top: calc(50% + 147px); z-index: 2147483645; transform: translateY(-50%); border: 1px solid #c4b5fd; border-radius: 9px 0 0 9px; background: linear-gradient(145deg,#4c1d95,#1e3a8a); color: #f5f3ff; padding: 11px 9px; writing-mode: vertical-rl; letter-spacing: .1em; font: 900 12px/1 Arial,sans-serif; box-shadow: 0 5px 20px #000a,0 0 16px #a78bfa44; cursor: pointer; }
    #${APP.ids.customMacroButton}[hidden] { display: none; }
    #${APP.ids.customMacroButton}:disabled { cursor: wait; opacity: .65; }
    #${APP.ids.customMacroMenu} { position: fixed; right: 58px; top: 50%; z-index: 2147483646; box-sizing: border-box; width: min(300px,calc(100vw - 78px)); max-height: min(70vh,620px); overflow: auto; transform: translateY(-50%); border: 1px solid #c4b5fd; border-radius: 12px; background: linear-gradient(145deg,#170b2af7,#10224df7); color: #fff; padding: 12px; box-shadow: 0 16px 44px #000d,0 0 24px #8b5cf633; font: 13px/1.3 Arial,sans-serif; }
    #${APP.ids.customMacroMenu}[hidden] { display: none; }
    #${APP.ids.customMacroMenu} > strong { display: block; margin-bottom: 8px; color: #ede9fe; text-align: center; font-size: 16px; }
    #${APP.ids.customMacroMenu} h3 { margin: 10px 0 6px; border-bottom: 1px solid #8b5cf666; padding-bottom: 4px; color: #ddd6fe; font-size: 12px; text-transform: uppercase; letter-spacing: .08em; }
    #${APP.ids.customMacroMenu} .yf-custom-macro-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
    #${APP.ids.customMacroMenu} button { min-width: 0; overflow-wrap: anywhere; border: 1px solid #8b5cf6; border-radius: 7px; background: linear-gradient(135deg,#312e81,#6d28d9); color: #fff; padding: 8px 6px; cursor: pointer; font-weight: 750; }
    #${APP.ids.customMacroMenu} button:hover, #${APP.ids.customMacroMenu} button:focus-visible { border-color: #f5d0fe; filter: brightness(1.15); }
    #${APP.ids.customMacroMenu} .yf-custom-empty { margin: 8px 0 0; color: #cbd5e1; text-align: center; }
    #${APP.ids.customMacroEditor} { position: fixed; inset: 0; z-index: 2147483647; display: grid; place-items: center; box-sizing: border-box; padding: 18px; background: #020617c7; color: #f8fafc; font: 14px/1.4 Arial,sans-serif; }
    #${APP.ids.customMacroEditor} * { box-sizing: border-box; }
    #${APP.ids.customMacroEditor} .yf-custom-editor-card { width: min(900px,calc(100vw - 32px)); max-height: calc(100vh - 32px); overflow: auto; border: 1px solid #c4b5fd; border-radius: 15px; padding: 17px; background: linear-gradient(145deg,#111827fb,#172554fb 58%,#3b1654fb); box-shadow: 0 24px 80px #000e,0 0 32px #a78bfa33; }
    #${APP.ids.customMacroEditor} header { display: flex; align-items: center; justify-content: space-between; gap: 12px; border-bottom: 1px solid #a78bfa66; padding-bottom: 10px; }
    #${APP.ids.customMacroEditor} h2 { margin: 0; color: #f5f3ff; font-family: Georgia,serif; }
    #${APP.ids.customMacroEditor} .yf-custom-close { border: 0; background: transparent; color: #cbd5e1; font-size: 28px; cursor: pointer; }
    #${APP.ids.customMacroEditor} textarea { display: block; width: 100%; min-height: 330px; resize: vertical; margin: 12px 0; border: 1px solid #64748b; border-radius: 8px; background: #020617; color: #f8fafc; padding: 11px; font: 13px/1.45 Consolas,monospace; }
    #${APP.ids.customMacroEditor} details { margin: 10px 0; border: 1px solid #475569; border-radius: 8px; background: #0f172aaa; padding: 9px 11px; }
    #${APP.ids.customMacroEditor} summary { cursor: pointer; color: #ddd6fe; font-weight: 800; }
    #${APP.ids.customMacroEditor} code { color: #a7f3d0; }
    #${APP.ids.customMacroEditor} .yf-custom-errors { white-space: pre-wrap; margin: 8px 0; border: 1px solid #f87171; border-radius: 7px; background: #7f1d1d77; color: #fee2e2; padding: 9px; }
    #${APP.ids.customMacroEditor} .yf-custom-errors[hidden] { display: none; }
    #${APP.ids.customMacroEditor} .yf-custom-editor-actions { display: flex; justify-content: flex-end; gap: 8px; }
    #${APP.ids.customMacroEditor} .yf-custom-editor-actions button { border: 1px solid #64748b; border-radius: 7px; background: #1e293b; color: #fff; padding: 9px 13px; cursor: pointer; font-weight: 750; }
    #${APP.ids.customMacroEditor} .yf-custom-editor-actions .yf-custom-save { border-color: #ddd6fe; background: linear-gradient(135deg,#5b21b6,#1d4ed8); }
    #${APP.ids.customMacroToast} { position: fixed; right: 58px; top: calc(50% + 238px); z-index: 2147483647; width: min(380px,calc(100vw - 80px)); border: 1px solid #c4b5fd; border-radius: 9px; background: #2e1065ee; color: #f5f3ff; padding: 10px 12px; text-align: center; font: 750 13px/1.35 Arial,sans-serif; box-shadow: 0 8px 24px #000c; }
    #${APP.ids.customMacroToast}.yf-custom-error { border-color: #f87171; background: #450a0aee; color: #fee2e2; }
    @media (max-width: 650px) { #${APP.ids.customMacroButton} { right: 4px; } #${APP.ids.customMacroMenu} { right: 48px; } #${APP.ids.customMacroMenu} .yf-custom-macro-grid { grid-template-columns: 1fr; } }
  `;

  class CustomMacroEngine {
    constructor(diagnostics) {
      this.diagnostics = diagnostics;
      this.cancelled = false;
    }

    cancel() { this.cancelled = true; }

    async execute(macro) {
      this.cancelled = false;
      this.#requireDuel();
      for (let index = 0; index < macro.actions.length; index++) {
        if (this.cancelled) throw new Error("Macro stopped.");
        const action = macro.actions[index];
        let wait = 250;
        let stop = false;
        if (action.type === "message") await this.#sendMessage(this.#replaceVariables(action.text));
        else {
          const result = await this.#executeFunction(action.name, action.param);
          wait = result?.wait ?? wait;
          stop = Boolean(result?.stop);
        }
        if (stop) break;
        if (index + 1 < macro.actions.length && wait > 0) await this.#wait(wait);
      }
    }

    #page() { return typeof unsafeWindow !== "undefined" ? unsafeWindow : window; }

    #requireDuel() {
      const page = this.#page();
      if (!page?.Send || !this.#player()) throw new Error("Enter an active duel before running a macro.");
    }

    #player() {
      const page = this.#page();
      return [page.player1, page.player2, page.player3, page.player4].find((player) => player?.username === page.user_username) ?? null;
    }

    #send(play, extra = {}) {
      const allowed = new Set(["Duel message", "View deck", "View ED", "To hand", "To T Deck", "To GY", "To ED FU", "Remove Token", "Banish", "Banish FD", "SS ATK", "SS DEF", "Normal Summon", "Set monster", "Flip", "To ATK", "To DEF", "To ST", "Set ST", "Summon token", "Add counter", "Remove counter", "Shuffle deck", "Move", "Overlay"]);
      if (!allowed.has(play)) throw new Error(`Blocked unsupported DuelingBook action: ${play}`);
      this.#page().Send({ action: "Duel", play, ...extra });
    }

    #sendMessage(message) {
      const text = String(message ?? "").trim();
      if (!text) return;
      if (text.length > 500) throw new Error("Chat messages must be 500 characters or fewer.");
      this.#send("Duel message", { message: text, html: 0 });
    }

    async #executeFunction(name, param) {
      const args = this.#args(param);
      switch (name) {
        case "waitInMs": return { wait: Math.min(30000, Math.max(0, Number(param) || 100)) };
        case "addFromDeckToHand": return this.#withDeck((cards) => this.#actNames(cards, param, "To hand"));
        case "sendFromDeckToGY": return this.#withDeck((cards) => this.#actNames(cards, param, "To GY"));
        case "sendFromExtraDeckToGY": return this.#withExtra((cards) => this.#actNames(cards, param, "To GY"));
        case "banishFromDeck": return this.#withDeck((cards) => this.#actNames(cards, param, "Banish"));
        case "banishFromGY": return this.#actNames(this.#player()?.grave_arr, param, "Banish");
        case "banishFromHand": return this.#actNames(this.#player()?.hand_arr, param, "Banish");
        case "discard": return this.#actNames(this.#player()?.hand_arr, param, "To GY");
        case "addFromGYToHand": return this.#actNames(this.#player()?.grave_arr, param, "To hand");
        case "fromBanishToTopOfDeck": return this.#actNames(this.#player()?.banished_arr, param, "To T Deck");
        case "fromGYToTopOfDeck": return this.#actNames(this.#player()?.grave_arr, param, "To T Deck");
        case "fromFieldToTopOfDeck": return this.#actNames(this.#ownFieldCards(), param, "To T Deck");
        case "sendFromFieldToGY": return this.#actFieldNames(param);
        case "specialFromHandInAtk": return this.#selectFromPile("hand", param, "SS ATK");
        case "specialFromHandInDef": return this.#selectFromPile("hand", param, "SS DEF");
        case "specialFromDeckInAtk": return this.#selectFromPile("deck", param, "SS ATK");
        case "specialFromDeckInDef": return this.#selectFromPile("deck", param, "SS DEF");
        case "specialFromExtraDeckInAtk": return this.#selectFromPile("extra", param, "SS ATK");
        case "specialFromExtraDeckInDef": return this.#selectFromPile("extra", param, "SS DEF");
        case "specialFromGYInAtk": return this.#selectFromPile("grave", param, "SS ATK");
        case "specialFromGYInDef": return this.#selectFromPile("grave", param, "SS DEF");
        case "specialFromHandInAtkRandomZone": return this.#actNames(this.#player()?.hand_arr, param, "SS ATK");
        case "specialFromHandInDefRandomZone": return this.#actNames(this.#player()?.hand_arr, param, "SS DEF");
        case "specialFromDeckInAtkRandomZone": return this.#pileAction("deck", param, "SS ATK");
        case "specialFromDeckInDefRandomZone": return this.#pileAction("deck", param, "SS DEF");
        case "specialFromExtraDeckInAtkRandomZone": return this.#pileAction("extra", param, "SS ATK");
        case "specialFromExtraDeckInDefRandomZone": return this.#pileAction("extra", param, "SS DEF");
        case "specialFromGYInAtkRandomZone": return this.#actNames(this.#player()?.grave_arr, param, "SS ATK");
        case "specialFromGYInDefRandomZone": return this.#actNames(this.#player()?.grave_arr, param, "SS DEF");
        case "specialFromHandInAtkToZone": return this.#zoneAction(this.#player()?.hand_arr, args, "SS ATK");
        case "specialFromHandInDefToZone": return this.#zoneAction(this.#player()?.hand_arr, args, "SS DEF");
        case "specialFromDeckInAtkToZone": return this.#pileZoneAction("deck", args, "SS ATK");
        case "specialFromDeckInDefToZone": return this.#pileZoneAction("deck", args, "SS DEF");
        case "specialFromExtraDeckInAtkToZone": return this.#pileZoneAction("extra", args, "SS ATK");
        case "specialFromExtraDeckInDefToZone": return this.#pileZoneAction("extra", args, "SS DEF");
        case "specialFromGYInAtkToZone": return this.#zoneAction(this.#player()?.grave_arr, args, "SS ATK");
        case "specialFromGYInDefToZone": return this.#zoneAction(this.#player()?.grave_arr, args, "SS DEF");
        case "activateSpellTrapFromDeck": return this.#selectFromPile("deck", param, "To ST");
        case "activateSpellTrapFromDeckToZone": return this.#pileZoneAction("deck", args, "To ST");
        case "setCardsFromDeckToSpellTrapZone": return this.#withDeck((cards) => this.#actNames(cards, param, "Set ST"));
        case "specialSummonToken": this.#page().tokenE(); return { stop: true };
        case "specialSummonTokenToZone": return this.#tokenToZone(args);
        case "specialSummonMultipleTokens": return this.#multipleTokens(param);
        case "sendAllControllingMonstersFromFieldToGY": return this.#sendAllMonsters(args);
        case "sendAllOwnSpellTrapsFromFieldToGY": return this.#sendAllSpellTraps();
        case "returnAllFromHandToTopOfDeck": return this.#sendAll(this.#player()?.hand_arr, "To T Deck", 80);
        case "shuffleDeck": return this.#shuffleDeck();
        case "moveZone": return this.#moveZone(args);
        case "overlayMonsters": return this.#overlay(args);
        case "flipDownMonsters": return this.#actNames(this.#ownMonsters(), param, "Set monster");
        case "flipUpMonsters": return this.#actNames(this.#ownMonsters(), param, "Flip");
        case "changeToAtk": return this.#actNames(this.#ownMonsters(), param, "To ATK");
        case "changeToDef": return this.#actNames(this.#ownMonsters(), param, "To DEF");
        case "normalSetToRandomZone": return this.#actNames(this.#player()?.hand_arr, param, "Set monster");
        case "normalSetToZone": return this.#zoneAction(this.#player()?.hand_arr, args, "Set monster");
        case "normalSummonToRandomZone": return this.#actNames(this.#player()?.hand_arr, param, "Normal Summon");
        case "normalSummonToZone": return this.#zoneAction(this.#player()?.hand_arr, args, "Normal Summon");
        case "addCountersToCards": return this.#counters(args, "Add counter");
        case "removeCountersFromCards": return this.#counters(args, "Remove counter");
        case "banishCardsFromTopOfDeckFD": return this.#banishTop(param);
        case "returnRandomBanishedCardToHand": return this.#randomBanishedToHand();
        default: throw new Error(`Unsupported macro function: ${name}()`);
      }
    }

    #args(value) { return String(value ?? "").split("~").map((item) => item.trim()).filter(Boolean); }
    #cardName(card) { try { return String(card.data("cardfront").data("name") ?? ""); } catch { return ""; } }
    #cardId(card) { try { return card.data("id"); } catch { return null; } }
    #cardData(card, key) { try { return card.data(key); } catch { return null; } }
    #frontData(card, key) { try { return card.data("cardfront").data(key); } catch { return null; } }

    #find(cards, name, used = new Set()) {
      const wanted = String(name ?? "").toLowerCase();
      return [...(cards ?? [])].find((card) => this.#cardName(card).toLowerCase() === wanted && !used.has(this.#cardId(card))) ?? null;
    }

    async #actNames(cards, names, play) {
      const used = new Set();
      for (const name of this.#args(names)) {
        const card = this.#find(cards, name, used);
        if (!card) continue;
        used.add(this.#cardId(card));
        this.#send(play, { card: this.#cardId(card) });
        await this.#wait(80);
      }
    }

    async #actFieldNames(names) {
      const used = new Set();
      for (const name of this.#args(names)) {
        const card = this.#find(this.#ownFieldCards(), name, used);
        if (!card) continue;
        used.add(this.#cardId(card));
        this.#sendFieldCardToGY(card);
        await this.#wait(80);
      }
    }

    #sendFieldCardToGY(card) {
      if (this.#frontData(card, "pendulum")) this.#send("To ED FU", { card: this.#cardId(card) });
      else if (this.#frontData(card, "monster_color") === "Token") this.#send("Remove Token", { card: this.#cardId(card) });
      else this.#send("To GY", { card: this.#cardId(card) });
    }

    async #sendAll(cards, play, delay = 80) {
      for (const card of [...(cards ?? [])]) {
        this.#send(play, { card: this.#cardId(card) });
        await this.#wait(delay);
      }
    }

    async #withDeck(callback) {
      const cards = this.#player()?.main_arr ?? [];
      if (!cards.length) return;
      this.#send("View deck", { card: this.#cardId(cards[0]) });
      await this.#wait(500);
      await callback(cards);
      await this.#wait(250);
    }

    async #withExtra(callback) {
      const cards = this.#player()?.extra_arr ?? [];
      if (!cards.length) return;
      this.#send("View ED", { card: this.#cardId(cards[0]) });
      await this.#wait(500);
      await callback(cards);
      await this.#wait(250);
    }

    #pile(name) {
      const player = this.#player();
      return name === "hand" ? player?.hand_arr : name === "deck" ? player?.main_arr : name === "extra" ? player?.extra_arr : player?.grave_arr;
    }

    async #pileAction(pile, names, play) {
      const callback = (cards) => this.#actNames(cards, names, play);
      return pile === "deck" ? this.#withDeck(callback) : pile === "extra" ? this.#withExtra(callback) : callback(this.#pile(pile));
    }

    async #selectFromPile(pile, name, play) {
      const open = async () => {
        const card = this.#find(this.#pile(pile), name);
        if (!card) throw new Error(`Card not found: ${name}`);
        const page = this.#page();
        if (typeof page.cardMenuClicked !== "function") throw new Error("DuelingBook's native card menu is unavailable.");
        page.menu_card = card;
        page.cardMenuClicked(card, play);
      };
      if (pile === "deck") await this.#withDeck(open);
      else if (pile === "extra") await this.#withExtra(open);
      else await open();
      return { stop: true };
    }

    async #pileZoneAction(pile, args, play) {
      const callback = (cards) => this.#zoneAction(cards, args, play);
      return pile === "deck" ? this.#withDeck(callback) : this.#withExtra(callback);
    }

    async #zoneAction(cards, args, play) {
      if (args.length < 2) throw new Error(`${play} requires a card name and at least one zone.`);
      const card = this.#find(cards, args[0]);
      if (!card) throw new Error(`Card not found: ${args[0]}`);
      const zone = this.#firstOpenZone(args.slice(1));
      if (!zone) throw new Error("None of the requested zones is available.");
      this.#send(play, { card: this.#cardId(card), zone });
    }

    #normalizeZone(value) {
      const zone = String(value ?? "").trim().toLowerCase();
      if (/^om[1-5]$/.test(zone)) return `M2-${zone.at(-1)}`;
      if (/^m[1-5]$/.test(zone)) return `M-${zone.at(-1)}`;
      if (/^s[1-5]$/.test(zone)) return `S-${zone.at(-1)}`;
      if (zone === "el") return "Left Extra Monster Zone";
      if (zone === "er") return "Right Extra Monster Zone";
      return null;
    }

    #firstOpenZone(values) {
      return values.map((value) => this.#normalizeZone(value)).filter(Boolean).find((zone) => this.#zoneEmpty(zone)) ?? null;
    }

    #zoneEmpty(zone) {
      const player = this.#player();
      const own = { "M-1": "m1", "M-2": "m2", "M-3": "m3", "M-4": "m4", "M-5": "m5", "S-1": "s1", "S-2": "s2", "S-3": "s3", "S-4": "s4", "S-5": "s5" };
      const opponent = { "M2-1": "m1", "M2-2": "m2", "M2-3": "m3", "M2-4": "m4", "M2-5": "m5" };
      if (own[zone]) return !player?.[own[zone]];
      if (opponent[zone]) return !player?.opponent?.[opponent[zone]];
      if (zone === "Left Extra Monster Zone") return !this.#page().linkLeft;
      if (zone === "Right Extra Monster Zone") return !this.#page().linkRight;
      return false;
    }

    #tokenToZone(zones) {
      const zone = this.#firstOpenZone(zones);
      if (!zone) throw new Error("None of the requested Token zones is available.");
      this.#send("Summon token", { zone });
    }

    async #multipleTokens(value) {
      const count = Math.min(5, Math.max(0, Number.parseInt(value, 10) || 0));
      for (let index = 0; index < count; index++) {
        this.#send("Summon token");
        await this.#wait(500);
      }
    }

    #ownMonsters(face = "") {
      const player = this.#player();
      const cards = [player?.m1, player?.m2, player?.m3, player?.m4, player?.m5, this.#page().linkLeft, this.#page().linkRight].filter(Boolean);
      return cards.filter((card) => this.#cardData(card, "controller")?.username === player?.username && (!face || Boolean(this.#cardData(card, "face_down")) === (face === "facedown")));
    }

    #opponentMonsters(face = "") {
      const player = this.#player();
      const opponent = player?.opponent;
      const cards = [opponent?.m1, opponent?.m2, opponent?.m3, opponent?.m4, opponent?.m5, this.#page().linkLeft, this.#page().linkRight].filter(Boolean);
      return cards.filter((card) => this.#cardData(card, "controller")?.username === opponent?.username && (!face || Boolean(this.#cardData(card, "face_down")) === (face === "facedown")));
    }

    #ownSpellTraps() {
      const player = this.#player();
      return [player?.s1, player?.s2, player?.s3, player?.s4, player?.s5, player?.fieldSpell].filter(Boolean);
    }
    #ownFieldCards() { return [...this.#ownMonsters(), ...this.#ownSpellTraps()]; }

    async #sendAllMonsters(args) {
      const position = String(args[0] ?? "").toLowerCase();
      const face = String(args[1] ?? (position === "faceup" || position === "facedown" ? position : "")).toLowerCase();
      for (const card of this.#ownMonsters(face)) {
        if (position === "atk" && !this.#cardData(card, "inATK")) continue;
        if (position === "def" && !this.#cardData(card, "inDEF")) continue;
        this.#sendFieldCardToGY(card);
        await this.#wait(80);
      }
    }

    async #sendAllSpellTraps() {
      for (const card of this.#ownSpellTraps()) {
        this.#sendFieldCardToGY(card);
        await this.#wait(80);
      }
    }

    #shuffleDeck() {
      const card = this.#player()?.main_arr?.[0];
      if (card) this.#send("Shuffle deck", { card: this.#cardId(card) });
    }

    #moveZone(args) {
      if (args.length < 2) throw new Error("moveZone requires a card name and at least one zone.");
      const card = this.#find(this.#ownFieldCards(), args[0]);
      if (!card) throw new Error(`Card not found: ${args[0]}`);
      const zone = this.#firstOpenZone(args.slice(1));
      if (!zone) throw new Error("None of the requested zones is available.");
      this.#send("Move", { card: this.#cardId(card), zone });
    }

    async #overlay(args) {
      if (args.length < 2) throw new Error("overlayMonsters requires a target and at least one material.");
      const cards = this.#ownMonsters();
      const target = this.#find(cards, args[0]);
      if (!target) throw new Error(`Overlay target not found: ${args[0]}`);
      for (const name of args.slice(1)) {
        const material = this.#find(cards, name);
        if (!material || this.#cardId(material) === this.#cardId(target)) continue;
        this.#send("Overlay", { start_card: this.#cardId(target), end_card: this.#cardId(material) });
        await this.#wait(100);
      }
    }

    async #counters(args, play) {
      if (args.length < 2) throw new Error(`${play} requires a count and at least one card name.`);
      const count = Math.min(20, Math.max(1, Number.parseInt(args.shift(), 10) || 1));
      for (let index = 0; index < count; index++) {
        await this.#actNames(this.#ownFieldCards(), args.join("~"), play);
        if (index + 1 < count) await this.#wait(500);
      }
    }

    async #banishTop(value) {
      const count = Math.min(60, Math.max(0, Number.parseInt(value, 10) || 0));
      for (const card of [...(this.#player()?.main_arr ?? [])].slice(0, count)) {
        this.#send("Banish FD", { card: this.#cardId(card) });
        await this.#wait(80);
      }
    }

    #randomBanishedToHand() {
      const cards = this.#player()?.banished_arr ?? [];
      if (!cards.length) return;
      const card = cards[Math.floor(Math.random() * cards.length)];
      this.#send("To hand", { card: this.#cardId(card) });
    }

    #replaceVariables(message) {
      return String(message ?? "").replace(/\$\{([A-Za-z][A-Za-z0-9]*)\}/g, (_whole, name) => {
        const player = this.#player();
        switch (name) {
          case "topUsername": return document.querySelector("#avatar2 .username_txt")?.textContent?.trim() ?? "";
          case "botUsername": return document.querySelector("#avatar1 .username_txt")?.textContent?.trim() ?? "";
          case "currentLP": return String(player?.lifepoints ?? 0);
          case "halfOfLP": return String(Math.floor((player?.lifepoints ?? 0) / 2));
          case "atkAllMonsters": return String(this.#sumStats("atk"));
          case "defAllMonsters": return String(this.#sumStats("def"));
          case "atkAllFaceUpMonsters": return String(this.#sumStats("atk", "faceup"));
          case "defAllFaceUpMonsters": return String(this.#sumStats("def", "faceup"));
          default: return "";
        }
      });
    }

    #sumStats(stat, face = "") {
      return [...this.#ownMonsters(face), ...this.#opponentMonsters(face)].reduce((sum, card) => sum + (Number.parseInt(this.#frontData(card, stat), 10) || 0), 0);
    }

    #wait(milliseconds) {
      const duration = Math.max(0, Number(milliseconds) || 0);
      return new Promise((resolve, reject) => {
        const started = Date.now();
        const tick = () => {
          if (this.cancelled) return reject(new Error("Macro stopped."));
          const remaining = duration - (Date.now() - started);
          if (remaining <= 0) return resolve();
          setTimeout(tick, Math.min(remaining, 100));
        };
        tick();
      });
    }
  }

  class CustomMacros {
    constructor(storage, diagnostics, getSettings) {
      this.storage = storage;
      this.diagnostics = diagnostics;
      this.getSettings = getSettings;
      this.source = DEFAULT_CUSTOM_MACROS;
      this.parsed = parseCustomMacroDefinitions(this.source);
      this.engine = new CustomMacroEngine(diagnostics);
      this.button = null;
      this.menu = null;
      this.editor = null;
      this.toast = null;
      this.running = false;
    }

    async mount() {
      if (document.getElementById(APP.ids.customMacroButton)) return;
      this.source = await this.storage.get("custom-macros", DEFAULT_CUSTOM_MACROS);
      this.parsed = parseCustomMacroDefinitions(this.source);
      const style = document.createElement("style");
      style.textContent = CUSTOM_MACRO_STYLE;
      document.head.append(style);
      this.button = document.createElement("button");
      this.button.id = APP.ids.customMacroButton;
      this.button.type = "button";
      this.button.textContent = "MACROS";
      this.button.title = "Open player-created macros";
      this.button.addEventListener("click", () => this.toggle());
      document.body.append(this.button);
      document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        if (this.running) this.engine.cancel();
        else if (this.editor) this.#closeEditor();
        else this.#closeMenu();
      });
      setInterval(() => this.refresh(), 750);
      this.refresh();
    }

    refresh() {
      if (!this.button) return;
      const settings = this.getSettings();
      this.button.hidden = !settings?.enabled || !settings?.customMacrosEnabled || !this.#isVisible(document.querySelector("#duel"));
      this.button.disabled = this.running;
      if (this.button.hidden) this.#closeMenu();
    }

    close() {
      this.engine.cancel();
      this.#closeMenu();
      this.#closeEditor();
    }

    toggle() {
      if (!this.menu) this.#renderMenu();
      else this.#closeMenu();
    }

    openEditor() {
      this.#closeEditor();
      const root = document.createElement("section");
      root.id = APP.ids.customMacroEditor;
      root.setAttribute("role", "dialog");
      root.setAttribute("aria-modal", "true");
      root.setAttribute("aria-label", "Custom macro editor");
      const card = document.createElement("div");
      card.className = "yf-custom-editor-card";
      const header = document.createElement("header");
      const title = document.createElement("h2");
      title.textContent = "Custom Macros";
      const close = document.createElement("button");
      close.type = "button";
      close.className = "yf-custom-close";
      close.setAttribute("aria-label", "Close macro editor");
      close.textContent = "×";
      close.addEventListener("click", () => this.#closeEditor());
      header.append(title, close);
      const intro = document.createElement("p");
      intro.textContent = "Custom DB-compatible format: Button Name | message or ${function(arguments)}. Separate function arguments with ~ and actions with |.";
      const textarea = document.createElement("textarea");
      textarea.value = this.source;
      textarea.spellcheck = false;
      const guide = document.createElement("details");
      const summary = document.createElement("summary");
      summary.textContent = "Syntax, variables, functions, and zones";
      const help = document.createElement("p");
      help.append(
        document.createTextNode("Categories: "), this.#code("-- Category Name"), document.createElement("br"),
        document.createTextNode("Variables: "), this.#code(CUSTOM_MACRO_VARIABLES.map((name) => `\${${name}}`).join(", ")), document.createElement("br"),
        document.createTextNode("Zones: M1–M5, S1–S5, OM1–OM5, EL, ER"), document.createElement("br"),
        document.createTextNode("Hand summon examples: "), this.#code("${specialFromHandInAtk(Card Name)} or ${specialFromHandInDefToZone(Card Name~M1~M2)}"), document.createElement("br"),
        document.createTextNode("Functions: "), this.#code(CUSTOM_MACRO_FUNCTIONS.map((name) => `${name}()`).join(", "))
      );
      guide.append(summary, help);
      const errors = document.createElement("div");
      errors.className = "yf-custom-errors";
      errors.hidden = true;
      const actions = document.createElement("div");
      actions.className = "yf-custom-editor-actions";
      const validate = document.createElement("button");
      validate.type = "button";
      validate.textContent = "Validate";
      validate.addEventListener("click", () => this.#showValidation(textarea.value, errors, false));
      const save = document.createElement("button");
      save.type = "button";
      save.className = "yf-custom-save";
      save.textContent = "Save Macros";
      save.addEventListener("click", () => this.#saveEditor(textarea.value, errors));
      actions.append(validate, save);
      card.append(header, intro, textarea, guide, errors, actions);
      root.append(card);
      root.addEventListener("click", (event) => { if (event.target === root) this.#closeEditor(); });
      document.body.append(root);
      this.editor = root;
      queueMicrotask(() => textarea.focus());
    }

    #code(text) { const code = document.createElement("code"); code.textContent = text; return code; }

    #showValidation(source, output, successToast) {
      const parsed = parseCustomMacroDefinitions(source);
      output.hidden = !parsed.errors.length;
      output.textContent = parsed.errors.join("\n");
      if (!parsed.errors.length && successToast) this.#showToast(`${parsed.macros.length} macro${parsed.macros.length === 1 ? "" : "s"} saved.`);
      else if (!parsed.errors.length) this.#showToast(`Valid: ${parsed.macros.length} macro${parsed.macros.length === 1 ? "" : "s"}.`);
      return parsed;
    }

    async #saveEditor(source, errors) {
      const parsed = this.#showValidation(source, errors, false);
      if (parsed.errors.length) return;
      try {
        await this.storage.set("custom-macros", String(source));
        this.source = String(source);
        this.parsed = parsed;
        this.#closeMenu();
        this.#showToast(`${parsed.macros.length} macro${parsed.macros.length === 1 ? "" : "s"} saved.`);
        this.diagnostics.info("custom-macros", "player macro definitions saved", { macroCount: parsed.macros.length });
        this.#closeEditor();
      } catch (error) {
        errors.hidden = false;
        errors.textContent = `Could not save macros: ${String(error?.message ?? error)}`;
      }
    }

    #renderMenu() {
      this.#closeMenu();
      const menu = document.createElement("section");
      menu.id = APP.ids.customMacroMenu;
      menu.setAttribute("aria-label", "Player-created macros");
      const title = document.createElement("strong");
      title.textContent = "⚙ Custom Macros";
      menu.append(title);
      if (!this.parsed.macros.length) {
        const empty = document.createElement("p");
        empty.className = "yf-custom-empty";
        empty.textContent = "No macros saved. Open YF → Manage Custom Macros.";
        menu.append(empty);
      }
      for (const group of this.parsed.groups) {
        const heading = document.createElement("h3");
        heading.textContent = group.name;
        const grid = document.createElement("div");
        grid.className = "yf-custom-macro-grid";
        for (const macro of group.macros) {
          const button = document.createElement("button");
          button.type = "button";
          button.textContent = macro.label;
          button.title = macro.actions.map((action) => action.raw ?? action.text).join(" | ");
          button.addEventListener("click", () => this.#run(macro));
          grid.append(button);
        }
        menu.append(heading, grid);
      }
      document.body.append(menu);
      this.menu = menu;
    }

    async #run(macro) {
      if (this.running) return;
      this.running = true;
      this.#closeMenu();
      this.refresh();
      this.#showToast(`Running ${macro.label}… Press Escape to stop.`);
      try {
        await this.engine.execute(macro);
        this.#showToast(`${macro.label} completed.`);
        this.diagnostics.info("custom-macros", "player macro completed", { label: macro.label, actionCount: macro.actions.length });
      } catch (error) {
        this.#showToast(String(error?.message ?? error), true);
        this.diagnostics.warn("custom-macros", "player macro stopped", { label: macro.label, reason: String(error?.message ?? error) });
      } finally {
        this.running = false;
        this.refresh();
      }
    }

    #closeMenu() { this.menu?.remove(); this.menu = null; }
    #closeEditor() { this.editor?.remove(); this.editor = null; }

    #showToast(message, error = false) {
      this.toast?.remove();
      this.toast = document.createElement("div");
      this.toast.id = APP.ids.customMacroToast;
      if (error) this.toast.className = "yf-custom-error";
      this.toast.textContent = message;
      document.body.append(this.toast);
      const current = this.toast;
      setTimeout(() => { if (this.toast === current) { current.remove(); this.toast = null; } }, error ? 6500 : 4200);
    }

    #isVisible(element) {
      if (!(element instanceof HTMLElement) || element.hidden) return false;
      const style = getComputedStyle(element);
      return style.display !== "none" && style.visibility !== "hidden" && element.getClientRects().length > 0;
    }
  }
