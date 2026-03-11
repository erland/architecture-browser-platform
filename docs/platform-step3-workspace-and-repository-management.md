# Step 3 — Workspace and Repository Management APIs

## Scope

This step turns the Step 2 persistence baseline into a usable management slice:

- create/list/get/update/archive workspaces
- create/list/get/update/archive repository registrations inside a workspace
- validate management input before persistence
- record audit events for lifecycle changes
- expose a thin web UI for management

## Backend API surface

### Workspaces

- `GET /api/workspaces`
- `POST /api/workspaces`
- `GET /api/workspaces/{workspaceId}`
- `PUT /api/workspaces/{workspaceId}`
- `POST /api/workspaces/{workspaceId}/archive`
- `GET /api/workspaces/{workspaceId}/audit-events`

### Repository registrations

- `GET /api/workspaces/{workspaceId}/repositories`
- `POST /api/workspaces/{workspaceId}/repositories`
- `GET /api/workspaces/{workspaceId}/repositories/{repositoryId}`
- `PUT /api/workspaces/{workspaceId}/repositories/{repositoryId}`
- `POST /api/workspaces/{workspaceId}/repositories/{repositoryId}/archive`

## Validation rules

### Workspaces

- `workspaceKey` required on create
- `workspaceKey` must match lowercase slug format: letters, digits, `-`, `_`
- `name` required
- `description` optional, max 2000 chars
- `workspaceKey` unique globally

### Repository registrations

- `repositoryKey` required on create
- `repositoryKey` must match lowercase slug format
- `name` required
- `repositoryKey` unique inside a workspace
- `sourceType` required
- for `LOCAL_PATH`, `localPath` required and `remoteUrl` must be empty
- for `GIT`, `remoteUrl` required

## Audit behavior

Audit rows are recorded in `audit_event` for:

- `workspace.created`
- `workspace.updated`
- `workspace.archived`
- `repository.created`
- `repository.updated`
- `repository.archived`

The current MVP marks the actor as `API_CLIENT` with a fixed placeholder actor id. Later steps can replace that with authenticated user context.

## Frontend slice

The Step 3 web app now provides:

- workspace creation form
- workspace list with selection
- workspace update/archive actions
- repository creation form scoped to selected workspace
- repository list with edit/archive actions
- workspace audit trail view

This is intentionally simple and optimized for exercising the API before richer UX work in later steps.

## Verification

### API

From `apps/api`:

```bash
mvn test
mvn package
```

### Web

From repository root:

```bash
npm install
npm run build:web
```

### Manual smoke flow

1. Create a workspace from the web UI or `POST /api/workspaces`
2. Select the workspace and create one `GIT` repository registration
3. Update the workspace name
4. Update the repository default branch
5. Archive the repository or workspace
6. Verify audit entries appear in `GET /api/workspaces/{workspaceId}/audit-events`
