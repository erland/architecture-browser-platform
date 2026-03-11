# architecture-browser-platform

Architecture Browser Platform monorepo baseline for the user-facing self-hosted product. This repository owns the platform API, web UI, deployment packaging, persistence, and the import boundary for normalized IR produced by the separate `architecture-browser-indexer` repository.

## Repository layout

- `apps/web` — React + TypeScript web UI
- `apps/api` — Quarkus 3.31 backend with JPA + Flyway
- `libs/contracts` — shared import-contract notes and TypeScript contract/domain types
- `libs/view-models` — shared pure helpers used by stable frontend tests
- `deploy/docker-compose` — dev/test Docker Compose files
- `deploy/env` — example environment files for image-based test deployment
- `docs` — product docs, ERD/import notes, and step-by-step implementation notes
- `scripts` — helper scripts for dev/test lifecycle and smoke checks

## Runtime baseline

The API targets **Java 25** on **Quarkus 3.31.4**. This is intentional:

- the separate `architecture-browser-indexer` line already needs a post-Java-21 baseline
- Quarkus 3.31 adds full Java 25 support
- Quarkus 3.31 requires Maven 3.9+

## Prerequisites

For local source development:

- Docker with Compose plugin
- Node.js 20+
- npm 10+
- Java 25
- Maven 3.9+

For remote test deployment:

- Docker with Compose plugin
- cloned `architecture-browser-platform` repository
- published platform API and web images

## Development install

Development is optimized for a local checkout where `architecture-browser-platform` and `architecture-browser-indexer` are sibling directories. The current MVP still uses the stub indexer adapter, so the platform dev stack does not yet need the indexer container to run.

Start the dev stack:

```bash
./scripts/dev-up.sh
```

This starts:

- PostgreSQL on `localhost:5432`
- Quarkus dev mode on `http://localhost:8080`
- Vite dev server on `http://localhost:5173`

Stop it with:

```bash
./scripts/dev-down.sh
```

The underlying compose file is:

```text
deploy/docker-compose/docker-compose.dev.yml
```

This dev mode does **not** require pushing images to GHCR.

## Test / remote install

Test deployment is image-based so the remote server can clone this repository only for configuration and lifecycle scripts, without rebuilding the whole stack.

1. Copy the example environment file:

```bash
cp deploy/env/platform-test.env.example deploy/env/platform-test.env
```

2. Edit:

- `POSTGRES_PASSWORD`
- `PLATFORM_API_IMAGE`
- `PLATFORM_WEB_IMAGE`

3. Start the stack:

```bash
./scripts/test-up.sh
```

This starts:

- PostgreSQL on `localhost:5432`
- API on `http://localhost:8080`
- Web UI on `http://localhost:8081`

The web container serves the built SPA and proxies `/api/*` to the API container.

4. Run a smoke test:

```bash
./scripts/smoke-test.sh
```

5. Stop the stack:

```bash
./scripts/test-down.sh
```

The underlying compose file is:

```text
deploy/docker-compose/docker-compose.test.yml
```

## Building publishable images

### API image

From the repository root:

```bash
docker build -f apps/api/src/main/docker/Dockerfile.jvm -t architecture-browser-platform-api:local .
```

### Web image

From the repository root:

```bash
docker build -f apps/web/Dockerfile -t architecture-browser-platform-web:local .
```

## Local verification

From the repository root:

```bash
npm ci
npm run test:web
npm run build:web
cd apps/api && mvn test && mvn package
```

Validate the compose files:

```bash
docker compose -f deploy/docker-compose/docker-compose.dev.yml config
cp deploy/env/platform-test.env.example deploy/env/platform-test.env
sed -i.bak 's#ghcr.io/example/architecture-browser-platform-api:latest#architecture-browser-platform-api:local#' deploy/env/platform-test.env
sed -i.bak 's#ghcr.io/example/architecture-browser-platform-web:latest#architecture-browser-platform-web:local#' deploy/env/platform-test.env
docker compose --env-file deploy/env/platform-test.env -f deploy/docker-compose/docker-compose.test.yml config
```

## Useful URLs

### Dev

- Web UI: `http://localhost:5173`
- API health: `http://localhost:8080/api/health`

### Test

- Web UI: `http://localhost:8081`
- API health: `http://localhost:8080/api/health`

## Notes

- Dev and test now have separate Docker Compose files.
- Dev is optimized for source-mounted iteration and does not require published images.
- Test is optimized for remote deployment from published images and does not require rebuilding the whole stack on the server.
- The platform still uses the stub indexer adapter at MVP stage, so full external indexer container orchestration can be added later without reworking the new packaging split.
