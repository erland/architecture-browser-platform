# Step 13 — Administration, retention, and operational visibility

This step adds an operations-oriented administration slice for architects and maintainers.

## Backend

Added operations endpoints under:
- `GET /api/workspaces/{workspaceId}/operations/overview`
- `GET /api/workspaces/{workspaceId}/operations/retention/preview`
- `POST /api/workspaces/{workspaceId}/operations/retention/apply`

The overview includes:
- workspace-level health and operational counts
- repository administration rows with latest snapshot/run state
- recent runs and failed runs
- failed or partial snapshots with extracted diagnostics and warnings
- retention defaults for safe cleanup

Retention implementation:
- keeps the newest N snapshots per repository
- keeps terminal runs per repository while protecting runs still referenced by retained snapshots
- deletes imported facts, overlays, saved views, and snapshot-linked audit events for removed snapshots
- deletes run-linked audit events for removed runs
- records a `retention.applied` audit event when cleanup is applied

## Frontend

Added a Step 13 operations section with:
- health/summary cards
- repository administration overview
- retention preview/apply controls
- failed run visibility
- problematic snapshot diagnostics visibility

## Tests

Added:
- backend API tests for overview/diagnostics and retention preview/apply
- stable frontend helper tests for operations headline and retention form normalization
