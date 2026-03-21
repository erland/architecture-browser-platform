# Step 3: Refactor `browserSnapshotIndex.ts`

## Goal
Reduce the size and responsibility concentration of `apps/web/src/browserSnapshotIndex.ts` without changing its public API.

## What changed
The former monolithic file was split into focused modules:

- `apps/web/src/browserSnapshotIndex.types.ts`
  - exported types only
- `apps/web/src/browserSnapshotIndex.shared.ts`
  - shared sorting, path, scope, search-document, and viewpoint helper logic
- `apps/web/src/browserSnapshotIndex.build.ts`
  - index construction and cache management
- `apps/web/src/browserSnapshotIndex.scopeQueries.ts`
  - scope tree, entity lookup, facts, and dependency neighborhood queries
- `apps/web/src/browserSnapshotIndex.search.ts`
  - search logic and scoring
- `apps/web/src/browserSnapshotIndex.viewpoints.ts`
  - available-viewpoint lookup, seed resolution, expansion relationships, and viewpoint graph assembly
- `apps/web/src/browserSnapshotIndex.ts`
  - thin public facade that re-exports the stable API surface

## Refactoring intent
This split follows the refactoring-analysis recommendation to separate:

- raw index building
- scope lookup/query helpers
- entity lookup/query helpers
- relationship/viewpoint helpers
- search helpers
- sorting/display utilities

## Public API compatibility
The public import path remains:

- `apps/web/src/browserSnapshotIndex.ts`

Existing callers should continue to work because the facade re-exports the same main functions and types.

## Verification performed
TypeScript compile verification passed:

```bash
cd apps/web
npx tsc -p tsconfig.json --noEmit
```

## Notes
This step is intentionally structural. It does not attempt to change browser behavior or simplify the query semantics yet. The aim is to create smaller seams for later changes.
