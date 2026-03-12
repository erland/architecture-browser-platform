import { browserTabs, type BrowserTabKey } from '../routing/browserTabs';

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
