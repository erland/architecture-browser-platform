# browser-auto-layout

This subsystem is organized by responsibility:

- `core/` — engine, pipeline, types, config, apply, and debug entrypoints
- `shared/` — graph extraction, ordering, placement primitives, and shared layout helpers
- `modes/` — per-mode layout implementations and their phase/support files

Root-level files are kept only as compatibility re-export shims during the directory restructuring sequence.


Refactor note (platform_v2_step1): shared root-selection policy now lives in `shared/layoutRoots.ts`, and shared directed-level propagation/grouping helpers live in `shared/layoutLevels.ts`. Mode phase files keep mode-specific behavior while delegating repeated orchestration rules to those shared helpers.
