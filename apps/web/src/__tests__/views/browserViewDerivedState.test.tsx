import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Repository } from '../../app-model';
import { useBrowserViewDerivedState } from '../../views/browser-view/controllers/internal/useBrowserViewDerivedState';
import { createEmptyBrowserSessionState } from '../../browser-session/state';

function renderDerivedState(args: Parameters<typeof useBrowserViewDerivedState>[0]): ReturnType<typeof useBrowserViewDerivedState> {
  let captured: ReturnType<typeof useBrowserViewDerivedState> | null = null;
  function Probe() {
    captured = useBrowserViewDerivedState(args);
    return createElement('div');
  }
  renderToStaticMarkup(createElement(Probe));
  if (!captured) {
    throw new Error('Expected derived state to be captured during render.');
  }
  return captured;
}

function buildSnapshot(id: string, repositoryRegistrationId: string) {
  return {
    id,
    workspaceId: 'ws-1',
    repositoryRegistrationId,
    repositoryKey: repositoryRegistrationId,
    repositoryName: repositoryRegistrationId,
    runId: `run-${id}`,
    snapshotKey: `${id}-key`,
    status: 'READY' as const,
    completenessStatus: 'COMPLETE' as const,
    derivedRunOutcome: 'SUCCESS' as const,
    schemaVersion: '1.0.0',
    indexerVersion: '0.1.0',
    sourceRevision: id,
    sourceBranch: 'main',
    importedAt: '2026-04-03T00:00:00Z',
    scopeCount: 1,
    entityCount: 1,
    relationshipCount: 0,
    diagnosticCount: 0,
    indexedFileCount: 1,
    totalFileCount: 1,
    degradedFileCount: 0,
  };
}

function buildRepository(overrides: Partial<Repository>): Repository {
  return {
    id: 'repo-1',
    workspaceId: 'ws-1',
    name: 'Repo',
    repositoryKey: 'repo',
    sourceType: 'LOCAL_PATH',
    localPath: '/tmp/repo',
    remoteUrl: null,
    defaultBranch: 'main',
    status: 'ACTIVE',
    metadataJson: null,
    createdAt: '2026-04-03T00:00:00Z',
    updatedAt: '2026-04-03T00:00:00Z',
    ...overrides,
  };
}

describe('useBrowserViewDerivedState', () => {
  test('does not fall back to the active session snapshot when it belongs to a different selected repository', () => {
    const sessionState = createEmptyBrowserSessionState();
    sessionState.activeSnapshot = {
      workspaceId: 'ws-1',
      repositoryId: 'repo-old',
      snapshotId: 'snap-old',
      snapshotKey: 'snap-old-key',
      preparedAt: '2026-04-03T00:00:00Z',
    };

    const derived = renderDerivedState({
      selection: {
        selectedRepositoryId: 'repo-new',
        selectedSnapshotId: null,
      },
      workspaceData: {
        repositories: [
          buildRepository({ id: 'repo-old', name: 'Old repo', repositoryKey: 'old', localPath: '/tmp/old' }),
          buildRepository({ id: 'repo-new', name: 'New repo', repositoryKey: 'new', localPath: '/tmp/new' }),
        ],
        snapshots: [
          buildSnapshot('snap-old', 'repo-old'),
        ],
      },
      browserSession: {
        state: sessionState,
      },
      browserLayout: {
        activeTab: 'overview',
      },
    });

    expect(derived.selectedRepository?.id).toBe('repo-new');
    expect(derived.selectedSnapshot).toBeNull();
    expect(derived.repositoryLabel).toBe('New repo');
  });
});
