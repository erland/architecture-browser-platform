# Browser full-screen shell (Step 7)

This step reshapes the Browser route into a focused analysis workspace shell while keeping the existing browser capabilities available during the migration.

## What changed

- The `/browser` route now bypasses the large app-level hero and primary navigation.
- Browser renders inside its own dedicated workspace shell.
- The shell keeps only compact orientation and route controls visible:
  - workspace
  - repository
  - snapshot
  - current analysis mode
  - back/change controls
- The screen is split into three areas:
  - left rail: current browser modes and destination shortcuts
  - center: main analysis surface for the active Browser mode
  - right rail: compact orientation and local-session information

## Why this shape

The plan calls for Browser to behave like a modeling/analysis tool rather than another dashboard section. This step implements that shell first, before later steps replace the current tabbed center content with:

- a left navigation tree
- a top local search bar
- a graph canvas
- a dedicated facts panel

## Intentional limitations of this step

This step does **not** yet replace the old Browser mode content. The current Overview/Layout/Dependencies/Entry points/Search surfaces are still used inside the new shell so the migration remains incremental and safe.

## Key files

- `apps/web/src/App.tsx`
- `apps/web/src/views/BrowserView.tsx`
- `apps/web/src/components/BrowserTabNav.tsx`
- `apps/web/src/styles.css`

## Follow-up steps

- Step 8: replace the left rail's mode-first navigation with a true scope tree
- Step 9: move local search into the slim top bar
- Steps 10-11: convert center/right areas into canvas + facts panel
