# Browser Interactive Canvas Step 1 — Baseline and State/Layout Seam

## Purpose

This note establishes a safe baseline before changing Browser canvas positioning semantics. The goal is to document where the current Browser canvas behavior lives today, what assumptions it makes, and where the refactor seam is for later steps.

The Browser canvas is currently an **analysis projection** over Browser session state, not a modelling surface with persistent node placement.

## Current Browser canvas flow

### 1. Browser session bootstrap and long-lived session state

The Browser route opens a Browser session around a prepared snapshot payload and stores the session in the dedicated Browser state/context.

Key files:

- `apps/web/src/hooks/useBrowserSessionBootstrap.ts`
- `apps/web/src/contexts/BrowserSessionContext.tsx`
- `apps/web/src/browserSessionStore.ts`
- `apps/web/src/views/BrowserView.tsx`

Important current state in `browserSessionStore.ts`:

- `canvasNodes`: lightweight semantic entries (`scope` / `entity`) with optional `pinned`
- `canvasEdges`: semantic relationship entries between entities
- `focusedElement`
- `selectedEntityIds`
- `selectedScopeId`
- `canvasLayoutMode`: `grid` or `radial`
- `fitViewRequestedAt`

Important observation:

- `canvasNodes` do **not** currently persist `x/y` coordinates.
- Browser session state owns **membership**, **selection**, **focus**, and a coarse **layout mode**, but not explicit node positions.

### 2. Local browser exploration/index layer

The prepared snapshot is converted into a local browser index used for navigation, search, facts, and dependency expansion.

Key file:

- `apps/web/src/browserSnapshotIndex.ts`

This index provides the source data that Browser canvas commands use when they add nodes and edges.

### 3. Node add / expansion commands

Browser canvas membership is changed through store commands in `browserSessionStore.ts`.

Current node-add paths include:

- `addEntityToCanvas(...)`
- `addEntitiesToCanvas(...)`
- `addPrimaryEntitiesForScope(...)`
- `addScopeToCanvas(...)`
- `addDependenciesToCanvas(...)`

User-facing entry points into those commands are wired from multiple Browser surfaces:

- left navigation tree
- top search
- facts/details panel
- graph workspace action toolbar / entity actions

Important observation:

- All add paths currently add semantic nodes/edges only.
- None of the add paths seed persistent coordinates.
- Dependency expansion pins the focal entity semantically, but position is still derived later by layout generation.

### 4. Workspace model builder

The graph workspace model is built in:

- `apps/web/src/browserGraphWorkspaceModel.ts`

This file is the current source of truth for node coordinates.

Current behavior:

- Builds scope node view-models from `state.canvasNodes`
- Builds entity node view-models from `state.canvasNodes`
- Computes layout in one of two modes:
  - `buildGridLayout(...)`
  - `buildRadialLayout(...)`
- Assigns `x/y/width/height` during model building
- Builds edge endpoints from those computed node positions
- Derives final workspace width/height from the computed layout bounds

Important observation:

- The model layer currently **owns node placement**.
- Layout is recomputed on every model build / rerender.
- The model is therefore both a **view-model derivation layer** and a **layout engine**.

### 5. Visual graph workspace component

The Browser canvas UI is rendered in:

- `apps/web/src/components/BrowserGraphWorkspace.tsx`

Current behavior:

- Calls `buildBrowserGraphWorkspaceModel(state)`
- Renders node cards and SVG edge layer using model coordinates
- Tracks a lightweight component-local `zoom` state
- Responds to `fitViewRequestedAt` by adjusting local zoom heuristically
- Exposes entity expansion, remove, pin, isolate, clear, relayout, and fit-view actions

Important observation:

- The visual workspace does not currently own a real viewport model with persistent pan/zoom offsets.
- “Fit view” is currently a presentational zoom heuristic, not a viewport computation over persisted positions.

## Where node positions are currently derived

