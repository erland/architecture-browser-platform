# Platform refactor step 2 — `browserSessionStore.ts`

## Goal

Split the browser session store into smaller modules without changing its public surface.

## Changes made

The original `apps/web/src/browserSessionStore.ts` was decomposed into these modules:

- `browserSessionStore.types.ts`
  - exported session, canvas, facts-panel, and viewpoint types
- `browserSessionStore.state.ts`
  - session creation, hydration, snapshot open, scope/search/tree state
- `browserSessionStore.persistence.ts`
  - local storage read/write
- `browserSessionStore.viewpoints.ts`
  - viewpoint selection and application logic
- `browserSessionStore.canvas.ts`
  - canvas mutation, focus, selection, viewport, and layout actions
- `browserSessionStore.utils.ts`
  - shared query/layout helpers used by the modules above
- `browserSessionStore.ts`
  - thin public facade that re-exports the stable API

## Result

The former 1136-line god module is now a 63-line facade with explicit responsibility-oriented submodules.

## Verification performed in packaging environment

### Passed

- TypeScript compile check

Command used:

```bash
cd apps/web
tsc -p tsconfig.json --noEmit
```

### Not fully runnable in packaging environment

- Jest test execution was not runnable via the repo's configured command because the root `node_modules` tree referenced by `apps/web/package.json` was not installed in this environment.

## Refactoring notes

- Public imports from `../browserSessionStore` remain valid.
- No broad app-wide import rewrites were required.
- Shared logic that would otherwise be duplicated between state/viewpoint/canvas modules was moved into `browserSessionStore.utils.ts`.
