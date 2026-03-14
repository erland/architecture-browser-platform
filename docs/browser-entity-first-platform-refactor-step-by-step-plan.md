# Browser Entity-First Refactor — Downloadable Step-by-Step Plan

## Purpose

Refactor the **architecture-browser-platform** Browser view so that:

- **Scope** is used primarily for **navigation and structural browsing**.
- **Entity** is used primarily for **canvas analysis and relationship exploration**.
- Adding something from the navigation tree or facts panel adds **entity nodes** to the canvas by default instead of raw **scope** nodes.
- The Browser becomes easier to understand, especially for technical snapshots where filesystem/package navigation and entity analysis should be clearly separated.

This plan is designed so it can be continued in a new chat without relying on hidden context.

---

## Starting State

This plan assumes the current codebase already includes these relevant capabilities from earlier work:

### Platform / Browser side
- Full snapshot payload contract exists and Browser preloads local snapshot data.
- Browser has a dedicated local snapshot index and browser session/store.
- Browser layout already has:
  - left navigation tree
  - canvas workspace
  - facts panel
- Navigation tree is grouped/tightened and supports category/tree exploration.
- Canvas has a selection toolbar.
- Facts panel can show selected scope/entity details.
- Scope-oriented canvas actions currently exist or partially exist.

### Indexer side
The indexer has recently been adjusted so the platform can build a better entity-first Browser UX:
- `FILE` scopes parent to their containing `DIRECTORY` scope.
- `DIRECTORY` and `FILE` display names are compact.
- `PACKAGE` hierarchy is modeled for navigation/canvas.
- Display names have been compacted for key scope/entity kinds.
- Structural relationships such as `CONTAINS` are available for entity expansion.
- Java method/function extraction and display names were corrected.

### Repositories in focus
- Main implementation target: **architecture-browser-platform**
- Supporting already-updated producer: **architecture-browser-indexer**

---

## Goal State

After this refactor:

### Navigation tree
- Defaults to **structural scopes** only.
- For technical snapshots, tree should primarily show:
  - `DIRECTORY`
  - `FILE`
- For Java-oriented snapshots, package navigation should be possible via a dedicated tree mode.
- Tree selection should select a **scope**, not directly place that scope on canvas.

### Facts panel
- Acts as the bridge between **scope navigation** and **entity analysis**.
- For a selected scope, it should clearly show:
  - scope facts
  - child scopes
  - primary entities represented by the scope
  - direct entities by kind
  - subtree entity counts/by kind
- It should offer explicit **entity-first add actions**.

### Canvas
- Defaults to showing **entities**, not scopes.
- Typical entity kinds on canvas:
  - `MODULE`
  - `FUNCTION`
  - `CLASS`
  - `INTERFACE`
  - `SERVICE`
  - `ENDPOINT`
  - `CONFIG_ARTIFACT`
  - `PACKAGE` entity when explicitly chosen
- Scope nodes remain supported only as an advanced/debug fallback.

### Interaction model
- Tree = navigate scopes
- Facts panel = explain selected scope + offer entity add choices
- Canvas = analyze entities and their relationships

---

## Assumptions

1. The Browser frontend is React/TypeScript and already has a local snapshot index abstraction.
2. Current Browser state already tracks selected scope/entity and canvas content.
3. Snapshot payload already contains enough scope/entity/relationship information to derive:
   - direct entities per scope
   - subtree entities per scope
   - child scopes
   - structural entity expansion from `CONTAINS`
4. Existing tests are present for Browser index/session/components and can be extended.
5. It is acceptable to keep scope-node canvas support internally while removing it from default UX.

---

## Out of Scope

- Redesigning the snapshot backend contract again.
- Large changes to indexer semantics beyond what is already implemented.
- Replacing the canvas renderer.
- Building advanced layout algorithms for entity clustering in this pass.
- Multi-user collaboration or server-driven Browser analysis logic.

---

## Technology / Design Choices

### Keep existing architecture direction
- Continue using local browser-side indexes and session state.
- Avoid reintroducing server-computed Browser endpoints.

### Introduce explicit scope-to-entity resolution policy
Do not let components guess how a scope maps to entities. Centralize this logic in the Browser snapshot index / Browser domain helpers.

### Prefer incremental migration
- Keep support for scope nodes on canvas internally.
- Change defaults and UI semantics first.
- Remove legacy scope-first paths only after tests and UX confirm the new model works well.

---

## Project Structure Impact

Expected areas to change in **architecture-browser-platform**:

