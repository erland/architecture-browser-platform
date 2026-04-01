import type { FullSnapshotPayload, SnapshotSummary } from '../appModel';
import { getOrBuildBrowserSnapshotIndex, clearBrowserSnapshotIndex } from '../browserSnapshotIndex';
import {
  buildStableEntityKey,
  buildStableRelationshipKey,
  buildStableScopeKey,
  createSavedCanvasEntityReference,
  createSavedCanvasRelationshipReference,
  createSavedCanvasScopeReference,
  resolveSavedCanvasReferenceIdByStableKey,
  resolveSavedCanvasReferenceWithFallback,
} from '../saved-canvas/rebinding/stableReferences';

const snapshotSummary: SnapshotSummary = {
  id: 'snap-stable-1',
  workspaceId: 'ws-1',
  repositoryRegistrationId: 'repo-1',
  repositoryKey: 'platform',
  repositoryName: 'Architecture Browser Platform',
  runId: 'run-1',
  snapshotKey: 'platform-main-001',
  status: 'READY',
  completenessStatus: 'COMPLETE',
  derivedRunOutcome: 'SUCCESS',
  schemaVersion: '1.0.0',
  indexerVersion: '0.1.0',
  sourceRevision: 'abc123',
  sourceBranch: 'main',
  importedAt: '2026-03-24T00:00:00Z',
  scopeCount: 2,
  entityCount: 2,
  relationshipCount: 1,
  diagnosticCount: 0,
  indexedFileCount: 1,
  totalFileCount: 1,
  degradedFileCount: 0,
};

function createPayload(options?: {
  scopeWebId?: string;
  browserEntityId?: string;
  searchEntityId?: string;
  relationshipId?: string;
}): FullSnapshotPayload {
  const scopeWebId = options?.scopeWebId ?? 'scope:web';
  const browserEntityId = options?.browserEntityId ?? 'entity:browser';
  const searchEntityId = options?.searchEntityId ?? 'entity:search';
  const relationshipId = options?.relationshipId ?? 'rel:browser-search';
  return {
    snapshot: snapshotSummary,
    source: { repositoryId: 'repo-1', acquisitionType: 'GIT', path: null, remoteUrl: null, branch: 'main', revision: 'abc123', acquiredAt: null },
    run: { startedAt: null, completedAt: null, outcome: 'SUCCESS', detectedTechnologies: ['react'] },
    completeness: { status: 'COMPLETE', indexedFileCount: 1, totalFileCount: 1, degradedFileCount: 0, omittedPaths: [], notes: [] },
    scopes: [
      { externalId: 'scope:repo', kind: 'REPOSITORY', name: 'platform', displayName: 'Platform', parentScopeId: null, sourceRefs: [], metadata: {} },
      { externalId: scopeWebId, kind: 'MODULE', name: 'apps/web', displayName: 'Web', parentScopeId: 'scope:repo', sourceRefs: [{ path: 'apps/web', startLine: null, endLine: null, snippet: null, metadata: {} }], metadata: {} },
    ],
    entities: [
      { externalId: browserEntityId, kind: 'COMPONENT', origin: 'react', name: 'BrowserView', displayName: 'BrowserView', scopeId: scopeWebId, sourceRefs: [{ path: 'apps/web/src/views/BrowserView.tsx', startLine: 1, endLine: 100, snippet: null, metadata: {} }], metadata: { qualifiedName: 'apps/web/BrowserView' } },
      { externalId: searchEntityId, kind: 'COMPONENT', origin: 'react', name: 'SearchTab', displayName: 'SearchTab', scopeId: scopeWebId, sourceRefs: [{ path: 'apps/web/src/components/SearchTab.tsx', startLine: 1, endLine: 80, snippet: null, metadata: {} }], metadata: { qualifiedName: 'apps/web/SearchTab' } },
    ],
    relationships: [
      { externalId: relationshipId, kind: 'USES', fromEntityId: browserEntityId, toEntityId: searchEntityId, label: 'uses', sourceRefs: [{ path: 'apps/web/src/views/BrowserView.tsx', startLine: 42, endLine: 45, snippet: null, metadata: {} }], metadata: {} },
    ],
    viewpoints: [],
    diagnostics: [],
    metadata: { metadata: {} },
    warnings: [],
  };
}

