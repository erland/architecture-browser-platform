
# Browser graph workspace

- `BrowserGraphWorkspace.tsx` owns composition and action wiring for the canvas workspace.
- `BrowserGraphWorkspace.sections.tsx` is now a thin composition layer for toolbar and canvas sections.
- `BrowserGraphWorkspaceToolbarHeader.tsx` owns the canvas header/meta badges.
- `BrowserGraphWorkspaceToolbarMenus.tsx` owns the Add / Arrange / Selection menu rendering.
- `BrowserGraphWorkspaceMenu.tsx` owns shared menu shell and menu-close helpers.
- `BrowserGraphWorkspaceEdgeLayer.tsx` owns edge rendering.
- `BrowserGraphWorkspace.edgeGeometry.ts` owns edge path/fallback geometry helpers.
- `BrowserGraphWorkspaceNodeLayer.tsx` owns node and UML compartment rendering.

# Browser facts panel

- `BrowserFactsPanel.model.ts` owns domain fact assembly for scope/entity/relationship/overview selections.
- `BrowserFactsPanel.presentation.ts` owns section/header/action presentation shaping for the facts panel.
- `BrowserFactsPanel.sections.tsx` now renders section-specific presentation models instead of reaching through the full Browser session state.

