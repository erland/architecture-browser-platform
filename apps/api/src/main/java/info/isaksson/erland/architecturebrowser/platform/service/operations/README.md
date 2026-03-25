# Operations overview composition

- `OperationsOverviewAssembler` is the top-level composer.
- `OperationsOverviewQueryService` owns data access and projections.
- `OperationsOverviewRepositorySectionBuilder` builds repository rows and summary counts.
- `OperationsOverviewRunSectionBuilder` builds recent/failed run sections.
- `OperationsOverviewSnapshotAttentionBuilder` builds snapshot attention items.

Keep new overview behavior in the relevant section builder or query service before expanding the top-level assembler.
