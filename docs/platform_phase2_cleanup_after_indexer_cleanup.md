# Platform phase 2 cleanup after indexer cleanup

This update removes the legacy worker-backed source-view path now that snapshot-owned source files are the durable source-view model.

Removed legacy pieces:
- `POST /api/workspaces/{workspaceId}/source-view/read`
- worker proxy service and mappers for `/api/source-files/read`
- `sourceHandle` from source-view request/response contracts
- frontend `platformApi.readSourceView(...)`
- legacy tests for worker-backed source retrieval

Retained durable path:
- `POST /api/workspaces/{workspaceId}/snapshot-source-files/read`
- selected-object resolution through stored snapshot source files
- embedded read-only source viewer in the web app

Also simplified:
- `RemoteIndexerResponseMapper` no longer persists legacy `sourceAccess` metadata
- source-view models now represent snapshot-backed reads only
