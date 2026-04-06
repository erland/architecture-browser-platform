# Platform source-view tests — Step 9

This step expands platform test coverage for the source-view feature across backend and frontend seams.

## Added backend coverage

- `SourceViewSelectionResolverServiceTest`
  - verifies diagnostic `filePath` fallback is converted into a readable source-view request when explicit `sourceRefs` are missing
- `SourceViewResourceTest`
  - verifies selected-object resolution failures such as an invalid `sourceRefIndex` are surfaced as validation errors

## Added frontend coverage

- `browserSourceView.test.ts`
  - verifies `requestSelectedObjectSourceView(...)` calls `platformApi.readSourceView(...)` with the selected-object request derived from browser session state
  - verifies the helper rejects when no selected object is available

## Coverage intent

Together with earlier steps, the platform source-view tests now cover:

- persisted source-access metadata handoff from run metadata
- backend proxy request/response mapping
- REST endpoint delegation and error mapping
- selected-object source-ref resolution
- frontend request construction
- embedded viewer rendering, focus, loading/error states, and syntax highlighting
