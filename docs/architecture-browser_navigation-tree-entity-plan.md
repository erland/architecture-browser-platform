# Architecture Browser — Downloadable Step-by-Step Plan
## Plan B — Entity-aware navigation tree

## Purpose
Enhance the left-hand navigation tree in the platform so it remains scope-led but also shows directly owned top-level entities under scopes. This should make it easy to add an individual class/component/service/endpoint to the canvas instead of only adding all entities from a scope.

## Starting state
Assumptions based on current platform direction:
- The navigation tree currently shows scope elements only.
- Users can add scopes to the canvas, but this often adds too much at once.
- The browser already has selection, facts panel, and add-to-canvas flows.
- The browser should remain primarily scope-led rather than becoming an arbitrary dependency graph navigator.

## Scope
In scope:
1. Show directly owned top-level entities under scopes in the navigation tree.
2. Keep child scopes visible and ordered predictably.
3. Allow selecting and adding individual entities from the tree.
4. Keep facts panel and canvas selection synchronized.
5. Persist expanded tree state if you already persist browser UI state.
6. Add conservative filtering/virtualization safeguards if the tree becomes too noisy.

Out of scope unless needed by existing code:
- Showing every nested member (fields/functions/local functions/etc.) in the first version.
- Displaying dependency edges/cross-links in the tree.
- Turning the navigation tree into a graph explorer.

## Functional target
When a user expands a scope node, the tree should show:
1. child scopes
2. directly owned top-level entities for that scope

Examples:
- package
  - subpackage A
  - subpackage B
  - OrderEntity
  - OrderRepository
  - OrderService

- frontend file or folder
  - routes.tsx
  - OrdersPage
  - AppShellLayout
  - useOrders

The initial entity set should only include entities directly tied to the scope and not already structurally contained in another entity at that same level.

## Proposed tree model
Treat the tree as structural containment, not scope-only containment.

A tree node can represent:
- a scope
- a top-level entity owned by a scope

Entity nodes should be included only when:
- their owning scope is the current scope
- they are top-level from the tree’s point of view
- they are not merely nested members of another visible entity at that same level

## Step-by-step implementation

### Phase 3: 1 — Define entity eligibility rules for tree visibility
Deliverables:
- A pure helper/service that decides which entities appear directly under a scope in the navigation tree.

Eligibility rules for first version:
- entity.ownerScopeId == expanded scope id
- entity is not owned by another entity that is also eligible at this tree level
- entity kind is useful for direct navigation/add-to-canvas

Typical included kinds:
- class
- interface
- enum
- service
- repository
- endpoint
- page
- route
- layout
- module
- top-level function/hook where meaningful

Typical excluded first-version nested items:
- fields
- methods
- local functions
- JSX child elements
- inner classes unless explicitly promoted by your model

Verification:
- Unit tests for eligibility helper using representative backend/frontend entities.

### Phase 3: 2 — Extend tree view-model generation to include entity children
Deliverables:
- Tree view-model now supports mixed child collections under a scope:
  - child scopes
  - eligible direct entities

Implementation notes:
- Preserve the scope-led mental model.
- Recommended ordering:
  1. child scopes
  2. eligible entities
- Use stable IDs and node kinds so UI actions stay deterministic.
- Add icons/badges so users can tell scope vs class vs endpoint vs page.

Verification:
- View-model tests for:
  - empty scope
  - scope with child scopes only
  - scope with entities only
  - scope with both
  - mixed frontend/backend examples

### Phase 3: 3 — Render entity nodes in the navigation tree UI
Deliverables:
- Tree can visually render entity nodes under scopes.
- Entity nodes look distinct from scopes but still fit the same tree.

Implementation notes:
- Add labels/icons/badges for entity kind.
- Keep expand affordance only where applicable.
- For first version, entity nodes do not need their own nested children unless already easy to support.
- Ensure large trees remain readable and not visually cluttered.

Verification:
- Component tests for mixed scope/entity rendering.
- Snapshot or DOM tests proving ordering and badges.

### Phase 3: 4 — Allow add-to-canvas directly from entity nodes
Deliverables:
- Users can add a single entity from the tree to the canvas.
- Existing “add scope” behavior remains intact.

Implementation notes:
- Support the same user gesture pattern already used for scope nodes where possible.
- If you have context menus or inline action buttons, keep the interaction consistent across scopes and entities.
- Avoid auto-adding sibling entities from the same scope.

Verification:
- Interaction tests showing:
  - add class from package node
  - add service from package node
  - add route/page from frontend scope
- Existing scope-add tests still pass.

### Phase 3: 5 — Synchronize selection across tree, canvas, and facts panel
Deliverables:
- Selecting an entity in the tree focuses/selects it consistently across browser surfaces.
- Facts panel reflects the selected entity.
- If entity is already on canvas, canvas selection follows.
- If not on canvas, at minimum facts panel/tree selection still works consistently.

