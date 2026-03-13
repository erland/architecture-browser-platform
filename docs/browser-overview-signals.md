# Browser compact overview signals

Step 13 reintroduces overview information in Browser without bringing back a large overview-first screen.

## What changed

Browser now shows a compact overview strip above the canvas with three cards:

- **Snapshot health** — completeness, coverage, diagnostics, and warnings
- **Scope context** — current selected scope path and local counts
- **Analysis state** — focused element, current search scope/query, and canvas/search activity

## Design intent

The strip keeps overview information visible while preserving the navigation-tree + top-search + canvas + facts-panel workflow as the primary interaction model.

The data is derived entirely from the prepared local snapshot payload and Browser session state. No browser-specific backend projection endpoints are used.
