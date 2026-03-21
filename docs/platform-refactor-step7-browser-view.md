# Platform refactor step 7: BrowserView.tsx

## Goal
Refactor `apps/web/src/views/BrowserView.tsx` so the top-level screen stays responsible for orchestration, while layout persistence, browser action wiring, and side-panel rendering move into smaller collaborators.

## What changed

### New view helpers
- `apps/web/src/views/browserView.shared.ts`
  - shared `BrowserViewProps`
  - browser tab/location helpers
  - pane width helpers
  - timestamp formatting helper

- `apps/web/src/views/useBrowserViewLayout.ts`
  - owns active tab state
  - owns top-search scope mode state
  - owns rail/inspector width + collapsed state
  - persists pane state to `localStorage`
  - handles browser tab sync with location search params
  - exposes pane resize handlers and layout CSS vars

- `apps/web/src/views/useBrowserViewActions.ts`
  - owns top-search result activation behavior
  - owns scope analysis add-to-canvas behavior
  - owns contained/peer entity add-to-canvas behavior
  - keeps search-scope syncing logic close to search action handling

- `apps/web/src/views/BrowserViewCenterContent.tsx`
  - owns empty-state rendering
  - owns the center workspace stage shell
  - isolates `BrowserGraphWorkspace` event wiring from the main screen

- `apps/web/src/views/BrowserViewPanels.tsx`
  - `BrowserRailPanel`
  - `BrowserInspectorPanel`
  - keeps navigation, viewpoint, facts-panel, and overview-strip rendering outside the top-level screen file

### Updated top-level file
- `apps/web/src/views/BrowserView.tsx`
  - now acts as a thinner composition/orchestration shell
  - still owns workspace data loading, session bootstrap, and high-level derived labels/counts
  - delegates most local layout/controller details to the extracted helpers

## Refactoring effect
Before this step, `BrowserView.tsx` mixed:
- browser tab routing state
- pane persistence and resizing
- top-search scope synchronization
- search result activation logic
- canvas expansion helpers
- center empty-state rendering
- rail and inspector panel rendering

After this step:
- layout concerns live in `useBrowserViewLayout.ts`
- browser/canvas/search action wiring lives in `useBrowserViewActions.ts`
- panel rendering lives in `BrowserViewPanels.tsx`
- center screen content lives in `BrowserViewCenterContent.tsx`
- `BrowserView.tsx` is primarily a screen-level coordinator

## Verification
TypeScript compile check passed:

```bash
cd apps/web
npx tsc -p tsconfig.json --noEmit
```

## Notes
This step intentionally preserves the public screen entry point (`BrowserView.tsx`) and does not attempt to redesign browser behavior. The focus is structural separation only.
