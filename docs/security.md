# Threat and account-safety review

## Protected assets

- DuelingBook credentials, cookies, session state, and account reputation;
- hidden card and deck information;
- integrity of player actions and the duel log;
- YugiFaux administrative credentials and unpublished league data;
- uninterrupted access to the DuelingBook interface.

## Main threats and controls

| Threat | Phase 1 control |
|---|---|
| Remote-code execution | Configuration is JSON only; `eval` and `new Function` are forbidden and checked by verification. |
| Malicious remote text/HTML | Remote labels use `textContent`; HTML from configuration is unsupported. |
| Credential leakage | No cookie, password, token, WebSocket, or login-form access. Diagnostics drop credential-like keys. |
| Hidden-information advantage | The passive observer reads only visible duel-log text. Opt-in custom macros may read the current player's own DuelingBook arrays to locate named cards, but never opponent hidden-zone arrays. |
| Accidental gameplay action | No page-function replacement or raw user-defined socket payloads. Custom functions run only from a player-clicked macro, and action/play names come from an internal allowlist. Host creation and Token recipes retain explicit review flows. |
| Network exfiltration | Userscript requests are limited to public configuration and static presentation assets from documented hosts. No account, deck, duel, chat, or rarity-selection data is uploaded. |
| UI obstruction | Overlay uses `pointer-events: none`, has a bounded duration, and can be removed by emergency disable. |
| Host/config outage | Last valid config is cached; otherwise bundled defaults load. DuelingBook does not depend on either. |
| Duplicate presentation | Existing lines are seeded and normalized line occurrences are deduplicated. Once-per-duel rules add a second guard. |
| DuelingBook DOM changes | Selectors are isolated; missing nodes cause the module to wait or skip rather than patch the site. |

## Residual risk

DuelingBook may change log wording or DOM structure without notice. A false positive could show a presentation at the wrong time, although it cannot perform a duel action. A live test may also reveal that identical public logs are delivered differently to players and spectators. The companion must remain opt-in and should be tested only in consenting unrated Custom Cards rooms until those risks are measured.

## Data inventory

Stored locally through Tampermonkey:

- companion enable/mute/reduced-motion/diagnostics settings;
- Deck Constructor rarity selections keyed by rendered public card name;
- the custom-macro enable setting and player-authored macro definition text;
- the last valid public configuration and its fetch time.

Held only in memory while the launcher is open:

- the player-entered match identifier and reviewed host settings.

Not collected or transmitted by the companion:

- usernames, chat, duel-log text, deck/card-zone contents, match identifiers, credentials, cookies, tokens, analytics, or diagnostics. Fixed Chain declarations are transmitted by DuelingBook itself as ordinary public duel chat after the player clicks a Chain button.

# Chain macro boundary

Chain macros contain only fixed declarations for Chain Links 1 through 8. They never call DuelingBook's socket sender or page globals. A clicked command uses the visible duel-chat input and native Enter handler. The companion observes newly rendered public chat rows only to display an ephemeral chain emoji over the matching public avatar; it does not store chat text or usernames.
# Token macro boundary

Token macros are hard-coded, reviewed recipes. They do not accept executable actions from remote configuration and do not call DuelingBook's socket sender. After an explicit confirmation, the companion opens DuelingBook's visible native Token gallery, selects a reserved built-in carrier thumbnail, and leaves each native Monster Zone choice to the player. Companion artwork and metadata are presentation-only.

# Marker boundary

Markers are player-created presentation reminders. The selector lists face-up field cards only and never reads names from face-down cards. Private reminders stay in memory for the current page session. Public reminders use fixed, readable duel-chat sentences submitted through DuelingBook's visible native chat input; there are no hidden synchronization messages. Marker badges never block or execute gameplay actions.

# Custom macro boundary

Custom macros are local, opt-in, and player initiated. The parser recognizes only categories, messages, documented variables, and function-call expressions. It never uses `eval` or `Function`. Each function maps to fixed DuelingBook action names and derives card identifiers only from the current player's active duel state. Macro definitions cannot provide raw action names, object keys, selectors, or JavaScript.