describe('savedCanvasStableReferences', () => {
  afterEach(() => {
    clearBrowserSnapshotIndex();
  });

  test('generates stable keys for scope, entity, and relationship references', () => {
    const index = getOrBuildBrowserSnapshotIndex(createPayload());

    const scopeReference = createSavedCanvasScopeReference(index, 'scope:web');
    const entityReference = createSavedCanvasEntityReference(index, 'entity:browser');
    const relationshipReference = createSavedCanvasRelationshipReference(index, 'rel:browser-search');

    expect(scopeReference.stableKey).toBe(buildStableScopeKey(index, index.scopesById.get('scope:web') ?? null));
    expect(entityReference.stableKey).toBe(buildStableEntityKey(index, index.entitiesById.get('entity:browser')!));
    expect(relationshipReference.stableKey).toBe(buildStableRelationshipKey(index, index.relationshipsById.get('rel:browser-search')!));
    expect(entityReference.stableKey).not.toBe('entity:browser');
    expect(relationshipReference.stableKey).not.toBe('rel:browser-search');
    expect(entityReference.originalSnapshotLocalId).toBe('entity:browser');
    expect(relationshipReference.originalSnapshotLocalId).toBe('rel:browser-search');
  });

  test('resolves stable references against a later snapshot with different local ids', () => {
    const originalIndex = getOrBuildBrowserSnapshotIndex(createPayload());
    const laterIndex = getOrBuildBrowserSnapshotIndex(createPayload({
      scopeWebId: 'scope:web:v2',
      browserEntityId: 'entity:browser:v2',
      searchEntityId: 'entity:search:v2',
      relationshipId: 'rel:browser-search:v2',
    }));

    const scopeReference = createSavedCanvasScopeReference(originalIndex, 'scope:web');
    const entityReference = createSavedCanvasEntityReference(originalIndex, 'entity:browser');
    const relationshipReference = createSavedCanvasRelationshipReference(originalIndex, 'rel:browser-search');

    expect(resolveSavedCanvasReferenceIdByStableKey(laterIndex, scopeReference)).toBe('scope:web:v2');
    expect(resolveSavedCanvasReferenceIdByStableKey(laterIndex, entityReference)).toBe('entity:browser:v2');
    expect(resolveSavedCanvasReferenceIdByStableKey(laterIndex, relationshipReference)).toBe('rel:browser-search:v2');
  });


  test('prefers qualified-name fallback before broader entity fallback rules', () => {
    const originalIndex = getOrBuildBrowserSnapshotIndex(createPayload());
    const laterIndex = getOrBuildBrowserSnapshotIndex({
      ...createPayload({
        scopeWebId: 'scope:web:v2',
        browserEntityId: 'entity:browser:v2',
        searchEntityId: 'entity:search:v2',
      }),
      entities: [
        {
          externalId: 'entity:browser:wrong',
          kind: 'COMPONENT',
          origin: 'react',
          name: 'BrowserView',
          displayName: 'BrowserView',
          scopeId: 'scope:web:v2',
          sourceRefs: [{ path: 'apps/web/src/views/BrowserView.tsx', startLine: 1, endLine: 100, snippet: null, metadata: {} }],
          metadata: { qualifiedName: 'apps/web/OtherBrowserView' },
        },
        {
          externalId: 'entity:browser:v2',
          kind: 'COMPONENT',
          origin: 'react',
          name: 'BrowserView',
          displayName: 'BrowserView',
          scopeId: 'scope:web:v2',
          sourceRefs: [{ path: 'apps/web/src/views/BrowserView.tsx', startLine: 1, endLine: 100, snippet: null, metadata: {} }],
          metadata: { qualifiedName: 'apps/web/BrowserView' },
        },
        {
          externalId: 'entity:search:v2',
          kind: 'COMPONENT',
          origin: 'react',
          name: 'SearchTab',
          displayName: 'SearchTab',
          scopeId: 'scope:web:v2',
          sourceRefs: [{ path: 'apps/web/src/components/SearchTab.tsx', startLine: 1, endLine: 80, snippet: null, metadata: {} }],
          metadata: { qualifiedName: 'apps/web/SearchTab' },
        },
      ],
      relationships: [],
    });

    const entityReference = createSavedCanvasEntityReference(originalIndex, 'entity:browser');
    const resolution = resolveSavedCanvasReferenceWithFallback(laterIndex, {
      ...entityReference,
      stableKey: 'entity:missing',
      originalSnapshotLocalId: 'entity:missing',
    });

    expect(resolution).toEqual({
      resolvedId: 'entity:browser:v2',
      strategy: 'FALLBACK_ENTITY_QUALIFIED_NAME',
    });
  });

  test('uses relationship endpoint fallback before broader kind and label matching', () => {
    const originalIndex = getOrBuildBrowserSnapshotIndex(createPayload());
    const laterPayload = createPayload({
      scopeWebId: 'scope:web:v2',
      browserEntityId: 'entity:browser:v2',
      searchEntityId: 'entity:search:v2',
      relationshipId: 'rel:browser-search:v2',
    });
    laterPayload.relationships = [
      {
        externalId: 'rel:wrong',
        kind: 'USES',
        fromEntityId: 'entity:search:v2',
        toEntityId: 'entity:browser:v2',
        label: 'uses',
        sourceRefs: [{ path: 'apps/web/src/views/BrowserView.tsx', startLine: 10, endLine: 12, snippet: null, metadata: {} }],
        metadata: {},
      },
      laterPayload.relationships[0],
    ];
    const laterIndex = getOrBuildBrowserSnapshotIndex(laterPayload);

    const relationshipReference = createSavedCanvasRelationshipReference(originalIndex, 'rel:browser-search');
    const resolution = resolveSavedCanvasReferenceWithFallback(laterIndex, {
      ...relationshipReference,
      stableKey: 'rel:missing',
      originalSnapshotLocalId: 'rel:missing',
    });

    expect(resolution).toEqual({
      resolvedId: 'rel:browser-search:v2',
      strategy: 'FALLBACK_RELATIONSHIP_ENDPOINTS',
    });
  });
});
