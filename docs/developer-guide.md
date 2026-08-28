# Developer guide

## Project structure

```text
config/
  companion.schema.json       JSON Schema for remote configuration
  companion.sample.json       deployable Phase 1 sample
  animations.sample.json      standalone manifest example
docs/                         research, security, permissions, and tests
scripts/
  build.mjs                   dependency-free ordered concatenation
  verify.mjs                  schema and safety invariant checks
src/
  header.js                   Tampermonkey metadata
  bootstrap.js                constants and bundled defaults
  diagnostics.js              sanitized local diagnostic buffer
  storage.js                  namespaced GM storage adapter
  config.js                   validation, remote load, and cache fallback
  event-observer.js           passive public-log classifier
  animation-player.js         non-blocking presentation layer
  match-launcher.js           guarded league host setup and confirmation
  token-macros.js             confirmed custom Token recipes and presentation
  chain-macros.js             fixed visible Chain declarations and avatar flash
  markers.js                  presentation-only card reminders and public chat synchronization
  custom-macros.js            compatible parser, editor, menu, and action engine
  ui.js                       namespaced panel and controls
  main.js                     lifecycle and dependency wiring
  footer.js                   userscript closure
dist/                         generated installable userscript
```

## Lifecycle

At `document-idle`, the companion restores settings, attaches a narrow observer to `#duel_log .log_txt`, mounts its own UI, and requests configuration. It also wraps DuelingBook's public-log renderer as a spectator-safe event source, reading only `public_log`; history arrays are ignored so joining spectators do not replay old animations. Existing rendered lines are marked as seen, and renderer/DOM duplicates are suppressed briefly.

An event must pass two gates: a conservative public-log phrase classifier and an exact case-insensitive configured card-name match. The animation overlay uses `pointer-events: none`. On any load or playback failure, it is skipped and the duel remains untouched.

Saved card rarities are card-name based, but their artwork layer is selected per rendered card. DuelingBook's `pendulum` template metadata maps `2` to the small Pendulum asset, `1` and `3` to normal, and `4` to large. If a specialized asset cannot load, the standard rarity asset is restored automatically.

The match launcher runs only after a player opens it and confirms a review screen. It may open the Duel Room, selects semantic option values for Custom Cards and a 2-out-of-3 match, applies the approved note and an empty password, and clicks DuelingBook's Host control only from the player's `Confirm & Host` action. Match identifiers stay in memory for the open launcher and are neither persisted nor transmitted.

## Configuration rules

- Increment `dataVersion` for every published data change.
- Keep `schemaVersion` at `1` until a breaking schema revision is intentional.
- Use only HTTPS asset URLs on hosts listed in `allowedAssetHosts` and in the userscript metadata.
- Remote configuration is data only. Never add JavaScript strings, selectors to execute, HTML, or callback bodies.
- Keep the bundled fallback valid and small.

## Core update preparation

Core updates use the repository's tracked `dist/yugifaux-companion.user.js` through controlled `@updateURL` and `@downloadURL` metadata. Build and verify before every push that changes the userscript. Do not add a wildcard `@connect` entry.

## Development boundary

Do not hook WebSocket methods, modify DuelingBook action functions, enable private-log filters, or send hidden synchronization messages. Player-authorized Chain macros place a fixed public declaration into DuelingBook's duel-chat input. The opt-in custom macro engine may read only the current player's duel arrays and call DuelingBook's native sender with action names constructed by its internal allowlist; macro text must never become an action name, selector, or executable code. The match launcher and Token recipes retain their own explicit confirmation and native-control boundaries.
