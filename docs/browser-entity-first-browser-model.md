# Browser entity-first model

This document captures the current Browser mental model after the entity-first refactor.

## Core interaction model

The Browser now separates structural navigation from analysis:

- **Tree** = navigate scopes
- **Facts panel** = explain the selected scope and offer entity-first add actions
- **Canvas** = analyze entities and relationships

The Browser should no longer be understood as a mixed scope/entity canvas by default. Scope nodes still exist, but only as an advanced/debug affordance.

## Scope vs entity

### Scopes

Scopes are structural containers used for browsing and orientation.
Typical examples:

- `DIRECTORY`
- `FILE`
- `PACKAGE`
- `MODULE` scope when present in older or mixed snapshots

Scopes help the user answer questions such as:

- where in the structure am I?
- what child scopes exist here?
- what kinds of entities live here?
- how large is this subtree?

### Entities

Entities are the primary analysis objects placed on the canvas.
Typical examples:

- `MODULE`
- `FUNCTION`
- `CLASS`
- `INTERFACE`
- `PACKAGE` entity
- `SERVICE`
- `ENDPOINT`
- `CONFIG_ARTIFACT`

Entities help the user answer questions such as:

- what depends on this?
- what is contained here?
- what calls this?
- what does this module expose or use?

## Primary entity policy

Primary entity resolution is centralized in the Browser snapshot index.
Components should not guess this mapping on their own.

### `FILE`

Default add target:

- direct `MODULE` entity/entities

### `DIRECTORY`

Default add target:

- direct `MODULE` entities represented by files directly inside that directory

### `PACKAGE`

Default add target:

- package entity/entities

### `MODULE` scope

If surfaced in mixed snapshots or legacy paths:

- direct `MODULE` entity/entities

## How add-to-canvas works

### Tree

Selecting a tree row selects a **scope**.
Using the tree add affordance adds that scope's **primary entities** by default.

### Facts panel

The facts panel is the main bridge from structural selection to analysis.
For a selected scope it shows:

- scope facts
- child scopes
- primary entities
- direct entities by kind
- subtree entities by kind

Its add actions operate on **entities**, not raw scope nodes.

### Search

Search now distinguishes navigation targets from analysis targets.

- clicking a **scope** hit navigates to that scope
- using **Add** on a scope hit adds that scope's primary entities to the canvas
- clicking an **entity** hit adds/focuses that entity for analysis
- relationship and diagnostic hits continue to route into analysis behavior

### Canvas

The canvas is entity-first.
Normal toolbar actions should add or expand entities, not scopes.

Scope nodes are intentionally demoted to advanced/debug usage for cases where container context is explicitly helpful.

## Tree modes

Technical snapshots can now be explored with explicit tree modes.

### Filesystem

Use when the user wants file/directory-oriented navigation.
This is the normal default for frontend/file-oriented snapshots.

### Package

Use when the user wants Java/package-oriented navigation.
This is the normal default for Java/package-heavy snapshots.

### All scopes

Use when the user needs an advanced/debug view of the complete underlying scope graph.
This mode is intentionally not the primary everyday navigation mode.

## Current advanced/debug path

Scope nodes are still supported internally and can still be shown on canvas when explicitly requested through advanced canvas actions.
That support remains useful for:

- container/debug context
- investigating how scopes were indexed
- validating snapshot structure

But it should not be the default Browser workflow.

## Known follow-ups

Likely next improvements after this refactor:

1. better entity grouping/layout on canvas
2. a chooser when a scope has several meaningful primary entities
3. richer entity-type-specific canvas actions
4. stronger keyboard navigation and recent-history support
5. optional visual distinction between structural expansion and relationship expansion
