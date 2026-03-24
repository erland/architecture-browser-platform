# Step 9 — Clean up tests and fixtures

This step aligns the frontend test suite with the browser-only shell.

## What changed

- Replaced placeholder browser-only tests with concrete browser-first coverage for:
  - `BrowserSourceTreeLauncher`
  - `BrowserSourceTreeSwitcherDialog`
- Kept route normalization tests because legacy URLs still intentionally normalize to `/browser`.
- Kept selection/bootstrap tests because the browser-only flow still depends on:
  - workspace bootstrap under the hood
  - source switching
  - selection restoration on refresh

## Result

The remaining frontend tests now better reflect the intended browser-only UX:

- launch into Browser
- manage sources from the Source tree dialog
- initialize the implicit workspace only when none exists
- avoid surfacing Compare / Operations / workspace-page UI in the browser-first shell

## Verification

Recommended local checks:

```bash
(cd apps/web && npm run test)
(cd apps/web && npm run typecheck)
```