- `apps/web/src/browser/...` or equivalent Browser domain/index utilities
- `apps/web/src/components/BrowserNavigationTree.tsx`
- Browser facts panel component(s)
- Browser canvas toolbar / canvas workspace component(s)
- Browser session/store reducer/actions/hooks
- Browser tests (index/session/component interaction tests)
- Browser documentation in `docs/`

Exact filenames may vary, but the responsibilities should follow the steps below.

---

# Step-by-Step Plan

## Step 1 — Add explicit entity-resolution helpers to the Browser snapshot index

### Objective
Create one central place where scope-to-entity resolution rules live.

### Why first
All later UI work depends on fast and deterministic answers to questions like:
- what entities belong directly to this scope?
- what entities belong to this scope subtree?
- what are the primary entities for this scope?
- what child scopes exist?

### Implement
Extend the Browser snapshot index with precomputed lookups such as:

- `scopeId -> directEntityIds`
- `scopeId -> subtreeEntityIds`
- `scopeId -> childScopeIds`
- `entityId -> containingScopeIds`
- `entityId -> containedEntityIds` based on `CONTAINS`

Add explicit helper methods such as:

- `getDirectEntitiesForScope(scopeId)`
- `getSubtreeEntitiesForScope(scopeId)`
- `getChildScopes(scopeId)`
- `getPrimaryEntitiesForScope(scopeId)`
- `getDirectEntitiesForScopeByKind(scopeId, kinds)`
- `getSubtreeEntitiesForScopeByKind(scopeId, kinds)`

### Primary entity policy to encode
Implement a centralized policy like:

- `FILE` scope:
  - primary entities = direct `MODULE` entities
- `DIRECTORY` scope:
  - primary entities = direct `MODULE` entities represented by files directly inside that directory
- `PACKAGE` scope:
  - primary entities = package entity/entities
- `MODULE` scope (if still present in some snapshots/UI paths):
  - primary entities = direct `MODULE` entities

Do not scatter this logic across components.

### Deliverables
- Snapshot index changes with new derived maps/helpers
- Unit tests for helper behavior
- Small inline comments documenting policy

### Verification
Run Browser/unit tests, for example:

```bash
npm test -- BrowserSnapshotIndex
```

And if available:

```bash
npm test -- browser
```

Expected outcome:
- direct/subtree/primary entity lookups are stable and fast
- tests prove behavior for `DIRECTORY`, `FILE`, and `PACKAGE`

---

## Step 2 — Change tree add behavior to add entities by default instead of scope nodes

### Objective
Make the navigation tree use scopes for navigation only, while its add actions place entities on the canvas.

### Implement
Adjust the tree interaction model so that:
- clicking a tree row selects a **scope**
- the tree add affordance uses `getPrimaryEntitiesForScope(scopeId)` by default
- if no primary entities exist, the UI should fail gracefully and explain that no primary entity is available

### Recommended behavior
For a selected scope:

- `FILE`
  - default add = add primary `MODULE` entity/entities
- `DIRECTORY`
  - default add = add direct module entities for the directory
- `PACKAGE`
  - default add = add package entity/entities

Retain an advanced/internal fallback path for adding raw scope nodes, but do not expose it as the default interaction.

### UX note
If a scope has multiple primary entities, either:
- add them all when that is expected and low-volume, or
- show a compact chooser later in a follow-up iteration

For this step, prefer deterministic bulk behavior rather than adding a new chooser workflow.

### Deliverables
- Updated tree add action semantics
- Any needed store/session action updates
- Focused component tests

### Verification
```bash
npm test -- BrowserNavigationTree
```

Expected outcome:
- tree add no longer inserts raw `scope:*` nodes by default
- file/directory/package adds resolve to entity nodes

---

## Step 3 — Update the facts panel to become the scope-to-entity bridge

### Objective
Make the facts panel explain how a selected scope maps to entities and expose clear entity-first actions.

### Implement
For a selected scope, show sections like:

1. **Scope**
   - kind
   - display name
   - canonical name/path
   - parent scope
   - child scope count

2. **Primary entities**
   - list of primary entity candidates
   - explicit `Add primary` action

3. **Direct entities by kind**
   - e.g. `MODULE (1)`, `FUNCTION (4)`, `CLASS (1)`
   - actions like `Add modules`, `Add functions`, `Add all direct`

4. **Subtree entities by kind**
   - especially useful for directories/packages
   - actions like `Add subtree modules`, `Add all subtree`

5. **Child scopes**
   - optional compact list or count summary

### Important rule
The facts panel should no longer push the user toward adding scope nodes to the canvas. It should make it obvious that:
- scope is what you selected in the tree
- entities are what you add/analyze on canvas

