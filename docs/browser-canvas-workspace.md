# Browser local refactor — Step 10: Canvas graph workspace

## Goal

Turn the center of Browser into a local graph surface driven by the prepared snapshot cache, the local snapshot index, and the dedicated Browser session store.

## What changed

- Added `apps/web/src/components/BrowserGraphWorkspace.tsx`
- Added `apps/web/src/browserGraphWorkspaceModel.ts`
- Reworked `BrowserView.tsx` so the main center stage is now a canvas-first workspace
- Kept the old mode-specific explorer content as a secondary detail tray beneath the canvas for incremental migration

## Current behavior

- The center stage now shows a local canvas graph instead of leading with the old server-driven tab body.
- Canvas nodes come from Browser session state:
  - scopes added from the left navigation tree
  - entities added from local search or from the new canvas toolbar
  - dependency expansions added through the Browser session graph actions
- Canvas edges come from locally indexed relationships only.
- The canvas supports basic actions needed for the next steps:
  - focus scope/entity/relationship
  - add selected scope
  - add entities from the selected scope
  - expand dependencies for an entity
  - remove an entity
  - clear canvas
  - fit view

## Why this matches Step 10

This step introduces the graph workspace without yet finishing all analysis interactions or facts-panel behavior. It creates the local canvas surface and makes it the primary Browser center area, while preserving the existing explorer detail components as a temporary secondary tray until later steps complete the migration.
