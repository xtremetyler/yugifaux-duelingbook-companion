  const EVENT_PHRASES = Object.freeze([
    ["end-phase", /\bentered end phase\b/i],
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
      this.bridgeTimer = null;
      this.bridge = null;
      this.bridgeOriginal = null;
      this.recentEvents = new Map();
    }

    start() {
      this.#attachIfAvailable();
      this.#attachPublicLogBridge();
      this.pageObserver = new MutationObserver(() => this.#attachIfAvailable());
      this.pageObserver.observe(document.body, { childList: true, subtree: true });
      this.bridgeTimer = setInterval(() => this.#attachPublicLogBridge(), 500);
    }

    stop() {
      this.logObserver?.disconnect();
      this.pageObserver?.disconnect();
      if (this.bridgeTimer) clearInterval(this.bridgeTimer);
      const page = this.#page();
      if (this.bridge && page?.duelLogPrint === this.bridge && typeof this.bridgeOriginal === "function") {
        page.duelLogPrint = this.bridgeOriginal;
      }
      this.logObserver = null;
      this.pageObserver = null;
      this.bridgeTimer = null;
      this.bridge = null;
      this.bridgeOriginal = null;
      this.root = null;
      this.snapshot = "";
      this.recentEvents.clear();
    }

    #page() {
      return typeof unsafeWindow !== "undefined" ? unsafeWindow : window;
    }

    #attachPublicLogBridge() {
      const page = this.#page();
      const current = page?.duelLogPrint;
      if (typeof current !== "function" || current === this.bridge) return;
      const observer = this;
      const bridge = function (...args) {
        observer.#ingestPublicLogData(args[0]);
        return current.apply(this, args);
      };
      try {
        Object.defineProperty(bridge, "__yfPublicLogBridge", { value: true });
        page.duelLogPrint = bridge;
        this.bridgeOriginal = current;
        this.bridge = bridge;
        this.diagnostics.info("observer", "attached to DuelingBook public log renderer", { source: "public_log" });
      } catch (error) {
        this.diagnostics.warn("observer", "public log renderer bridge unavailable; using rendered log fallback", { reason: String(error?.message ?? error) });
      }
    }

    #ingestPublicLogData(data) {
      if (!data || Array.isArray(data)) return;
      if (typeof data.public_log !== "string") return;
      this.#emitPublicLine(data.public_log, "public-log-renderer");
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
        this.#emitPublicLine(line, "rendered-log");
      }
    }

    #emitPublicLine(line, source) {
      const event = classifyPublicLogLine(line);
      if (!event) return;
      const now = Date.now();
      const fingerprint = `${event.type}\n${event.text.toLocaleLowerCase()}`;
      const lastSeen = this.recentEvents.get(fingerprint) ?? 0;
      this.recentEvents.set(fingerprint, now);
      for (const [key, seenAt] of this.recentEvents) {
        if (now - seenAt > 3000) this.recentEvents.delete(key);
      }
      if (now - lastSeen < 500) return;
      this.diagnostics.info("observer", "public duel event detected", { type: event.type, text: event.text, source });
      this.onEvent(event);
    }
  }