### Deliverables
- Facts panel redesign/update for selected scope flow
- New scope/entity sections and actions
- Tests for representative examples:
  - Java `PACKAGE`
  - filesystem `DIRECTORY`
  - `FILE` with module + functions

### Verification
```bash
npm test -- BrowserFactsPanel
```

Expected outcome:
- selected scope clearly exposes represented entities
- add actions operate on entities, not scope nodes

---

## Step 4 — Make the canvas toolbar entity-first

### Objective
Replace scope-centric canvas workflows with entity-centric analysis actions.

### Implement
When a selected canvas node is an **entity**, show actions appropriate to that entity kind.

Suggested toolbar behavior:

### MODULE entity
- `Contained`
- `Functions`
- `Dependencies`
- `Used by` / `Callers` if available
- `Remove`
- `Pin`

### PACKAGE entity
- `Subpackages`
- `Contained`
- `Modules`
- `Classes`
- `Remove`

### FUNCTION entity
- `Calls`
- `Called by`
- `Same module`
- `Remove`

### CLASS / INTERFACE entity
- `Contained`
- `Dependencies`
- `Used by`
- `Remove`

Use existing relationships where possible:
- `CONTAINS`
- `DEPENDS_ON`
- `CALLS`
- `USES`

### Important migration choice
Do not remove scope toolbar support entirely in this step. Instead:
- prioritize entity toolbar behavior
- reduce scope toolbar behavior to fallback/advanced support

### Deliverables
- Updated canvas selection toolbar logic
- Entity-kind-specific actions
- Tests for entity selection behavior

### Verification
```bash
npm test -- BrowserCanvasWorkspace
```

Expected outcome:
- selected module/function/package entities expose meaningful analysis actions
- toolbar no longer feels dependent on scope-only semantics

---

## Step 5 — Introduce tree modes for technical snapshots

### Objective
Reduce noise in the left tree by making its default structure mode-aware.

### Implement
Add explicit tree modes such as:

- `filesystem`
  - primarily `DIRECTORY` and `FILE`
- `package`
  - primarily `PACKAGE`
  - useful for Java snapshots
- `all scopes` or `advanced`
  - debugging / full structure view

### Default recommendations
- For TypeScript/frontend/mixed code snapshots:
  - default to `filesystem`
- For Java snapshots:
  - default to either `package` or `filesystem`
  - choose one based on what feels most usable after quick manual validation

### Detection strategy
Use lightweight heuristics from snapshot content, such as:
- presence/volume of `PACKAGE` scopes
- predominance of `.java` modules/files

Keep this heuristic simple and overrideable by the user.

### Deliverables
- Tree mode state in Browser session/store
- Tree mode toggle UI
- Filtered tree-building logic per mode
- Tests for tree mode filtering

### Verification
```bash
npm test -- BrowserNavigationTree
```

Expected outcome:
- users can switch between filesystem/package/full views
- default tree is less noisy for code snapshots

---

## Step 6 — Demote scope nodes on the canvas to advanced/debug usage

### Objective
Complete the UX shift so the canvas is entity-first by default.

### Implement
Audit all Browser entry points that add nodes to canvas:
- navigation tree add actions
- facts panel actions
- search results
- toolbar actions
- any context menu paths

Change defaults so they add entities first.

Keep a limited advanced option such as:
- `Add scope node`
- `Show selected scope as container`

This can live behind a secondary menu or debug affordance.

### Deliverables
- Removal of default scope-first canvas paths
- Optional advanced scope-add path retained
- Regression tests covering the main entry points

### Verification
```bash
npm test -- browser
```

Expected outcome:
- normal Browser usage no longer produces confusing duplicate scope/entity canvas nodes
- scope nodes remain available only when explicitly desired

---

## Step 7 — Update search behavior to distinguish navigation targets from analysis targets

### Objective
Make search consistent with the new mental model.

### Implement
Search results should behave differently depending on result type.

### Scope results
- selecting result focuses/selects the scope in tree/facts
- `Add` action adds primary entity/entities for that scope

### Entity results
- selecting result focuses/adds the entity directly on canvas

### Deliverables
- Updated search result action logic
- Tests for scope-vs-entity search behavior

### Verification
```bash
npm test -- BrowserSearch
```

Expected outcome:
- search no longer blurs navigation targets and analysis targets

---

## Step 8 — Add focused UI tests and regression tests for the new model

### Objective
Protect the new behavior against future regressions.

### Add tests for
1. `FILE` scope selected in tree
   - add inserts module entity, not file scope
2. `DIRECTORY` scope selected in tree
   - add inserts direct module entities
3. `PACKAGE` scope selected in tree
   - add inserts package entity
4. Facts panel sections for selected scope
   - primary entities
   - direct entities by kind
   - subtree entities by kind
