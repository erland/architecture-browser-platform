# Wave A Step A4 — SnapshotDependencyExplorerService refactor notes

## Intent
Refactor `SnapshotDependencyExplorerService` into a coordinator that delegates index construction, dependency query semantics, and response mapping to focused collaborators.

## What changed
- `SnapshotDependencyExplorerService` now orchestrates the dependency view flow at a high level.
- Added `SnapshotDependencyIndex` for the dependency explorer's local service-side model.
- Added `SnapshotDependencyIndexBuilder` to isolate fact-to-index construction.
- Added `SnapshotDependencyQuerySupport` to isolate scope traversal, relationship inclusion rules, summary building, scope-path building, and label helpers.
- Added `SnapshotDependencyResponseMapper` to isolate entity/relationship/focus response shaping.

## Preserved behavior
- The external `getView(...)` contract is unchanged.
- Scope selection, scope path rules, dependency direction filtering, focus filtering, summary counts, and response ordering were kept mechanically close to the original implementation.

## Boundary after refactor
- `SnapshotDependencyExplorerService`: coordinator / flow composition.
- `SnapshotDependencyIndexBuilder`: index construction from imported facts.
- `SnapshotDependencyQuerySupport`: query and summarization rules.
- `SnapshotDependencyResponseMapper`: DTO shaping for dependency entities, relationships, and focus payloads.

## Verification note
This was implemented as a structure-preserving refactor. Maven verification could not be run in this container, so the refactor was kept intentionally close to the prior logic and naming.
