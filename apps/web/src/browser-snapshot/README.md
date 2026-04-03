# Browser-snapshot subsystem

## Purpose

`browser-snapshot/` owns the in-memory browser snapshot index plus the query,
search, semantic, display, and viewpoint helpers that operate on that index.

## Internal structure

- `model/` — canonical internal home for snapshot index types and build/cache helpers
- `query/` — scope/entity/dependency/search queries over the index
- `support/` — display, sorting, source-ref, and semantic helpers used by the index/query layers
- `viewpoints/` — viewpoint availability and graph resolution helpers
- `application/` — prepared-snapshot cache selection/runtime helpers for browser-facing workflows

## Canonical import guidance

- Public consumers should import from `browser-snapshot`
- Internal stage-specific code should import from:
  - `browser-snapshot/model`
  - `browser-snapshot/query`
  - `browser-snapshot/support`
  - `browser-snapshot/viewpoints`

## Compatibility notes

The old flat `browserSnapshotIndex*.ts` files now remain only as thin
compatibility wrappers. The canonical internal model lives under `model/`, and
new code should not add fresh dependencies on the flat wrapper family.

## Ownership boundary

Prepared snapshot cache access for Browser workflows should go through `browser-snapshot/application` rather than importing the transport cache singleton directly into view/controller code.
