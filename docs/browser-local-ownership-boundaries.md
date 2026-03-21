# Browser-local subsystem ownership boundaries

This note establishes the intended ownership boundaries for the browser-local subsystem before Wave B code changes.

It is meant to be the reference for the `browserSnapshotIndex*`, `browserSessionStore*`, projection, canvas, viewport, and presentation files so later refactors can move logic without changing user-visible behavior.

## Why this document exists

The browser route now has a meaningful local architecture:

- a loaded snapshot payload
- a browser-local index over that payload
- a session store that holds UI/session state
- canvas placement and viewport behavior
- viewpoint and presentation policies
- route-level React views and components

Those pieces already exist, but some responsibilities are still close enough together that it is easy to let helper logic drift into the wrong file. This note defines where each kind of logic should live.

## Browser-local layers

The browser-local subsystem should be understood as six layers:

1. **Snapshot lookup/query semantics**
2. **Projection and graph shaping**
3. **Session/store state transitions**
4. **Canvas placement and layout planning**
5. **Viewport and interaction behavior**
6. **Presentation and React rendering**

The sections below define what each layer owns.

## 1. Snapshot lookup and query semantics

### Owns
- building the reusable browser-local index from a full snapshot payload
- normalized lookup maps and precomputed collections over scopes, entities, relationships, diagnostics, and viewpoints
- tree/scope queries over the indexed snapshot
- search over the indexed snapshot
- dependency-neighborhood and entity/scope fact lookup
- viewpoint seed/expansion resolution that is based on snapshot semantics rather than UI state
- stable sorting/display helper rules that are intrinsic to the indexed snapshot model

### Main files
- `apps/web/src/browserSnapshotIndex.ts`
- `apps/web/src/browserSnapshotIndex.build.ts`
- `apps/web/src/browserSnapshotIndex.types.ts`
- `apps/web/src/browserSnapshotIndex.scopeQueries.ts`
- `apps/web/src/browserSnapshotIndex.search.ts`
- `apps/web/src/browserSnapshotIndex.viewpoints.ts`
- `apps/web/src/browserSnapshotIndex.shared.ts`
- `apps/web/src/browserRelationshipSemantics.ts`

### Does not own
- React state or hooks
- persisted browser session shape
- canvas node mutation rules
- viewport pan/zoom state
- DOM measurement or rendering concerns
- route/tab orchestration

### Practical rule
If a function can be answered from `FullSnapshotPayload` plus the browser index, without needing current UI/session state, it belongs here.

## 2. Projection and graph shaping

### Owns
- transforming indexed snapshot data into graph-like or display-ready browser-local models
- viewpoint graph materialization
- projection rules for compact model/canvas rendering
- graph workspace shaping that sits between raw snapshot semantics and rendered canvas components

### Main files
- `apps/web/src/browserProjectionModel.ts`
- `apps/web/src/browserGraphWorkspaceModel.ts`

### Depends on
- browser snapshot index/query modules
- viewpoint/presentation policy modules when a projection needs resolved style decisions

### Does not own
- mutation of the authoritative browser session state
- localStorage persistence
- screen pan/zoom state transitions
- React component layout

### Practical rule
If the logic is about **what graph/model should be shown**, but not about **how the session store changes**, it belongs in projection/shaping.

## 3. Session/store state transitions

### Owns
- canonical browser session state shape
- opening/hydrating/persisting a browser session
- state transitions for selection, search, tree mode, focused element, facts panel mode, viewpoint selection, and canvas commands
- orchestration that coordinates snapshot index queries with current session state
- conversion between persisted state and live in-memory state

### Main files
- `apps/web/src/browserSessionStore.ts`
- `apps/web/src/browserSessionStore.types.ts`
- `apps/web/src/browserSessionStore.state.ts`
- `apps/web/src/browserSessionStore.canvas.ts`
- `apps/web/src/browserSessionStore.viewpoints.ts`
- `apps/web/src/browserSessionStore.persistence.ts`
- `apps/web/src/browserSessionStore.utils.ts`

### Allowed dependencies
- snapshot index/query modules
- projection modules
- canvas placement and viewport helper modules
- presentation policy helpers where state transitions need resolved behavior

### Does not own
- direct JSX rendering
- raw DOM event wiring
- CSS/layout concerns
- generic snapshot indexing rules that are independent of session state

### Practical rule
If a function returns a new `BrowserSessionState` from the old state plus an action, it belongs here.

## 4. Canvas placement and layout planning

### Owns
- grid/around-focus placement algorithms
- insertion planning for new nodes
- default spacing/constants/math for canvas placement
- relayout strategy support that computes positions for nodes

### Main files
- `apps/web/src/browserCanvasPlacement.ts`
- `apps/web/src/browserCanvasSizing.ts`

### Does not own
- deciding *when* a node should be added to the canvas
- persisting canvas session state
- facts panel behavior
- viewport pan/zoom transitions

### Practical rule
Canvas placement answers **where nodes go**. It should not decide **whether they exist** in the session.

## 5. Viewport and interaction behavior

### Owns
- viewport math and viewport transition helpers
- fit/pan/zoom calculations
- interaction rules that are fundamentally about the canvas camera rather than domain semantics

### Main files
- `apps/web/src/browserCanvasViewport.ts`
- relevant viewport helpers inside `apps/web/src/browserSessionStore.utils.ts`
- the viewport-related transition surface exposed from `apps/web/src/browserSessionStore.canvas.ts`

