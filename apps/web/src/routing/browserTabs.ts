export const browserTabs = [
  { key: 'overview', label: 'Explore', description: 'General architecture exploration with the local tree, search, canvas, and facts panel.' },
  { key: 'layout', label: 'Structure', description: 'Focus on scopes, containment, and how the model is organized locally.' },
  { key: 'dependencies', label: 'Dependencies', description: 'Focus on relationship neighborhoods and dependency-driven expansion on the local canvas.' },
  { key: 'entry-points', label: 'Entrypoints', description: 'Focus on likely starting points, boundaries, and integration edges using local facts and search.' },
  { key: 'search', label: 'Inspect', description: 'Focus on selected entities, diagnostics, and detailed facts from the prepared snapshot.' },
] as const;

export type BrowserTabKey = (typeof browserTabs)[number]['key'];

export function isBrowserTabKey(value: string | null | undefined): value is BrowserTabKey {
  return browserTabs.some((tab) => tab.key === value);
}
