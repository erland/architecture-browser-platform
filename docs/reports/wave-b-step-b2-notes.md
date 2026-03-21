# Wave B — Step B2 notes

This step refactors `apps/web/src/browserSnapshotIndex.shared.ts` into more intentional browser-local index helper modules, following the ownership note added in B1.

## What changed

Added focused modules:
- `apps/web/src/browserSnapshotIndex.display.ts`
- `apps/web/src/browserSnapshotIndex.sort.ts`
- `apps/web/src/browserSnapshotIndex.semantics.ts`
- `apps/web/src/browserSnapshotIndex.aggregates.ts`
- `apps/web/src/browserSnapshotIndex.sourceRefs.ts`

Retained:
- `apps/web/src/browserSnapshotIndex.shared.ts` as a thin compatibility barrel that re-exports the split helpers.

Updated imports in:
- `apps/web/src/browserSnapshotIndex.build.ts`
- `apps/web/src/browserSnapshotIndex.search.ts`
- `apps/web/src/browserSnapshotIndex.scopeQueries.ts`
- `apps/web/src/browserSnapshotIndex.viewpoints.ts`

## Ownership after the split

- `browserSnapshotIndex.display.ts`
  - display name normalization
  - compact scope labeling
  - searchable document shaping

- `browserSnapshotIndex.sort.ts`
  - stable ordering of scopes, entities, relationships, and viewpoint-specific output

- `browserSnapshotIndex.semantics.ts`
  - architectural-role / semantic extraction
  - scope-mode checks
  - tree-mode scope-kind rules
  - relationship inclusion helpers used by viewpoint flows

- `browserSnapshotIndex.aggregates.ts`
  - map accumulation helpers
  - scope path / subtree / tree construction
  - descendant aggregate calculation

- `browserSnapshotIndex.sourceRefs.ts`
  - source-ref aggregation and deduplication

## Verification note

Because the packaged environment still lacks the full React/Jest root dependency setup for the workspace-wide checks, I verified this step with a targeted TypeScript compile over the refactored browser snapshot index modules:

```bash
cd apps/web
npx tsc --noEmit --module esnext --target es2022 --moduleResolution bundler --skipLibCheck --lib es2022,dom \
  src/browserSnapshotIndex.build.ts \
  src/browserSnapshotIndex.search.ts \
  src/browserSnapshotIndex.scopeQueries.ts \
  src/browserSnapshotIndex.viewpoints.ts \
  src/browserSnapshotIndex.aggregates.ts \
  src/browserSnapshotIndex.display.ts \
  src/browserSnapshotIndex.semantics.ts \
  src/browserSnapshotIndex.sort.ts \
  src/browserSnapshotIndex.sourceRefs.ts
```

That targeted compile passed in this container.
