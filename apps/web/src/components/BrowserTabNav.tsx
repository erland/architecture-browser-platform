import { browserTabs, type BrowserTabKey } from '../routing/browserTabs';

type BrowserTabNavProps = {
  activeTab: BrowserTabKey;
  onSelectTab: (tab: BrowserTabKey) => void;
  onOpenCompare: () => void;
  onOpenOperations: () => void;
  onOpenLegacy: () => void;
};

export function BrowserTabNav({ activeTab, onSelectTab, onOpenCompare, onOpenOperations, onOpenLegacy }: BrowserTabNavProps) {
  return (
    <nav className="card browser-tab-nav browser-tab-nav--compact" aria-label="Browser modes">
      <div className="browser-tab-nav__header">
        <p className="eyebrow">Browser tools</p>
        <h2 className="app-nav__title">Mode switcher</h2>
        <p className="muted app-nav__lead">
          The scope tree now owns the left-rail navigation. These mode switches remain available as secondary analysis tools while later steps move more work into tree, top search, canvas, and facts.
        </p>
      </div>

      <div className="browser-tab-nav__section">
        <p className="browser-tab-nav__section-label">Secondary Browser tools</p>
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
      </div>

      <div className="browser-tab-nav__section browser-tab-nav__section--secondary">
        <p className="browser-tab-nav__section-label">Other destinations</p>
        <div className="browser-secondary-nav">
          <button type="button" className="nav-link" onClick={onOpenCompare}>
            <span className="nav-link__label">Compare</span>
            <span className="nav-link__description">Compare the selected snapshot against another snapshot.</span>
          </button>
          <button type="button" className="nav-link" onClick={onOpenOperations}>
            <span className="nav-link__label">Operations</span>
            <span className="nav-link__description">Review failed runs, retention, and audit events.</span>
          </button>
          <button type="button" className="nav-link" onClick={onOpenLegacy}>
            <span className="nav-link__label">Legacy workspace</span>
            <span className="nav-link__description">Leave the focused Browser shell and return to the previous stacked workspace.</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
