# architecture-browser-platform

Architecture Browser Platform monorepo baseline for the user-facing self-hosted product. This repository owns the platform API, web UI, deployment packaging, persistence, and the import boundary for normalized IR produced by the separate `architecture-browser-indexer` repository.

## Repository layout

- `apps/web` — React + TypeScript web UI baseline
- `apps/api` — Quarkus 3.31 backend with JPA + Flyway
- `libs/contracts` — shared import-contract notes and TypeScript contract/domain types
- `libs/view-models` — placeholder shared view-model module for later steps
- `deploy/docker-compose` — Docker Compose baseline for local/dev installation
- `docs` — product docs, ERD/import notes, and IR analysis
- `scripts` — helper scripts for starting/stopping the baseline environment

## Step 4 status

This step extends the baseline with the first run orchestration slice:

- CRUD APIs for workspaces
- CRUD APIs for repository registrations inside workspaces
- run request and run-history APIs
- persisted run state transitions and audit events
- a stub indexer adapter for simulated success/failure outcomes
- a thin web UI for management and run-status tracking

## Prerequisites

- Node.js 20+
- npm 10+
- Java 25
- Maven 3.9+
- Docker and Docker Compose plugin


## Runtime baseline

The API now targets **Java 25** on **Quarkus 3.31.4**. This is intentional:

- the separate `architecture-browser-indexer` line already needs a post-Java-21 baseline
- Quarkus 3.31 adds full Java 25 support
- Quarkus 3.31 requires Maven 3.9+

The `apps/api` Maven build now fails fast with a clear enforcer message if Java 25 or Maven 3.9+ is not being used.

## Local development

### Start infrastructure and services

From the repository root:

```bash
./scripts/dev-up.sh
```

This starts:

- PostgreSQL on `localhost:5432`
- Quarkus API on `http://localhost:8080`
- React web app on `http://localhost:5173`

Stop the stack with:

```bash
./scripts/dev-down.sh
```

### Run services individually

#### Web

From the repository root:

```bash
npm install
npm run build:web
npm run dev:web
```

Or from the app directory:

```bash
cd apps/web
npm install
npm run build
npm run dev
```

#### API

```bash
cd apps/api
mvn test
mvn package
```


### Database and migrations

Flyway runs automatically on API startup. Migration scripts live under:

```text
apps/api/src/main/resources/db/migration
```

There is no manual top-level migration workflow in this step.

## Useful URLs

- Web UI: `http://localhost:5173`
- API health: `http://localhost:8080/api/health`
- API baseline info: `http://localhost:8080/api/baseline`
- API domain model summary: `http://localhost:8080/api/domain-model`
- API current IR contract notes: `http://localhost:8080/api/contracts/indexer-ir`
- Workspaces: `GET/POST http://localhost:8080/api/workspaces`
- Workspace detail/update: `GET/PUT http://localhost:8080/api/workspaces/{workspaceId}`
- Workspace archive: `POST http://localhost:8080/api/workspaces/{workspaceId}/archive`
- Workspace audit trail: `GET http://localhost:8080/api/workspaces/{workspaceId}/audit-events`
- Repositories in workspace: `GET/POST http://localhost:8080/api/workspaces/{workspaceId}/repositories`
- Repository detail/update: `GET/PUT http://localhost:8080/api/workspaces/{workspaceId}/repositories/{repositoryId}`
- Repository archive: `POST http://localhost:8080/api/workspaces/{workspaceId}/repositories/{repositoryId}/archive`
- Request repository run: `POST http://localhost:8080/api/workspaces/{workspaceId}/repositories/{repositoryId}/runs`
- Repository run history: `GET http://localhost:8080/api/workspaces/{workspaceId}/repositories/{repositoryId}/runs`
- Recent workspace runs: `GET http://localhost:8080/api/workspaces/{workspaceId}/runs/recent`
- Contract validation: `POST http://localhost:8080/api/imports/indexer-ir/validate`
- Stub import storage: `POST http://localhost:8080/api/imports/indexer-ir/stub-store`

## Verification sequence

From the repository root:

```bash
docker compose -f deploy/docker-compose/docker-compose.yml config
npm run build:web
cd apps/api && mvn test && mvn package
```

To exercise the management APIs after the API is running:

```bash
curl -X POST   -H 'Content-Type: application/json'   --data '{"workspaceKey":"customs-core","name":"Swedish Customs Core"}'   http://localhost:8080/api/workspaces
```

Then create a repository registration inside that workspace:

```bash
curl -X POST   -H 'Content-Type: application/json'   --data '{"repositoryKey":"platform-api","name":"Platform API","sourceType":"GIT","remoteUrl":"https://github.com/erland/architecture-browser-platform"}'   http://localhost:8080/api/workspaces/<workspaceId>/repositories
```

## Notes

- The platform remains a single repository for MVP because backend, frontend, install packaging, persistence, and import-contract evolution are tightly coupled.
- The indexer remains a separate repository so parsing/extraction logic stays isolated from the platform product lifecycle.
- The imported-fact projection from Step 2 is still intentionally generic so browse-specialized schemas can be added in later steps without reworking the management APIs.


To exercise stub run orchestration after creating a repository registration:

```bash
curl -X POST \
  -H 'Content-Type: application/json' \
  --data '{"triggerType":"MANUAL","requestedSchemaVersion":"indexer-ir-v1","requestedIndexerVersion":"step4-stub","requestedResult":"SUCCESS"}' \
  http://localhost:8080/api/workspaces/<workspaceId>/repositories/<repositoryId>/runs
```
