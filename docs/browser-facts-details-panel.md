# Browser facts/details panel

The facts panel is now the main bridge between structural scope navigation and entity-first analysis.

## Current role of the panel

For a selected scope, the panel should help the user answer two questions:

1. what is this part of the structure?
2. what should I add to the canvas to analyze it?

That makes it more than a passive inspector. It is now the clearest scope-to-entity bridge in the Browser.

## Scope-focused behavior

For a selected scope the panel now emphasizes:

- scope facts
- parent/child scope context
- primary entities for the scope
- direct entities by kind
- subtree entities by kind

It also exposes explicit entity-first actions such as:

- add primary
- add all direct
- add all subtree
- add grouped direct/subtree entities by kind

## Entity-focused behavior

Entity and relationship inspection remains intact.
The panel still shows focused entity/relationship facts, diagnostics, and related references.

## Why this matters

The Browser mental model is now:

- tree = navigate scopes
- facts panel = bridge into analysis
- canvas = analyze entities and relationships

The panel should therefore guide users toward **entity** actions first, not toward placing raw scope nodes on canvas.
