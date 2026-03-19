# Indexer IR sample payloads

These samples were copied from the attached MVP-level `architecture-browser-indexer` repository so the platform repository has a stable local reference point for future import tests.

Included samples:

- `minimal-success.json`
- `partial-result.json`
- `viewpoints-curated.json`

These are documentation and contract-reference assets used by the platform import pipeline and browser regression tests. The curated viewpoints sample exercises the end-to-end viewpoint contract across request handling, API surface, persistence, integration, module dependencies, and UI navigation.


## Viewpoint sample usage

`viewpoints-curated.json` is the main reference sample for the current Browser viewpoint feature. It is used as:

- a developer-facing reference for the viewpoint portion of the import contract
- a backend test fixture for full snapshot viewpoint exposure
- a frontend/browser regression fixture for viewpoint graph assembly and application

When the viewpoint catalog evolves, update this sample together with the browser regression tests and contract-facing documentation.
