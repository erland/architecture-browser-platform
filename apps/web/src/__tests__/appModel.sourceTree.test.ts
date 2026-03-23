import {
  buildSelectedSourceTreeSummary,
  buildSourceTreeId,
  buildSourceTreeLauncherItems,
} from '../appModel.sourceTree';
import type { Repository, SnapshotSummary, Workspace } from '../appModel.api';

const workspace: Workspace = {
  id: 'ws-1',
  workspaceKey: 'alpha',
  name: 'Alpha Workspace',
  description: null,
  status: 'ACTIVE',
  createdAt: '2026-03-01T09:00:00Z',
  updatedAt: '2026-03-01T09:00:00Z',
  repositoryCount: 2,
};

const repositories: Repository[] = [
  {
    id: 'repo-1',
    workspaceId: 'ws-1',
    repositoryKey: 'payments-service',
    name: 'Payments Service',
    sourceType: 'GIT',
    localPath: null,
    remoteUrl: 'https://example.test/payments.git',
    defaultBranch: 'main',
    status: 'ACTIVE',
    metadataJson: null,
    createdAt: '2026-03-01T09:00:00Z',
    updatedAt: '2026-03-01T09:00:00Z',
  },
  {
    id: 'repo-2',
    workspaceId: 'ws-1',
    repositoryKey: 'web-ui',
    name: '',
    sourceType: 'LOCAL_PATH',
    localPath: '/src/web-ui',
    remoteUrl: null,
    defaultBranch: 'develop',
    status: 'ACTIVE',
    metadataJson: null,
    createdAt: '2026-03-01T09:00:00Z',
    updatedAt: '2026-03-01T09:00:00Z',
  },
];

const snapshots: SnapshotSummary[] = [
  {
    id: 'snap-older',
    workspaceId: 'ws-1',
    repositoryRegistrationId: 'repo-1',
    repositoryKey: 'payments-service',
    repositoryName: 'Payments Service',
    runId: 'run-1',
    snapshotKey: '2026-03-10',
    status: 'READY',
    completenessStatus: 'COMPLETE',
    derivedRunOutcome: 'SUCCESS',
    schemaVersion: '1',
    indexerVersion: '1',
    sourceRevision: 'abc',
    sourceBranch: 'main',
    importedAt: '2026-03-10T10:00:00Z',
    scopeCount: 1,
    entityCount: 2,
    relationshipCount: 3,
    diagnosticCount: 0,
    indexedFileCount: 10,
    totalFileCount: 10,
    degradedFileCount: 0,
  },
  {
    id: 'snap-newer',
    workspaceId: 'ws-1',
    repositoryRegistrationId: 'repo-1',
    repositoryKey: 'payments-service',
    repositoryName: 'Payments Service',
    runId: 'run-2',
    snapshotKey: '2026-03-18',
    status: 'READY',
    completenessStatus: 'PARTIAL',
    derivedRunOutcome: 'PARTIAL',
    schemaVersion: '1',
    indexerVersion: '1',
    sourceRevision: 'def',
    sourceBranch: 'main',
    importedAt: '2026-03-18T10:00:00Z',
    scopeCount: 1,
    entityCount: 2,
    relationshipCount: 3,
    diagnosticCount: 1,
    indexedFileCount: 9,
    totalFileCount: 10,
    degradedFileCount: 1,
  },
];

describe('appModel.sourceTree', () => {
  it('builds a launcher list centered on repositories as source trees', () => {
    expect(buildSourceTreeLauncherItems({ workspace, repositories, snapshots })).toEqual([
      expect.objectContaining({
        id: buildSourceTreeId('ws-1', 'repo-1'),
        workspaceId: 'ws-1',
        repositoryId: 'repo-1',
        sourceTreeLabel: 'Payments Service',
        indexedVersionLabel: '2026-03-18 · PARTIAL',
        latestSnapshotId: 'snap-newer',
        status: 'ready',
      }),
      expect.objectContaining({
        id: buildSourceTreeId('ws-1', 'repo-2'),
        workspaceId: 'ws-1',
        repositoryId: 'repo-2',
        sourceTreeLabel: 'web-ui',
        indexedVersionLabel: 'Not indexed yet',
        latestSnapshotId: null,
        status: 'empty',
      }),
    ]);
  });

  it('summarizes persisted selection as a source-tree-centric header model', () => {
    expect(buildSelectedSourceTreeSummary({
      selectedWorkspaceId: 'ws-1',
      selectedRepositoryId: 'repo-7',
      selectedSnapshotId: 'snap-9',
    })).toEqual({
      sourceTreeId: 'ws-1::repo-7',
      sourceTreeLabel: 'Selected source tree: repo-7',
      indexedVersionLabel: 'Indexed version: snap-9',
      workspaceContextLabel: 'Workspace context: ws-1',
    });
  });
});
