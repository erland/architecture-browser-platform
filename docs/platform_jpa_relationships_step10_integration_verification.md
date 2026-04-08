# Platform JPA relationships — Step 10 integration verification

## Purpose

This document records the final integration-verification assets added for the normalized JPA association rollout.

## What was verified

The platform test/resources and documentation now include exact example exports copied from the indexer repository under:

- `docs/export-format/examples/java-jpa-normalized-association-export.json`
- `docs/export-format/examples/java-persistence-only-export.json`

These are mirrored into the platform repository at:

- `apps/api/src/test/resources/contracts/indexer-produced/`
- `docs/samples/indexer-ir/`

## Verification focus

The added verification covers:

1. **Import-contract validation**
   - the platform contract validator accepts the exact indexer-produced JPA normalized association export
   - the platform contract validator accepts the exact indexer-produced persistence-only export

2. **Snapshot import and Browser full-payload mapping**
   - the platform can import the exact indexer-produced JPA normalized association export
   - the full snapshot API still exposes canonical normalized relationship data and dependency views needed by the Browser

## Notes

- The rollout assumes active repositories are re-indexed before normalized association rendering is relied on.
- Because of that rollout assumption, dedicated backward-compatibility work for pre-normalized snapshots was intentionally skipped.
- The verification assets are meant to reduce drift between indexer examples and platform expectations.
