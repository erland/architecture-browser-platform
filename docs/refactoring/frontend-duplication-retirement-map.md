# Frontend duplication retirement map

This map records the main duplication and compatibility surfaces that should be retired over the remaining Browser frontend consolidation work.

## Purpose

Use this file as the inventory for deciding whether a new change should:

- move an existing consumer to a canonical entrypoint,
- remove an old compatibility path, or
- keep a temporary adapter for one more step.

The default choice should be to move consumers toward canonical ownership rather than extending duplication.

## Canonical ownership targets

### BrowserView orchestration
**Canonical target**
- `views/browser-view/application/`
- `views/browser-view/controllers/`

**Retire over time**
- top-level `views/browser-view/useBrowserView*.ts` compatibility hooks outside the application/controller structure

### Browser session public surface
**Canonical target**
- `browser-session/types`
- `browser-session/state`
- `browser-session/lifecycle-api`
- `browser-session/navigation-api`
- `browser-session/canvas-api`
- `browser-session/viewpoints-api`
- `browser-session/facts-panel-api`
- `browser-session/commands-api`

**Retire over time**
- broad root imports from `browser-session/index.ts`
- direct use of `browser-session/browserSessionStore.ts` outside the subsystem
- direct use of `browser-session/commands/index.ts` outside the subsystem

### Browser snapshot indexing/querying
**Canonical target**
- `browser-snapshot/model/`
- `browser-snapshot/query/`
- `browser-snapshot/support/`
- `browser-snapshot/viewpoints/`
- `browser-snapshot/` as the public entrypoint

**Already retired / should stay retired**
- `browserSnapshotIndex*.ts` compatibility family

### Saved-canvas subsystem
**Canonical target**
- `saved-canvas/domain/`
- `saved-canvas/application/`
- `saved-canvas/adapters/`

**Retire over time**
- any page-driven or component-driven saved-canvas business logic that bypasses those layers
- any broad top-level saved-canvas facade reintroduced for convenience

### Graph pipeline stage ownership
**Canonical target**
- `browser-projection/`
- `browser-graph/workspace/`
- `browser-canvas-placement/stage.ts`
- `browser-auto-layout/stage.ts`
- `browser-graph/canvas/stage.ts`
- `browser-routing/`

**Retire over time**
- direct neighboring-internal imports when a stage entrypoint exists
- imports from broader roots when a narrower stage-owned entrypoint is available

## Duplication / drift patterns to avoid

- Recreating Browser page orchestration in page shell components instead of controller/application hooks.
- Reintroducing root `browser-session` facade imports in new code.
- Duplicating snapshot traversal logic in views/components instead of `browser-snapshot/query`.
- Moving placement/layout/routing policy into React rendering folders.
- Letting saved-canvas domain or application code depend on views, components, hooks, contexts, or transport code.

## Retirement order

1. Keep BrowserView page composition on `views/browser-view/application` and avoid reintroducing top-level page-composition facades.
2. Retire external consumers of `browser-session/index.ts` and `browser-session/browserSessionStore.ts`.
3. Retire graph-stage imports that bypass `stage.ts` or other canonical stage entrypoints.
4. Retire duplicated snapshot traversal or saved-canvas orchestration that lives outside canonical subsystem ownership.

## Decision rule for future changes

Before adding a helper, facade, or adapter, check:

1. Does a canonical subsystem entrypoint already exist?
2. Can the consumer be moved instead of adding a shim?
3. If a temporary adapter is unavoidable, is its retirement step documented here or in the active refactoring plan?

If the answer to 1 or 2 is yes, prefer migration over duplication.
