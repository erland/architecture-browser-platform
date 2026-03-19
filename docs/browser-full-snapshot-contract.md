# Browser full snapshot payload contract

This document captures the Step 2 contract added for local Browser migration.

## Purpose

The Browser refactor needs a single domain-oriented payload that the web app can fetch once and then cache/index locally.

The new endpoint is intentionally **not** a Browser view model. It returns the imported snapshot content in a stable, browser-consumable shape without layout/search/dependency projections.

## Endpoint

`GET /api/workspaces/{workspaceId}/snapshots/{snapshotId}/full`

## Payload shape

Top-level sections:

- `snapshot` — platform snapshot summary/identity and counts
- `source` — source repository acquisition metadata
- `run` — run timing/outcome/detected technologies
- `completeness` — completeness/import diagnostics summary
- `scopes` — full scope list
- `entities` — full entity list
- `relationships` — full relationship list
- `diagnostics` — full diagnostic list
- `viewpoints` — document-level viewpoint catalog exported by the indexer
- `metadata` — snapshot-level metadata envelope
- `warnings` — user-visible warnings already derived from completeness/import state

## Design intent

The contract is close to the stored imported snapshot model and suitable for local indexing.

Characteristics:

- stable IDs
- explicit arrays for scopes, entities, relationships, diagnostics
- source references preserved on scopes/entities/relationships/diagnostics
- metadata preserved as opaque maps
- no Browser-tab-specific projections

## Current server mapping

Backend mapping lives in:

- `apps/api/src/main/java/.../api/SnapshotCatalogResource.java`
- `apps/api/src/main/java/.../service/snapshots/SnapshotCatalogService.java`
- `apps/api/src/main/java/.../api/dto/SnapshotDtos.java`

Frontend fetch/types live in:

- `apps/web/src/platformApi.ts`
- `apps/web/src/appModel.ts`
- `libs/contracts/src/index.ts`

## Migration note

This endpoint is additive.

Existing Browser endpoints remain in place for now so later steps can migrate incrementally:

- overview
- layout tree/scope detail
- dependencies
- entry points
- search/entity detail

These older endpoints should only be removed after Browser uses the local full snapshot payload path end-to-end.


## Viewpoints

The full snapshot payload now includes a document-level `viewpoints` array.

Each viewpoint provides the browser with a canonical, architect-facing slice of the imported graph. The browser resolves these locally using the exported seed roles, explicit seed entities, semantic expansion hints, and preferred dependency-view hints.

Current contract fields include:

- `id`
- `title`
- `description`
- `availability`
- `confidence`
- `seedEntityIds`
- `seedRoleIds`
- `expandViaSemantics`
- `preferredDependencyViews`
- `evidenceSources`

Current curated examples cover:

- `request-handling`
- `api-surface`
- `persistence-model`
- `integration-map`
- `module-dependencies`
- `ui-navigation`

The Browser should treat this catalog as imported snapshot metadata, not as a hard-coded UI enum. Special-case browser logic is only needed when a viewpoint benefits from custom ordering or layout.
