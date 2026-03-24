# Step 10 — Final terminology and UX cleanup

This step finishes the browser-only frontend cleanup by removing leftover user-facing wording and dead UI artifacts from the older multi-screen shell.

## What changed

- Updated the Browser shell copy so the app consistently presents itself as **Browser** / **Architecture Browser** instead of an "analysis workspace".
- Updated the source-tree initialization prompt so it refers to a **single source tree catalog** instead of exposing workspace language in normal UI.
- Updated the prepared snapshot overview so it shows **Catalog** context instead of **Workspace** context.
- Removed dead frontend artifacts left behind from the retired route-based screens:
  - `WorkspaceManagementSection.tsx`
  - `WorkspaceDetailsSection.tsx`
  - `RepositoryManagementSection.tsx`
  - `SnapshotCatalogSection.body`
  - `appModel.operations.ts`
- Removed the stale `appModel.operations` re-export from `appModel.ts`.
- Removed leftover compare/audit-only CSS selectors from `styles.css`.

## Result

The frontend now presents a consistent browser-only experience:

- launch into Browser
- manage source trees from the Source tree dialog
- use Browser terminology in the visible shell
- avoid exposing Compare / Operations / workspace-page concepts in the active UX

## Verification

Recommended local checks:

```bash
(cd apps/web && npm run typecheck)
(cd apps/web && npm run test)
```
