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

type BrowserTabNavProps = {
  activeTab: BrowserTabKey;
  onSelectTab: (tab: BrowserTabKey) => void;
};

export function BrowserTabNav({ activeTab, onSelectTab }: BrowserTabNavProps) {
  return (
    <nav className="card browser-tab-nav" aria-label="Browser tools">
      <div>
        <p className="eyebrow">Browser tools</p>
        <h2 className="app-nav__title">Architecture views</h2>
        <p className="muted app-nav__lead">
          Step 6 introduces the dedicated Browser shell and mounts the existing snapshot panels into focused tab containers.
        </p>
      </div>
      <div className="browser-tab-nav__links">
        {browserTabs.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              type="button"
              className={isActive ? 'nav-link nav-link--active' : 'nav-link'}
              onClick={() => onSelectTab(tab.key)}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="nav-link__label">{tab.label}</span>
              <span className="nav-link__description">{tab.description}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
