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
| Hidden-information advantage | The observer reads only text DuelingBook rendered in the visible duel-log container and never changes `Private Info`. |
| Accidental gameplay action | No gameplay clicks, macros, chat messages, or page-function replacement. Host creation requires the player to click `Confirm & Host` after reviewing every setting. |
| Network exfiltration | The only userscript request is a GET for public configuration from one declared host. No duel data is uploaded. |
| UI obstruction | Overlay uses `pointer-events: none`, has a bounded duration, and can be removed by emergency disable. |
| Host/config outage | Last valid config is cached; otherwise bundled defaults load. DuelingBook does not depend on either. |
| Duplicate presentation | Existing lines are seeded and normalized line occurrences are deduplicated. Once-per-duel rules add a second guard. |
| DuelingBook DOM changes | Selectors are isolated; missing nodes cause the module to wait or skip rather than patch the site. |

## Residual risk

DuelingBook may change log wording or DOM structure without notice. A false positive could show a presentation at the wrong time, although it cannot perform a duel action. A live test may also reveal that identical public logs are delivered differently to players and spectators. The companion must remain opt-in and should be tested only in consenting unrated Custom Cards rooms until those risks are measured.

## Data inventory

Stored locally through Tampermonkey:

- companion enable/mute/reduced-motion/diagnostics settings;
- the last valid public configuration and its fetch time.

Held only in memory while the launcher is open:

- the player-entered match identifier and reviewed host settings.

Not collected or transmitted:

- usernames, chat, duel-log text, deck/card-zone contents, match identifiers, credentials, cookies, tokens, analytics, or diagnostics.
