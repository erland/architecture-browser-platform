# Platform Step 2 — Core Domain Model and Import Contract

## Scope of this step

This step covers the second item in the platform development plan:

- define the first persistent platform domain model
- align the import contract to the currently observed indexer IR
- establish Flyway-managed schema ownership
- prove that a valid sample payload can be validated, parsed, and stored through a stub path

## Main decisions

### 1. Flyway owns schema evolution

Database migrations live inside the Quarkus API application at:

- `apps/api/src/main/resources/db/migration`

This avoids any manual external migration workflow and keeps schema history versioned with backend code.

### 2. JPA/Panache owns persistence mapping

The backend uses Quarkus Hibernate ORM Panache for initial persistence. This gives a simple baseline for later repository/query logic without overdesigning the persistence layer too early.

### 3. Imported facts remain immutable

The platform stores indexer imports as immutable snapshot input. User-authored overlays, notes, and saved views stay in separate tables and will never mutate the imported facts themselves.

### 4. Step 2 uses a generic fact projection

Instead of prematurely introducing many specialized storage tables for every scope/entity/relationship subtype, Step 2 stores imported facts in:

- `snapshot`
- `imported_fact`

That is enough to support future overview, explorer, and detail views while keeping the first import slice small and reversible.

## What was implemented

- JPA entities for workspace, repository registration, index run, snapshot, imported fact, overlay, saved view, audit event
- enum model for statuses and classifications
- Flyway migration `V1__baseline_domain_model.sql`
- JSON Schema resource for indexer IR validation
- contract validator service
- stub import service and API endpoint
- contract validation tests
- stub import persistence test using test-time H2


## Step 2a fix

This package includes a small compile fix for the API module:
- `ContractValidationResult.valid()` renamed to `ok()` to avoid clashing with the record accessor `valid()`
- networknt schema validation call aligned to the dependency version used by the project (`schema.validate(payload)`)


## Java/Quarkus baseline note

For `apps/api`, the backend baseline is now **Java 25** on **Quarkus 3.31.4** so the platform can align better with the newer JDK baseline already needed by the indexer side. Flyway remains the migration mechanism and JPA/Panache remains the persistence approach.
