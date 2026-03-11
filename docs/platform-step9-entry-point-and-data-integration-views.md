# Step 9 – Entry-point and data/integration views

This slice adds a categorized explorer over imported snapshot facts so architects can inspect:

- entry points (`ENDPOINT`, `STARTUP_POINT`)
- data-related surfaces (`DATASTORE`, `PERSISTENCE_ADAPTER`, `CONFIG_ARTIFACT`)
- integration-related surfaces (`SERVICE`, `EXTERNAL_SYSTEM`)

## Backend

Added endpoint:

- `GET /api/workspaces/{workspaceId}/snapshots/{snapshotId}/entry-points`

Supported query parameters:

- `scopeId` – optional scope subtree filter
- `category=ALL|ENTRY_POINT|DATA|INTEGRATION`
- `focusEntityId` – optional focused detail item

The response includes:

- selected scope reference
- counts for visible items and categories
- visible item list with owner scope path and source context
- focused detail with inbound/outbound relationships to related owners

## Frontend

Added a new snapshot panel for:

- scope filtering
- category filtering
- focused detail selection
- item inventory with related-kind summaries
- focused inbound/outbound relationship lists
- source path and source snippet preview

## Tests

Backend tests cover:

- category filtering for entry points, data, and integration surfaces
- focused detail for a datastore item
- source-context propagation

Frontend tests added only for pure helper logic to keep them stable:

- option mapping and sorting
- kind summary generation
