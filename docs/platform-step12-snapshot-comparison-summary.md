# Step 12 — Snapshot comparison summary

This step adds a high-level snapshot comparison between a selected base snapshot and another snapshot in the same workspace.

## Backend

Added comparison endpoint:
- `GET /api/workspaces/{workspaceId}/snapshots/{snapshotId}/compare?otherSnapshotId=...`

The comparison summary reports:
- added/removed scopes
- added/removed entities
- added/removed relationships
- added/removed entry points
- notable integration and persistence changes
- added/removed dependency previews

The comparison remains MVP-oriented and intentionally avoids deep semantic diffing.

## Frontend

Added a Step 12 section on the snapshot page with:
- compare-against snapshot selector
- headline summary
- top-level count cards
- added entry-point preview
- integration/persistence change preview
- added/removed dependency preview

## Tests

Added:
- backend comparison API test using a second snapshot fixture
- stable frontend helper tests for comparison headline and snapshot option filtering
