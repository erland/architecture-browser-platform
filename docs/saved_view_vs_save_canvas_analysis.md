# Saved view vs save canvas analysis

## Purpose

This document analyzes whether the currently retained saved-view frontend and API surface is a good basis for a future **save canvas** feature, or whether it should later be replaced by a more Browser-session-oriented persistence model.

## Current saved-view shape

The current saved-view frontend model is centered around `apps/web/src/savedViewModel.ts` and the saved-view related types and API methods that remain in the repo.

### What saved view currently captures

The current `SavedViewState` stores mainly older explorer-style query and layout selection state:

- selected search scope id
- search query
- selected search entity id
- selected layout scope id
- selected dependency scope id
- dependency direction
- focused dependency entity id
- selected entry-point scope id
- entry category
- focused entry-point id

The `buildSavedViewRequest(...)` helper serializes that into two buckets:

- `queryState`
- `layoutState`

with `viewType` fixed to `SNAPSHOT_BROWSER`.

## Current Browser session shape

The live Browser-only frontend now revolves around `BrowserSessionState`.

That state already includes much richer canvas-oriented information, including:

- active snapshot identity
- selected scope id
- selected entity ids
- search query and search scope
- canvas nodes with x/y positions
- canvas edges
- focused element
- facts panel mode and location
- graph expansion actions
- viewpoint selection
- applied viewpoint
- viewpoint presentation preference
- canvas layout mode
- tree mode
- canvas viewport (zoom and offsets)

The persisted Browser session state also keeps most of that information locally in browser storage.

## Fit assessment

## 1. Is saved view the same thing as save canvas?

No.

It is **related**, but it is **not the same thing**.

The current saved-view model looks like an older snapshot-browser state capture focused on:

- search/filter context
- dependency/entry-point explorer context
- some high-level layout/focus choices

A future **save canvas** feature for the current Browser-only app would most likely need to persist a much richer subset of `BrowserSessionState`.

## 2. What save canvas would probably need to persist

A real save-canvas feature likely needs most or all of these:

- active snapshot reference
- selected scope/entity context
- graph/canvas node placement
- pinned/manual placement flags
- visible edges or graph expansion results
- canvas layout mode
- viewport zoom and pan offset
- viewpoint selection and apply mode
- presentation preference (for example compact UML vs entity graph)
- possibly facts panel placement/mode
- possibly tree mode

The current saved-view shape does **not** capture most of those things.

## 3. What saved view can still be useful for

Even though it is not sufficient as-is, the current saved-view slice is still useful in three ways.

### Useful as a product seam

The repository already has a concept of a named, persisted, user-defined view for a snapshot. That is very close to the product concept you probably want.

### Useful as an API/persistence seam

The repo already has:

- saved-view records
- saved-view API endpoints
- create/duplicate/delete lifecycle
- a stable place in the domain for per-snapshot user state

That means you do not need to invent the persistence concept from scratch.

### Useful as migration starting point

You could evolve saved view from an explorer-oriented state payload into a Browser-session-oriented state payload, rather than deleting it and inventing a completely separate concept immediately.

## Gap analysis

## What the current saved-view model is missing for canvas persistence

The biggest gaps are:

### Missing canvas placement

The current model does not store canvas nodes with positions, pinned state, or manual placement.

### Missing viewport state

The current model does not store zoom or pan/offset.

### Missing viewpoint state

The current model does not appear to store the current viewpoint selection, apply mode, or presentation preference.

### Missing richer Browser selection state

The current model is tied to older dependency/entry-point/search selections rather than the current Browser graph workspace semantics.

### Missing facts panel / Browser layout state

The current model does not clearly represent the current Browser shell layout choices.

## Best interpretation

The best interpretation is:

- **saved view is not currently a full save-canvas implementation**
- **saved view is still the best existing foundation to evolve from**

So the right near-term decision is usually:

- keep saved view
- do not expose it yet unless you are happy with the user experience
- later redesign the saved-view payload around Browser session persistence

## Recommended direction

## Recommendation: evolve, do not delete

The recommended choice is:

**Keep and evolve saved view into save canvas.**

That means:

1. keep the saved-view record/API concept
2. stop thinking of it as an old explorer helper
3. later redefine the saved-view payload around Browser session state
4. add a migration layer if older saved-view payloads need to continue working

## Suggested target model

A future saved view / saved canvas payload should likely be based on a deliberately chosen subset of `BrowserSessionState`, for example:

- snapshot id / snapshot key
- selected scope id
- selected entity ids
- search query / search scope
- canvas nodes
- canvas edges or graph expansion actions
- focused element
- facts panel mode / location
- viewpoint selection
- viewpoint presentation preference
- canvas layout mode
- tree mode
- canvas viewport

You may want a separate stored payload type such as `SavedCanvasState` rather than directly serializing all of `BrowserSessionState`.

## Why not delete it now

Deleting saved view now would likely throw away:

- a useful persistence concept
- existing API endpoints and domain terminology
- a natural place for named reusable canvas states

Since you already suspect you may want to save a canvas later, deletion now would create avoidable rework.

## Decision

## Final decision for now

- **Keep** saved-view foundations
- **Do not** treat the current payload shape as the finished save-canvas solution
- **Plan** to evolve saved view into a Browser-session-based saved canvas later
- **Do not** remove saved-view API/model code during the current unreachable-frontend cleanup wave

## Practical next step after this cleanup wave

When you are ready to work on save canvas, the next design step should be:

1. define the exact user-visible behavior for save canvas
2. define a `SavedCanvasState` payload based on the Browser-only session model
3. decide whether to:
   - replace the current saved-view payload shape, or
   - version it and support both old and new shapes
4. then expose save/load actions in the Browser UI
