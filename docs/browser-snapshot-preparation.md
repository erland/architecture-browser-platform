# Browser snapshot preparation flow (Step 5)

Step 5 moves snapshot preparation earlier in the user journey so Browser can open against a prepared local model instead of starting that orchestration after navigation.

## New module

- `apps/web/src/hooks/useBrowserSnapshotPreparation.ts`

This hook is a small browser-ready state machine that coordinates:

- selection-aware cache inspection
- full snapshot download when the cache is missing or stale
- local cache refresh
- local browser-index priming
- user-visible preparation status

## States

The hook exposes these explicit states:

- `idle`
- `not-downloaded`
- `downloading`
- `cached`
- `preparing`
- `ready`
- `failed`

## Current integration

### Snapshots view

The Snapshots view now treats snapshot selection as the main entry point for Browser preparation.

When a snapshot is selected, the UI now:

1. keeps the shared workspace / repository / snapshot selection up to date
2. ensures a current full snapshot payload exists locally
3. primes the in-memory browser indexes
4. exposes a clear Browser readiness message
5. only opens Browser after preparation succeeds

### Repositories view

The post-run callout now uses the same preparation flow when the user jumps directly from a newly created snapshot into Browser.

## UX intent

The user should now experience Browser as opening a prepared analysis workspace rather than starting from a cold data orchestration path.

This step is intentionally still additive: the legacy Browser UI remains in place, but the snapshot handoff now prepares the local model that later Browser steps will consume directly.
