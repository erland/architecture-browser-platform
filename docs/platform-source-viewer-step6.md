# Platform Step 6 — Add a read-only source viewer in the web app

This step replaces the temporary popup-based source view with an embedded, read-only source viewer inside the Browser web UI.

## Included

- Adds `BrowserSourceViewDialog` as an in-app source viewer overlay.
- Renders source with:
  - file path
  - metadata badges
  - line numbers
  - focused source range highlighting
- Replaces the Step 5 popup helper with an in-app fetch helper that returns source payloads to the Browser UI.
- Wires the facts-panel **View source** action to open the embedded source viewer.
- Adds web tests for:
  - line model building
  - embedded source viewer rendering
  - null/closed rendering

## Notes

- This step keeps the viewer read-only.
- It does not yet add richer loading/error UX beyond the existing error alert path.
- It also does not yet add syntax-token highlighting beyond language-aware metadata display; a later step can deepen syntax rendering behavior.
