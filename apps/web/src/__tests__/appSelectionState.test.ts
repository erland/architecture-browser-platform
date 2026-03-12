import {
  buildAppSelectionSearch,
  mergeAppSelectionState,
  parseAppSelectionSearch,
} from '../routing/appSelectionState';

describe('appSelectionState', () => {
  it('parses workspace, repository, and snapshot ids from the url', () => {
    expect(parseAppSelectionSearch('?workspace=w1&repository=r2&snapshot=s3')).toEqual({
      selectedWorkspaceId: 'w1',
      selectedRepositoryId: 'r2',
      selectedSnapshotId: 's3',
    });
  });

  it('merges persisted state with url state and lets the url win', () => {
    expect(mergeAppSelectionState(
      {
        selectedWorkspaceId: 'persisted-workspace',
        selectedRepositoryId: 'persisted-repository',
        selectedSnapshotId: 'persisted-snapshot',
      },
      {
        selectedWorkspaceId: 'url-workspace',
        selectedSnapshotId: 'url-snapshot',
      },
    )).toEqual({
      selectedWorkspaceId: 'url-workspace',
      selectedRepositoryId: 'persisted-repository',
      selectedSnapshotId: 'url-snapshot',
    });
  });

  it('renders selection state back to a query string and preserves unrelated params', () => {
    expect(buildAppSelectionSearch('?tab=browser', {
      selectedWorkspaceId: 'w1',
      selectedRepositoryId: null,
      selectedSnapshotId: 's3',
    })).toBe('?tab=browser&workspace=w1&snapshot=s3');
  });
});
