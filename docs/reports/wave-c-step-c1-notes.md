## Wave C — Step C1 notes

This step refactors `BrowserNavigationTree.tsx` by separating pure tree/grouping logic and local expansion-state orchestration from the JSX view.

Added modules:
- `apps/web/src/components/browserNavigationTree.model.ts`
- `apps/web/src/components/browserNavigationTree.state.ts`

Resulting responsibilities:
- `browserNavigationTree.model.ts` owns tree-mode metadata, ancestor/default-expansion calculations, category grouping, full-tree expansion, and summary derivation.
- `browserNavigationTree.state.ts` owns local expanded-scope / expanded-category state and the actions that mutate that state.
- `BrowserNavigationTree.tsx` now focuses on rendering and wiring callbacks into the view.

Compatibility:
- `BrowserNavigationTree.tsx` still exports `collectAncestorScopeIds`, `computeDefaultExpandedScopeIds`, `buildScopeCategoryGroups`, and `computeDefaultExpandedCategories` so existing tests/imports continue to work.
- No route/view call sites were changed.

Behavioral intent:
- no deliberate runtime behavior change
- clearer separation between tree model logic, component-local state, and rendering
