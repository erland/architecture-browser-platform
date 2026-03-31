# Browser auto-layout

This module introduces the first dedicated subsystem boundary for browser auto-layout.

## Step 2 status

This step intentionally adds the subsystem skeleton without changing user-visible arrange behavior yet.

Current behavior:

- `Arrange all` still produces the existing grid-based result.
- `Arrange around focus` is unchanged and still uses the existing focused relayout path.
- route refresh, fit-view, collision handling, and post-layout cleanup continue to use the current platform seams.

## Intended responsibility split

- `graph.ts`
  - extracts a layout-friendly graph from visible canvas nodes and edges
- `components.ts`
  - connected-component detection for later graph-aware arrange modes
- `structureLayout.ts`
  - default structure layout strategy
- `flowLayout.ts`
  - directional left-to-right layout strategy for dependency-style graphs
- `hierarchyLayout.ts`
  - future hierarchy-oriented layout strategy
- `apply.ts`
  - maps layout results back onto browser canvas nodes
- `engine.ts`
  - orchestrates extract → detect → strategy → apply

## Current implementation note

Structure layout is now graph-aware, and Flow layout now provides a dedicated directional strategy.
Hierarchy layout now provides a dedicated top-to-bottom tree-oriented strategy with conservative anchored-node handling.


## Step 11 status

Ordering heuristics now prefer graph-neighbor barycenters within each band so related nodes stay in a more readable vertical order, and post-layout cleanup now compacts oversized gaps after the main placement pass.


## Configuration

The subsystem now has an internal configuration layer with conservative defaults for spacing, component gaps, hard-anchor policy, max breadth, cleanup intensity, and optional ordering heuristics.

## Step 14 status

After the Step 13 regression fixtures were added, the recommended decision is to keep the current browser-native auto-layout stack as the default and not add ELK now.

ELK should only be reconsidered later as an optional backend if realistic imported snapshots expose dense-graph readability problems that the current `structure`, `flow`, and `hierarchy` strategies cannot solve well enough.
