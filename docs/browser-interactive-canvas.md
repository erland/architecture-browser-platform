# Browser interactive canvas

The Browser canvas is now a lightweight modelling-style **analysis workspace**.
It is still Browser-specific and entity-first, but it no longer behaves like a purely derived graph projection.

## Current behavior model

The Browser canvas now combines three layers:

1. **Persistent canvas state**
   - canvas nodes carry persisted `x/y`
   - dragged nodes are marked `manuallyPlaced`
   - pinned nodes remain explicit in session state
   - viewport state is persisted as `zoom`, `offsetX`, and `offsetY`
2. **Interaction behavior**
   - users can drag nodes directly
   - users can pan the background viewport
   - ctrl/cmd + wheel zoom keeps the pointer over the same world point
   - fit view computes a viewport for the current content bounds
3. **Placement / arrange logic**
   - new nodes are seeded near the relevant context instead of re-layouting the full canvas
   - full-canvas arrange is a manual command
   - focused arrange is a manual command
   - anchored nodes (`pinned` or `manuallyPlaced`) remain stable during arrange operations

## What the canvas is for

The canvas remains the main Browser analysis surface for:

- entities
- relationships between entities
- dependency exploration
- contained / peer entity exploration
- local analysis of a subset of a snapshot

It is **not** intended to become a general-purpose diagram editor.

## Default add policy

The Browser now follows this default rule:

- adding nodes should place only the **new** nodes
- adding nodes should **not** rearrange the full canvas automatically

Typical placement behavior:

- first insertion seeds an initial position on an empty canvas
- dependency expansion places neighbors around the focused entity
- contained / peer additions place new nodes near the related context
- append-style additions grow the current canvas without scrambling existing positions

## Manual movement behavior

Dragging updates node coordinates directly in Browser session state.

Effects of dragging:

- the node receives updated `x/y`
- the node is marked `manuallyPlaced: true`
- future arrange commands treat it as anchored unless that policy is changed deliberately later

This preserves the user’s mental map better than the old derived-layout behavior.

## Viewport behavior

Viewport state now lives in Browser session state instead of local component-only zoom state.

Current viewport capabilities:

- background pan
- zoom slider
- ctrl/cmd + wheel zoom around pointer
- fit view

The viewport is intended to behave like a lightweight world/screen transform over the current canvas content.

## Arrange commands

The old passive re-layout behavior has been replaced by explicit commands.

### Arrange all

- manual toolbar action
- repositions eligible nodes into a deterministic full-canvas arrangement
- preserves anchored nodes

### Arrange around focus

- manual toolbar action
- arranges around the currently focused entity
- keeps anchored focused nodes in place when they are pinned or manually placed
- preserves other anchored nodes while repositioning eligible nodes nearby

## Pinning and manual placement policy

The Browser now treats these nodes as **anchored** during arrange operations:

- pinned nodes
- manually placed nodes

That means:

- users can stabilize important landmarks with pinning
- any node the user drags becomes part of the stable mental map
- arrange commands affect the movable subset instead of resetting the full workspace

## Main implementation seams

### Session state

Primary ownership lives in:

- `apps/web/src/browserSessionStore.ts`
- `apps/web/src/contexts/BrowserSessionContext.tsx`

This layer owns:

- positioned nodes
- pinning / manual placement metadata
- selection / focus
- viewport state
- arrange commands

### Placement and arrange utilities

Primary ownership lives in:

- `apps/web/src/browserCanvasPlacement.ts`

This layer owns:

- seed placement
- incremental placement
- arrange-all behavior
- arrange-around-focus behavior
- anchored-node preservation rules

### Viewport interaction math

Primary ownership lives in:

- `apps/web/src/browserCanvasViewport.ts`

This layer owns pure calculations for:

- drag movement at zoom
- panning
- pointer-centered zoom
- fit view
- zoom clamping

### Workspace rendering and gesture handling

Primary ownership lives in:

- `apps/web/src/components/BrowserGraphWorkspace.tsx`
- `apps/web/src/browserGraphWorkspaceModel.ts`

This layer should:

- consume persisted positions and viewport state
- derive renderable nodes / edges / bounds
- translate pointer interaction into store updates

It should **not** go back to inventing node positions during normal rendering.

## Regression safety net

The focused safety net for the interactive canvas now includes:

- `apps/web/src/__tests__/browserSessionStore.test.ts`
- `apps/web/src/__tests__/browserGraphWorkspaceModel.test.ts`
- `apps/web/src/__tests__/browserGraphWorkspace.test.ts`
- `apps/web/src/__tests__/browserCanvasViewport.test.ts`

These tests are intended to protect:

- persisted node positioning
- dragging semantics
- viewport pan/zoom/fit calculations
- anchored-node behavior during arrange commands
- toolbar affordance visibility

## Follow-up candidates

Natural next improvements after this phase:

1. keyboard shortcuts for zoom / fit / arrange / selection
2. richer node-grouping / clustering behavior
3. better relationship labeling and edge readability
4. selection history / breadcrumbs / navigation memory
5. route-level Browser rendering and interaction tests
6. optional session persistence across reloads if that becomes valuable

## Behavioral guardrails

Keep these rules unless there is a deliberate product decision to change them:

- Browser canvas stays analysis-first, not a general diagram editor
- adding nodes should not implicitly rearrange the whole canvas
- arrange is manual
- user-dragged nodes count as anchored
- pinned nodes count as anchored
- rendering/model code consumes layout state instead of owning it
