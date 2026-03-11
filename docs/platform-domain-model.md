# Platform Domain Model (Step 2)

## Aggregate roots

### Workspace
A top-level collaboration boundary. Owns repository registrations, runs, snapshots, overlays, saved views, and audit events.

### Repository registration
Represents one browsable source-code repository within a workspace. Holds the durable registration metadata needed to run or import indexing results.

### Index run
Represents execution tracking for a requested indexing operation. In Step 2 the table exists, but full orchestration comes later.

### Snapshot
Immutable imported index result bound to a workspace and repository registration. Stores import-level counts and the raw payload for trace/debug purposes.

### Overlay
User-authored interpretation layer that can target a workspace or a specific snapshot.

### Saved view
User-authored saved browse/query state for a snapshot or workspace context.

### Audit event
Append-only operational and user action trail.

## Imported projection

### Imported fact
A generic representation of one imported scope, entity, relationship, or diagnostic. This is intentionally broad in Step 2.

Fields include:
- snapshot linkage
- fact type
- external/indexer id
- kind
- name/display name
- optional scope/from/to references
- summary text
- raw payload json

## Modeling rules

- imported snapshot facts are immutable
- overlays and saved views are mutable user state
- snapshots are versioned by import time and repository
- the platform may later add denormalized browse tables without changing the import contract
