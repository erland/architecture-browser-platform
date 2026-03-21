# Browser viewpoints

The Browser now supports **viewpoints**: predefined architect-facing slices that automatically seed and expand the canvas from the imported snapshot instead of requiring the user to manually add entities one by one.

This feature builds on the local full-snapshot browser model. The tree still provides structural navigation and scoping, but the canvas can now be populated from a viewpoint definition exported by the indexer and resolved locally by the web client.

## Why viewpoints exist

Manual add-to-canvas remains useful for exploratory work, but architects often start with a recurring question such as:

- How does request handling flow through this system?
- What is the API surface?
- What does the persistence model look like?
- Which integrations exist?
- How are modules coupled?
- How does frontend navigation work?

Viewpoints provide a repeatable answer to those questions by combining:

- exported viewpoint metadata from the indexer
- browser-side seed resolution
- scope-aware filtering
- semantic graph expansion
- viewpoint-specific canvas layout hints
- viewpoint explanation in the facts panel

## Current user workflow

In the Browser left rail the user can now:

1. select a scope in the navigation tree
2. choose a viewpoint
3. choose a scope mode
4. choose whether to replace the canvas or add to it
5. apply the viewpoint

The Browser then resolves the viewpoint locally and adds the resulting graph to the canvas.

## Scope modes

The Browser supports three scope modes when applying a viewpoint:

- **Current scope** — limit seeds and expansion to the currently selected scope
- **Current subtree** — include the selected scope plus descendants
- **Whole snapshot** — resolve the viewpoint across the whole imported snapshot

These scope modes let the same viewpoint act as either a focused local analysis tool or a broader system overview.

## Apply modes

The Browser supports two apply modes:

- **Replace canvas** — clear current canvas content and populate it from the viewpoint result
- **Add to canvas** — merge the viewpoint result into the current canvas

This makes viewpoints useful both as a starting point and as an augmentation tool during interactive analysis.

## Implemented viewpoints

The current Browser supports these viewpoint ids from the imported snapshot:

### `request-handling`

Purpose:
- follow requests from entrypoints through services into persistence and related collaborators

Typical canvas shape:
- entrypoints on the left
- application services in the middle
- persistence and integration neighbors to the right

Primary semantics:
- `serves-request`
- `invokes-use-case`
- `accesses-persistence`

### `api-surface`

Purpose:
- show exposed entrypoints and their immediate backend collaborators

Typical canvas shape:
- entrypoints first
- immediate service/use-case neighbors next
- related external neighbors after that

Primary semantics:
- `serves-request`
- `invokes-use-case`

### `persistence-model`

Purpose:
- show persisted structures together with persistence access paths

Typical canvas shape:
- services or upstream neighbors on the left
- persistence-access in the middle
- persistent entities and stores on the right

Primary semantics:
- `accesses-persistence`
- `stored-in`

Browser-local variant:
- `show-entity-relations`

The browser-local `show-entity-relations` variant changes the emphasis from persistence access paths to a persistence **entity relationship** view. In that variant the Browser keeps only `persistent-entity` elements and association relationships between them, using normalized metadata such as `associationKind`, `associationCardinality`, and explicit endpoint bounds.

### `integration-map`

Purpose:
- show adapters and their external system dependencies

Typical canvas shape:
- callers on the left
- integration adapters in the middle
- external dependencies on the right

Primary semantics:
- `calls-external-system`

### `module-dependencies`

Purpose:
- show high-level module-boundary coupling

Typical canvas shape:
- seeded module boundaries first
- related modules next
- non-module fallback entities in a trailing lane if present

Primary semantics:
- `depends-on-module`

### `ui-navigation`

Purpose:
- show layouts, pages, and route/navigation semantics

Typical canvas shape:
- layouts on the left
- pages next
- navigation nodes after that

Primary semantics:
- `contains-route`
- `navigates-to`
- `redirects-to`
- `guards-route`


## Canvas presentation modes

The Browser now separates **what a viewpoint resolves** from **how the resolved entities are drawn** on the canvas.

Supported local presentation modes:

- **Auto** — use the Browser's local default for the viewpoint id
- **Entity graph** — keep the existing node-per-entity canvas model
- **Compact UML** — project class-like entities as UML-style classifier boxes with attribute and operation compartments

The current compact UML implementation is platform-local only. It does not change the imported snapshot contract.

