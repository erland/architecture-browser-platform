# Step 6 – Snapshot catalog and overview pages

This step adds the first browse-oriented read APIs and UI for imported snapshots.

## Backend

Added snapshot catalog endpoints:

- `GET /api/workspaces/{workspaceId}/snapshots`
- `GET /api/workspaces/{workspaceId}/repositories/{repositoryId}/snapshots`
- `GET /api/workspaces/{workspaceId}/snapshots/{snapshotId}`
- `GET /api/workspaces/{workspaceId}/snapshots/{snapshotId}/overview`

The overview response exposes:

- snapshot summary and repository identity
- source provenance (revision, branch, acquisition details)
- run metadata (times, outcome, detected technologies)
- completeness information (indexed/degraded files, omitted paths, notes)
- high-level fact-kind breakdowns
- top scopes by fact volume
- recent diagnostics
- warnings for partial snapshots

## UI

The web app now shows:

- a workspace-level snapshot catalog
- snapshot selection
- overview cards for the selected snapshot
- kind summaries, top scopes, and diagnostics

This is intentionally still an MVP browse surface. It is meant to give architects a quick understanding of what a snapshot contains before later steps add deeper layout, dependency, entry-point, and search views.
