# Step 13 — Operations/admin API review

This step is an analysis-only product decision checkpoint.

## Scope reviewed

Backend operations/admin slice:

- `api/OperationsAdminResource`
- `service/operations/OperationsAdminService`
- `service/operations/OperationsOverviewAssembler`
- `service/operations/OperationsRetentionPlanner`
- `service/operations/OperationsRetentionCleanupService`
- `api/dto/OperationsDtos`
- related tests for the operations endpoints

## Current frontend dependency

The cleaned Browser-first frontend does **not** call the operations/admin API.

The protected frontend backend surface remains:

- health
- workspace core endpoints
- repository management
- run request / recent runs
- workspace snapshot listing
- full snapshot payload
- saved canvases

The operations/admin endpoints are outside that active surface.

## What this backend slice currently provides

### Overview endpoint

`GET /api/workspaces/{workspaceId}/operations/overview`

Provides an aggregated operational view over:

- repositories in the workspace
- recent runs
- snapshots
- audit count
- failed snapshots and selected diagnostics

This is operational/admin visibility rather than Browser browsing functionality.

### Retention preview/apply endpoints

- `GET /api/workspaces/{workspaceId}/operations/retention/preview`
- `POST /api/workspaces/{workspaceId}/operations/retention/apply`

Provides retention planning and cleanup for:

- old snapshots per repository
- old runs per repository
- persisted audit records connected to deleted snapshots/runs
- saved-canvas cleanup when snapshots are deleted

## Recommendation

Do **not** remove this slice automatically as part of frontend-alignment cleanup.

Reason:

- It is not used by the cleaned frontend, so it is removable from a frontend-dependency perspective.
- But it still provides real operational behavior, especially retention cleanup for runs/snapshots.
- Removing it is a product decision about how the platform should be administered, not just dead-code cleanup.

## Suggested decision options

### Option A — Keep operations/admin backend for now

Choose this if you still want:

- a backend-supported retention workflow
- manual cleanup controls for runs/snapshots
- an operational overview endpoint for future admin tooling or scripts

This is the safest option if retention behavior still matters.

### Option B — Remove only the overview endpoint, keep retention

Choose this if:

- you no longer need admin dashboards/overview responses
- but you still want built-in retention application logic

This would require a smaller follow-up plan because `OperationsOverviewAssembler` and overview DTOs are separate from retention planning/execution.

### Option C — Remove the whole operations/admin slice

Choose this only if you are comfortable losing:

- backend retention preview/apply endpoints
- backend operational overview endpoints
- the current admin-oriented cleanup workflow

Before doing this, define what replaces retention/cleanup, for example:

- no retention at all
- manual DBA cleanup
- an external maintenance script/job
- a future internal-only maintenance command

## Recommendation for next action

No code removal in this step.

Keep the operations/admin slice unchanged until a product decision is made.

If a later decision is to remove it, do that as a dedicated cleanup wave with explicit replacement handling for retention behavior.
