# Platform browser-only frontend cleanup — Step 8

## Goal
Simplify `App.tsx` into a Browser-only shell.

## What changed
- Simplified `apps/web/src/App.tsx` so it always renders `BrowserView`.
- Removed route-state handling from the top-level app shell.
- Kept one-time path normalization so legacy frontend URLs still land on `/browser`.
- Simplified `apps/web/src/routing/appRoutes.ts` to a Browser-only route model.

## Result
The top-level frontend shell now behaves as a Browser-only application:
- no route-based view switching in `App.tsx`
- Browser is always rendered
- old route aliases still normalize to `/browser`

## Notes
This step intentionally leaves the lightweight route normalization helpers in place so old bookmarks and direct links continue to resolve safely.
