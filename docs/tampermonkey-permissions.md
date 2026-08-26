# Tampermonkey permissions

| Metadata | Why it is required |
|---|---|
| `@match https://www.duelingbook.com/*` | Limits execution to HTTPS DuelingBook pages. |
| `@run-at document-idle` | Waits for the document before adding the companion shell. |
| `@grant GM.getValue` | Reads namespaced local player settings and cached public configuration. |
| `@grant GM.setValue` | Stores those settings and the last valid configuration. |
| `@grant GM.xmlHttpRequest` | Fetches public JSON configuration despite normal cross-origin restrictions. |
| `@grant unsafeWindow` | Gives the opt-in Custom DB-compatible macro engine access to DuelingBook's current-player arrays, native card-menu functions, and `Send` function. The engine exposes only fixed allowlisted actions. |
| `@connect raw.githubusercontent.com` | Restricts that request to the planned public configuration host. |

Not requested:

- no wildcard network access;
- no cookie, clipboard, notification, download, or tab-opening grant;
- no DuelingBook API domain access;
- no Cloudinary connection until an approved asset host and real asset are supplied.

The configuration and update URLs use the public `xtremetyler/yugifaux-duelingbook-companion` repository. Browser media elements may later need explicit Cloudinary access depending on the chosen loading strategy; document that change before release.
