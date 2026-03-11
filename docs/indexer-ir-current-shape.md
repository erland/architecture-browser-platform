# Current indexer IR shape observed from the MVP-level indexer source

This note summarizes the current JSON payload shape emitted by the attached `architecture-browser-indexer` MVP source and fixture files. It is meant to help the platform implementation in Steps 1 and 2 by grounding the import boundary in the code that exists today.

## Source of understanding

The current understanding comes from:

- `src/main/java/.../ir/model/*` in the attached indexer repository
- `ArchitectureIrFactory`
- `ArchitectureIrJson`
- fixture payloads under `src/test/resources/fixtures/ir`

## Current top-level document

The current indexer payload is represented by `ArchitectureIndexDocument` with these top-level fields:

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

## Current important observations

### The live shape differs slightly from the early MVP foundation sketch

The foundation document proposed:
- `sourceUnits`
- top-level `sourceRefs`

The actual current indexer payload instead uses:
- a single `source` object for repository acquisition metadata
- `sourceRefs` embedded inside scopes, entities, relationships, and diagnostics
- no top-level `sourceRefs` array

This means the platform should align Step 2 import work with the **actual emitted payload**, not only the original skeleton.

### Current scope kinds

Observed enum values:

- `REPOSITORY`
- `MODULE`
- `PACKAGE`
- `COMPONENT`
- `DIRECTORY`
- `FILE`

### Current entity kinds

Observed enum values:

- `CLASS`
- `INTERFACE`
- `FUNCTION`
- `MODULE`
- `ENDPOINT`
- `SERVICE`
- `PERSISTENCE_ADAPTER`
- `UI_MODULE`
- `STARTUP_POINT`
- `DATASTORE`
- `EXTERNAL_SYSTEM`
- `CONFIG_ARTIFACT`

### Current relationship kinds

Observed enum values:

- `DEPENDS_ON`
- `EXPOSES`
- `CALLS`
- `READS`
- `WRITES`
- `CONTAINS`
- `USES`

### Origin and completeness

The current payload already distinguishes:

- entity origin: `OBSERVED` vs `INFERRED`
- run outcome: `SUCCESS`, `PARTIAL`, `FAILED`
- completeness status: `COMPLETE`, `PARTIAL`, `FAILED`

This is useful because the platform can later expose inferred-vs-observed facts and partial-result warnings in the UI without inventing a new concept.

## Suggested Step 2 platform contract direction

Use the current emitted payload as the canonical import contract baseline and:

- preserve the current top-level fields
- treat `metadata` as extensibility space
- preserve nested `sourceRefs`
- keep imported facts immutable per snapshot
- store overlays/notes/saved views outside imported snapshot facts
- document any platform-side normalization explicitly if a richer browse model is introduced

## Immediate platform implications

- The backend import endpoint should parse the current `ArchitectureIndexDocument` shape.
- The first persistence schema should be able to store snapshot-level source metadata, scopes, entities, relationships, diagnostics, completeness, and opaque metadata.
- The browse model can later denormalize some of this into faster query tables, but the original imported payload should remain reconstructable or at least traceable.
