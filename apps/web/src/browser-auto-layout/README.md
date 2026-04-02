# browser-auto-layout

This subsystem is organized by responsibility:

- `core/` — engine, pipeline, types, config, apply, and debug entrypoints
- `shared/` — graph extraction, ordering, placement primitives, and shared layout helpers
- `modes/` — per-mode layout implementations and their phase/support files

Root-level files are kept only as compatibility re-export shims during the directory restructuring sequence.
