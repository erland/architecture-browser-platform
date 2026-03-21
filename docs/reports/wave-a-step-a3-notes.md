# Wave A Step A3 — Refactor `OperationsAdminService.java`

## What changed

This step turns `OperationsAdminService` into a coordinator and moves the heavy logic into focused collaborators:

- `OperationsOverviewAssembler`
  - loads operations overview data
  - maps repositories, recent runs, failed runs, and failed snapshots into response rows
  - owns snapshot payload parsing used for failed snapshot diagnostics
- `OperationsRetentionPlanner`
  - validates retention counts
  - computes snapshot/run retention plans
  - maps plan results into retention candidates and a response-ready plan object
- `OperationsRetentionCleanupService`
  - performs physical cleanup of snapshots, runs, and dependent records
- `OperationsRetentionPlan`
  - package-private record used as the internal handoff between planner and coordinator

## Resulting ownership

- `OperationsAdminService`
  - workspace guard
  - request normalization
  - dry-run/apply branching
  - audit recording
- `OperationsOverviewAssembler`
  - response assembly for `/operations/overview`
- `OperationsRetentionPlanner`
  - retention planning and candidate creation
- `OperationsRetentionCleanupService`
  - deletion side effects

## Notes

- The public API contract of `OperationsAdminService` is unchanged.
- `RepositoryManagementService` was removed from `OperationsAdminService` because it was no longer used.
- The refactor was kept mechanically close to the original implementation to reduce behavior drift.
