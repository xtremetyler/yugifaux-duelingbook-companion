# Technical assessment and research findings

## Feasibility

Phase 1 is feasible as a passive userscript. DuelingBook currently renders its application screens into one document with stable top-level IDs, including `#start`, `#main_menu`, `#duel_room`, `#duel`, and `#duel_log`. The public duel-log content lives under `#duel_log .log_txt`, making a scoped `MutationObserver` practical without touching sockets or page functions.

Independent playback on two installed browsers is plausible because both clients should receive the same public duel event. It is not yet proven: a live player/player and player/spectator test is required to confirm exact wording, ordering, timing, and whether all desired summon categories appear identically.

## Current DuelingBook inspection — 2026-08-26

The logged-out current page loaded `utils.js?v=931`, `duel.js?v=931`, and `main.js?v=931`. The full duel and room DOMs are present but hidden until their screens are active. Useful observations:

- `#duel_room` contains format choices, including `#cu`, plus host/join containers.
- `#duel` is the duel screen and contains field, zone, player, and action elements.
- `#duel_log` is a separate panel with `.log_txt`, `.duel_cb`, `.game_cb`, `.chat_cb`, `.private_cb`, `.usernames_cb`, and `.search_txt`.
- DuelingBook's own public documentation describes the duel log as available to duelists and searchable/filterable.
- The DOM includes a `Private Info` filter. The companion never enables, reads, or stores that control; it only observes whatever visible text DuelingBook has already rendered in `.log_txt`.

Because no test account or consenting live room was supplied, exact production summon-log strings and spectator parity remain unverified. The parser therefore uses conservative event phrases and requires the configured card name to appear in the same visible line.

## Reference repository findings

The requested reference is a large single-file userscript (about 149 KB / 3,694 lines when inspected) that:

- detects DuelingBook with top-level IDs such as `#frames`, `#duel`, and `#start`;
- adds a fixed settings button;
- uses a whole-body `MutationObserver` and a wrapped page navigation function to reapply changes;
- reads and rewrites duel-log presentation through `#duel_log .log_txt`;
- replaces DuelingBook page-global functions such as normal/special summon handlers for some features;
- offers macros that perform player actions;
- declares broad permissions, including `@connect *`.

Those techniques demonstrate that the UI is extensible, but most are outside this companion's safety boundary. This POC uses namespaced DOM additions, a narrowly scoped observer, no gameplay macros, no page-global replacement, and one explicit remote host.

The source header says `@license MIT`; the inspected repository listing did not show a standalone `LICENSE` file. No code was reused, so this scaffold does not depend on uncertain attribution text. If code is copied later, obtain and preserve the complete license notice first.

## Proposed Phase 1 architecture

`main` coordinates four isolated components:

- `ConfigLoader`: fetch, validate, cache, and fall back;
- `PublicDuelLogObserver`: read-only classification and occurrence-aware deduplication;
- `AnimationPlayer`: data-driven matching and fail-safe overlay playback;
- `CompanionUI`: settings, status, diagnostics, and manual test trigger.

All remote configuration is parsed as JSON and never evaluated. Remote strings reach the DOM through `textContent`. Failures stay inside the companion and are recorded in a small sanitized in-memory diagnostic buffer.

## Recommended next development step

Provide the official GitHub repository, the first public test card's exact DuelingBook name/ID, and one original hosted animation asset. Then publish the sample configuration at the allowlisted URL and run the two-browser checklist. Freeze the observed real log strings as test fixtures before broadening event detection.
