# app-model

Shared frontend application model types and helpers used across API access, Browser state, views, and saved-canvas flows.

## Responsibilities
- API-facing DTO types
- snapshot payload types
- shared form defaults
- cross-layer request/response contracts
- source-tree helpers
- model-level utility helpers

This subtree is the single source of truth for frontend shared model types.


Contract ownership notes:
- `appModel.contracts.ts` owns shared frontend request/response contracts used by API transport, Browser workflows, and saved-canvas adapters.
- `api/` should send those contracts, not redefine them locally.
- subsystem application ports should not own backend DTOs.
