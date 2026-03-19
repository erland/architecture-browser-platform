import { renderToStaticMarkup } from 'react-dom/server';
import type { FullSnapshotViewpoint } from '../appModel';
import { formatViewpointAvailability, formatViewpointLabel, BrowserViewpointControls } from '../components/BrowserViewpointControls';
import { buildBrowserSnapshotIndex } from '../browserSnapshotIndex';

const viewpoint: FullSnapshotViewpoint = {
  id: 'request-handling',
  title: 'Request Handling',
  description: 'Shows request entrypoints and collaborating services.',
  availability: 'available',
  confidence: 0.92,
  seedEntityIds: ['entity:controller'],
  seedRoleIds: ['api-entrypoint', 'application-service'],
  expandViaSemantics: ['serves-request', 'invokes-use-case'],
  preferredDependencyViews: ['runtime-dependencies'],
  evidenceSources: ['fixture'],
};

test('formats viewpoint labels and availability for browser controls', () => {
  expect(formatViewpointLabel(viewpoint)).toBe('Request Handling');
  expect(formatViewpointAvailability(viewpoint)).toBe('Available · 92% confidence');
});

test('renders viewpoint controls with exported viewpoint choices and applied counts', () => {
  const index = buildBrowserSnapshotIndex({
    snapshot: {
      id: 'snap-1', workspaceId: 'ws-1', repositoryRegistrationId: 'repo-1', repositoryKey: 'platform', repositoryName: 'Platform', runId: 'run-1', snapshotKey: 'snap-key', status: 'READY', completenessStatus: 'COMPLETE', derivedRunOutcome: 'SUCCESS', schemaVersion: '1.3.0', indexerVersion: '0.1.0', sourceRevision: 'abc', sourceBranch: 'main', importedAt: '2026-03-19T00:00:00Z', scopeCount: 1, entityCount: 1, relationshipCount: 0, diagnosticCount: 0, indexedFileCount: 1, totalFileCount: 1, degradedFileCount: 0,
    },
    source: { repositoryId: 'repo-1', acquisitionType: 'GIT', path: null, remoteUrl: null, branch: 'main', revision: 'abc', acquiredAt: null },
    run: { startedAt: null, completedAt: null, outcome: 'SUCCESS', detectedTechnologies: ['java'] },
    completeness: { status: 'COMPLETE', indexedFileCount: 1, totalFileCount: 1, degradedFileCount: 0, omittedPaths: [], notes: [] },
    scopes: [{ externalId: 'scope:repo', kind: 'REPOSITORY', name: 'platform', displayName: 'Platform', parentScopeId: null, sourceRefs: [], metadata: {} }],
    entities: [{ externalId: 'entity:controller', kind: 'COMPONENT', origin: 'java', name: 'Controller', displayName: 'Controller', scopeId: 'scope:repo', sourceRefs: [], metadata: { architecturalRoles: ['api-entrypoint'] } }],
    relationships: [],
    viewpoints: [viewpoint],
    diagnostics: [],
    metadata: { metadata: {} },
    warnings: [],
  });

  const markup = renderToStaticMarkup(
    <BrowserViewpointControls
      index={index}
      selectedScopeLabel="Platform"
      selection={{ viewpointId: 'request-handling', scopeMode: 'selected-scope', applyMode: 'replace', variant: 'default' }}
      appliedViewpoint={{ viewpoint, scopeMode: 'selected-scope', selectedScopeId: 'scope:repo', seedEntityIds: ['entity:controller'], entityIds: ['entity:controller'], relationshipIds: [], preferredDependencyViews: ['runtime-dependencies'], recommendedLayout: 'request-flow', variant: 'default' }}
      onSelectViewpoint={() => undefined}
      onSelectScopeMode={() => undefined}
      onSelectApplyMode={() => undefined}
      onSelectVariant={() => undefined}
      onApplyViewpoint={() => undefined}
    />,
  );

  expect(markup).toContain('Auto-seed canvas analysis');
  expect(markup).toContain('Request Handling');
  expect(markup).toContain('Available · 92% confidence');
  expect(markup).toContain('1 entities on canvas');
});
