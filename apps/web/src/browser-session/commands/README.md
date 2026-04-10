# Browser session command grouping

This folder owns grouped browser-session mutation surfaces and their bound action helpers.

## Files

- `mutations.ts` — canonical grouped mutation collections by responsibility area.
- - `bindings.ts` — React `setState` binding helpers that turn grouped mutations into action groups.
- `types.ts` — generic mutation and binding types.
- `index.ts` — public barrel.

## Working rules

- Treat `mutations.ts` as the canonical grouped mutation surface.
- Command alias exports now live directly on the canonical `commands/index.ts` entrypoint.
- Prefer direct imports from focused canvas modules inside `mutations.ts` rather than re-routing through the public canvas barrel.
- Keep binding logic in `bindings.ts`; do not mix state-binding concerns into the grouped mutation modules.
