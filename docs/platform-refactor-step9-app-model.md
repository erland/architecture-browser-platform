# Step 9: Review and simplify `appModel.ts`

## Goal
Reduce accidental coupling in the frontend model layer by splitting the large `appModel.ts` file into smaller responsibility-based modules while preserving the existing import surface.

## What changed

The original `apps/web/src/appModel.ts` mixed several different concerns:

- API-facing workspace/repository/run/snapshot DTOs
- full snapshot payload types used by the browser
- layout/search/dependency/detail explorer view models
- overlay/comparison/customization models
- operations/admin models
- UI form defaults and initial constants
- general utility functions

That file is now split into:

- `appModel.api.ts`
- `appModel.snapshot.ts`
- `appModel.explorers.ts`
- `appModel.customization.ts`
- `appModel.operations.ts`
- `appModel.forms.ts`
- `appModel.utils.ts`

The public compatibility layer remains:

- `appModel.ts`

It now re-exports the new modules, so existing imports do not need to change.

## Why this is better

- keeps raw API-facing DTOs separated from richer browser snapshot/explorer types
- isolates admin/operations models from browser exploration models
- isolates UI form defaults from domain/API types
- makes future cleanup possible without touching all consumers at once
- preserves backward compatibility while shrinking the main hotspot

## Verification

Recommended local verification:

```bash
cd apps/web
npx tsc -p tsconfig.json --noEmit
```

If dependencies are installed, also run the web test suite.
