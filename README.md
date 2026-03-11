# architecture-browser-platform

Architecture Browser Platform monorepo baseline for the user-facing self-hosted product. This repository owns the platform API, web UI, deployment packaging, and the import boundary for normalized IR produced by the separate `architecture-browser-indexer` repository.

## Repository layout

- `apps/web` — React + TypeScript web UI baseline
- `apps/api` — Quarkus backend baseline
- `libs/contracts` — shared import-contract notes and TypeScript contract types
- `libs/view-models` — placeholder shared view-model module for later steps
- `deploy/docker-compose` — Docker Compose baseline for local/dev installation
- `db/migrations` — database migration placeholder
- `docs` — product docs, handoff notes, and IR analysis
- `scripts` — helper scripts for starting/stopping the baseline environment

## MVP baseline status

This step intentionally sets up the monorepo skeleton and a thin running slice:

- web app scaffold with a landing page and health check wiring
- API scaffold with health/info endpoints
- PostgreSQL container skeleton wired to the API
- initial contracts module seeded from the current indexer IR shape
- Compose/dev scripts so one command can boot the baseline stack

Domain modeling, persistence schema, run orchestration, snapshot import, and browse views beyond the landing page are deferred to later steps in the plan.

## Prerequisites

- Node.js 20+
- npm 10+
- Java 21+
- Maven 3.9+
- Docker and Docker Compose plugin

## Local development

### One-command baseline stack

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

```bash
npm install
npm run dev:web
```

#### API

```bash
cd apps/api
mvn quarkus:dev
```

#### Database only

```bash
docker compose -f deploy/docker-compose/docker-compose.yml up -d postgres
```

## Useful URLs

- Web UI: `http://localhost:5173`
- API health: `http://localhost:8080/api/health`
- API baseline info: `http://localhost:8080/api/baseline`
- API current IR contract notes: `http://localhost:8080/api/contracts/indexer-ir`

## Notes

- The platform is kept as a single repository for MVP because backend, frontend, install packaging, and import-contract evolution are tightly coupled in the early phases.
- The indexer remains a separate repository so parsing/extraction logic stays isolated from the platform product lifecycle.
- The contract files under `libs/contracts` and `docs` reflect the current indexer IR observed from the attached MVP-level indexer source.
