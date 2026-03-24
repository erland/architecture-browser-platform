# Remaining frontend cleanup — Step 8

## Goal

Finish the cleanup wave by tidying exports, tests, and active documentation after the earlier deletions.

## What changed

- Reviewed frontend source for lingering imports or exports referencing modules removed in steps 2–7.
- Confirmed there are no remaining runtime imports in `apps/web/src` for the removed route helper, explorer helpers, snapshot-preparation hooks, orphaned browser index helper, or dead customization UI.
- Kept the surviving test suite focused on the live Browser-only flow and retained saved-view tests intentionally.
- Updated stale Browser bootstrap wording to match the current Browser-only UX:
  - old: `Return to Snapshots and prepare Browser data first.`
  - new: `Open the source tree dialog and prepare Browser data first.`

## Intentionally retained

- `savedViewModel.ts`
- `appModel.customization.ts`
- saved-view methods in `platformApi.ts`
- historical architecture/refactor notes under `docs/` that mention earlier files or intermediate designs

The historical docs are kept as project history rather than treated as active product documentation.

## Verification notes

- A repo-wide search over `apps/web/src` shows no remaining references to the modules removed in steps 2–7.
- The active Browser-only source tree / bootstrap / session flow remains unchanged apart from the stale wording cleanup.
