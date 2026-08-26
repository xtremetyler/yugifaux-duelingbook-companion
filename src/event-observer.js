  const EVENT_PHRASES = Object.freeze([
    ["effect-declaration", /(?:\b(?:declare(?:d|s|ing)?|announc(?:ed|es|ing)?)\b.{0,160}\beffect\b|\beffect\b.{0,160}\bactivate(?:d|s|ing)?\b)/i],
    ["normal-summon", /\bnormal summon(?:ed|s|ing)?\b/i],
    ["special-summon", /\bspecial summon(?:ed|s|ing)?\b/i],
    ["fusion-summon", /\bfusion summon(?:ed|s|ing)?\b/i],
    ["synchro-summon", /\bsynchro summon(?:ed|s|ing)?\b/i],
    ["xyz-summon", /\bxyz summon(?:ed|s|ing)?\b/i],
    ["link-summon", /\blink summon(?:ed|s|ing)?\b/i],
    ["activation", /\bactivate(?:d|s|ing)?\b/i],
    ["attack", /\b(?:attack(?:ed|s|ing)?|declared an attack)\b/i]
  ]);

  const normalizeLine = (value) => value.replace(/\s+/g, " ").trim();

  function classifyPublicLogLine(text) {
    const normalized = normalizeLine(text);
    if (!normalized) return null;
    const match = EVENT_PHRASES.find(([, pattern]) => pattern.test(normalized));
    return match ? { type: match[0], text: normalized } : null;
  }

  function getNewLogText(previous, current) {
    if (!current || current === previous) return "";
    if (!previous) return current;
    if (current.startsWith(previous)) return current.slice(previous.length);
    if (current.endsWith(previous)) return current.slice(0, current.length - previous.length);

    let prefixLength = 0;
    const prefixLimit = Math.min(previous.length, current.length);
    while (prefixLength < prefixLimit && previous[prefixLength] === current[prefixLength]) prefixLength += 1;

    let suffixLength = 0;
    const suffixLimit = Math.min(previous.length - prefixLength, current.length - prefixLength);
    while (
      suffixLength < suffixLimit &&
      previous[previous.length - 1 - suffixLength] === current[current.length - 1 - suffixLength]
    ) suffixLength += 1;

    return current.slice(prefixLength, current.length - suffixLength);
  }

  class PublicDuelLogObserver {
    constructor(diagnostics, onEvent) {
      this.diagnostics = diagnostics;
      this.onEvent = onEvent;
      this.logObserver = null;
      this.pageObserver = null;
      this.root = null;
      this.snapshot = "";
      this.scanQueued = false;
    }

    start() {
      this.#attachIfAvailable();
      this.pageObserver = new MutationObserver(() => this.#attachIfAvailable());
      this.pageObserver.observe(document.body, { childList: true, subtree: true });
    }

    stop() {
      this.logObserver?.disconnect();
      this.pageObserver?.disconnect();
      this.logObserver = null;
      this.pageObserver = null;
      this.root = null;
      this.snapshot = "";
    }

    #attachIfAvailable() {
      const nextRoot = document.querySelector("#duel_log .log_txt");
      if (!nextRoot || nextRoot === this.root) return;
      this.logObserver?.disconnect();
      this.root = nextRoot;
      this.snapshot = "";
      this.#scan(true);
      this.logObserver = new MutationObserver(() => this.#queueScan());
      this.logObserver.observe(nextRoot, { childList: true, characterData: true, subtree: true });
      this.diagnostics.info("observer", "attached to public duel log", { selector: "#duel_log .log_txt" });
    }

    #queueScan() {
      if (this.scanQueued) return;
      this.scanQueued = true;
      queueMicrotask(() => {
        this.scanQueued = false;
        this.#scan(false);
      });
    }

    #scan(seedOnly) {
      if (!this.root) return;
      const current = this.root.innerText;
      if (seedOnly) {
        this.snapshot = current;
        return;
      }

      const addedText = getNewLogText(this.snapshot, current);
      this.snapshot = current;
      const lines = addedText.split(/\r?\n/).map(normalizeLine).filter(Boolean);
      for (const line of lines) {
        const event = classifyPublicLogLine(line);
        if (event) {
          this.diagnostics.info("observer", "public duel event detected", { type: event.type, text: event.text });
          this.onEvent(event);
        }
      }
    }
  }
