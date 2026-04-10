# browser-source-view

This package owns the source-view dialog and its focused helpers.

## Ownership split

- `BrowserSourceViewDialog.tsx` composes fetch/render/status/focus behavior for the source viewer dialog.
- `browserSourceViewLines.ts` owns line normalization and focus-range derivation.
- `browserSourceViewHighlighting.tsx` owns tokenization and syntax-highlighting helpers for supported languages.

## Intent

The dialog should stay focused on UI composition and interaction behavior. Tokenization/highlighting and line/focus derivation belong in focused helpers so source-view feature work can evolve without growing the dialog component into a mixed UI + parsing module.
