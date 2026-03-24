# Platform browser-only frontend cleanup — Step 5

## Goal
Remove the dedicated Operations / Audit frontend flow so the Browser remains the only top-level screen.

## Changes made
- Removed the `/operations` route from the frontend route catalog.
- Normalized `/operations` to `/browser`.
- Removed `OperationsView` from the app shell.
- Deleted the dedicated operations/audit frontend view and section components.
- Removed retention preview/apply and audit/operations-only API usage from the frontend workspace data loader.
- Kept recent runs loading because the source tree management flow still uses latest-run information per repository.

## Result
- The frontend no longer exposes a dedicated Operations / Audit screen.
- Old `/operations` URLs now land on Browser.
- Browser-oriented source tree management remains intact.

## Notes
- Backend operations and audit endpoints are still present; this step removes only the frontend route and route-specific UI.
- Recent run loading remains because repository/source-tree UI still uses it for status context.
