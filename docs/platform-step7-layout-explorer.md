# Step 7 — Repository/module layout explorer

This step adds a layout-oriented browse surface on top of imported snapshot facts.

## Backend

New APIs:
- `GET /api/workspaces/{workspaceId}/snapshots/{snapshotId}/layout/tree`
- `GET /api/workspaces/{workspaceId}/snapshots/{snapshotId}/layout/scopes/{scopeId}`

The tree API returns nested repository/module/package scopes with:
- direct child-scope counts
- direct entity counts
- descendant counts
- direct entity kind badges

The scope detail API supports drill-down navigation by returning:
- breadcrumb path
- child scopes
- direct entities
- direct entity classification counts

## Frontend

The snapshot area now includes a layout explorer that lets the user:
- pick a snapshot
- browse the repository/module/package tree
- click into a scope for drill-down
- inspect direct entities under the selected scope

## Notes

This step deliberately uses imported snapshot facts rather than introducing a fully separate read model. That keeps the persistence model simple while still making repository/module/package navigation possible for the MVP.
