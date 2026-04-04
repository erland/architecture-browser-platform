# Architecture Browser — Downloadable Step-by-Step Plan
## Plan A — Canvas class presentation controls

## Purpose
Implement post-add-time class presentation controls in the platform canvas so a user can select a class already placed on the canvas and change how it is shown:
- simple class
- class with compartments
- expanded class with member nodes

Also support member-category visibility so fields and functions can be shown independently depending on analysis scenario.

## Starting state
Assumptions based on current platform direction:
- The browser canvas already supports adding entities/scopes to the canvas.
- Class rendering already has some add-time choices for compact UML-like rendering vs more expanded forms.
- Browser session state already exists and is the preferred place for persistent browser/canvas behavior.
- Saved canvas persistence already exists or is in progress and should remain the source of persisted user presentation choices.
- Layout/routing is already recomputed on graph changes.

## Scope
In scope:
1. Add per-class presentation state after the class is already on the canvas.
2. Support simple / compartments / expanded modes.
3. Support separate field/function visibility toggles.
4. Re-derive visible canvas nodes and edges from presentation state.
5. Persist presentation state in browser session / saved canvas model.
6. Refresh layout/routing conservatively when presentation changes.
7. Add tests for state derivation, UI actions, persistence, and edge cases.

Out of scope unless required by an existing code path:
- Arbitrary per-member custom styling.
- Full semantic aggregation of hidden member edges beyond simple first-pass rules.
- Deep nested expansion beyond one class -> its immediate fields/functions.

## Functional target
A selected class on the canvas can be changed between:
- Simple
- Compartments
- Expanded

A selected class can independently toggle:
- Show fields
- Show functions

Behavior rules:
- Simple: render one class node only; member toggles do not affect visible nodes.
- Compartments: render one class node; fields/functions shown inline according to toggles.
- Expanded: render class node plus child member nodes according to toggles.
- If both fields and functions are off while in compartments or expanded, fall back to simple.
- Presentation changes should not require deleting/re-adding the class.
- Presentation should persist in saved canvas state.

## Proposed model
Introduce a class presentation policy, owned by session/canvas state, not by rendering components.

Example shape:
```ts
type ClassPresentationMode = "simple" | "compartments" | "expanded";

type ClassPresentationPolicy = {
  mode: ClassPresentationMode;
  showFields: boolean;
  showFunctions: boolean;
};
```

Attach this policy to the canvas representation of an entity node, not to the underlying architecture entity.

## Step-by-step implementation

## Phase 1: Establish state model and derivation boundary

### Phase 3: 1 — Add explicit class presentation policy to canvas/session state
Deliverables:
- Add a presentation policy model for class-like canvas entities.
- Define defaults for newly added class nodes.
- Ensure non-class entities are unaffected.

Implementation notes:
- Keep the source architecture entity immutable.
- Store presentation policy in browser session state / canvas node state.
- Default recommendation:
  - mode = `simple`
  - showFields = true
  - showFunctions = true
- If current add-time behavior already stores similar choices, normalize them into the new model.

Files likely affected:
- browser session state/store
- canvas node model types
- saved canvas model mapping types if mirrored there

Verification:
- Typecheck passes.
- Existing canvas add flows still work without behavior change for non-class entities.

### Phase 3: 2 — Create a single visible-graph derivation path for class representation
Deliverables:
- Centralized derivation logic that converts class presentation policy into visible nodes/edges.
- Remove ad hoc rendering branching where feasible.

Implementation notes:
- Derive:
  - one visible class node for all modes
  - inline compartment data for `compartments`
  - visible child member nodes for `expanded`
- Keep this logic out of React view components as much as possible.
- Use a pure helper/service so it can be tested directly.

Rules:
- `simple`: no member nodes
- `compartments`: no member nodes, but compartment data included in node view model
- `expanded`: child nodes generated for visible fields/functions
- both toggles false => treat as `simple`

Verification:
- Unit tests for derivation from:
  - simple + fields/functions on
  - compartments + fields only
  - compartments + functions only
  - expanded + fields only
  - expanded + functions only
  - expanded + both off => simple fallback

### Phase 3: 3 — Add toolbar/inspector commands for selected class nodes
Deliverables:
- User actions to change representation of selected class nodes.
- User actions to toggle field/function visibility.

Implementation notes:
- Expose controls only when selected entity is a class-like entity that supports these modes.
- Suggested actions:
  - View as Simple
  - View as Compartments
  - View as Expanded
  - Show fields
  - Show functions
- Prefer disabled state rather than hidden state if that matches the rest of the browser UX.
- Close menus after command execution and when clicking outside, consistent with your toolbar direction.

Verification:
- Component tests for selected-class controls.
- Interaction tests proving state updates after command selection.

### Phase 3: 4 — Render compartment variants on class nodes
Deliverables:
- Class nodes render zero/field/function/both compartments according to policy.
- No separate member nodes yet beyond what derivation already supports.

Implementation notes:
- This phase should make `simple` and `compartments` fully usable even before expanded mode is fully refined.
- Ensure node sizing recalculates when compartments change.
- Ensure class badges/kinds still render correctly.

Verification:
- Visual/component tests for:
  - simple
  - fields only
  - functions only
  - both fields and functions
  - simple fallback when both toggles are off

## Phase 2: Expanded class/member view

