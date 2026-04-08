# Architecture Browser — Downloadable Step-by-Step Plan (Platform)
## Topic: Render Normalized JPA Associations in Entity/Persistence Views

## Goal

Update the platform so entity/persistence diagrams prefer canonical normalized relationships from the indexer, show multiplicities on both ends, expose evidence in facts/details, and remain backward compatible with older snapshots.

## End State

After this plan:

- entity/persistence diagrams use normalized associations when available
- duplicate raw JPA field-level edges are not shown as the main diagram relationships
- multiplicities are displayed on both ends
- `CONTAINMENT` has a distinct but conservative visual treatment
- facts/details expose both normalized summary and raw evidence
- older snapshots without normalized associations still load and render safely

## Assumptions

1. The indexer plan has already been completed or is sufficiently advanced to provide canonical normalized associations.
2. The platform already imports snapshot/catalog relationship data and renders entity/persistence views.
3. Existing tests cover browser session, graph preparation, facts/details, and viewpoints.
4. The platform should avoid re-deriving JPA semantics from raw annotations.

---

# Step 1 — Extend platform contracts and snapshot mapping

## Objective
Support the new normalized relationship fields in platform contracts, snapshot import, and internal read models.

## Deliverables
- Contract/view-model updates for normalized association metadata, such as:
  - association kind/category
  - both-end multiplicities
  - bidirectional flag
  - evidence references
  - optional ownership metadata
- Snapshot import/mapping updates
- Backward-compatible defaults for older snapshots
- Contract/mapping tests

## Notes
The platform should consume normalized relationship data rather than reconstructing it.

## Verification
Example local commands:
```bash
cd platform
pnpm test
```
or project-specific frontend/backend test commands already used in the repo.

---

# Step 2 — Teach entity/persistence views to prefer normalized associations

## Objective
Change view/query/projection logic so canonical normalized associations are the primary relationships for entity/persistence diagrams.

## Deliverables
- View/query selection rules that:
  - use normalized associations when present
  - fall back to older/raw relationship data only when normalized data is absent
- Tests showing one edge instead of duplicate raw JPA field edges in supported snapshots

## Notes
This step is the core duplicate-edge removal on the platform side.

## Verification
```bash
cd platform
pnpm test
```

---

# Step 3 — Add multiplicity rendering at both association ends

## Objective
Render lower/upper bounds clearly on the diagram edges.

## Deliverables
- Edge label support for:
  - source end multiplicity
  - target end multiplicity
- Label formatting rules such as:
  - `1`
  - `0..1`
  - `0..*`
  - `1..*` if ever emitted
- UI tests / snapshot tests for multiplicity display

## Notes
Keep formatting compact and readable on the canvas.

## Verification
Run the relevant graph/browser view tests:
```bash
cd platform
pnpm test
```

---

# Step 4 — Add distinct visual treatment for containment

## Objective
Make `CONTAINMENT` visible without overcomplicating the diagram.

## Deliverables
- Styling/design choice for containment edges, for example:
  - containment badge
  - stronger label
  - special marker near the owning side
- Tests verifying containment style selection

## Notes
Do not overcommit to strict UML composition symbols unless the product deliberately wants that. A clear containment cue is enough.

## Verification
```bash
cd platform
pnpm test
```

---

# Step 5 — Expose normalized relationship summary and raw evidence in facts/details

## Objective
Keep traceability by showing both the canonical association and the field-level evidence.

## Deliverables
- Facts/details panel updates showing:
  - normalized association type
  - both-end multiplicities
  - bidirectional status
  - containment status if present
  - underlying evidence entries such as source field mappings
- UI tests confirming evidence remains inspectable

## Notes
This is where the raw field-level JPA mappings should remain visible, rather than on the main diagram.

## Verification
```bash
cd platform
pnpm test
```

---

# Step 6 — Remove duplicate-edge assumptions in graph preparation and session logic

## Objective
Ensure graph/projection/canvas logic does not accidentally recreate duplicate edges after normalized associations are introduced.

## Deliverables
- Updates in graph preparation/projection/session code so one normalized association corresponds to one primary diagram edge
- Tests covering:
  - no duplicate parallel edges for the canonical JPA inverse-pair cases
  - stable selection/focus/facts behavior for normalized edges

## Notes
This step matters because duplicate edges can reappear if graph preparation still treats raw relationships as first-class in the entity view.

## Verification
```bash
cd platform
pnpm test
```

---

# Step 7 — Maintain backward compatibility for older snapshots

## Objective
Prevent regressions for previously indexed sources.

## Deliverables
- Compatibility logic where:
  - normalized associations are preferred if present
  - older snapshots still render through fallback behavior
- Tests for:
  - older snapshot fixture
  - new snapshot fixture
  - mixed-data safety behavior

## Notes
Do not break the browser for existing saved/imported data.

## Verification
```bash
cd platform
pnpm test
```

---

# Step 8 — Add end-to-end regression fixtures using representative JPA snapshots

## Objective
Protect the platform behavior using realistic browser/entity view fixtures.

## Deliverables
- Snapshot fixtures or mocked browser data covering:
  - `Project` ↔ `Task` bidirectional one-to-many
  - bidirectional one-to-one
  - bidirectional many-to-many
  - non-merge cases
  - containment vs plain association
- Assertions for:
  - one primary edge rendered
  - correct multiplicity labels
  - facts/details evidence visibility

## Notes
Use fixture names and expectations that are easy to maintain.

## Verification
```bash
cd platform
pnpm test
```

---

# Step 9 — Apply UX polish for readability and discoverability

## Objective
Make the new relationship semantics readable without clutter.

## Deliverables
- Small UX improvements if needed, such as:
  - concise edge label placement
  - containment legend or tooltip
  - better facts/details wording
- Tests if wording/behavior is asserted elsewhere

## Notes
This step should remain small and focused. Avoid broad redesign.

## Verification
```bash
cd platform
pnpm test
```

---

# Step 10 — Final integration verification with indexer-produced snapshots

## Objective
Confirm platform behavior against real or representative outputs from the updated indexer.

## Deliverables
- Full end-to-end verification using updated snapshot/export data
- Final cleanup of temporary compatibility shims if safe
- Regression pass across browser/entity/persistence-related tests

## Verification
Suggested commands:
```bash
cd platform
pnpm test
```

If backend and frontend are verified separately, also run the project-specific commands you already use for:
- frontend tests
- backend tests
- any browser graph/viewpoint regression suites

---

# Suggested Implementation Order Summary

1. contracts and mapping
2. entity-view preference for normalized associations
3. multiplicity rendering
4. containment styling
5. facts/details evidence exposure
6. graph/session duplicate-edge cleanup
7. backward compatibility
8. end-to-end fixtures
9. UX polish
10. final integration verification

# Expected Outcome

At the end of this plan, the platform will render one canonical normalized JPA association in entity/persistence views, display multiplicities, expose evidence in the facts/details panel, and remain compatible with older snapshots that lack normalized association data.
