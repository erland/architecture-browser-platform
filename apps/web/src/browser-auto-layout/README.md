# browser-auto-layout

This subsystem is organized by responsibility:

- `core/` — engine, pipeline, types, config, apply, and debug entrypoints
- `shared/` — graph extraction, ordering, placement primitives, and shared layout helpers
- `modes/` — per-mode layout implementations and their phase/support files

Root-level files are kept only as compatibility re-export shims during the directory restructuring sequence.


Refactor note (platform_v2_step1): shared root-selection policy now lives in `shared/layoutRoots.ts`, and shared directed-level propagation/grouping helpers live in `shared/layoutLevels.ts`. Mode phase files keep mode-specific behavior while delegating repeated orchestration rules to those shared helpers.


Refactor note (platform_v3_step1): balanced mode was decomposed into mode-owned collaborators: `balancedLayoutSemantics.ts`, `balancedLayoutModel.ts`, `balancedLayoutPlacement.ts`, and `balancedAnchoredPlacementPolicy.ts`. `balancedLayoutPhases.ts` now acts as a thin facade/re-export layer so tests and callers keep the same surface while the mode logic is split by responsibility.


Refactor note (platform_v3_step2): hierarchy mode was decomposed into mode-owned collaborators: `hierarchyLayoutSemantics.ts`, `hierarchyLayoutModel.ts`, `hierarchyLayoutPlacement.ts`, and `hierarchyAnchoredPlacementPolicy.ts`. `hierarchyLayoutPhases.ts` now acts as a thin facade/re-export layer so tests and callers keep the same surface while the mode logic is split by responsibility.


Refactor note (platform_v3_step3): flow and structure modes were decomposed into lighter mode-owned collaborators: `flowLayoutSemantics.ts`, `flowLayoutModel.ts`, `flowLayoutPlacement.ts`, `flowAnchoredPlacementPolicy.ts`, and `structureLayoutSemantics.ts`, `structureLayoutModel.ts`, `structureLayoutPlacement.ts`, `structureAnchoredPlacementPolicy.ts`. Their `*LayoutPhases.ts` files now act as thin facade/re-export layers so callers keep the same surface while the mode files become shallower.


Refactor note (platform_v3_step4): all four layout modes now share a common mode-engine shape through `modes/shared/modeEngine.ts`. Each mode exports a `*AutoLayoutModeEngine` alongside its strategy and public run function, so mode entrypoints are structurally consistent even when their internal placement policies differ.