5. Canvas toolbar for selected module entity
   - shows contained/dependency actions
6. Search behavior
   - scope result navigates + entity-first add
7. Tree modes
   - filesystem/package/all scopes

### Deliverables
- Focused Browser regression coverage

### Verification
```bash
npm test
```

Expected outcome:
- the new scope/tree vs entity/canvas model is protected by automated tests

---

## Step 9 — Update docs and continuation notes

### Objective
Document the new Browser mental model so it is easy to continue in future chats.

### Update docs with
- scope vs entity explanation
- primary entity policy per scope kind
- tree modes and intended use
- canvas entity-first behavior
- any known limitations / follow-ups

### Suggested doc sections
- `Browser model: scope vs entity`
- `How add-to-canvas works`
- `Filesystem mode vs package mode`
- `Known follow-ups`

### Deliverables
- updated Browser docs
- continuation notes for future work

### Verification
Manual review of docs plus any doc-linked screenshots if you maintain them.

---

# Recommended Behavior Policies

## Scope-to-primary-entity policy

### FILE
Default add target:
- direct `MODULE` entity/entities

Secondary actions:
- add `FUNCTION`
- add all direct entities

### DIRECTORY
Default add target:
- direct `MODULE` entities for the directory

Secondary actions:
- add subtree modules
- add all subtree entities

### PACKAGE
Default add target:
- package entity

Secondary actions:
- add subpackages
- add direct contained entities
- add subtree entities

### MODULE scope
If still surfaced anywhere:
- add direct `MODULE` entity/entities

---

## Canvas toolbar policy

### Preferred canvas node types
- `MODULE`
- `FUNCTION`
- `CLASS`
- `INTERFACE`
- `PACKAGE` entity
- `SERVICE`
- `ENDPOINT`
- `CONFIG_ARTIFACT`

### Avoid by default
- `DIRECTORY` scope
- `FILE` scope
- raw scope containers generally

---

# Risks and Mitigations

## Risk 1 — Some scopes map to multiple entities or no clear primary entity
**Mitigation:** centralize explicit primary-entity policy and fall back to direct entity lists when needed.

## Risk 2 — Canvas gets overloaded when bulk-adding subtree entities
**Mitigation:** keep caps or staged actions such as `Add modules` before `Add all subtree`.

## Risk 3 — Package mode and filesystem mode can confuse users
**Mitigation:** make the mode switch explicit and keep one sensible default per snapshot type.

## Risk 4 — Legacy scope-based canvas behavior still leaks through old entry points
**Mitigation:** audit all add-to-canvas paths and cover them with focused regression tests.

---

# Minimal Verification Checklist Per Step

For each completed step, verify:

1. selection in tree still works
2. facts panel still updates correctly
3. canvas additions use expected node type
4. canvas toolbar actions still function
5. no obvious performance regression in tree/canvas
6. targeted test suite passes

---

# Suggested Follow-Up After This Plan

Once the entity-first Browser model is working, likely next improvements are:

1. Better entity grouping/layout on canvas
2. Small chooser when a scope has multiple meaningful primary entities
3. Stronger entity-type-specific toolbar actions
4. Better package/file dual navigation for Java snapshots
5. Optional visual distinction between structural and analytical expansion paths

---

# Summary

This refactor should make the Browser much easier to understand:

- **Scopes** remain the structural navigation model.
- **Entities** become the analysis model on canvas.
- The **facts panel** becomes the bridge between the two.
- The **tree** becomes cleaner and more mode-aware.
- The **canvas** becomes more relationship-focused and less cluttered by low-value scope nodes.

This is the main platform-side move needed now that the indexer has better support for:
- compact display names
- file/directory hierarchy
- package hierarchy
- structural `CONTAINS` relationships


---

# Completion status

This plan has now been implemented through Step 9 in the current repository state.

Implemented outcomes:

- Step 1: explicit scope-to-entity resolution helpers were added to the Browser snapshot index
- Step 2: tree add behavior now adds primary entities by default instead of raw scope nodes
- Step 3: facts panel now acts as the scope-to-entity bridge
- Step 4: canvas toolbar is entity-first
- Step 5: technical tree modes were added for filesystem, package, and advanced/all-scopes views
- Step 6: scope nodes on canvas were demoted to advanced/debug usage
- Step 7: search now distinguishes navigation targets from analysis targets
- Step 8: focused regression coverage was added for the new model
- Step 9: docs and continuation notes were updated to reflect the completed model

For ongoing work after this plan, use `docs/browser-entity-first-browser-model.md` and `docs/browser-local-continuation-notes.md` as the primary continuation documents.
