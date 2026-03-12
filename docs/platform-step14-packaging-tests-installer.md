# Step 14 — Packaging, tests, and installer hardening

This step hardens the MVP installer experience with two explicit deployment modes:

- **dev**: source-mounted local development with PostgreSQL, Quarkus dev mode, and Vite dev server
- **test**: image-based deployment using published API and web images so the server does not need to rebuild the stack

## Added assets

- `deploy/docker-compose/docker-compose.dev.yml`
- `deploy/docker-compose/docker-compose.test.yml`
- `deploy/env/platform-test.env.example`
- `apps/api/src/main/docker/Dockerfile.jvm`
- `apps/web/Dockerfile`
- `apps/web/docker/nginx/default.conf`
- `scripts/dev-up.sh`
- `scripts/dev-down.sh`
- `scripts/test-up.sh`
- `scripts/test-down.sh`
- `scripts/smoke-test.sh`

## Dev flow

Assumptions:
- `architecture-browser-platform` and `architecture-browser-indexer` live side-by-side locally
- platform development does **not** require publishing images to GHCR
- the current platform dev and test stacks use the real remote indexer, so both environments require an indexer container or published indexer image

Commands:

```bash
./scripts/dev-up.sh
./scripts/dev-down.sh
```

## Test flow

Assumptions:
- the remote server clones only `architecture-browser-platform`
- published images are used for API and web
- the repository provides compose/env files, not a mandatory rebuild workflow

Commands:

```bash
cp deploy/env/platform-test.env.example deploy/env/platform-test.env
# edit image names and secrets
./scripts/test-up.sh
./scripts/smoke-test.sh
./scripts/test-down.sh
```

## CI hardening

- API tests now run on Java 25
- frontend Jest tests run in CI
- both compose files are validated with `docker compose config`
