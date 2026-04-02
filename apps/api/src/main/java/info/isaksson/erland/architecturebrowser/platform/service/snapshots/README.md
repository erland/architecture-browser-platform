# snapshots

This package is organized by backend responsibility:

- `catalog/` contains snapshot catalog loading, canonical mapping, query support, and Browser-facing assembly.
- `savedcanvas/` contains saved-canvas service orchestration plus response/document serialization helpers.

Java package names remain unchanged (`...service.snapshots`) so this directory split is navigation-only and behavior-preserving.
