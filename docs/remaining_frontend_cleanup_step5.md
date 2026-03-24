# Remaining frontend cleanup — Step 5

## Step implemented

Remove orphaned browser index helper files.

## What changed

Deleted:

- `apps/web/src/browserSnapshotIndex.shared.ts`

## Rationale

`browserSnapshotIndex.shared.ts` was an orphaned compatibility barrel that no longer had any live runtime importers in the Browser-only frontend. The active Browser index flow already imports the split helper modules directly.

## Intentionally unchanged

- the live browser snapshot index modules remain in place
- no browser runtime behavior was changed
- saved-view related foundations remain untouched
