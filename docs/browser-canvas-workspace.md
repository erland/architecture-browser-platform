# Browser canvas graph workspace

The Browser canvas is now explicitly **entity-first**.

## Current role of the canvas

The canvas is the main analysis surface for:

- entities
- relationships between entities
- focused expansion actions such as dependencies, containment, peers, and callers/callees

It is no longer intended to be a mixed scope/entity canvas by default.

## Preferred canvas node types

Normal canvas usage should primarily involve entities such as:

- `MODULE`
- `FUNCTION`
- `CLASS`
- `INTERFACE`
- `PACKAGE` entity
- `SERVICE`
- `ENDPOINT`
- `CONFIG_ARTIFACT`

## Current toolbar direction

The toolbar now favors entity-first actions.
Examples include:

- add primary entities for the selected scope
- add direct entities
- add subtree entities
- entity-type-specific actions such as contained/dependencies/calls/used-by

## Advanced scope-node path

Scope nodes still exist, but only as an advanced/debug affordance.
Use them only when explicit container context is needed.
They should not be the default Browser workflow.


## Interactive layout behavior

The canvas now behaves like a lightweight interactive analysis workspace:

- nodes have persisted positions
- users can drag nodes directly
- viewport state supports pan, zoom, and fit view
- newly added nodes are seeded incrementally near relevant context
- full-canvas arrange is manual
- focused arrange is manual
- pinned and manually placed nodes stay anchored during arrange operations

The current detailed documentation lives in:

- `docs/browser-interactive-canvas.md`
- `docs/browser-interactive-canvas-continuation-notes.md`