Implementation notes:
- Reuse existing selection model rather than inventing a tree-specific selection state.
- Distinguish clearly between:
  - select entity
  - add entity to canvas
  - focus entity already on canvas

Verification:
- Interaction tests for tree selection -> facts panel update.
- Interaction tests for tree selection of already-visible canvas entity.

## Phase 2: Safe expansion and noise control

### Phase 3: 6 — Add optional entity expansion support only where structurally safe
Deliverables:
- Optional support for expanding certain entity nodes later, but only if you already have safe ownership data.

Recommended first-version decision:
- Do not expand entity nodes into fields/functions yet.
- Keep this feature deferred until class presentation / expanded member work is ready in the canvas.

Why:
- It avoids tree explosion.
- It keeps the tree useful rather than overwhelming.

Verification:
- Entity nodes either have no expand affordance or only where deliberately implemented.

### Phase 3: 7 — Add filtering / search alignment for entity-aware tree browsing
Deliverables:
- Tree search or browser search can find entity nodes as well as scopes.
- Matching a specific class/service/page should reveal its containing path.

Implementation notes:
- If you already have a tree filter/search model, extend it to entity labels and kinds.
- Preserve ancestor scopes when showing a match so the tree remains understandable.

Verification:
- Tests for searching a class name under a package.
- Tests for searching a React page/hook.
- Tests that matching nodes reveal correct ancestors.

### Phase 3: 8 — Add conservative noise controls for very large scopes
Deliverables:
- Avoid overwhelming the tree when a scope contains many entities.

Options:
- lazy loading when expanding a scope
- capped initial list with “show more”
- simple kind filtering
- virtualization if the tree already trends large

Recommendation:
- start with lazy derivation/loading on scope expand
- only add stronger controls if large-scope usability becomes a real issue

Verification:
- Performance-oriented tests or manual checks with a large package/module.

## Phase 3: Persistence and UX coherence

### Phase 3: 9 — Persist tree expansion and selected-node state if browser UI state already supports it
Deliverables:
- Expanded scopes remain expanded when reasonable.
- Selected entity/scope state restores consistently after refresh/reload if such persistence already exists.

Implementation notes:
- Do not block the feature if persistence is not already present.
- Persist only lightweight UI state:
  - expanded node ids
  - selected node id
  - maybe last focused entity

Verification:
- State round-trip tests if applicable.

### Phase 3: 10 — Align facts panel summaries for entity selection from tree
Deliverables:
- Entity selected from tree shows meaningful facts even before being added to canvas.
- Kind-specific summary appears in facts panel.

Implementation notes:
- This is especially important for:
  - classes
  - endpoints
  - repositories
  - React pages/routes/layouts
- This makes the tree useful as a lightweight explorer, not just an add control.

Verification:
- Facts panel tests for selected entity that is not yet on canvas.

## Phase 4: Viewpoint-aware refinement

### Phase 3: 11 — Optionally bias visible entity kinds by viewpoint without hiding user access
Deliverables:
- Tree can prefer relevant entity kinds depending on viewpoint, while still allowing users to access others.

Examples:
- persistence-model:
  - prioritize entities, repositories, datastores
- request-handling:
  - prioritize endpoints, services, handlers
- ui-navigation:
  - prioritize routes, pages, layouts

Implementation notes:
- Keep this lightweight in first pass:
  - ordering, badges, or default expansion
  - not hard exclusion
- The tree should remain a general browser, not a viewpoint-locked widget.

Verification:
- Tests ensuring viewpoint bias affects ordering/highlighting only if implemented.

## Safety net / test plan

Add or update tests in these categories:
1. Tree eligibility and view-model generation tests
2. Navigation tree rendering tests
3. Add-to-canvas interaction tests
4. Selection/facts panel synchronization tests
5. Search/filter tests
6. Optional persistence tests

Critical scenarios:
- Expand package with classes and subpackages
- Expand frontend folder/file with top-level page/component/route entities
- Add single entity instead of full scope
- Select entity in tree and inspect facts without adding it
- Search reveals entity path correctly
- Large scope remains usable

## Refactoring seams to keep clean
Keep these concerns separated:
- source architecture containment data
- tree eligibility rules
- tree view-model generation
- React tree rendering
- selection/add-to-canvas commands
- facts panel state

Avoid:
- hardcoding entity eligibility directly in JSX
- mixing dependency relationships into the tree structure
- exposing every nested member in the first version

## Expected end state
After this plan:
- The navigation tree still works as a scope-led browser.
- Expanding a scope also reveals directly owned top-level entities.
- Users can add a single entity to the canvas without adding a whole scope.
- The facts panel can inspect an entity selected from the tree.
- The tree becomes a practical precision-navigation tool rather than only a bulk-add structure.

## Suggested verification commands
Adjust to your repo layout if needed.

Frontend:
```bash
cd apps/web
npm test
npm run build
```

Full platform:
```bash
npm test
mvn test
```

If targeted tests exist:
```bash
npm test -- BrowserNavigationTree
npm test -- BrowserView
npm test -- browserSessionStore
```
