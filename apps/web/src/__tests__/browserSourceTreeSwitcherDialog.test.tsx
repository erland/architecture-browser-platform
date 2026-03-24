import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BrowserSourceTreeSwitcherDialog } from '../components/BrowserSourceTreeSwitcherDialog';
import type { Repository, Workspace } from '../appModel';
import type { SourceTreeLauncherItem } from '../appModel.sourceTree';

const repository: Repository = {
  id: 'repo-1',
  workspaceId: 'ws-1',
  repositoryKey: 'customs-api',
  name: 'Customs API',
  sourceType: 'GIT',
  localPath: null,
  remoteUrl: 'https://example.test/customs-api.git',
  defaultBranch: 'main',
  metadataJson: '{"team":"platform"}',
  status: 'ACTIVE',
  createdAt: '2026-03-20T08:00:00Z',
  updatedAt: '2026-03-24T08:00:00Z',
};

const workspace: Workspace = {
  id: 'ws-1',
  workspaceKey: 'default',
  name: 'Default workspace',
  description: null,
  createdAt: '2026-03-20T08:00:00Z',
  updatedAt: '2026-03-24T08:00:00Z',
  status: 'ACTIVE',
  repositoryCount: 1,
};

const item: SourceTreeLauncherItem = {
  id: 'item-1',
  workspaceId: workspace.id,
  workspaceName: workspace.name,
  repositoryId: repository.id,
  latestSnapshotId: 'snap-1',
  latestSnapshotKey: 'customs-api-main',
  sourceTreeLabel: repository.name,
  sourceTreeKey: repository.repositoryKey,
  sourceSummary: 'Latest indexed version from main',
  indexedVersionLabel: 'Ready',
  latestIndexedAtLabel: '2026-03-24T08:00:00Z',
  latestImportedAt: '2026-03-24T08:00:00Z',
  searchText: 'Default workspace Customs API customs-api main',
  latestRunStatusLabel: 'Success',
  status: 'ready',
};

function renderDialog(selectedWorkspace: Workspace | null, items: SourceTreeLauncherItem[] = [item]) {
  return renderToStaticMarkup(createElement(BrowserSourceTreeSwitcherDialog, {
    isOpen: true,
    items,
    repositories: [repository],
    selectedWorkspace,
    onSelectSourceTree: () => undefined,
    onCreateRepository: async () => undefined,
    onInitializeWorkspace: async () => undefined,
    onRequestReindex: async () => undefined,
    onArchiveRepository: async () => undefined,
    onUpdateRepository: async () => undefined,
    onClose: () => undefined,
  }));
}

describe('BrowserSourceTreeSwitcherDialog', () => {
  it('renders the single-workspace initialization prompt when no workspace exists yet', () => {
    const markup = renderDialog(null, []);

    expect(markup).toContain('Initialize source tree catalog');
    expect(markup).toContain('Browser keeps a single source tree catalog behind the scenes.');
    expect(markup).not.toContain('Create workspace');
  });

  it('renders browser-first source-tree management actions when the implicit workspace is available', () => {
    const markup = renderDialog(workspace);

    expect(markup).toContain('Source trees');
    expect(markup).toContain('Add source tree');
    expect(markup).toContain('Open in Browser');
    expect(markup).toContain('Re-index');
    expect(markup).toContain('Edit');
    expect(markup).toContain('Archive');
    expect(markup).not.toContain('Operations');
    expect(markup).not.toContain('Compare');
  });
});
