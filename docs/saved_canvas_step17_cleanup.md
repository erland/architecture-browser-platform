# Step 17 — Final cleanup and alignment with saved-canvas foundations

This step removes dead frontend saved-view overlap now that saved-canvas is the active browser persistence model.

## Changes

- Removed the unused frontend-only `savedViewModel.ts` helper.
- Removed the matching obsolete unit test.
- Removed unused saved-view convenience methods from `platformApi.ts`.
- Updated the frontend baseline verification script to check saved-canvas foundations instead of the removed saved-view helper.

## Intent

The backend can still retain historical saved-view support where needed, but the Browser UI and active frontend persistence path are now centered on saved canvases.
