import { buildBrowserGraphWorkspaceModel } from '../../browser-graph';
import { buildBrowserFactsPanelModel } from '../../components/browser-facts-panel/BrowserFactsPanel';
import { buildBrowserSnapshotIndex, buildViewpointGraph, clearBrowserSnapshotIndex, getViewpointById } from '../../browser-snapshot';
import { applySelectedViewpoint, setSelectedViewpoint, setViewpointVariant } from '../../browser-session/viewpoints-api';
import { createEmptyBrowserSessionState } from '../../browser-session/state';
import { focusBrowserElement } from '../../browser-session/facts-panel-api';
import { openSnapshotSession } from '../../browser-session/lifecycle-api';
import { jpaEntityRelationFixtures } from './fixtures/jpaEntityRelationsEndToEndFixtures';

describe('JPA entity-relations end-to-end regression fixtures', () => {
  afterEach(() => clearBrowserSnapshotIndex());

  test.each(jpaEntityRelationFixtures)('$name uses canonical normalized associations in persistence entity-relations graphs', (fixture) => {
    const index = buildBrowserSnapshotIndex(fixture.payload);
    const viewpoint = getViewpointById(index, 'persistence-model');
    expect(viewpoint).not.toBeNull();

    const graph = buildViewpointGraph(index, viewpoint!, { scopeMode: 'whole-snapshot', variant: 'show-entity-relations' });

    expect(graph.relationshipIds).toEqual(fixture.expectedRelationshipIds);
    expect(graph.preferredDependencyViews).toEqual(['entityAssociationRelationships']);
  });

  test.each(jpaEntityRelationFixtures)('$name renders expected workspace edges, multiplicities, and containment style', (fixture) => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: fixture.payload.snapshot.workspaceId,
      repositoryId: fixture.payload.source.repositoryId ?? 'repo-jpa',
      payload: fixture.payload,
    });
    state = setSelectedViewpoint(state, 'persistence-model');
    state = setViewpointVariant(state, 'show-entity-relations');
    state = applySelectedViewpoint(state);

    const model = buildBrowserGraphWorkspaceModel(state);
    const actual = model.edges.map((edge) => ({
      relationshipId: edge.relationshipId,
      fromLabel: edge.fromLabel,
      toLabel: edge.toLabel,
      label: edge.label,
      semanticStyle: edge.semanticStyle,
    })).sort((left, right) => left.relationshipId.localeCompare(right.relationshipId));
    const expected = fixture.expectedEdgeSummaries.map((edge) => ({
      relationshipId: edge.relationshipId,
      fromLabel: edge.fromLabel,
      toLabel: edge.toLabel,
      label: edge.label,
      semanticStyle: edge.semanticStyle,
    })).sort((left, right) => left.relationshipId.localeCompare(right.relationshipId));

    expect(model.presentationMode).toBe('compact-uml');
    expect(actual).toEqual(expected);
  });

  test.each(jpaEntityRelationFixtures)('$name keeps raw evidence discoverable in relationship facts/details', (fixture) => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: fixture.payload.snapshot.workspaceId,
      repositoryId: fixture.payload.source.repositoryId ?? 'repo-jpa',
      payload: fixture.payload,
    });
    state = setSelectedViewpoint(state, 'persistence-model');
    state = setViewpointVariant(state, 'show-entity-relations');
    state = applySelectedViewpoint(state);
    state = focusBrowserElement(state, { kind: 'relationship', id: fixture.factsRelationshipId });

    const model = buildBrowserFactsPanelModel(state);

    expect(model?.mode).toBe('relationship');
    expect(model?.relationship?.externalId).toBe(fixture.factsRelationshipId);
    expect(model?.evidenceRelationships.map((item) => item.relationshipId)).toEqual(fixture.expectedEvidenceRelationshipIds);
    expect(model?.evidenceRelationships.every((item) => item.existsInSnapshot)).toBe(true);
    expect(model?.relationshipMetadata?.normalized.some((entry) => entry.key === 'associationCardinality')).toBe(true);
  });
});
