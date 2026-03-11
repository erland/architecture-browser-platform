# Platform ↔ indexer integration

This step replaces the platform stub indexer adapter with a real remote HTTP gateway.

## What changed

- `IndexRunService` now delegates run execution to `IndexerExecutionGateway`.
- `IndexerExecutionGateway` selects between:
  - `stub` mode for tests and fallback
  - `remote` mode for real HTTP worker integration
- `RemoteIndexerGateway` calls the indexer worker at `POST /api/index-jobs/run`, extracts the returned `document`, enriches `runMetadata.metadata`, and then imports the payload through the existing snapshot import path.

## Configuration

The API now supports these settings:

- `PLATFORM_INDEXER_MODE=stub|remote`
- `PLATFORM_INDEXER_BASE_URL=http://indexer:8080`
- `PLATFORM_INDEXER_CONNECT_TIMEOUT_SECONDS=10`
- `PLATFORM_INDEXER_READ_TIMEOUT_SECONDS=300`

## Packaging

### Dev

The dev compose file now builds the sibling `architecture-browser-indexer` repository locally and exposes it on `localhost:8082`.
No registry push is required.

### Test

The test compose file now expects a published `PLATFORM_INDEXER_IMAGE` and mounts the bundled sample repository so `scripts/smoke-test.sh` can verify the real indexing path without rebuilding on the test server.
