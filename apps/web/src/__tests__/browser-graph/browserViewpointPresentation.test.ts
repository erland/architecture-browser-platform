import type { FullSnapshotPayload, SnapshotSummary } from '../../app-model';
import { resolveBrowserStateViewpointPresentationPolicy, resolveBrowserViewpointPresentationPolicy } from '../../browser-graph';
import { clearBrowserSnapshotIndex } from '../../browser-snapshot';
import { createEmptyBrowserSessionState } from '../../browser-session/state';
import { openSnapshotSession } from '../../browser-session/lifecycle-api';
import { setSelectedViewpoint } from '../../browser-session/viewpoints-api';

const snapshotSummary: SnapshotSummary = {
  id: 'snap-viewpoint-presentation-1',
  workspaceId: 'ws-1',
  repositoryRegistrationId: 'repo-1',
  repositoryKey: 'platform',
  repositoryName: 'Architecture Browser Platform',
  runId: 'run-1',
  snapshotKey: 'platform-main-viewpoint-presentation',
  status: 'READY',
  completenessStatus: 'COMPLETE',
  derivedRunOutcome: 'SUCCESS',
  schemaVersion: '1.0.0',
  indexerVersion: '0.1.0',
  sourceRevision: 'abc123',
  sourceBranch: 'main',
  importedAt: '2026-03-20T00:00:00Z',
  scopeCount: 1,
  entityCount: 1,
  relationshipCount: 0,
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
      { externalId: 'scope:domain', kind: 'PACKAGE', name: 'domain', displayName: 'Domain', parentScopeId: null, sourceRefs: [], metadata: {} },
    ],
    entities: [
      { externalId: 'entity:order', kind: 'CLASS', origin: 'java', name: 'Order', displayName: 'Order', scopeId: 'scope:domain', sourceRefs: [], metadata: {} },
    ],
    relationships: [],
    viewpoints: [
      { id: 'persistence-model', title: 'Persistence model', description: 'Show entities and repositories.', availability: 'available', confidence: 0.93, seedEntityIds: [], seedRoleIds: ['persistent-structure'], expandViaSemantics: ['reads-persistence', 'writes-persistence'], preferredDependencyViews: ['structural-dependencies'], evidenceSources: ['java-jpa'] },
      { id: 'request-handling', title: 'Request handling', description: 'Trace requests across services.', availability: 'available', confidence: 0.91, seedEntityIds: [], seedRoleIds: ['api-entrypoint'], expandViaSemantics: ['serves-request', 'invokes-use-case'], preferredDependencyViews: ['runtime-dependencies'], evidenceSources: ['java-spring'] },
    ],
    diagnostics: [],
    metadata: { metadata: {} },
    warnings: [],
  };
}

describe('browserViewpointPresentation', () => {
  afterEach(() => {
    clearBrowserSnapshotIndex();
  });

  test('uses compact UML presentation for class-centric viewpoints', () => {
    const policy = resolveBrowserViewpointPresentationPolicy({ id: 'persistence-model' }, 'default');
    expect(policy.mode).toBe('compact-uml');
    expect(policy.collapseMembersByDefault).toBe(true);
    expect(policy.compactMemberKinds).toEqual(['FIELD', 'PROPERTY', 'FUNCTION', 'METHOD']);
  });

  test('uses standard entity graph presentation for flow-centric viewpoints', () => {
    const policy = resolveBrowserViewpointPresentationPolicy({ id: 'request-handling' }, 'show-upstream-callers');
    expect(policy.mode).toBe('entity-graph');
    expect(policy.variant).toBe('show-upstream-callers');
    expect(policy.compactMemberKinds).toEqual([]);
  });



  test('lets the local presentation preference force entity graph fallback for class-centric viewpoints', () => {
    const policy = resolveBrowserViewpointPresentationPolicy({ id: 'persistence-model' }, 'default', 'entity-graph');
    expect(policy.mode).toBe('entity-graph');
    expect(policy.reason).toContain('disabled by the local browser presentation toggle');
  });

  test('lets the local presentation preference force compact UML for non-class-centric viewpoints', () => {
    const policy = resolveBrowserViewpointPresentationPolicy({ id: 'request-handling' }, 'default', 'compact-uml');
    expect(policy.mode).toBe('compact-uml');
    expect(policy.reason).toContain('enabled by the local browser presentation toggle');
  });

  test('resolves selected browser viewpoint policy from session state even before canvas application', () => {
    let state = openSnapshotSession(createEmptyBrowserSessionState(), {
      workspaceId: 'ws-1',
      repositoryId: 'repo-1',
      payload: createPayload(),
    });
    state = setSelectedViewpoint(state, 'persistence-model');

    const policy = resolveBrowserStateViewpointPresentationPolicy(state);
    expect(policy.viewpointId).toBe('persistence-model');
    expect(policy.mode).toBe('compact-uml');
    expect(policy.reason).toContain('class-centric');
  });
});
