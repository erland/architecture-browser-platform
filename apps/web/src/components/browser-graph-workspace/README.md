# Browser graph workspace components

This directory contains the graph workspace render surface, toolbar/menu composition, node/edge layers, workspace interaction helpers, and graph-specific presentation utilities.


## Preferred access path

Renderer components in this folder should prefer `browser-graph/workspace` for workspace model types and common workspace summaries instead of reaching through broader graph or snapshot surfaces for routine renderer-facing data.


## Rendering vs interaction boundary

The workspace render layers should stay declarative: node and edge layers render workspace model data and invoke interaction handler ports. Browser-session action translation and DOM-based canvas reconciliation live in dedicated hooks so visual rendering can evolve independently from interaction logic.
