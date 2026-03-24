# Remaining Frontend Cleanup — Step 2

## Objective

Remove obsolete route-state helper code that is no longer needed now that the app is a Browser-only shell.

## Changes made

- Deleted `apps/web/src/routing/appRouteState.ts`.
- Deleted `apps/web/src/__tests__/appRouteState.test.ts`.
- Kept route normalization in `apps/web/src/routing/appRoutes.ts` as the single remaining route concern for legacy URL compatibility.

## Rationale

The app no longer maintains independent top-level route state. `App.tsx` always renders `BrowserView`, and legacy paths are normalized to `/browser`. The deleted helper only wrapped `normalizeRoutePath(...)` and URL string concatenation for a route model that no longer exists.

## Verification intent

- Browser path normalization still lives in `appRoutes.ts`.
- There are no remaining runtime imports of `appRouteState.ts`.
- Legacy paths such as `/sources`, `/workspaces`, `/compare`, and `/operations` still normalize to `/browser`.
