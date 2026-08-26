# YugiFaux DuelingBook Companion

This repository contains a player-controlled Tampermonkey companion for YugiFAUX league matches on DuelingBook.

The current build:

- adds a small `YF` button and collapsible control panel;
- provides a guided `Start YugiFAUX Match` launcher with a session-only match identifier, fixed Custom Cards and best-of-three settings, an exact league note, no password, and an explicit review before hosting;
- adds a manual right-side `TOKENS` macro that lets the player choose a supported source monster and explicitly confirm its Token recipe;
- adds a compact right-side `CHAIN` menu for visible, player-initiated `⛓️ Chain Link 2` through `⛓️ Chain Link 7` chat declarations;
- flashes a chain emoji over the declaring player's avatar when an installed companion receives that public chat line;
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
- does not read cookies, inspect hidden zones, alter DuelingBook functions, call its socket sender, or send duel data anywhere; Token summons require player confirmation and player-selected native zones, while Chain messages use DuelingBook's visible chat input and native Enter handler.

## Install the proof of concept

1. Install Tampermonkey in current Chrome or Edge.
2. Open the [raw userscript](https://github.com/xtremetyler/yugifaux-duelingbook-companion/raw/refs/heads/main/dist/yugifaux-companion.user.js).
3. Approve the installation in Tampermonkey.
4. Open `https://www.duelingbook.com/`.
5. Click the `YF` button near the lower-left corner.
6. Use the named preview buttons to test any configured animation without entering a duel.

During an active duel, `TOKENS` and `CHAIN` buttons appear along the right side. The Chain menu sends one explicit public declaration per button click; it never uses hidden synchronization messages.

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

Research used [killburne/custom-duelingbook](https://github.com/killburne/custom-duelingbook) as requested. Its userscript header identifies it as MIT-licensed, but the repository root inspected on 2026-08-26 did not show a separate license file. No source code was copied into this project; only general integration lessons were used.
