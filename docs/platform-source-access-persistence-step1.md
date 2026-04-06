# Platform Step 1 — Persist source-access metadata from the indexer run response

## Goal
Persist the indexer worker `sourceAccess` handoff metadata in the platform run record without changing the platform database shape yet.

## Implementation in this step

- The remote indexer response mapper now copies top-level worker `sourceAccess` into the imported document under:
  - `runMetadata.metadata.sourceAccess`
- The existing run lifecycle already persists `payload.runMetadata` into `index_run.metadata_json` after a successful import.
- As a result, successful run records now retain source-view access metadata such as:
  - `sourceHandle`
  - `accessMode`
  - retention-related metadata returned by the worker

## Why this shape
This keeps Step 1 small and backward compatible:

- no schema migration is required yet
- no new platform endpoint is required yet
- the metadata survives import because it is stored alongside the existing run metadata payload
- later steps can read the persisted `sourceHandle` from the run record and expose it through dedicated platform source-view services

## Stored location
After a successful remote indexing/import cycle, the run record `metadataJson` contains JSON equivalent to:

```json
{
  "startedAt": "2026-04-05T10:00:00Z",
  "completedAt": "2026-04-05T10:00:15Z",
  "outcome": "SUCCESS",
  "detectedTechnologies": ["java", "typescript"],
  "metadata": {
    "indexerGateway": "remote-http",
    "indexerJobId": "job-123",
    "workerStatus": "COMPLETED",
    "sourceAccess": {
      "sourceHandle": "src_123",
      "accessMode": "RETAINED_ROOT"
    }
  }
}
```

## Deferred to later platform steps

- parsing `sourceAccess` into a dedicated backend DTO/service
- exposing a source-view endpoint to the web UI
- selecting the best `sourceRef` for the chosen object
- rendering a read-only syntax-highlighted source viewer in the browser
