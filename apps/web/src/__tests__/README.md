# Web test structure

The web test suite is organized to mirror the main source subsystems.

- `api/` covers transport, platform API access, and snapshot caching.
- `app/` covers routing and app-level selection/tab state.
- `app-model/` covers shared frontend model helpers.
- `browser-session/` covers Browser session lifecycle, commands, invariants, and persistence.
- `browser-snapshot/` covers Browser snapshot index build/query/viewpoint helpers.
- `browser-graph/` covers canvas/workspace graph helpers and graph presentation policy.
- `browser-auto-layout/` covers auto-layout modes, phases, and layout regression fixtures.
- `browser-canvas-placement/` covers incremental placement alignment and placement flows.
- `components/` covers Browser UI surfaces and feature-family components.
- `saved-canvas/` covers saved-canvas browser-state, mapping, rebinding, storage, and sync flows.
- `views/` covers Browser screen/controller workflows.
