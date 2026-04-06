# Platform Step 3 — Source-view API endpoint

This step adds a platform REST endpoint for source viewing.

## Added endpoint

- `POST /api/workspaces/{workspaceId}/source-view/read`

## Request body

```json
{
  "sourceHandle": "src_123",
  "path": "src/App.tsx",
  "startLine": 10,
  "endLine": 20
}
```

## Response body

The platform returns the proxied source-view payload using its own API DTOs:

```json
{
  "sourceHandle": "src_123",
  "path": "src/App.tsx",
  "language": "tsx",
  "totalLineCount": 120,
  "fileSizeBytes": 4096,
  "requestedStartLine": 10,
  "requestedEndLine": 20,
  "sourceText": "..."
}
```

## Current scope

This endpoint is intentionally thin in Step 3:

- it does not yet resolve selected-object source refs
- it does not yet look up `sourceHandle` from snapshot/run state
- it simply exposes a stable platform API that proxies to the indexer source-read endpoint

## Error handling

- missing request body or invalid request fields are mapped to `400 validation_error`
- upstream indexer failures are mapped to `502 upstream_error`

## Next step

Step 4 will add backend logic that resolves a selected entity, relationship, or diagnostic into the appropriate
`sourceHandle + path + optional line range` request.
