# management

Management services coordinate workspace and repository workflows, but stable helpers now live in narrower homes:

- `WorkspaceResponseMapper` maps `WorkspaceEntity` to API responses.
- `RepositoryResponseMapper` maps `RepositoryRegistrationEntity` to API responses.
- `WorkspaceRepositoryCountQuery` owns repository-count lookup logic used by workspace responses.
- `ManagementStringSupport` owns normalization and JSON-escaping helpers used by management workflows.

`WorkspaceManagementService` and `RepositoryManagementService` remain application-service coordinators over validation, persistence, audit, and lookup steps.
