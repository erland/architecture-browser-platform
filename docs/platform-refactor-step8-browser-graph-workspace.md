# Step 8: Refactor `BrowserGraphWorkspace.tsx`

## Goal

Reduce the size and mixed responsibilities of `apps/web/src/components/BrowserGraphWorkspace.tsx` by separating:

- viewport drag/pan/zoom interaction mechanics
- entity selection action derivation
- large JSX rendering sections

while keeping `BrowserGraphWorkspace.tsx` as the stable public component entry point.

## Changes made

### New files

- `apps/web/src/components/BrowserGraphWorkspace.types.ts`
- `apps/web/src/components/BrowserGraphWorkspace.actions.ts`
- `apps/web/src/components/useBrowserGraphWorkspaceInteractions.ts`
- `apps/web/src/components/BrowserGraphWorkspace.sections.tsx`

### Responsibilities after refactor

- `BrowserGraphWorkspace.tsx`
  - thin orchestration shell
  - computes focused counts and focused entity/scope state
  - wires callbacks into toolbar/canvas sections

- `BrowserGraphWorkspace.actions.ts`
  - `buildEntitySelectionActions(...)`
  - scope label helper
  - UML compartment subtitle formatting
  - action-count helpers

- `useBrowserGraphWorkspaceInteractions.ts`
  - fit-view effect
  - drag state
  - viewport pan state
  - wheel zoom behavior
  - click suppression during drags

- `BrowserGraphWorkspace.sections.tsx`
  - header/toolbar/helper-row rendering
  - empty-state rendering
  - canvas/edge rendering
  - node rendering
  - UML compartment rendering

- `BrowserGraphWorkspace.types.ts`
  - prop and interaction types shared by the new modules

## Verification

TypeScript compile check passed:

```bash
cd apps/web
npx tsc -p tsconfig.json --noEmit
```

## Expected end state

`BrowserGraphWorkspace.tsx` is no longer a mixed interaction/rendering god component. Interaction logic, action derivation, and render-heavy sections are now separated behind a stable top-level component facade.
