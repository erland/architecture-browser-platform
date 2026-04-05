# Hooks subsystem seams

## `useBrowserSessionBootstrap`

The browser-session bootstrap flow is intentionally split into focused support modules.

- `useBrowserSessionBootstrap.ts`
  - thin hook shell plus legacy compatibility export surface
  - gathers inputs, invokes the orchestration flow, updates React state
- `useBrowserSessionBootstrap.bootstrapPrepared.ts`
  - canonical prepared-snapshot bootstrap implementation
- `useBrowserSessionBootstrap.orchestration.ts`
  - orchestrates plan execution, immediate state application, and async outcome handling
- `useBrowserSessionBootstrap.types.ts`
  - shared status/outcome types used across bootstrap helpers
- `useBrowserSessionBootstrap.messages.ts`
  - bootstrap/user-facing message formatting and generic error text helpers
- `useBrowserSessionBootstrap.stalePolicy.ts`
  - pure stale-session clearing rules
- `useBrowserSessionBootstrap.planner.ts`
  - pure bootstrap decision planning
- `useBrowserSessionBootstrap.execution.ts`
  - immediate-state derivation and async plan execution wiring
- `useBrowserSessionBootstrap.application.ts`
  - browser-session state application/reset helpers
- `useBrowserSessionBootstrap.preparedSnapshot.ts`
  - prepared-snapshot acquisition flow
- `useBrowserSessionBootstrap.preparedSnapshot.fetch.ts`
  - fetch-and-cache implementation for prepared snapshots

Working rules:

- Keep `useBrowserSessionBootstrap.ts` as a thin hook shell and legacy compatibility surface.
- Prefer direct imports from focused bootstrap modules in internal code and tests.
- Treat `useBrowserSessionBootstrap.bootstrapPrepared.ts` as the canonical prepared-bootstrap implementation.
- Keep decision logic pure whenever possible.
- Put user-facing message construction in `*.messages.ts` rather than embedding strings across multiple helpers.
- Put browser-session state writes in `*.application.ts` or the orchestration hook, not in planner/policy helpers.
