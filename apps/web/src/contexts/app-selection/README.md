# App selection support

This folder keeps Browser/app selection concerns split into narrower responsibilities:

- `appSelectionPolicy.ts` owns pure selection and precedence rules
- `appSelectionStorage.ts` owns localStorage and URL persistence helpers
- `useAppSelectionPersistence.ts` wires persisted selection + URL sync
- `useAppSelectionLocationSync.ts` wires browser back/forward reconciliation
- `useBrowserLastOpenedSourceSync.ts` persists the Browser-specific "last opened source tree" record

`AppSelectionContext.tsx` should stay focused on exposing the selection state and wiring these helpers together.
