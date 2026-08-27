# YugiFaux DuelingBook Companion

This repository contains a player-controlled Tampermonkey companion for YugiFAUX league matches on DuelingBook.

The current build:

- adds a small `YF` button and collapsible control panel;
- provides a guided `Start YugiFAUX Match` launcher with a session-only match identifier, fixed Custom Cards and best-of-three settings, an exact league note, no password, and an explicit review before hosting;
- adds a manual right-side `TOKENS` macro that lets the player choose a supported source monster and explicitly confirm its Token recipe;
- plays the embedded recorded Token summon sound when a supported Token reaches the field, synchronized for installed players with **Mute audio** turned off;
- adds a compact right-side `CHAIN` menu for visible, player-initiated `⛓️ Chain Link 1` through `⛓️ Chain Link 8` chat declarations;
- adds an opt-in, locally stored Custom DB-compatible macro editor and right-side `MACROS` menu with categories, variables, waits, messages, and an allowlisted set of player-triggered duel functions;
- extends those functions with Attack/Defense Special Summons from the hand using an interactive zone chooser, a DuelingBook-chosen zone, or an ordered list of preferred zones;
- adds a `MARKERS` tab for player-applied reminders including Effect Negated, Cannot Attack, Cannot Activate Effects, battle-position locks, End Phase returns, and custom notes;
- supports private reminders or readable public chat declarations that synchronize field badges between installed companions, with manual or End Phase expiration;
- presents active reminders as stable color-coded medallions—vertical along Attack Position cards and horizontal across Defense Position cards—with full details revealed on hover; public sharing is enabled by default;
- keeps public marker chat concise—for example, `‼️ Xigg, the Lost — Return in End Phase (Until End Phase)`—adding a location only when identical face-up card names require disambiguation;
- flashes a chain emoji over the declaring player's avatar when an installed companion receives that public chat line;
- plays the embedded recorded Chain sound for installed players who have **Mute audio** turned off;
- supports `Polyflora Hexbloom` by selecting two distinct Bloom artworks from six approved variants, requiring two open Monster Zones, and using DuelingBook's visible native Token controls;
- presents those Tokens to installed companions as `Bloom Token` (Plant/WIND/Level 2/ATK 0/DEF 0) while leaving DuelingBook's authoritative generic Token state untouched;
- loads a versioned JSON configuration and falls back to the last valid cache or bundled defaults;
- passively observes visible public text added to DuelingBook's duel log;
- recognizes `Ash Blossom & Lonely Spring` when a visible public log line is classified as an effect declaration;
- plays a pink petal-bloom overlay using the approved Cloudinary artwork without receiving pointer input;
- plays a five-color magical wisp, flower, and fairy-dust overlay for `Polyflora Hexbloom`;
- plays a speed-adjusted cinematic trap chase with warning flashes, flying pages, and a closing frame for `No Way Out!`;
- resolves Iris's excavation visually by sending three reflected card backs toward the hand, GY, and face-down banishment;
- stages a psychedelic concert entrance with rising notes, equalizer bars, spotlights, and beat pulses for `Sgt. Pepper's Lonely Hearts Club Band`;
- includes animation, mute, reduced-motion, diagnostics, and emergency-disable controls;
- does not read cookies, alter DuelingBook functions, or transmit data outside DuelingBook; Token summons require player confirmation and player-selected native zones, while Chain messages use DuelingBook's visible chat input. Opt-in custom macros can inspect the current player's own duel arrays and call DuelingBook's native sender only with fixed, allowlisted actions initiated by the player.

## Install the proof of concept

1. Install Tampermonkey in current Chrome or Edge.
2. Open the [raw userscript](https://github.com/xtremetyler/yugifaux-duelingbook-companion/raw/refs/heads/main/dist/yugifaux-companion.user.js).
3. Approve the installation in Tampermonkey.
4. Open `https://www.duelingbook.com/`.
5. Click the `YF` button near the lower-left corner.
6. Use the named preview buttons to test any configured animation without entering a duel.

During an active duel, `TOKENS`, `CHAIN`, and `MARKERS` buttons appear along the right side. Enabling **Custom macros** adds a `MACROS` button. Open **YF → Manage Custom Macros** to paste Custom DB-format definitions such as `Button | message | ${function(arguments)}`. The Chain and public Marker tools send explicit readable chat declarations; they never use hidden synchronization messages.

Hand Special Summon examples:

- `SS Hand ATK | ${specialFromHandInAtk(Card Name)}` opens DuelingBook's native zone chooser and summons in Attack Position.
- `SS Hand DEF | ${specialFromHandInDef(Card Name)}` opens the chooser and summons in Defense Position.
- `SS Hand Preferred | ${specialFromHandInDefToZone(Card Name~M3~M2~M4)}` uses the first available listed zone.
- Add `RandomZone` before the parentheses—for example, `${specialFromHandInAtkRandomZone(Card Name)}`—to let DuelingBook choose an available zone.

Tampermonkey checks the repository's built userscript for core updates. League configuration loads independently from the versioned JSON in `config/companion.sample.json`, allowing data changes without reinstalling the script.

## For league testers

Use only consenting test accounts in an unrated Custom Cards room. Keep audio muted for the first test. If anything looks wrong, click **Emergency disable**; DuelingBook should remain usable because the companion does not replace its functions or intercept its network traffic.

The first real two-client test needs the DuelingBook name of a public test card and an original YugiFaux animation asset. Until those are provided, the manual simulation verifies the panel, settings, and non-blocking animation path, while the passive observer can be exercised with a test fixture.

## Documentation

- [Implementation plan](docs/implementation-plan.md)
- [Technical assessment and research findings](docs/technical-assessment.md)
- [Developer guide and architecture](docs/developer-guide.md)
- [Account-safety and threat review](docs/security.md)
- [DuelingBook selectors and hooks](docs/duelingbook-hooks.md)
- [Tampermonkey permissions](docs/tampermonkey-permissions.md)
- [Two-client test checklist](docs/testing.md)
- [Known limitations](docs/known-limitations.md)

## Build and verify

```powershell
npm test
```

There are no runtime or development package dependencies. The build script concatenates the small ordered modules into one installable userscript. The verifier checks the sample data and guards against wildcard network access and dynamic code execution.

## Reference project

The macro syntax, function names, and DuelingBook action mappings were implemented for compatibility with the requested [killburne/custom-duelingbook](https://github.com/killburne/custom-duelingbook) reference. Its userscript header identifies it as MIT-licensed. See [ATTRIBUTION.md](ATTRIBUTION.md).
