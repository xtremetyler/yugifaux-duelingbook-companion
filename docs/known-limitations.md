# Known limitations

- The repository URLs are configured, but the first push must complete before remote configuration and Tampermonkey update checks can succeed.
- The first Cloudinary artwork and card name are configured, but the exact public DuelingBook effect-declaration wording still requires a consenting live-room capture.
- Exact authenticated duel-log wording has not been captured, so automatic recognition is implemented conservatively but remains unproven in a live duel.
- Player/player and spectator synchronization have not yet been measured.
- Once-per-duel state resets manually in the simulation and when the log empties; a reliable public duel-boundary signal still needs validation.
- The POC observes rendered visible log text. It does not access DuelingBook's underlying event objects, which reduces risk but may be less precise.
- The mute setting is present, but the CSS-only test animation has no audio.
- The standalone animation manifest is an example for the next extraction step; Phase 1 embeds its single mapping in the main configuration.
- The update URL tracks the `main` branch. Tagged release URLs and a release workflow should be considered after the proof of concept stabilizes.
- Match launching, reminders, introductions, judge tools, streamer mode, and analytics are out of scope for this pass.
# Token macro limitations

- Custom Token names, artwork, Level, Attribute, Type, and stat labels are companion presentation. DuelingBook still treats each summoned card as a generic Token.
- Players without the companion see DuelingBook's corresponding built-in carrier Token artwork.
- Bloom artwork variants currently reserve built-in DuelingBook Token IDs 1 through 6 as synchronization carriers. Manually summoning those same carrier images outside the macro can therefore receive a Bloom skin on installed companions.
- Token macros use DuelingBook's visible Token selector and zone-selection controls. A DuelingBook UI change can safely stop the macro until its selectors are updated.

# Chain macro limitations

- Chain messages rely on DuelingBook's native `#duel .cin_txt` input and Enter-key handler. DuelingBook keeps that native control transparent beneath its custom-rendered chat field, so the companion detects it by active layout presence rather than CSS opacity. If that interface changes, the fixed message remains in the chat box for the player to send manually.
- The avatar flash is companion-only and is synchronized from the newly rendered public `⛓️ Chain Link N` chat row. Players without the companion still see the ordinary chat declaration.
- The chain sound is companion-only, follows the global **Mute audio** setting, and requires the player to have interacted with DuelingBook once so the browser can unlock audio playback.

# Custom macro limitations

- Custom macros intentionally use DuelingBook's page-level player arrays and `Send` function, matching the behavior required for Custom DB-compatible gameplay functions. A DuelingBook internal API change can stop individual functions until their mappings are updated.
- Macro definitions are stored only in the player's Tampermonkey storage. They do not synchronize between browsers or devices.
- The parser supports Custom DB's `-- Category` and `Button | action | action` format, the documented variables, `~` argument separator, and the allowlisted functions shown in the editor. It does not execute arbitrary JavaScript.
- Functions that open DuelingBook's native zone chooser end the remaining macro sequence so the player can finish that interactive action safely.
- Player-created macros can move multiple cards immediately. Test new gameplay macros in a consenting unrated room before league use.

# Marker limitations

- Markers are reminders, not rules enforcement. They never prevent attacks, activations, position changes, or other DuelingBook actions.
- Private markers exist only in the current page session. Public markers synchronize only to installed companions that receive the readable marker chat declaration.
- Automatic End Phase expiration depends on DuelingBook's visible public `Entered End Phase` duel-log line. A filtered or unavailable duel log can require manual removal.
- Face-down cards are deliberately excluded so marker selection never reveals hidden card names.
