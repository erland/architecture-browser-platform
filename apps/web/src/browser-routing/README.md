# browser-routing

This folder is split by concern:

- `extract.ts` builds routing inputs from projected browser nodes and edges.
- `routingCandidates.ts` generates and scores orthogonal route candidates.
- `routingEndpoints.ts` adjusts route endpoints and adds connection stubs.
- `routingPresentation.ts` converts point lists into SVG path and label metadata.
- `geometry.ts` contains shared low-level geometry helpers.
- `engine.ts` coordinates the above pieces and exposes the public route builder.


Cross-stage contract: routing should consume projection shapes through the `browser-projection` entrypoint rather than importing projection implementation files directly.