### Phase 3: 5 — Materialize field/function child nodes in expanded mode
Deliverables:
- Expanded class representation generates child member nodes for selected categories.
- Membership/containment relationships are visible between class and child nodes.

Implementation notes:
- Start with immediate members only.
- Child node IDs should be stable and derived from class/member identity.
- Child nodes should be clearly marked as derived/member nodes, not independent top-level entity additions.

Suggested rules:
- Expanded + fields only => class + field nodes
- Expanded + functions only => class + function nodes
- Expanded + both => class + both
- Expanded + neither => fallback to simple

Verification:
- Pure derivation tests for child node materialization.
- Canvas tests proving visible node count changes as expected.

### Phase 3: 6 — Define first-pass external-edge behavior for expanded vs compacted states
Deliverables:
- Clear initial rule set for edges touching members.

Recommended first-pass rule:
- When expanded:
  - show member-level edges if the underlying graph already supports them
- When compacted:
  - hide member-level nodes and member-level edges
  - keep only class-level structure visible
  - surface detail in facts panel/inspector instead of forcing edge aggregation

Why this approach:
- It minimizes complexity.
- It avoids premature complicated edge aggregation semantics.

Verification:
- Tests proving member edges disappear when compacting.
- No orphan edges remain visible.

### Phase 3: 7 — Re-run layout and route refresh conservatively on presentation changes
Deliverables:
- Presentation changes trigger graph layout/routing refresh where needed.
- Existing manually positioned unrelated nodes remain stable if your arrange model supports that.

Implementation notes:
- Simple <-> compartments may only require node resize + route refresh.
- Expanded/compacted transitions require graph change handling.
- Prefer localized placement of new member nodes near the parent class before any broader arrange operation.
- Do not automatically “destroy” the surrounding layout with a full aggressive arrange.

Verification:
- Tests for:
  - member nodes appearing near parent
  - unrelated nodes remaining stable
  - routed edges refreshing correctly after expand/collapse

## Phase 3: Persistence and saved canvas integration

### Phase 3: 8 — Persist class presentation policy in saved canvas model
Deliverables:
- Saved canvases retain:
  - mode
  - showFields
  - showFunctions
- Load/rebind restores the same presentation policy.

Implementation notes:
- Treat presentation policy as view state, not domain semantics.
- For rebinding:
  - if the class entity resolves, restore its presentation policy
  - if member nodes are derived rather than first-class saved nodes, recompute them from parent presentation state after load

Verification:
- Serialization/deserialization tests.
- Rebind tests confirming representation survives snapshot rebinding when entity identity still matches.

### Phase 3: 9 — Normalize old add-time choices into the new policy
Deliverables:
- Existing add flows map into the same policy model.
- Users can still choose initial representation at add time if desired, but afterwards the same controls remain available.

Implementation notes:
- Do not maintain separate “add-time only” and “selected-node presentation” logic.
- One policy model should drive both.

Verification:
- Tests covering current add dialog/menu choices and subsequent toggling after node creation.

## Phase 4: UX refinement and viewpoint alignment

### Phase 3: 10 — Align defaults with analysis scenarios and viewpoints
Deliverables:
- Optional viewpoint-aware defaults for newly added classes.

Suggested defaults:
- persistence-model:
  - mode = compartments
  - showFields = true
  - showFunctions = false
- request-handling:
  - mode = compartments or expanded
  - showFields = false
  - showFunctions = true
- module-dependencies:
  - mode = simple
- generic/no viewpoint:
  - mode = simple

Implementation notes:
- Keep this as a defaulting layer only.
- The user can always override on the selected node afterward.

Verification:
- Tests proving viewpoint defaulting affects initial policy only, not later user overrides.

### Phase 3: 11 — Add compact summary/inspector feedback for hidden member detail
Deliverables:
- Facts panel or inspector shows that:
  - fields are hidden
  - functions are hidden
  - class is compacted from expanded/member detail

Implementation notes:
- This reduces confusion when users wonder why expected members are not visible.

Verification:
- Inspector tests for hidden/visible member summaries.

## Safety net / test plan

Add or update tests in these categories:
1. Pure session/derivation tests
2. Canvas rendering tests
3. Toolbar/inspector interaction tests
4. Saved canvas persistence tests
5. Layout/routing refresh regression tests

Critical scenarios:
- Switch simple -> compartments -> expanded -> simple
- Toggle fields/functions independently
- Both toggles off fallback
- Expanded member nodes disappear cleanly when compacted
- Saved canvas round-trip restores policy
- Rebinding after snapshot reload preserves policy when entity identity survives

## Refactoring seams to keep clean
Keep these concerns separated:
- Architecture entity model
- Canvas/session presentation policy
- Visible graph derivation
- React rendering
- Saved canvas serialization
- Layout/routing refresh

Avoid:
- Embedding derivation rules directly in React components
- Treating derived member nodes as fully independent persisted business entities unless required
- Duplicating representation logic in add flow and selection-edit flow

## Expected end state
After this plan:
- Users can add a class once and change its representation later.
- A class can be shown as simple, compartments, or expanded.
- Fields and functions can be shown independently.
- Persistence-model analysis can focus on fields without methods.
- Behavior/request analysis can focus on methods without fields.
- Saved canvases preserve those presentation choices.
- Layout/routing remains stable enough for iterative exploration.

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
npm test -- browserSessionStore
npm test -- BrowserGraphWorkspace
npm test -- BrowserView
```
