# Operations/admin service boundaries

- `OperationsAdminService` is the thin application entrypoint for overview and retention flows.
- `OperationsOverviewAssembler` composes overview sections from dedicated query and builder collaborators.
- `OperationsOverviewWorkspaceQueryService` owns repository/run/snapshot summary queries.
- `OperationsOverviewAttentionQueryService` owns failed-run and failed-snapshot attention queries.
- `OperationsOverviewRepositorySectionBuilder` builds repository rows and summary counts.
- `OperationsOverviewRunSectionBuilder` builds recent/failed run sections.
- `OperationsOverviewSnapshotAttentionBuilder` builds snapshot attention items.
- `OperationsRetentionPolicyResolver` normalizes retention request defaults and validation.
- `OperationsRetentionPlanner` calculates what would be deleted.
- `OperationsRetentionExecutionService` applies deletes and records audit events.

Keep new operations/admin behavior in the narrowest query/builder/planner/execution collaborator instead of expanding the top-level admin service.
