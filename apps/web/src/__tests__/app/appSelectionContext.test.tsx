import { __appSelectionContextTestExports } from '../../contexts/AppSelectionContext';

const {
  resolveInitialSelection,
  buildLastOpenedBrowserSourceSelection,
} = __appSelectionContextTestExports;

describe('AppSelectionContext', () => {
  it('prefers the last opened Browser source tree over the generic persisted selection', () => {
    expect(resolveInitialSelection({
      persistedSelection: {
        selectedWorkspaceId: 'ws-admin',
        selectedRepositoryId: 'repo-admin',
        selectedSnapshotId: 'snap-admin',
      },
      lastOpenedBrowserSource: {
        selectedWorkspaceId: 'ws-browser',
        selectedRepositoryId: 'repo-browser',
        selectedSnapshotId: 'snap-browser',
      },
      locationSearch: '',
    })).toEqual({
      selectedWorkspaceId: 'ws-browser',
      selectedRepositoryId: 'repo-browser',
      selectedSnapshotId: 'snap-browser',
    });
  });

  it('keeps url selection as the highest-priority source', () => {
    expect(resolveInitialSelection({
      persistedSelection: {
        selectedWorkspaceId: 'ws-admin',
        selectedRepositoryId: 'repo-admin',
        selectedSnapshotId: 'snap-admin',
      },
      lastOpenedBrowserSource: {
        selectedWorkspaceId: 'ws-browser',
        selectedRepositoryId: 'repo-browser',
        selectedSnapshotId: 'snap-browser',
      },
      locationSearch: '?workspace=ws-url&repository=repo-url&snapshot=snap-url',
    })).toEqual({
      selectedWorkspaceId: 'ws-url',
      selectedRepositoryId: 'repo-url',
      selectedSnapshotId: 'snap-url',
    });
  });

  it('builds the persisted last-opened record from the active Browser snapshot', () => {
    expect(buildLastOpenedBrowserSourceSelection({
      workspaceId: 'ws-browser',
      repositoryId: 'repo-browser',
      snapshotId: 'snap-1',
    })).toEqual({
      selectedWorkspaceId: 'ws-browser',
      selectedRepositoryId: 'repo-browser',
      selectedSnapshotId: 'snap-1',
    });
  });
});
