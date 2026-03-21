# Browser persistence entity-relations view

The Browser now supports a **browser-local persistence entity-relations variant** under the existing `persistence-model` viewpoint.

This variant is intended for architects who want to inspect the **data model side** of persistence rather than the **access-path side**.

## Goal

The entity-relations variant focuses on:

- `persistent-entity` elements
- relationships between those entities
- readable multiplicity labels derived from normalized relationship metadata

This makes it easier to inspect a JPA-oriented persistence/domain model as a graph of entities and associations.

## How it differs from the default persistence model

The Browser now effectively supports two persistence-oriented views.

### Persistence model (default/access-path oriented)

Focuses on:

- `persistence-access`
- repositories / adapter-like persistence nodes
- upstream collaborators
- access-path semantics such as:
  - `accesses-persistence`
  - `stored-in`

This is useful for understanding **how the application reaches persistence**.

### Persistence model → Show entity relations

Focuses on:

- entities with normalized role `persistent-entity`
- relationships where both endpoints are `persistent-entity`
- normalized association metadata such as:
  - `associationKind`
  - `associationCardinality`
  - `sourceLowerBound`
  - `sourceUpperBound`
  - `targetLowerBound`
  - `targetUpperBound`

This is useful for understanding **the persistence/domain structure itself**.

## Selection and filtering rules

When the selected viewpoint is:

- `persistence-model`
- variant `show-entity-relations`

then the Browser currently:

- includes only entities with normalized role `persistent-entity`
- includes only relationships where:
  - both endpoints are `persistent-entity`
  - `associationKind === "association"`
- excludes repository / persistence-access nodes from the graph by default
- excludes relationships that do not have enough normalized metadata to produce a readable association label

## Multiplicity labels

The current first version derives readable edge labels from normalized relationship metadata.

Preferred source:

- `sourceLowerBound`
- `sourceUpperBound`
- `targetLowerBound`
- `targetUpperBound`

Fallback source:

- `associationCardinality`

Current display behavior:

- if explicit normalized bounds are present, the Browser uses a readable multiplicity label such as:
  - `1`
  - `0..1`
  - `0..*`
  - `1..*`
- if bounds are missing but `associationCardinality` exists, the Browser falls back to a coarse label such as:
  - `one-to-one`
  - `one-to-many`
  - `many-to-one`
  - `many-to-many`
- if neither usable bounds nor usable cardinality exists, the relationship is excluded from this variant

## Presentation mode

In `auto` presentation mode, the Browser prefers **Compact UML** for:

- `persistence-model + show-entity-relations`

This is a browser-local presentation rule.

The user can still override the presentation mode and switch to:

- `Entity graph`
- `Compact UML`

manually from the viewpoint controls.

## Inspector / facts panel behavior

When a relationship is focused, the facts panel now shows:

### Normalized

- association kind
- association cardinality
- source lower/upper bounds
- target lower/upper bounds

### Framework evidence

If present, framework-specific evidence is also shown, for example:

- `jpaAssociation`
- `joinColumn`
- `joinTable`
- `mappedBy`

The normalized fields are intended to be the primary semantic data. Framework-specific fields are supporting evidence.

## Current limits

The current implementation is intentionally conservative.

- The entity-relations view depends on normalized association metadata being present in the imported snapshot.
- Older snapshots may show fewer relationships because the Browser does not try to infer entity associations from unrelated persistence semantics.
- The first version renders simple edge labels rather than full UML end-label placement.
- The first version prefers readable target-side multiplicity labels over full diagrammatic endpoint labeling.
- Relationships without usable normalized display metadata are excluded instead of being guessed.
- The default `persistence-model` remains access-path oriented; the entity-relations view is a browser-local variant layered on top.

## Main files

Main implementation files for the current feature:

- `apps/web/src/browserSnapshotIndex.ts`
- `apps/web/src/browserRelationshipSemantics.ts`
- `apps/web/src/browserProjectionModel.ts`
- `apps/web/src/browserViewpointPresentation.ts`
- `apps/web/src/components/BrowserViewpointControls.tsx`
- `apps/web/src/components/BrowserFactsPanel.tsx`

Regression coverage for the feature includes:

- `apps/web/src/__tests__/browserPersistenceEntityRelationsRegression.test.ts`
- `apps/web/src/__tests__/browserSnapshotIndex.test.ts`
- `apps/web/src/__tests__/browserRelationshipSemantics.test.ts`
- `apps/web/src/__tests__/browserViewpointPresentation.test.ts`
- `apps/web/src/__tests__/browserFactsPanel.test.ts`
