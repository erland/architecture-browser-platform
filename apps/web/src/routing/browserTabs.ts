export const browserTabs = [
  { key: 'overview', label: 'Overview', description: 'Snapshot summary, counts, and recent diagnostics.' },
  { key: 'layout', label: 'Layout', description: 'Scopes, tree structure, and scope detail.' },
  { key: 'dependencies', label: 'Dependencies', description: 'Directional dependency exploration.' },
  { key: 'entry-points', label: 'Entry points', description: 'Inbound edges and integration starting points.' },
  { key: 'search', label: 'Search', description: 'Entity search and detailed drill-down.' },
] as const;

export type BrowserTabKey = (typeof browserTabs)[number]['key'];

export function isBrowserTabKey(value: string | null | undefined): value is BrowserTabKey {
  return browserTabs.some((tab) => tab.key === value);
}
