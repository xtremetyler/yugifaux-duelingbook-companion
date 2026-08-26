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
