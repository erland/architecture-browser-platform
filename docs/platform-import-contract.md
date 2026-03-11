# Platform Import Contract (Step 2)

## Supported source contract

The platform currently supports the observed indexer JSON shape with:

- schema version `1.0.0`
- platform import version `2026-03-step2`

## Top-level fields

- `schemaVersion`
- `indexerVersion`
- `runMetadata`
- `source`
- `scopes`
- `entities`
- `relationships`
- `diagnostics`
- `completeness`
- `metadata`

## Contract handling strategy

1. Validate the JSON payload against the JSON Schema.
2. Parse the payload into Java records.
3. Seed or locate a workspace and repository registration.
4. Create an immutable snapshot row.
5. Store imported scopes/entities/relationships/diagnostics into `imported_fact`.
6. Record an audit event.

## Stub import endpoint

`POST /api/imports/indexer-ir/stub-store`

Behavior:
- rejects invalid payloads with `400`
- accepts valid payloads with `201`
- returns snapshot and count summary

## Why not fully normalize the import yet?

The main browse/use cases are not implemented yet, so Step 2 deliberately postpones hard normalization into many query-specific tables. The generic fact projection keeps the contract stable while future steps reveal which views deserve specialized storage.
