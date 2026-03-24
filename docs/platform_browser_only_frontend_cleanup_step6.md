# Platform browser-only frontend cleanup — Step 6

## Step implemented
Collapse workspace UI to one implicit workspace model.

## What changed
- Removed workspace-creation UI from the Browser source-tree dialog.
- The Browser source-tree flow now treats the workspace as an implicit internal container.
- When no workspace exists yet, the dialog offers a single initialization action instead of exposing workspace management concepts.
- Browser launcher copy no longer shows workspace context.
- Workspace selection now prefers the first active workspace automatically.

## Current behavior
- Browser still uses workspace ids under the hood for API calls and persisted selection state.
- Users no longer manage or switch workspaces from the Browser-facing flow.
- If a deployment has no workspace yet, the source-tree dialog can initialize the implicit default workspace.

## Notes
- This step intentionally does not delete old workspace-focused view files yet.
- The remaining cleanup of dead route-first files belongs to later steps.