Node positions are currently derived in:

- `apps/web/src/browserGraphWorkspaceModel.ts`

Specifically:

- `buildGridLayout(...)`
- `buildRadialLayout(...)`

These functions assign the effective `x/y` coordinates used by the canvas.

This is the main seam for the interactive-canvas refactor.

## Current edge assumptions

Edges are currently computed in `buildBrowserGraphWorkspaceModel(...)` from:

- semantic edge state in `state.canvasEdges`
- computed node positions from the current layout pass

Current assumptions:

- an edge endpoint can only be computed after the current render-time layout pass has assigned positions to its endpoint nodes
- edge routing is simple left-to-right straight-line geometry based on rectangular node bounds
- edge rendering is tightly coupled to the current derived node positions

This means later steps must preserve a consistent node-position source of truth so that edges can continue to resolve endpoint geometry deterministically.

## Current “derived layout” behavior

Today the Browser canvas behaves like this:

- Browser state says which nodes/edges are on the canvas
- the model builder decides where those nodes appear
- changing layout mode (`grid` / `radial`) changes placement for the whole canvas
- rerendering can recompute positions for all nodes
- “pinning” influences layout behavior, but does not mean “this node keeps an explicit user-chosen position”

This is appropriate for a lightweight analysis projection, but it is the reason the current Browser canvas does not yet behave like a modelling-tool surface.

## Target seam for later steps

The intended direction for the interactive canvas refactor is:

### Current split

- **Session state**: semantic membership, focus, selection, pinning flag, layout mode
- **Model layer**: placement + render derivation
- **View component**: rendering + lightweight zoom heuristic

### Target split

- **Session state**: semantic membership, focus, selection, pinning, manual-placement metadata, explicit node positions, viewport state
- **Model layer**: render derivation only (selection/focus flags, labels, bounds, edge endpoints from persisted positions)
- **View component / interaction controller**: drag, pan, zoom, fit-view, pointer interaction
- **Layout utilities**: seed placement, incremental placement, explicit arrange commands

The most important architectural change is therefore:

> Move layout ownership from `browserGraphWorkspaceModel.ts` into long-lived Browser session state plus explicit layout utilities.

## Files expected to change in later interactive-canvas steps

### Primary files

- `apps/web/src/browserSessionStore.ts`
- `apps/web/src/contexts/BrowserSessionContext.tsx`
- `apps/web/src/browserGraphWorkspaceModel.ts`
- `apps/web/src/components/BrowserGraphWorkspace.tsx`

### Likely supporting files

- `apps/web/src/views/BrowserView.tsx`
- `apps/web/src/components/BrowserFactsPanel.tsx`
- `apps/web/src/components/BrowserNavigationTree.tsx`
- `apps/web/src/components/BrowserTopSearch.tsx`
- `apps/web/src/__tests__/browserGraphWorkspace.test.ts`
- `apps/web/src/__tests__/browserGraphWorkspaceModel.test.ts`
- `apps/web/src/__tests__/browserArchitectureWorkflow.test.ts`
- `apps/web/src/__tests__/browserEntityFirstRegression.test.ts`
- `apps/web/src/__tests__/browserSessionStore.test.ts`

### Likely new files in later steps

- Browser canvas layout helper module(s)
- Browser viewport helper / controller module(s)
- additional focused interaction tests for drag / pan / fit-view behavior

## Step 1 outcome

Step 1 does not change Browser canvas behavior. It documents the current architecture and identifies the seam so that later steps can:

1. add persistent positioned nodes safely
2. move placement out of the model builder
3. introduce real viewport behavior without mixing concerns
4. keep Browser’s entity-first analysis flow intact

## Reference note regarding `pwa-modeller`

The relevant pattern to borrow conceptually from `pwa-modeller` is not the full canvas implementation, but the separation between:

- long-lived canvas state
- interaction handling
- layout utilities

No direct code reuse is introduced in this step.
