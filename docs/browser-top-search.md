# Browser local top search (Step 9)

## Goal

Move Browser search into the top of the focused Browser workspace so discovery becomes part of the main local browsing workflow instead of depending on a separate backend-driven Browser tab.

## What changed

- Added `BrowserTopSearch` in the Browser top bar.
- Search now reads from the Browser session's local snapshot index.
- The user can switch search scope between:
  - **Current scope** (selected scope branch only)
  - **Entire snapshot**
- Selecting a result now drives Browser-local actions:
  - scope hit -> select scope and move to Layout mode
  - entity hit -> add entity to canvas/session focus and move to Search mode
  - relationship hit -> focus relationship and move to Dependencies mode

## Notes on migration state

This step is intentionally additive:

- The old Search tab still exists.
- `useBrowserExplorer` still powers the old tab content.
- The new top search is already local-first and uses the prepared full snapshot payload plus in-memory indexes.

That means later steps can continue replacing the center/right workspace without losing the new top-level discovery workflow.

## Files primarily involved

- `apps/web/src/components/BrowserTopSearch.tsx`
- `apps/web/src/views/BrowserView.tsx`
- `apps/web/src/browserSessionStore.ts`
- `apps/web/src/browserSnapshotIndex.ts`
- `apps/web/src/styles.css`
