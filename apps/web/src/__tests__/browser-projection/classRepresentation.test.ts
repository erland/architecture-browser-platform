import type { FullSnapshotPayload, SnapshotSummary } from '../../app-model';
import type { BrowserViewpointPresentationPolicy } from '../../browser-graph/presentation';
import { deriveBrowserClassRepresentation } from '../../browser-projection/classRepresentation';
import { clearBrowserSnapshotIndex } from '../../browser-snapshot';
import { createEmptyBrowserSessionState, openSnapshotSession } from '../../browser-session';
import type { BrowserCanvasNode } from '../../browser-session';

const snapshotSummary: SnapshotSummary = {
  id: 'snap-class-representation-1',
  workspaceId: 'ws-1',
  repositoryRegistrationId: 'repo-1',
  repositoryKey: 'platform',
  repositoryName: 'Architecture Browser Platform',
  runId: 'run-1',
  snapshotKey: 'platform-main-class-representation',
  status: 'READY',
  completenessStatus: 'COMPLETE',
  derivedRunOutcome: 'SUCCESS',
  schemaVersion: '1.0.0',
  indexerVersion: '0.1.0',
  sourceRevision: 'abc123',
  sourceBranch: 'main',
  importedAt: '2026-03-20T00:00:00Z',
  scopeCount: 2,
  entityCount: 3,
  relationshipCount: 2,
  diagnosticCount: 0,
  indexedFileCount: 1,
  totalFileCount: 1,
  degradedFileCount: 0,
};

function createPayload(): FullSnapshotPayload {
  return {
    snapshot: snapshotSummary,
    source: { repositoryId: 'repo-1', acquisitionType: 'GIT', path: null, remoteUrl: null, branch: 'main', revision: 'abc123', acquiredAt: null },
    run: { startedAt: null, completedAt: null, outcome: 'SUCCESS', detectedTechnologies: ['java'] },
    completeness: { status: 'COMPLETE', indexedFileCount: 1, totalFileCount: 1, degradedFileCount: 0, omittedPaths: [], notes: [] },
    scopes: [
      { externalId: 'scope:repo', kind: 'REPOSITORY', name: 'platform', displayName: 'Platform', parentScopeId: null, sourceRefs: [], metadata: {} },
      { externalId: 'scope:domain', kind: 'PACKAGE', name: 'domain', displayName: 'Domain', parentScopeId: 'scope:repo', sourceRefs: [], metadata: {} },
    ],
    entities: [
      { externalId: 'entity:order', kind: 'CLASS', origin: 'java', name: 'Order', displayName: 'Order', scopeId: 'scope:domain', sourceRefs: [], metadata: {} },
      { externalId: 'entity:order:id', kind: 'FIELD', origin: 'java', name: 'id', displayName: 'id', scopeId: 'scope:domain', sourceRefs: [], metadata: {} },
      { externalId: 'entity:order:save', kind: 'FUNCTION', origin: 'java', name: 'save', displayName: 'save', scopeId: 'scope:domain', sourceRefs: [], metadata: {} },
    ],
    relationships: [
      { externalId: 'rel:contains:id', kind: 'CONTAINS', fromEntityId: 'entity:order', toEntityId: 'entity:order:id', label: null, sourceRefs: [], metadata: {} },
      { externalId: 'rel:contains:save', kind: 'CONTAINS', fromEntityId: 'entity:order', toEntityId: 'entity:order:save', label: null, sourceRefs: [], metadata: {} },
    ],
    viewpoints: [],
    diagnostics: [],
    metadata: { metadata: {} },
    warnings: [],
  };
}

const entityGraphPolicy: BrowserViewpointPresentationPolicy = {
  viewpointId: null,
  variant: 'default',
  mode: 'entity-graph',
  collapseMembersByDefault: false,
  showAttributeCompartment: false,
  showOperationCompartment: false,
  compactMemberKinds: [],
  reason: 'test',
};

