# Platform Step 5 — Frontend action to open source for the selected object

This step adds the first web UI affordance for source view.

## Included

- Adds a **View source** action to the facts panel when the current scope/entity/relationship has source refs.
- Adds frontend request types for the source-view API.
- Adds `platformApi.readSourceView(...)` for the new backend endpoint.
- Adds a small Browser view helper that:
  - builds a selected-object source-view request from the current Browser session state
  - calls the platform source-view endpoint
  - opens the returned source text in a separate browser window as a temporary read-only surface

## Notes

- This step intentionally does **not** add the in-app source viewer yet.
- The temporary browser window is only a bridge so the action is usable before the embedded viewer is added.
- The next step should replace the popup with a proper read-only source viewer inside the web app.
