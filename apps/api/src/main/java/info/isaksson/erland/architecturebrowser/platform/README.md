# API module boundaries

The API side should stay layered around resource entry points, DTOs, domain persistence, and application services.

## API entry points
- `api/`
- Resource classes own HTTP request/response wiring, status codes, and request validation at the transport boundary.
- Resources should delegate business workflows to services rather than coordinating persistence directly.

## DTO boundary
- `api/dto/`
- Owns transport-facing request and response records.
- DTOs should reflect API contracts, not become a second domain model.

## Domain and persistence
- `domain/`
- Owns persisted entities and persistence-facing enums/value shapes.
- Business services may depend on this package; DTOs should not leak persistence concerns back into callers.

## Application services
- `service/`
- Owns repository/workspace management, runs, snapshot import, saved-canvas handling, and overview/catalog queries.
- Services should coordinate domain repositories, import mapping, and worker/integration access.

## Contract/library boundary
- `contract/`
- Owns import/export contract helpers shared at the platform boundary.

## Placement rules
- Put new REST records in `api/dto/` under the grouped DTO files.
- Put transport-only mapping in resource or mapper helpers, not in domain entities.
- Put business workflows in `service/` packages grouped by capability.
- Keep persistence-specific behavior in `domain/` and repository-facing helpers.

## Dependency direction
- `api/` depends on `api/dto/` and `service/`.
- `service/` depends on `domain/` and contract/import helpers.
- `domain/` should not depend on `api/` DTO types.
