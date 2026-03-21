# Browser compact UML presentation

The Browser now supports a **platform-local compact UML presentation mode** for class-oriented viewpoints.

This feature changes **how the canvas renders existing entities**. It does **not** change the imported snapshot contract and it does **not** require indexer support in the current implementation.

## Goal

Some viewpoints become too noisy when every class, field, and method is rendered as a separate canvas node. Compact UML presentation keeps the underlying entity model intact while projecting selected class-like entities as a single UML-style classifier box with compartments.

The current implementation is intended to improve readability for architect-facing viewpoints such as:

- persistence model
- domain model
- API contract model
- type hierarchy
- repository/entity model

## What changes in compact UML mode

When compact UML mode is active for a viewpoint:

- class-like entities are projected as a single `uml-class` canvas node
- contained field/property entities are shown in an **attributes** compartment
- contained method/function entities are shown in an **operations** compartment
- projected member entities are **suppressed as separate canvas nodes**
- relationships to suppressed member nodes are not rendered as separate edges
- the underlying imported entities still exist in the browser index and facts model

This means the Browser keeps the current fine-grained analysis model, but applies a different visual projection for the canvas.

## Presentation policy

The Browser resolves a local presentation mode for the currently selected or applied viewpoint.

Supported presentation modes:

- `auto`
- `entity-graph`
- `compact-uml`

### `auto`

Use the Browser's local default for the viewpoint id.

Current default mapping:

- `persistence-model` → `compact-uml`
- `persistence-model + show-entity-relations` → `compact-uml`
- `domain-model` → `compact-uml`
- `api-contract-model` → `compact-uml`
- `type-hierarchy` → `compact-uml`
- `repository-entity-model` → `compact-uml`
- all other viewpoints → `entity-graph`

### `entity-graph`

Force the pre-existing node-per-entity presentation.

Use this when:

- you want to inspect members as separate nodes
- the compact projection hides too much detail
- the viewpoint is not classifier-oriented

### `compact-uml`

Force the local UML-style projection where possible.

Use this when:

- the canvas is dominated by class/member structure
- you want a more diagrammatic classifier view
- the viewpoint is easier to read as classes with compartments than as separate nodes

## Inspector and details behavior

Compact UML is only a canvas projection.

The Browser still uses the **real imported entities** for inspection and details:

- selecting a compact UML class node still resolves to the underlying class-like entity
- clicking a member row in a compartment focuses the real underlying field/function entity
- hidden member entities still participate in facts/details lookup even when they are not visible as separate canvas nodes
- parent class projections show selected/focused state when one of their underlying members is selected or focused

This design avoids introducing a second parallel domain model just for rendering.

## Safe fallback

The Browser exposes a presentation toggle in the viewpoint controls.

Architects can switch between:

- `Auto`
- `Entity graph`
- `Compact UML`

This fallback is intentionally local to the Browser session and does not modify the imported snapshot.

## Current limits

The current implementation is intentionally conservative.

### Contract and indexer limits

- no snapshot contract field currently declares preferred visual presentation
- no indexer-side viewpoint metadata currently drives UML rendering
- compact UML is decided entirely by the platform's local policy layer

### Projection limits

- compact UML currently derives compartments from existing containment only
- it does not yet apply advanced member filtering such as public-only or architecturally-significant-only members
- it does not yet distinguish between Java-style classifiers and all TypeScript structural patterns beyond the current class-like projection rules
- it does not yet add dedicated rendering for interfaces, enums, records, or other classifier variants beyond the current generic classifier box

### Graph/rendering limits

- relationships are rendered at classifier level only when the endpoints remain visible after member suppression
- relationships to suppressed members are currently dropped from the canvas instead of being lifted or summarized on the parent classifier
- there is no special edge anchoring to specific compartments or member rows
- compact UML currently focuses on node presentation, not on UML-complete semantics

### UX limits

- compact UML is viewpoint-driven and toggleable, but not yet persisted as a named saved-view preference
- no dedicated inspector summary groups projected attributes and operations separately beyond the normal entity facts path
- there is no per-viewpoint override editor; defaults are currently hardcoded in the Browser

## Files involved

Main platform files for the current implementation:

- `apps/web/src/browserProjectionModel.ts`
- `apps/web/src/browserViewpointPresentation.ts`
- `apps/web/src/browserGraphWorkspaceModel.ts`
- `apps/web/src/components/BrowserGraphWorkspace.tsx`
- `apps/web/src/components/BrowserViewpointControls.tsx`
- `apps/web/src/browserSessionStore.ts`

Primary regression coverage:

- `apps/web/src/__tests__/browserProjectionModel.test.ts`
- `apps/web/src/__tests__/browserGraphWorkspaceModel.test.ts`
- `apps/web/src/__tests__/browserGraphWorkspace.test.ts`
- `apps/web/src/__tests__/browserViewpointPresentation.test.ts`
- `apps/web/src/__tests__/browserCompactUmlProjectionRegression.test.ts`

## Next likely follow-ups

Likely future enhancements include:

- viewpoint-exported presentation hints from the indexer contract
- smarter member filtering rules for compact UML classifiers
- classifier-specific rendering variants
- parent-level summarization for member relationships
- richer inspector summaries for projected compartments
