import type { FullSnapshotPayload, SnapshotSummary } from '../../app-model';
import { buildBrowserSnapshotIndex, getEligibleDirectEntitiesForScope, isEntityEligibleForNavigationTree } from '../../browser-snapshot';

const snapshotSummary: SnapshotSummary = {
  id: 'snap-tree-eligibility',
  workspaceId: 'ws-1',
  repositoryRegistrationId: 'repo-1',
  repositoryKey: 'platform',
  repositoryName: 'Architecture Browser Platform',
  runId: 'run-1',
  snapshotKey: 'platform-main-eligibility',
  status: 'READY',
  completenessStatus: 'COMPLETE',
  derivedRunOutcome: 'SUCCESS',
  schemaVersion: '1.0.0',
  indexerVersion: '0.1.0',
  sourceRevision: 'abc123',
  sourceBranch: 'main',
  importedAt: '2026-04-04T00:00:00Z',
  scopeCount: 4,
  entityCount: 11,
  relationshipCount: 2,
  diagnosticCount: 0,
  indexedFileCount: 2,
  totalFileCount: 2,
  degradedFileCount: 0,
};

function createPayload(): FullSnapshotPayload {
  return {
    snapshot: snapshotSummary,
    source: {
      repositoryId: 'repo-1',
      acquisitionType: 'GIT',
      path: null,
      remoteUrl: 'https://example.org/platform.git',
      branch: 'main',
      revision: 'abc123',
      acquiredAt: '2026-04-04T00:00:00Z',
    },
    run: {
      startedAt: '2026-04-04T00:00:00Z',
      completedAt: '2026-04-04T00:01:00Z',
      outcome: 'SUCCESS',
      detectedTechnologies: ['java', 'react'],
    },
    completeness: {
      status: 'COMPLETE',
      indexedFileCount: 2,
      totalFileCount: 2,
      degradedFileCount: 0,
      omittedPaths: [],
      notes: [],
    },
    viewpoints: [],
    diagnostics: [],
    scopes: [
      { externalId: 'scope:repo', kind: 'REPOSITORY', name: 'platform', displayName: 'Platform', parentScopeId: null, sourceRefs: [], metadata: {} },
      { externalId: 'scope:pkg', kind: 'PACKAGE', name: 'com.example.orders', displayName: 'com.example.orders', parentScopeId: 'scope:repo', sourceRefs: [], metadata: {} },
      { externalId: 'scope:file', kind: 'FILE', name: 'apps/web/src/orders.tsx', displayName: 'orders.tsx', parentScopeId: 'scope:repo', sourceRefs: [], metadata: {} },
      { externalId: 'scope:other', kind: 'PACKAGE', name: 'com.example.other', displayName: 'com.example.other', parentScopeId: 'scope:repo', sourceRefs: [], metadata: {} },
    ],
    entities: [
      { externalId: 'entity:order', kind: 'CLASS', origin: 'java', name: 'Order', displayName: 'Order', scopeId: 'scope:pkg', sourceRefs: [], metadata: {} },
      { externalId: 'entity:order:id', kind: 'FIELD', origin: 'java', name: 'id', displayName: 'id', scopeId: 'scope:pkg', sourceRefs: [], metadata: {} },
      { externalId: 'entity:order:save', kind: 'FUNCTION', origin: 'java', name: 'save', displayName: 'save', scopeId: 'scope:pkg', sourceRefs: [], metadata: {} },
      { externalId: 'entity:top-level-hook', kind: 'HOOK', origin: 'react', name: 'useOrders', displayName: 'useOrders', scopeId: 'scope:file', sourceRefs: [], metadata: {} },
      { externalId: 'entity:page', kind: 'COMPONENT', origin: 'react', name: 'OrdersPage', displayName: 'OrdersPage', scopeId: 'scope:file', sourceRefs: [], metadata: { architecturalRoles: ['ui-page'] } },
      { externalId: 'entity:file-module', kind: 'MODULE', origin: 'react', name: 'OrdersModule', displayName: 'OrdersModule', scopeId: 'scope:file', sourceRefs: [], metadata: { architecturalRoles: ['module-boundary'] } },
      { externalId: 'entity:file-self', kind: 'FILE', origin: 'react', name: 'apps/web/src/orders.tsx', displayName: 'orders.tsx', scopeId: 'scope:file', sourceRefs: [], metadata: { architecturalRoles: ['module-boundary'] } },
      { externalId: 'entity:pkg-module', kind: 'MODULE', origin: 'java', name: 'OrdersSupportModule', displayName: 'OrdersSupportModule', scopeId: 'scope:pkg', sourceRefs: [], metadata: { architecturalRoles: ['application-service'] } },
      { externalId: 'entity:pkg-self', kind: 'PACKAGE', origin: 'java', name: 'com.example.orders', displayName: 'com.example.orders', scopeId: 'scope:pkg', sourceRefs: [], metadata: {} },
      { externalId: 'entity:other-service', kind: 'SERVICE', origin: 'java', name: 'OtherService', displayName: 'OtherService', scopeId: 'scope:other', sourceRefs: [], metadata: {} },
    ],
    relationships: [
      { externalId: 'rel:contains:field', kind: 'CONTAINS', fromEntityId: 'entity:order', toEntityId: 'entity:order:id', label: null, sourceRefs: [], metadata: {} },
      { externalId: 'rel:contains:function', kind: 'CONTAINS', fromEntityId: 'entity:order', toEntityId: 'entity:order:save', label: null, sourceRefs: [], metadata: {} },
    ],
    metadata: { metadata: {} },
    warnings: [],
  };
}

describe('browser navigation tree entity eligibility', () => {
  test('includes useful top-level entities for a scope', () => {
    const index = buildBrowserSnapshotIndex(createPayload());

    expect(getEligibleDirectEntitiesForScope(index, 'scope:pkg').map((entity) => entity.externalId)).toEqual([
      'entity:order',
    ]);
  });

  test('excludes nested members and scope-duplicate synthetic entities', () => {
    const index = buildBrowserSnapshotIndex(createPayload());

    expect(isEntityEligibleForNavigationTree(index, 'scope:pkg', 'entity:order:id')).toBe(false);
    expect(isEntityEligibleForNavigationTree(index, 'scope:pkg', 'entity:order:save')).toBe(false);
    expect(isEntityEligibleForNavigationTree(index, 'scope:pkg', 'entity:pkg-self')).toBe(false);
    expect(isEntityEligibleForNavigationTree(index, 'scope:file', 'entity:file-module')).toBe(false);
    expect(isEntityEligibleForNavigationTree(index, 'scope:file', 'entity:file-self')).toBe(false);
    expect(isEntityEligibleForNavigationTree(index, 'scope:pkg', 'entity:pkg-module')).toBe(false);
  });

  test('keeps top-level hooks and pages while rejecting entities from another scope', () => {
    const index = buildBrowserSnapshotIndex(createPayload());

    expect(getEligibleDirectEntitiesForScope(index, 'scope:file').map((entity) => entity.externalId)).toEqual([
      'entity:page',
      'entity:top-level-hook',
    ]);
    expect(isEntityEligibleForNavigationTree(index, 'scope:pkg', 'entity:other-service')).toBe(false);
  });
});
