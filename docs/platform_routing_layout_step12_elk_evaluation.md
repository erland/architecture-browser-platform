# Platform Routing/Layout Step 12 — ELK Arrange Evaluation

## Purpose

Decide whether the platform should adopt an ELK-backed arrange backend after the routed-edge and arrange-pipeline improvements added in Steps 1–11.

## Current Platform State After Steps 1–11

The platform now has the following capabilities in the existing browser canvas stack:

- explicit routed-edge model in the workspace graph model
- platform-local routing input extraction from visible canvas nodes
- obstacle-aware orthogonal routing with conservative fallback behavior
- endpoint-side hints and endpoint adjustment away from box centers
- routed SVG path rendering with render-time fallback handling
- route recomputation on graph changes and node movement
- lane separation for parallel edges
- arrange pipeline integration with explicit route refresh
- post-layout cleanup after arrange/viewpoint placement
- feature flags and conservative defaults for routing/layout behavior

The current arrange implementation remains platform-specific and lightweight:

- grid arrange for general canvas layout
- focus-centered arrange for entity-driven exploration
- viewpoint-specific placement helpers
- post-layout cleanup for overlap/spacing normalization

No external layout engine is currently required for the improved baseline experience.

## What ELK Would Potentially Add

ELK would be most valuable if the platform later needs stronger support for:

- large layered graphs with stronger directionality
- more systematic edge-crossing minimization
- hierarchical layout quality beyond the current grid/focus/viewpoint placement model
- consistent layout across large dependency graphs with many sibling branches

ELK would **not** replace the value of the routing work already completed. Even with ELK, the platform would still need:

- routed edge rendering
- obstacle-aware route refresh after interaction
- platform-specific projection handling for compact UML and browser viewpoints
- conservative interaction rules for pinned/manual nodes

## Evaluation Against Current Platform Goals

### 1. Browser-first exploration workflow

The platform is not a general-purpose diagram authoring tool. Its main usage is exploratory browsing of imported architecture snapshots through:

- navigation tree selection
- viewpoint application
- search-driven addition to canvas
- manual drag/pin/isolate/remove interaction

For this workflow, the current platform-specific layout pipeline is a strong fit because it is:

- predictable
- fast to recompute
- easy to keep aligned with current browser-session semantics
- easy to preserve manual placements within

ELK would add power, but also another layer of layout semantics that would have to be reconciled with the browser’s exploratory interaction model.

### 2. Current readability improvements

The largest readability gap before this work was not only node placement; it was the combination of:

- straight-line relationships
- node-overlap issues after arrange
- lack of parallel-edge separation
- lack of explicit route refresh after layout/interaction

Those have now been addressed in the platform stack itself. This significantly reduces the pressure to introduce ELK immediately.

### 3. Complexity and maintenance cost

Adding ELK would increase complexity in several ways:

- new dependency and browser integration surface
- translation between platform projection nodes and ELK graph input/output
- reconciliation with pinned/manual nodes and persisted canvas state
- interaction between ELK node placement and the existing route-refresh pipeline
- additional tests across viewpoints, compact UML projection, and persisted sessions

The current layout stack is comparatively small, readable, and already integrated with the browser session store. That is a meaningful advantage.

### 4. Remaining limitations of the current stack

The current platform-specific arrange pipeline will still be weaker than ELK in some scenarios:

- very large graphs with many branches
- strict layered dependency flow diagrams
- layouts where minimizing crossings is more important than preserving local placement intuition
- cases where the best result requires a global optimization step rather than incremental heuristics

These are real limitations, but they appear to be second-order improvements relative to the gains already achieved in Steps 1–11.

## Decision

## Recommendation: do **not** add ELK now

The platform should stop here for the current routing/layout effort and treat ELK as a **future optional backend only if later evidence shows the current arrange pipeline is insufficient**.

### Why this is the recommended decision

1. The platform now has a coherent routing + arrange pipeline that matches its browser-first exploration model.
2. The biggest practical readability issues were solved without introducing a heavy external layout engine.
3. The current stack is easier to reason about, maintain, and adapt to viewpoint/projection semantics.
4. ELK would add significant integration complexity before there is strong evidence that it is necessary.

## What would justify ELK later

Revisit ELK only if one or more of these become recurring problems in realistic usage:

- large viewpoint graphs remain hard to read even after arrange and manual pinning
- users need stronger top-to-bottom or left-to-right dependency layering than the current arrange modes can provide
- repeated snapshots show persistent crossing/branching problems that cannot be improved with incremental heuristics
- a specific new viewpoint category naturally maps to hierarchical layout and performs poorly with the current grid/focus/viewpoint placement pipeline

## Suggested follow-up if ELK is reconsidered later

If ELK is revisited, keep it optional and isolated.

### Recommended future approach

1. Add ELK as a separate arrange backend rather than replacing the existing pipeline.
2. Restrict the first ELK integration to a single explicit arrange mode, for example `hierarchical`.
3. Keep routing/path rendering in the platform’s existing routed-edge pipeline.
4. Preserve current support for:
   - pinned nodes
   - manually placed nodes
   - viewpoint presentation policies
   - compact UML projection
5. Compare ELK output against the current arrange pipeline on a fixed set of representative snapshots/viewpoints before broadening adoption.

### Recommended seam if implemented later

Potential future module split:

```text
apps/web/src/browser-canvas-placement/
  relayout.ts                # current lightweight arrange modes
  postLayoutCleanup.ts       # current cleanup phase
  elkArrange.ts              # future optional ELK backend
  arrangeBackend.ts          # backend selection adapter
```

## Verification status for this step

This step is an architectural decision note rather than a runtime code change.

The recommendation above is grounded in the current platform code after Steps 1–11:

- arrange is already explicit in `browser-canvas-placement/*`
- route refresh is part of the browser session workflow
- routed edge rendering is already independent from the arrange algorithm
- conservative routing/layout flags already exist for safe rollout and troubleshooting

A future ELK decision should still be validated against several realistic imported snapshots and viewpoints before implementation, but based on the current code structure the recommended decision is: **ELK is not needed now**.
