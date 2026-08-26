  const EVENT_PHRASES = Object.freeze([
    ["effect-declaration", /(?:\b(?:declare(?:d|s|ing)?|announc(?:ed|es|ing)?)\b.*(?:\beffect\b|$)|\beffect\b.*\bactivate(?:d|s|ing)?\b)/i],
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

  class PublicDuelLogObserver {
    constructor(diagnostics, onEvent) {
      this.diagnostics = diagnostics;
      this.onEvent = onEvent;
      this.logObserver = null;
      this.pageObserver = null;
      this.root = null;
      this.seen = new Set();
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
      this.seen.clear();
    }

    #attachIfAvailable() {
      const nextRoot = document.querySelector("#duel_log .log_txt");
      if (!nextRoot || nextRoot === this.root) return;
      this.logObserver?.disconnect();
      this.root = nextRoot;
      this.seen.clear();
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
      const lines = this.root.innerText.split(/\r?\n/).map(normalizeLine).filter(Boolean);
      if (lines.length === 0) this.seen.clear();
      const occurrences = new Map();
      for (const line of lines) {
        const normalizedKey = line.toLocaleLowerCase();
        const occurrence = (occurrences.get(normalizedKey) ?? 0) + 1;
        occurrences.set(normalizedKey, occurrence);
        const fingerprint = `${normalizedKey}::${occurrence}`;
        if (this.seen.has(fingerprint)) continue;
        this.seen.add(fingerprint);
        if (seedOnly) continue;
        const event = classifyPublicLogLine(line);
        if (event) {
          this.diagnostics.info("observer", "public duel event detected", { type: event.type, text: event.text });
          this.onEvent(event);
        }
      }
    }
  }
