# Remaining frontend cleanup — Step 9

## Objective

Do a focused saved-view/canvas decision analysis before any further deletion.

## Outcome

The analysis concludes that the current saved-view implementation is **not** the same thing as a full future **save canvas** feature, but it is still the best existing foundation to evolve from.

## Decision

Keep the saved-view foundations for now:

- `apps/web/src/savedViewModel.ts`
- saved-view related types in `apps/web/src/appModel.customization.ts`
- saved-view related methods in `apps/web/src/platformApi.ts`

Do not delete them as part of the unreachable-frontend cleanup wave.

## Rationale

The current saved-view model captures older explorer-oriented query/layout state, while the live Browser-only app is built around a richer `BrowserSessionState` that includes:

- canvas nodes and manual placement
- viewport state
- viewpoint selection
- facts panel state
- Browser graph/session state

That means the current saved-view payload is insufficient as-is for a real save-canvas feature, but the saved-view persistence concept and API surface are still useful and should be evolved later rather than removed now.

## Added document

This step adds:

- `docs/saved_view_vs_save_canvas_analysis.md`

## No code changes

This step is intentionally analysis-only and does not change runtime behavior.
