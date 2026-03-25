# architecture-browser-platform

Architecture Browser Platform monorepo baseline for the user-facing self-hosted product. This repository owns the platform API, Browser-first web UI, deployment packaging, persistence, and the import boundary for normalized IR produced by the separate `architecture-browser-indexer` repository.

## Repository layout

- `apps/web` — React + TypeScript Browser-first web UI
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
- published platform API, web, and indexer images


## Browser persistence entity-relations view

The Browser now supports a browser-local `persistence-model` variant named `show-entity-relations`.

This variant is intended for entity-model exploration and uses normalized association metadata from imported snapshots to show:

- `persistent-entity` elements
- relationships between those entities
- readable multiplicity labels such as `1`, `0..1`, and `0..*`

In `auto` presentation mode, this variant prefers **Compact UML**.

See:

- `docs/browser-persistence-entity-relations.md`
- `docs/browser-compact-uml-presentation.md`
- `docs/browser-viewpoints.md`

## Refactor maintenance helpers

After the step 1–10 refactor series, the repository includes two root helpers:

- `npm run clean:generated` — removes packaged build output and machine-local artifacts
- `npm run verify:refactor` — runs the lightweight refactor verification flow and records a report in `docs/reports/refactor-verification.txt`

For full local verification after restoring dependencies:

```bash
npm install
npm run verify:refactor
cd apps/api && mvn test
```

## Development install

Development is optimized for a local checkout where `architecture-browser-platform` and `architecture-browser-indexer` are sibling directories. The dev stack now includes the real `architecture-browser-indexer` HTTP worker and uses it over HTTP from the API.

Start the dev stack:

```bash
./scripts/dev-up.sh
```

This starts:

- PostgreSQL on `localhost:5432`
- Quarkus dev mode on `http://localhost:8080`
- Vite dev server on `http://localhost:5173`
- indexer HTTP worker on `http://localhost:8082`

Stop it with:

```bash
./scripts/dev-down.sh
```

The underlying compose file is:

```text
deploy/docker-compose/docker-compose.dev.yml
```

### Dev repository path note

The dev API and indexer containers mount the parent directory that contains both sibling repositories at `/host-workspace`.
When you register a local repository for real indexing in dev mode, use a container-visible path such as:

```text
/host-workspace/architecture-browser-platform
/host-workspace/architecture-browser-indexer
```

The smoke test uses the bundled sample repo mounted at `/workspace/smoke-repo`.

This dev mode does **not** require pushing images to GHCR. The indexer image is built locally from the sibling `../architecture-browser-indexer` checkout.

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
- `PLATFORM_INDEXER_IMAGE`

3. Start the stack:

```bash
./scripts/test-up.sh
```

This starts:

- PostgreSQL on `localhost:5432`
- API on `http://localhost:8080`
- Web UI on `http://localhost:8081`
- indexer HTTP worker on `http://localhost:8082`

The web container serves the built SPA and proxies `/api/*` to the API container.

4. Run a smoke test that verifies the real indexer integration path against the bundled sample repository:

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


## Compact UML viewpoint presentation

The web Browser includes a platform-local compact UML presentation mode for class-oriented viewpoints.

This feature:

- keeps the imported snapshot contract unchanged
- projects class-like entities as UML-style classifier boxes with attributes and operations compartments
- suppresses projected member entities from separate canvas placement in compact mode
- keeps inspector/details behavior backed by the real underlying entities
- provides a safe fallback toggle between **Auto**, **Entity graph**, and **Compact UML**

See:

- `docs/browser-viewpoints.md`
- `docs/browser-compact-uml-presentation.md`

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
sed -i.bak 's#ghcr.io/example/architecture-browser-indexer:latest#architecture-browser-indexer:local#' deploy/env/platform-test.env
docker compose --env-file deploy/env/platform-test.env -f deploy/docker-compose/docker-compose.test.yml config
```

## Useful URLs

### Dev

- Web UI: `http://localhost:5173`
- API health: `http://localhost:8080/api/health`
- Indexer health: `http://localhost:8082/health`

### Test

- Web UI: `http://localhost:8081`
- API health: `http://localhost:8080/api/health`
- Indexer health: `http://localhost:8082/health`

## Browser local workspace docs

The Browser refactor from backend-driven explorer to local analysis workspace is documented here:

- `docs/browser-local-refactor-summary.md`
- `docs/browser-entity-first-browser-model.md`
- `docs/browser-local-continuation-notes.md`
- `docs/browser-local-only-browser.md`
- `docs/browser-automated-tests.md`
- `docs/browser-interactive-canvas.md`
- `docs/browser-interactive-canvas-continuation-notes.md`

The current Browser mental model is now explicitly:

- **Tree** = navigate structural scopes
- **Facts panel** = explain the selected scope and bridge into entity analysis
- **Canvas** = analyze entities and relationships
- **Viewpoints** = apply predefined architect-facing graph slices to the canvas

The Browser supports three tree modes for technical snapshots:

- **Filesystem** — directory/file-oriented navigation
- **Package** — Java/package-oriented navigation
- **All scopes** — advanced/debug view of the underlying scope graph

Add-to-canvas is now entity-first by default. Scope nodes remain available only through advanced canvas actions when container/debug context is explicitly desired.

The Browser canvas now also uses an interactive layout model with persisted node positions, manual dragging, persisted viewport pan/zoom/fit behavior, contextual incremental placement, explicit arrange commands, and anchored handling for pinned / manually placed nodes.

Viewpoint-specific docs:

- `docs/browser-viewpoints.md`
- `docs/browser-full-snapshot-contract.md`
- `docs/browser-facts-details-panel.md`

## Notes

- Dev and test now have separate Docker Compose files.
- Dev is optimized for source-mounted iteration and does not require published images.
- Test is optimized for remote deployment from published images and does not require rebuilding the whole stack on the server.
- The platform can now call the real indexer worker over HTTP.
- The bundled smoke test exercises the end-to-end flow: workspace → repository registration → run request → remote indexing → snapshot import.


## Runtime diagnostics notes

- The dev/test Docker indexer runtime on Apple Silicon uses Linux ARM64 native tree-sitter libraries from `/app/lib/linux-aarch64`, not the host macOS libraries.
- The platform API now logs remote indexer request/response details and enables HTTP access logs to make worker communication failures easier to diagnose.
