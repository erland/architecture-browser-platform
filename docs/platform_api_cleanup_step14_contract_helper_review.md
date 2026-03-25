# Step 14 — Contract/introspection/dev helper review

## Scope reviewed

This review covers backend resources and helpers that are **not used by the cleaned Browser-first frontend** and should therefore be considered as a **separate cleanup wave**, not automatic dead-code removal.

Reviewed classes:

- `BaselineResource`
- `DomainModelResource`
- `IndexerIrContractResource`
- `ImportContractResource`
- `StubImportService`
- `IndexerImportContractValidator`

## Current conclusion

These classes are **not required by the cleaned frontend runtime flow**, but they are **not all equally removable**.

### Keep for now

#### `IndexerImportContractValidator`
Keep.

Reason:
- It is used by the active import flow through `SnapshotImportService`.
- It also has direct test coverage through `IndexerImportContractValidatorTest`.

This validator is shared infrastructure, not just a helper for the review/contract endpoints.

### Review separately before removal

#### `ImportContractResource`
Not used by the cleaned frontend.

Reason to review separately:
- It is a developer-facing contract/helper endpoint.
- It depends on `IndexerImportContractValidator` and `StubImportService`.
- Removing it may be reasonable later, but should be done as a conscious product/developer-workflow decision.

#### `StubImportService`
Review separately.

Reason:
- It appears tied to `ImportContractResource` rather than the active frontend flow.
- It may become removable if the helper endpoint is removed and no tests/dev flows still depend on it.

### Likely removable in a later optional wave

#### `BaselineResource`
Not used by the cleaned frontend.

Interpretation:
- Looks like a helper/introspection/demo-style endpoint.
- Can be considered for removal later if you want to reduce non-product API surface.

#### `DomainModelResource`
Not used by the cleaned frontend.

Interpretation:
- Looks like a domain/introspection endpoint.
- Safe to treat as optional surface rather than core runtime API.

#### `IndexerIrContractResource`
Not used by the cleaned frontend.

Interpretation:
- Looks like a contract/introspection endpoint for developers/integration validation.
- Can be reviewed in a later optional cleanup wave.

## Recommended next stance

Do **not** remove anything automatically in this step.

Use the following rule for future cleanup:

- Keep shared runtime import infrastructure (`IndexerImportContractValidator`).
- Treat helper/introspection resources as a separate optional reduction of developer-facing API surface.
- Only remove `StubImportService` together with `ImportContractResource`, after confirming no remaining tests or workflows need it.

## Suggested later cleanup order

1. Decide whether developer-facing contract/helper endpoints should remain exposed.
2. If no, remove:
   - `BaselineResource`
   - `DomainModelResource`
   - `IndexerIrContractResource`
   - `ImportContractResource`
3. Then remove `StubImportService` if it has no remaining references.
4. Keep `IndexerImportContractValidator` because it is still part of active import processing.
