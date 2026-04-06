# Platform Step 2 — Source-view contract and proxy service

## What this step adds
This step introduces the platform-internal backend seam for on-demand source viewing without exposing the indexer worker directly to the web app yet.

Added pieces:
- `SourceViewReadRequest`
- `SourceViewReadResponse`
- `RemoteIndexerSourceViewRequestFactory`
- `RemoteIndexerSourceViewResponseMapper`
- `RemoteIndexerSourceViewErrorMapper`
- `PlatformSourceViewProxyService`

## Current behavior
The new proxy service sends a request to the indexer worker endpoint:
- `POST /api/source-files/read`

It accepts:
- `sourceHandle`
- `path`
- optional `startLine`
- optional `endLine`

It returns normalized platform-side DTOs containing:
- `sourceHandle`
- `path`
- `language`
- `totalLineCount`
- `fileSizeBytes`
- `requestedStartLine`
- `requestedEndLine`
- `sourceText`

## Deliberate scope limit
This step does **not** yet add:
- a public platform REST endpoint
- snapshot/run lookup for `sourceHandle`
- selected-object `sourceRef` resolution
- any web UI source viewer

Those remain for later steps.