For class-oriented viewpoints such as persistence-oriented or domain-oriented analysis, compact UML reduces noise by suppressing separate member nodes while keeping the underlying member entities available in details/inspection flows.

## Facts-panel explanation

When a viewpoint is applied, the facts panel explains the generated canvas using:

- viewpoint title and id
- description
- availability
- confidence
- applied scope mode and scope label
- resolved entity/relationship counts
- recommended layout
- resolved seed entities
- seed roles
- expansion semantics
- preferred dependency views
- evidence sources

This makes the generated graph inspectable rather than opaque.

## Architect guidance

A practical starting pattern is:

- start with **API surface** or **Request handling** for backend-heavy systems
- start with **UI navigation** for frontend-heavy systems
- use **Persistence model** when you want to understand stored structures and write paths
- use **Integration map** for external system analysis
- use **Module dependencies** for higher-level structural coupling analysis

Then refine the analysis by:

- switching scope mode from whole snapshot to subtree
- merging multiple viewpoints into the same canvas
- manually adding or removing entities after the viewpoint has been applied

## Developer notes

The feature is intentionally split across the contract, browser index, session model, and UI.

### Contract and payload

Document-level viewpoints are carried in the full snapshot payload as `viewpoints`.

Relevant files:

- `libs/contracts/src/index.ts`
- `libs/contracts/indexer-ir.schema.json`
- `apps/api/src/main/java/.../api/dto/SnapshotDtos.java`
- `apps/web/src/appModel.ts`
- `apps/web/src/platformApi.ts`

### Browser indexing and graph resolution

The Browser resolves viewpoints locally from the imported snapshot.

Relevant files:

- `apps/web/src/browserSnapshotIndex.ts`

Important responsibilities:

- viewpoint lookup
- role-to-entity indexing
- semantic relationship indexing
- scope filtering
- seed resolution
- semantic expansion
- viewpoint-specific graph ordering
- recommended layout hints

### Session state and canvas application

Viewpoint selection and application live in the browser session model.

### Compact UML notes

Compact UML is currently a Browser-only projection layer:

- the imported snapshot still contains the same fine-grained entities
- member entities still exist in the Browser index
- compact UML suppresses member nodes from separate canvas placement when they are shown inside classifier compartments
- the viewpoint controls include a safe fallback toggle back to **Entity graph**

See `docs/browser-compact-uml-presentation.md` for the current behavior and limits.

Relevant files:

- `apps/web/src/browserSessionStore.ts`
- `apps/web/src/contexts/BrowserSessionContext.tsx`

Important responsibilities:

- selected viewpoint id
- scope mode
- apply mode
- applied viewpoint graph
- replace vs merge behavior
- seed pinning/focus
- viewpoint-specific canvas placement

### UI

Relevant files:

- `apps/web/src/components/BrowserViewpointControls.tsx`
- `apps/web/src/views/BrowserView.tsx`
- `apps/web/src/components/BrowserFactsPanel.tsx`

### Tests and fixtures

Relevant files:

- `apps/web/src/__tests__/fixtures/viewpointFixtures.ts`
- `apps/web/src/__tests__/browserViewpointsRegression.test.ts`
- `apps/api/src/test/resources/contracts/viewpoints-curated.json`
- `docs/samples/indexer-ir/viewpoints-curated.json`

## Extension guidance

When adding a new viewpoint, prefer this sequence:

1. add or confirm the canonical viewpoint export in the indexer
2. make sure the full snapshot payload carries the needed metadata
3. extend browser graph shaping only if the generic seed/semantic expansion is not enough
4. add a recommended layout only if the viewpoint benefits from a distinctive canvas reading order
5. add curated regression coverage for the viewpoint contract, graph assembly, apply behavior, and facts-panel explanation

Keep the Browser mostly metadata-driven. Viewpoint-specific branching should stay narrow and only be introduced when a viewpoint genuinely needs specialized graph ordering or layout.


## Second-wave enhancements

The Browser also supports additive viewpoint variants that do not change the exported indexer contract.

- `Default`
- `Show writers`
- `Show readers`
- `Show upstream callers`

These variants are browser-side refinements layered on top of exported viewpoints. They are currently available for `persistence-model` and `request-handling` where they provide the most value.

For `persistence-model`, the new `show-entity-relations` variant is intended for entity-model exploration rather than repository/access-path exploration.
