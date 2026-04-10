# runs

Run services are split between workflow orchestration and narrower read helpers:

- `RunQueryService` owns repository/workspace run list queries.
- `RunLookupService` owns run ownership validation for detail reads.
- `RunResponseMapper` maps run entities to API responses.
- `IndexRunService` coordinates request validation, run persistence, gateway execution, and read helpers.

This keeps stable query and mapping logic out of the main application service.
