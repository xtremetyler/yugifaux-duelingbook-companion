# DuelingBook selectors and hooks

Observed against the current public page on 2026-08-26. Treat every item as version-sensitive.

| Selector | Purpose | Phase 1 use | Stability approach |
|---|---|---|---|
| `#frames` | Main DuelingBook application frame | Detection evidence only | Do not depend on it for events. |
| `#start` | Intro/start screen | Detection evidence only | Top-level screen ID. |
| `#front_page` | Login/front page | Detection evidence only | Never inspect form values. |
| `#main_menu` | Main menu screen | Future screen status | Observe visibility only if needed. |
| `#duel_room` | Room and format selection | Future launcher | Guide/highlight only until safely tested. |
| `#cu` | Custom Cards format option | Future launcher candidate | Confirm semantic label during authenticated testing. |
| `#host`, `#hosting`, `#joining` | Room workflow containers | Future launcher candidates | No Phase 1 writes. |
| `#duel` | Duel screen | Presence evidence only | Never infer that hidden children are public. |
| `#duel_log` | Duel-log panel | Scope boundary | No checkbox or search mutations. |
| `#duel_log .log_txt` | Rendered log text | **Read-only Phase 1 observer** | Scoped `MutationObserver`; missing node fails open. |
| `#duel_log .chat_cb` | Chat filter | None | Never toggle automatically. |
| `#duel_log .duel_cb` | Duel-event filter | None | Testers must leave public duel events visible. |
| `#duel_log .game_cb` | Game-event filter | None | Never toggle automatically. |
| `#duel_log .private_cb` | Private-info filter | Explicitly forbidden | Never read, enable, or store its state. |
| `#duel_log .usernames_cb` | Username display filter | None | Detection cannot depend on usernames. |
| `#duel_log .search_txt` | Log search | None | Never alter player search state. |

## Page functions intentionally not hooked

The reference project showed that globals such as `goto`, `duelLogPrint`, `normalSummon`, and `specialSummon` can be replaced. This POC does not access or replace them. Page-global hooks are more brittle, can change gameplay behavior, and create account-safety review work that is unnecessary for the first passive experiment.

## Event assumptions requiring live validation

- Normal, Special, Fusion, Synchro, Xyz, and Link Summon public lines contain the summon phrase and public card name in one rendered line.
- Both players and spectators receive equivalent public text.
- `.log_txt` clears or changes predictably between duels.
- Re-renders preserve line order sufficiently for occurrence-based deduplication.
