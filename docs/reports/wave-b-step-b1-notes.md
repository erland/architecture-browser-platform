# Wave B — Step B1 ownership boundaries documented

This step adds an explicit browser-local ownership note so the Wave B refactors can follow a shared boundary model instead of moving helpers opportunistically.

## Added
- `docs/browser-local-ownership-boundaries.md`

## What the note defines
- snapshot lookup/query ownership in `browserSnapshotIndex*`
- projection ownership in `browserProjectionModel.ts` and `browserGraphWorkspaceModel.ts`
- session/store ownership in `browserSessionStore*`
- canvas placement ownership in `browserCanvasPlacement.ts`
- viewport ownership in `browserCanvasViewport.ts`
- viewpoint/presentation ownership split across semantic, policy, and state-transition modules
- React/rendering ownership in views, hooks, and components

## Why this matters before B2–B4
The next steps split shared index helpers, placement helpers, and canvas store logic. Without a written boundary reference, those refactors could still improve file size while leaving responsibility drift in place.

This document is intended to be the reference point for:
- B2 `browserSnapshotIndex.shared.ts`
- B3 `browserCanvasPlacement.ts`
- B4 `browserSessionStore.canvas.ts`

## Verification note
This is a documentation-only step. No runtime behavior was intentionally changed.
