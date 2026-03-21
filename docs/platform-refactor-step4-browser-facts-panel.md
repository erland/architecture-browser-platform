# Step 4: Refactor `BrowserFactsPanel.tsx`

## Goal
Reduce `BrowserFactsPanel.tsx` by separating panel model construction, reusable formatting helpers, and section-level rendering while preserving the existing public import surface.

## Changes made
- Introduced `apps/web/src/components/BrowserFactsPanel.types.ts` for exported facts-panel model/types.
- Introduced `apps/web/src/components/BrowserFactsPanel.model.ts` for `buildBrowserFactsPanelModel(...)` and related model-building helpers.
- Introduced `apps/web/src/components/BrowserFactsPanel.utils.tsx` for shared display/formatting helpers.
- Introduced `apps/web/src/components/BrowserFactsPanel.sections.tsx` for section-level rendering components.
- Kept `apps/web/src/components/BrowserFactsPanel.tsx` as the public facade and top-level shell component.

## Result
The former single large UI/component file is now split into:
- model construction
- formatting/display helpers
- section rendering
- thin top-level component shell

This preserves current imports for:
- `BrowserFactsPanel`
- `buildBrowserFactsPanelModel`
- exported panel model/types

## Verification
Compile verification command:

```bash
cd apps/web
npx tsc -p tsconfig.json --noEmit
```
