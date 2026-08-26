# YugiFaux DuelingBook Companion

This repository contains the Phase 1 technical proof of concept for a player-controlled Tampermonkey companion on DuelingBook.

The current build:

- adds a small `YF` button and collapsible control panel;
- loads a versioned JSON configuration and falls back to the last valid cache or bundled defaults;
- passively observes visible public text added to DuelingBook's duel log;
- recognizes `Ash Blossom & Lonely Spring` when a visible public log line is classified as an effect declaration;
- plays a pink petal-bloom overlay using the approved Cloudinary artwork without receiving pointer input;
- plays a five-color magical wisp, flower, and fairy-dust overlay for `Polyflora Hexbloom`;
- plays a speed-adjusted cinematic trap chase with warning flashes, flying pages, and a closing frame for `No Way Out!`;
- includes animation, mute, reduced-motion, diagnostics, and emergency-disable controls;
- does not automate gameplay, read cookies, inspect hidden zones, alter DuelingBook functions, or send duel data anywhere.

## Install the proof of concept

1. Install Tampermonkey in current Chrome or Edge.
2. Open the [raw userscript](https://raw.githubusercontent.com/xtremetyler/yugifaux-duelingbook-companion/main/dist/yugifaux-companion.user.js).
3. Approve the installation in Tampermonkey.
4. Open `https://www.duelingbook.com/`.
5. Click the `YF` button near the lower-left corner.
6. Use **Preview Ash Blossom**, **Preview Polyflora**, or **Preview No Way Out!** to test an animation without entering a duel.

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
