# Phase 1 two-client test checklist

Use two Chrome/Edge profiles or two separate browsers with Tampermonkey installed. Use consenting test accounts, an unrated Custom Cards room, and no production/rated match.

## Before the live test

- [ ] Confirm the live custom card name is exactly `Ash Blossom & Lonely Spring`.
- [ ] Publish valid `companion.sample.json` at the approved GitHub raw URL.
- [ ] Run `npm test` and install the newly built userscript in both profiles.
- [ ] Confirm both panels show the same core and data version.
- [ ] Confirm **Preview Ash Blossom overlay** plays in each profile independently.
- [ ] Confirm mute, reduced motion, animations disabled, and emergency disable work.
- [ ] Confirm clicking through the animation still reaches no companion overlay (`pointer-events: none`).

## Player/player synchronization

- [ ] Create an unrated password-protected Custom Cards room manually.
- [ ] Leave the Duel filter visible in both duel logs; do not enable Private Info for testing.
- [ ] Summon the test card once using an ordinary player-controlled DuelingBook action.
- [ ] Record whether both clients play exactly once and note their start-time difference.
- [ ] Repeat a nonqualifying summon and confirm neither client plays the test animation.
- [ ] Re-render/minimize/reopen the log and confirm the prior event is not replayed.
- [ ] Start a new Duel and confirm once-per-duel state resets as expected; this is currently a known gap if the log is not cleared.

## Spectator test

- [ ] Join with a third consenting profile as spectator.
- [ ] Repeat the qualifying summon.
- [ ] Confirm the spectator sees the same public log wording and one animation.
- [ ] Confirm no hand, facedown, or private-log information appears in companion diagnostics.

## Failure tests

- [ ] Block or change the config URL and confirm cached data is reported.
- [ ] Clear the cache, repeat the outage, and confirm bundled data is reported.
- [ ] Serve malformed JSON and a schema-invalid config; confirm both are rejected.
- [ ] Configure a non-HTTPS or unapproved asset URL; confirm validation rejects it.
- [ ] Disable the companion mid-animation and confirm the overlay disappears.
- [ ] Confirm DuelingBook remains fully usable after every failure.

## Evidence to retain

Keep only sanitized results: core/data versions, browser versions, event wording with player names removed, timing measurements, duplicate count, and errors. Do not retain credentials, cookies, hidden cards, private chat, or private-log content.
