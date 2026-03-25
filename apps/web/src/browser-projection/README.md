# Browser projection entry point

- Public projection entry point: `index.ts`
- `build.ts` orchestrates the projection pipeline.
- `sourceMapping.ts`, `nodeShaping.ts`, and `edgeShaping.ts` own the phase-specific logic.

Add new projection behavior to the most specific phase module possible before expanding the top-level builder.
