# Browser left navigation tree

The Browser left rail is now a navigation-first scope tree with explicit technical tree modes.

## Current role of the tree

The tree is for **structural navigation**, not for making raw scope nodes the main canvas content.

Users should understand the tree like this:

- click a row = select a scope
- add from a row = add that scope's **primary entities** to the canvas
- expand/collapse = browse structure

## Tree modes

The tree now supports three modes:

### Filesystem

Shows file/directory-oriented structure.
This is the normal default for frontend/file-oriented snapshots.

### Package

Shows package-oriented structure.
This is the normal default for Java/package-heavy snapshots.

### All scopes

Shows the broader underlying scope graph.
This is intentionally an advanced/debug view rather than the primary everyday mode.

## Current behavior

- root scopes are expanded by default
- ancestors of the selected scope remain expanded
- selected-scope path expansion stays stable across tree modes
- add actions resolve to **primary entities** by default instead of raw `scope:*` nodes
- tree mode defaults are chosen from snapshot shape heuristics

## Why this matches the current Browser model

The Browser now separates concerns more clearly:

- tree = navigate scopes
- facts panel = explain selected scope and offer entity-first bridge actions
- canvas = analyze entities and relationships
