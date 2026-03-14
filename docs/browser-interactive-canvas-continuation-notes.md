# Browser interactive canvas continuation notes

This note is intended for a future chat together with the latest zip so interactive-canvas work can continue without hidden context.

## Current position

The Browser canvas refactor is complete through these changes:

1. baseline seam documented
2. persistent positioned nodes added
3. graph workspace model now consumes positions
4. contextual seed / incremental placement added
5. manual node dragging added
6. persisted viewport model added
7. explicit arrange commands added
8. anchored pin/manual-placement semantics added
9. focused interactive-canvas regression coverage added

The Browser canvas should now be understood as a **state-owned interactive analysis workspace**.

## Mental model

Use this mental model when making future changes:

- **Tree** = structural navigation
- **Facts panel** = explanation + bridge into entity analysis
- **Canvas** = interactive analysis surface with stable user-owned layout

The Browser canvas is not just a derived graph projection anymore.

## Where the important logic lives

### Layout state

Owned primarily by:

- `apps/web/src/browserSessionStore.ts`

Key state concepts:

- `canvasNodes[]` with `x`, `y`, `pinned?`, `manuallyPlaced?`
- `canvasViewport` with `zoom`, `offsetX`, `offsetY`
- focus / selection / edge membership

### Interaction logic

Owned primarily by:

- `apps/web/src/components/BrowserGraphWorkspace.tsx`
- `apps/web/src/browserCanvasViewport.ts`

Responsibilities:

- drag gestures
- pan gestures
- zoom behavior
- fit view behavior
- translating pointer events into store updates

### Arrange / placement algorithms

Owned primarily by:

- `apps/web/src/browserCanvasPlacement.ts`

Responsibilities:

- empty-canvas seed placement
- incremental contextual placement
- append behavior
- arrange all
- arrange around focus
- anchored-node preservation

### Rendering derivation

Owned primarily by:

- `apps/web/src/browserGraphWorkspaceModel.ts`

Responsibilities:

- build node view models
- derive edge endpoints from current node positions
- compute canvas content bounds
- expose stable render metadata

This file should remain a render-derivation layer, not a layout owner.

## Key policies that should stay true

1. **No implicit full re-layout on add**
   - adding nodes should place only the new nodes near the relevant context
2. **Arrange is explicit**
   - full arrange and focused arrange are manual actions
3. **Anchored nodes stay stable**
   - pinned nodes and manually placed nodes should not be casually overwritten
4. **Viewport is real state**
   - pan/zoom/fit should operate on persisted viewport state, not ad hoc local heuristics
5. **Canvas stays analysis-first**
   - do not drift toward arbitrary diagram-authoring unless that becomes a deliberate product change

## Tests to inspect first

For interactive-canvas changes, inspect these first:

- `apps/web/src/__tests__/browserSessionStore.test.ts`
- `apps/web/src/__tests__/browserGraphWorkspaceModel.test.ts`
- `apps/web/src/__tests__/browserGraphWorkspace.test.ts`
- `apps/web/src/__tests__/browserCanvasViewport.test.ts`

These cover the most important behavior contracts of the current design.

## Likely future improvements

The most natural next candidates are:

1. keyboard shortcuts
   - zoom in/out
   - fit view
   - arrange all / arrange around focus
   - selection helpers
2. richer selection behavior
   - box/lasso selection if needed
   - keyboard navigation between visible nodes
3. better visual readability
   - clearer relationship labels
   - improved edge routing / overlap handling
   - stronger group/context hints
4. persistence polish
   - optional canvas session persistence across reloads
   - saved analysis views only if there is a clear product need
5. higher-level UI coverage
   - more route-level interaction coverage around the Browser shell

## Good prompts for a later chat

### Continue interactive canvas polish

```text
Can you do a source code analysis of the attached architecture-browser-platform zip, summarize the current Browser interactive-canvas architecture, and recommend the highest-value next improvement after the interactive canvas refactor? Then create a downloadable step-by-step plan.
```

### Implement the next interaction improvement directly

```text
Can you do a source code analysis of the attached architecture-browser-platform zip, confirm the current Browser interactive-canvas architecture, and implement the next highest-value interactive canvas improvement you recommend first?
```

### Cleanup-focused follow-up

```text
Can you do a source code analysis of the attached architecture-browser-platform zip and identify any Browser canvas code paths, tests, or docs that still reflect the old derived-layout mental model and should now be cleaned up?
```
