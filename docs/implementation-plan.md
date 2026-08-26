# Phase 1 implementation plan

1. Establish a fail-open shell: inject one namespaced button, a panel, stored opt-in settings, diagnostics, and an emergency disable path.
2. Load strictly validated JSON configuration over one allowlisted host; cache only a validated last-known-good value and bundle a minimal fallback.
3. Observe `#duel_log .log_txt` with `MutationObserver`, seed existing lines without replaying them, classify only public text, and deduplicate by normalized line plus occurrence number.
4. Match classified public events against data-only animation triggers and render an original pointer-transparent overlay.
5. Replace the placeholder card and CSS presentation with one approved YugiFaux card/asset, then run the documented two-profile test before adding any other event types.

Success for this pass means the scaffold builds, fails safely without its remote host, and is ready for one controlled two-client experiment. It does not claim synchronized detection is proven until that live experiment is completed.
