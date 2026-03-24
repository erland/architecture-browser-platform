import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BrowserSourceTreeLauncher } from '../components/BrowserSourceTreeLauncher';
import type { SourceTreeLauncherItem } from '../appModel.sourceTree';

const readyItem: SourceTreeLauncherItem = {
  id: 'launcher-item-ready',
  workspaceId: 'ws-1',
  workspaceName: 'Default workspace',
  repositoryId: 'repo-1',
  latestSnapshotId: 'snap-1',
  latestSnapshotKey: 'customs-api-main',
  sourceTreeLabel: 'Customs API',
  sourceTreeKey: 'customs-api',
  sourceSummary: 'Latest indexed version from main',
  indexedVersionLabel: 'Ready',
  latestIndexedAtLabel: '2026-03-24T08:00:00Z',
  latestImportedAt: '2026-03-24T08:00:00Z',
  searchText: 'Default workspace Customs API customs-api main',
  latestRunStatusLabel: 'Success',
  status: 'ready',
};

const emptyItem: SourceTreeLauncherItem = {
  ...readyItem,
  id: 'launcher-item-empty',
  latestSnapshotId: null,
  latestSnapshotKey: null,
  indexedVersionLabel: 'No indexed version',
  latestImportedAt: null,
  latestRunStatusLabel: 'Not started',
  status: 'empty',
};

describe('BrowserSourceTreeLauncher', () => {
  it('renders browser-first actions for ready and unprepared source trees', () => {
    const markup = renderToStaticMarkup(createElement(BrowserSourceTreeLauncher, {
      title: 'Open a source tree',
      description: 'Choose the latest indexed version to continue in Browser.',
      items: [readyItem, emptyItem],
      onSelectSourceTree: () => undefined,
      onOpenSourceTreeDialog: () => undefined,
    }));

    expect(markup).toContain('Source tree launcher');
    expect(markup).toContain('Open in Browser');
    expect(markup).toContain('Select source tree');
    expect(markup).toContain('Choose indexed version');
    expect(markup).toContain('Manage source tree');
    expect(markup).toContain('Open Source tree dialog');
    expect(markup).not.toContain('Open Workspaces');
    expect(markup).not.toContain('Compare');
    expect(markup).not.toContain('Operations');
  });

  it('renders an empty browser-first prompt when no source trees are registered', () => {
    const markup = renderToStaticMarkup(createElement(BrowserSourceTreeLauncher, {
      title: 'Open a source tree',
      description: 'Choose the latest indexed version to continue in Browser.',
      items: [],
      onSelectSourceTree: () => undefined,
      onOpenSourceTreeDialog: () => undefined,
    }));

    expect(markup).toContain('No source trees are available yet. Open the Source tree dialog to register one.');
    expect(markup).toContain('Open Source tree dialog');
  });
});