describe('deriveBrowserClassRepresentation', () => {
  afterEach(() => {
    clearBrowserSnapshotIndex();
  });

  function createState() {
    return openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(),
    });
  }

  function derive(node: BrowserCanvasNode) {
    const state = createState();
    const entity = state.index?.entitiesById.get('entity:order');
    expect(entity).toBeDefined();
    return deriveBrowserClassRepresentation(state, node, entity!, entityGraphPolicy);
  }

  test('derives simple mode without inline compartments or expanded child members', () => {
    const derived = derive({
      kind: 'entity',
      id: 'entity:order',
      x: 32,
      y: 48,
      classPresentation: {
        mode: 'simple',
        showFields: true,
        showFunctions: true,
      },
    });

    expect(derived.mode).toBe('simple');
    expect(derived.nodeKind).toBe('entity');
    expect(derived.compartments).toEqual([]);
    expect(derived.memberEntityIds).toEqual([]);
    expect(derived.suppressedEntityIds).toEqual([]);
  });

  test('derives compartments mode with only the field compartment visible', () => {
    const derived = derive({
      kind: 'entity',
      id: 'entity:order',
      x: 32,
      y: 48,
      classPresentation: {
        mode: 'compartments',
        showFields: true,
        showFunctions: false,
      },
    });

    expect(derived.mode).toBe('compartments');
    expect(derived.nodeKind).toBe('uml-class');
    expect(derived.compartments.map((compartment) => compartment.kind)).toEqual(['attributes']);
    expect(derived.inlineMemberEntityIds).toEqual(['entity:order:id']);
    expect(derived.expandedMemberEntityIds).toEqual([]);
    expect(derived.suppressedEntityIds).toEqual(['entity:order:id']);
  });

  test('derives compartments mode with only the function compartment visible', () => {
    const derived = derive({
      kind: 'entity',
      id: 'entity:order',
      x: 32,
      y: 48,
      classPresentation: {
        mode: 'compartments',
        showFields: false,
        showFunctions: true,
      },
    });

    expect(derived.mode).toBe('compartments');
    expect(derived.compartments.map((compartment) => compartment.kind)).toEqual(['operations']);
    expect(derived.inlineMemberEntityIds).toEqual(['entity:order:save']);
    expect(derived.suppressedEntityIds).toEqual(['entity:order:save']);
  });

  test('derives expanded mode with only field members visible', () => {
    const derived = derive({
      kind: 'entity',
      id: 'entity:order',
      x: 32,
      y: 48,
      classPresentation: {
        mode: 'expanded',
        showFields: true,
        showFunctions: false,
      },
    });

    expect(derived.mode).toBe('expanded');
    expect(derived.nodeKind).toBe('uml-class');
    expect(derived.compartments).toEqual([]);
    expect(derived.inlineMemberEntityIds).toEqual([]);
    expect(derived.expandedMemberEntityIds).toEqual(['entity:order:id']);
    expect(derived.memberEntityIds).toEqual(['entity:order:id']);
    expect(derived.suppressedEntityIds).toEqual([]);
  });

  test('derives expanded mode with only function members visible', () => {
    const derived = derive({
      kind: 'entity',
      id: 'entity:order',
      x: 32,
      y: 48,
      classPresentation: {
        mode: 'expanded',
        showFields: false,
        showFunctions: true,
      },
    });

    expect(derived.mode).toBe('expanded');
    expect(derived.expandedMemberEntityIds).toEqual(['entity:order:save']);
    expect(derived.memberEntityIds).toEqual(['entity:order:save']);
  });

  test('falls back to simple when both member toggles are disabled', () => {
    const derived = derive({
      kind: 'entity',
      id: 'entity:order',
      x: 32,
      y: 48,
      classPresentation: {
        mode: 'expanded',
        showFields: false,
        showFunctions: false,
      },
    });

    expect(derived.mode).toBe('simple');
    expect(derived.nodeKind).toBe('entity');
    expect(derived.compartments).toEqual([]);
    expect(derived.memberEntityIds).toEqual([]);
  });
});
