# Platform Step 7 — Wire the viewer to line-range focus and loading/error states

This step makes the embedded source viewer behave more like a first-class in-app tool instead of a simple rendered response blob.

## Included changes

- Adds explicit source-view UI states:
  - `idle`
  - `loading`
  - `ready`
  - `error`
- Updates the Browser inspector flow so opening source:
  - clears any stale source content
  - shows a loading state while the request is in flight
  - shows an error state inside the viewer when the request fails
  - shows the ready state once source content arrives
- Marks the first focused line as the viewer's focus target.
- Scrolls the focused line into view when a source response contains a requested line range.
- Falls back to scrolling to the top when there is no focused line.

## Why this step matters

Without these states, the embedded source viewer feels abrupt and brittle:

- users do not know whether the request is in progress
- expired handles and missing files only surface as generic alerts
- large files do not guide the user to the requested source range reliably

This step keeps source-view concerns local to the inspector/viewer seam instead of leaking them into broader Browser session state.

## What is still not included

- token-level syntax highlighting
- retry controls inside the viewer
- clickable source navigation
- source viewer deep-linking or URL state
