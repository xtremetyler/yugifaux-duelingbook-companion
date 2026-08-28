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
# Polyflora Token macro

Use two consenting accounts with version 0.9.0 or newer in an unrated Custom Cards duel.

1. Leave at least two Main Monster Zones open for the initiating player.
2. Click the right-side **TOKENS** button and choose **Polyflora Hexbloom**.
3. Confirm that exactly two different Bloom artworks appear and that there is no reroll control.
4. Close and reopen the popup before summoning; confirm the same draft pair remains selected.
5. Confirm the summon, then click one of DuelingBook's highlighted Monster Zones for each Token.
6. Verify both Tokens are in Defense Position and use the selected companion artwork on both installed clients.
7. Hover each Token and verify its companion label identifies `Bloom Token`, WIND, Level 2, and 0/0.
8. Repeat with only one open Monster Zone and confirm the workflow stops without summoning either Token.
9. Repeat on a client without the companion and verify it sees ordinary DuelingBook Token artwork while the authoritative field placement remains correct.

# Marker reminders

Use two consenting accounts with version 0.12.0 or newer in an unrated Custom Cards duel.

1. Place a face-up monster on the field, open **MARKERS**, choose **Effect Negated**, and select that monster.
2. Apply it privately and confirm only the initiating client shows a compact `NEG` field badge.
3. Remove it from the active-reminders list and confirm the badge disappears without changing the card's gameplay state.
4. Apply **Cannot Attack** publicly and confirm the readable marker sentence appears in duel chat and both installed clients show `NO ATK` on the same card.
5. Remove the public marker and confirm the readable clear sentence removes it on both installed clients.
6. Apply an **Until End Phase** marker, enter the End Phase, and confirm both clients expire it after the public `Entered End Phase` log line.
7. Apply **Return in End Phase**, banish that card, and confirm the reminder remains in the active list without a field badge until the End Phase.
8. Set a monster face-down and confirm it cannot be selected or have its hidden name exposed by the Marker panel.
9. Attempt a public marker while the native chat box contains text and confirm the companion refuses to overwrite it.

# YugiFaux visual theme

1. On DuelingBook's start page, confirm the league background fills the window and Beltza replaces the native start-page monster.
2. Open the league-logo button and turn **YugiFaux visual theme** off. Confirm DuelingBook's original background layers and start-page monster return.
3. Turn the theme back on, enter a duel, and confirm the Companion's duel controls remain usable and the replacement monster does not appear over the field.
4. Reload the page several times and confirm each load shows either Beltza or Cheepflight, with no character swap during a single page session.
