# Platform Step 10 – Search and entity detail pages

This step adds snapshot-scoped entity search and a generic entity detail view.

## Backend

- Added `GET /api/workspaces/{workspaceId}/snapshots/{snapshotId}/search`
  - Query params:
    - `q`
    - `scopeId`
    - `limit`
- Added `GET /api/workspaces/{workspaceId}/snapshots/{snapshotId}/entities/{entityId}`
- Search matches names/display names, kinds, summaries, scope paths, source paths, and source snippets.
- Search results include scope-path disambiguation so duplicate names across modules/packages remain understandable.
- Entity detail includes source references, metadata, and inbound/outbound relationship navigation.

## Frontend

- Added Step 10 snapshot panel for search and entity detail.
- Supports free-text search, scope filtering, result selection, and relationship-based drill-down to adjacent entities.
- Shows source context and raw metadata when present.

## Tests

- Added backend API tests for duplicate-name search behavior and entity detail payloads.
- Added stable frontend Jest tests for search result labeling/sorting and match-reason formatting.
