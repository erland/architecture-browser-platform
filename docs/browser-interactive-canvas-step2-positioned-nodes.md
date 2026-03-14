# Browser Interactive Canvas Step 2 — Persistent Positioned Canvas Nodes

## What changed

This step moves the Browser session state one step closer to an interactive canvas by making canvas nodes carry persisted placement metadata.

`BrowserCanvasNode` now includes:

- `x`
- `y`
- `pinned?`
- `manuallyPlaced?`

## Current behavior after Step 2

- All Browser canvas add paths now insert **positioned** nodes into Browser session state.
- Position seeding happens in `browserSessionStore.ts` instead of being completely absent from long-lived state.
- Existing pin/unpin behavior remains compatible with the entity-first Browser workflow.
- Persisted/hydrated Browser session state normalizes canvas nodes so older/incomplete node entries are assigned seed coordinates.

## Important limitation retained intentionally

This step does **not** yet make the render model consume persisted positions as the source of truth.

That refactor is still deferred to Step 3.

So after Step 2 the codebase is in an intentional transitional state:

- **session state** now stores `x/y`
- **render/model layer** still computes layout as before

This keeps the behavior stable while introducing the state shape needed for later drag / pan / viewport work.

## New state/layout seam after Step 2

The main seam is now:

- `browserSessionStore.ts` owns seeded node positions
- `browserGraphWorkspaceModel.ts` still owns render-time placement

The next step is to remove that split by making the graph workspace model consume `state.canvasNodes[].x/y` directly.

## Files changed in Step 2

- `apps/web/src/browserSessionStore.ts`
- `apps/web/src/__tests__/browserSessionStore.test.ts`
- `apps/web/src/__tests__/browserEntityFirstRegression.test.ts`
- `apps/web/src/__tests__/browserGraphWorkspace.test.ts`

## Verification note

The container copy used for this update does not include the root workspace `node_modules`, so the requested Jest and TypeScript verification commands could not be executed here.