### Does not own
- snapshot search/index logic
- entity/scope fact derivation
- JSX rendering
- high-level route/tab state

### Practical rule
Viewport logic answers **how the camera moves around the canvas**. It should not shape domain facts or snapshot semantics.

## 6. Viewpoint and presentation policy

### Owns
- rules for how a selected viewpoint should be presented
- variant/presentation preference policy
- mapping from viewpoint semantics to presentation behavior
- display-specific policy that is still framework-agnostic

### Main files
- `apps/web/src/browserViewpointPresentation.ts`
- `apps/web/src/browserSessionStore.viewpoints.ts`
- viewpoint-related functions in `apps/web/src/browserSnapshotIndex.viewpoints.ts`

### Boundary split inside viewpoint logic
- `browserSnapshotIndex.viewpoints.ts` owns **which entities/relationships/viewpoints are semantically in scope**
- `browserViewpointPresentation.ts` owns **how that viewpoint is visually/presentationally applied**
- `browserSessionStore.viewpoints.ts` owns **how viewpoint selection/application changes the current browser session state**

## 7. React rendering and route composition

### Owns
- React hooks, components, and route shells
- binding browser session state/actions to UI controls
- rendering panels, tabs, tree widgets, canvas widgets, and facts panels
- URL/tab synchronization and route-level composition

### Main files
- `apps/web/src/views/BrowserView.tsx`
- `apps/web/src/views/BrowserViewCenterContent.tsx`
- `apps/web/src/views/BrowserViewPanels.tsx`
- `apps/web/src/browser/*.tsx`
- `apps/web/src/components/Browser*.tsx`
- `apps/web/src/hooks/useBrowserSessionBootstrap.ts`
- `apps/web/src/hooks/useBrowserExplorer.ts`
- `apps/web/src/hooks/useLocalSnapshotIndex.ts`
- `apps/web/src/routing/browserTabState.ts`
- `apps/web/src/routing/browserTabs.ts`

### Does not own
- raw snapshot query semantics
- canonical placement algorithms
- canonical session-state transition rules

### Practical rule
React files should compose and render existing browser-local services. They should not become the primary home for snapshot semantics or canvas algorithms.

## Explicit ownership map by concern

### Lookup maps and reusable semantic queries
Owner:
- `browserSnapshotIndex.build.ts`
- `browserSnapshotIndex.scopeQueries.ts`
- `browserSnapshotIndex.search.ts`
- `browserSnapshotIndex.viewpoints.ts`

### Browser session lifecycle and persistence
Owner:
- `browserSessionStore.state.ts`
- `browserSessionStore.persistence.ts`

### Canvas mutation commands
Owner:
- `browserSessionStore.canvas.ts`

### Placement algorithms and geometry planning
Owner:
- `browserCanvasPlacement.ts`
- `browserCanvasSizing.ts`

### Viewport math and transitions
Owner:
- `browserCanvasViewport.ts`
- store-level viewport command wiring in `browserSessionStore.canvas.ts`

### Visual viewpoint policy
Owner:
- `browserViewpointPresentation.ts`
- state integration in `browserSessionStore.viewpoints.ts`

### Graph/model shaping for rendered browser workspace
Owner:
- `browserProjectionModel.ts`
- `browserGraphWorkspaceModel.ts`

## Dependency direction rules

Preferred dependency direction is:

1. `appModel` snapshot payload types
2. `browserSnapshotIndex*` semantic lookup/query layer
3. projection / placement / viewport / presentation helpers
4. `browserSessionStore*` state transition layer
5. React hooks, route shells, and components

In other words:

- lower layers must not depend on React components
- snapshot index modules must not depend on browser session state
- placement/viewport helpers should stay pure and reusable
- session store modules may depend on semantic/query helpers, but not the other way around

## Guardrails for Wave B refactors

### When splitting `browserSnapshotIndex.shared.ts`
Move helpers according to intent:
- display-name and labeling helpers stay with index/display semantics
- sorting helpers stay with index/query semantics
- source-ref aggregation helpers stay with index facts/query support
- aggregate/stat helpers stay with index semantics

Do not move them into React components or store modules just because they are convenient there.

### When refactoring `browserCanvasPlacement.ts`
Keep:
- pure placement strategies
- spacing/math/constants
- insertion planning

Do not let placement code start mutating `BrowserSessionState` directly.

### When simplifying `browserSessionStore.canvas.ts`
Keep the file as the owner of:
- canvas-related state transitions
- graph expansion commands
- facts-panel mode/focus transitions that happen as a result of canvas actions

But prefer helpers for:
- pure node/edge mutation calculations
- viewport transition calculations
- placement strategy invocation

## “Wrong file” signals

Use these signals during later refactors:

### A function is in the wrong place if it:
- needs only indexed snapshot data but lives in a React component
- mutates `BrowserSessionState` but lives in a projection or index helper module
- computes node positions but also decides route/tab behavior
- performs viewport math while also formatting domain facts
- imports React just to reuse domain or placement helpers
- reaches into DOM/rendering concerns from snapshot index or store modules

## Intended end state after Wave B

After the next refactors, the browser-local subsystem should read like this:

- **snapshot index layer**: “what exists and how it relates”
- **projection layer**: “what model/graph we want to show”
- **session store layer**: “what the current browser session state is”
- **placement/viewport layer**: “where it goes and how the camera moves”
- **presentation layer**: “how viewpoint/display policy is applied”
- **React layer**: “how the UI binds to all of the above”

That is the ownership model Wave B should preserve.
