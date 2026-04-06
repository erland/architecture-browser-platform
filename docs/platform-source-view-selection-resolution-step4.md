# Platform Step 4 — Resolve selected-object source refs into a source-view request

This step adds backend resolution from a selected snapshot object to the concrete source-read request sent to the indexer.

## Added behavior

The platform source-view endpoint now supports two request shapes:

1. **Direct source-read request**
   - caller provides `sourceHandle + path + optional line range`
2. **Selected-object request**
   - caller provides `snapshotId + selectedObjectType + selectedObjectId`
   - optional `sourceRefIndex` chooses a non-primary source ref when multiple refs are present

## Resolution flow

When the request does not already contain `sourceHandle` and `path`, the platform now:

1. loads the snapshot by `workspaceId + snapshotId`
2. parses the stored snapshot payload
3. finds the selected object by type and id
4. picks the best readable `sourceRef`
5. loads the run referenced by the snapshot
6. extracts `run.metadata.sourceAccess.sourceHandle`
7. builds a concrete source-read request using:
   - `sourceHandle`
   - `sourceRef.path`
   - `sourceRef.startLine`
   - `sourceRef.endLine`

## Supported selected object types

- `SCOPE`
- `ENTITY`
- `RELATIONSHIP`
- `DIAGNOSTIC`

## Request example

```json
{
  "snapshotId": "snapshot-123",
  "selectedObjectType": "ENTITY",
  "selectedObjectId": "entity:com.example.OrderService"
}
```

Optional alternate source ref selection:

```json
{
  "snapshotId": "snapshot-123",
  "selectedObjectType": "RELATIONSHIP",
  "selectedObjectId": "rel:call:abc123",
  "sourceRefIndex": 1
}
```

## Fallback behavior

- diagnostics can fall back to `filePath` when they do not contain explicit `sourceRefs`
- explicit `startLine` / `endLine` in the request override the selected source-ref range
- existing direct request support remains intact for backwards compatibility

## Validation and failure behavior

The resolver rejects requests when:

- snapshot identity is missing
- selected object identity is missing
- selected object type is unsupported
- the selected object is not found in the snapshot payload
- the selected object has no readable source reference
- the snapshot has no associated run
- the run metadata does not contain `metadata.sourceAccess.sourceHandle`

## Deferred

- richer source-ref ranking than “first readable ref”
- lookup by snapshot key or current browser session context
- dedicated source-ref metadata selection rules
