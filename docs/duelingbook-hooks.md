# DuelingBook selectors and hooks

Observed against the current public page on 2026-08-26. Treat every item as version-sensitive.

| Selector | Purpose | Phase 1 use | Stability approach |
|---|---|---|---|
| `#frames` | Main DuelingBook application frame | Detection evidence only | Do not depend on it for events. |
| `#start` | Intro/start screen | Visual-theme scope | Top-level screen ID; only its named monster image is replaced. |
| `#brionac_large` | Start-page monster image | Reversible artwork replacement | Preserve the original `src`, 1370px layout box, and native negative positioning; resize the replacement visually around its center and restore the original when disabled. |
| `body`, `#circuit_board`, `#greenlines` | Page background layers | Reversible visual theme | Apply a body class and CSS overrides; never remove DuelingBook's native layers. |
| `#deck_constructor`, `.deck_bg`, `.side_bg`, `.extra_bg` | Current deck-editor background layers | Reversible visual theme | Recolor the native panels with scoped CSS; restore by removing the body theme class. |
| `#search`, `.search_bg` | Current deck-editor search background layers | Reversible visual theme | Recolor the native search panel and pair it with readable light labels. |
| `#deck_constructor #preview .cardfront`, `.deck_card`, `.side_card`, `.extra_card`, `.search_card` | Native Deck Constructor card renders | Optional Secret Rare presentation | Read rendered card names, append a pointer-transparent animated image only to selected names, and remove all layers when disabled. |
| `#front_page` | Login/front page | Detection evidence only | Never inspect form values. |
| `#main_menu` | Main menu screen | Future screen status | Observe visibility only if needed. |
| `#duel_room` | Room and format selection | Guided launcher scope | Must be visibly active before host fields are changed. |
| `#cu` | Custom Cards format option | Semantic evidence | Launcher selects the host form's `cu` option by value and verifies it exists. |
| `#host`, `#hosting`, `#joining` | Room workflow containers | Guided host workflow | Abort while already hosting/joining; change only reviewed host fields. |
| `#room_btn` | Main-menu Duel Room control | Guided navigation | Click only after the player starts the launcher. |
| `#decklist_cb` | Current deck selector | Preflight validation | Read selected option label/value only; never inspect deck contents. |
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
