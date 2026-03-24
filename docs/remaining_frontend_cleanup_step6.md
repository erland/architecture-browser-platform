# Remaining frontend cleanup — Step 6

## What this step does

This step narrows customization-related frontend code without deleting saved-view foundations that may still be useful for a future save-canvas feature.

## Removed in this step

- `apps/web/src/components/CustomizationPanel.tsx`
- `apps/web/src/components/snapshotCatalogTypes.ts`

These files represented unreachable customization UI from an earlier route/screen model and were no longer part of the active Browser-only shell.

## Intentionally kept

The following remain in place for now:

- `apps/web/src/savedViewModel.ts`
- saved-view related types in `apps/web/src/appModel.customization.ts`
- saved-view related API methods in `apps/web/src/platformApi.ts`

## Why saved-view foundations were kept

A future "save canvas" feature may overlap with or evolve from saved-view concepts. Until that is analyzed explicitly, it is safer to retain the saved-view model and API seams while removing only clearly dead UI.
