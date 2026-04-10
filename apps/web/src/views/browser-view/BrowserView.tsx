import { BrowserViewCenterContent } from './BrowserViewCenterContent';
import { BrowserViewDialogs } from './BrowserViewDialogs';
import { BrowserViewFooter } from './BrowserViewFooter';
import { BrowserInspectorPanel, BrowserRailPanel } from './BrowserViewPanels';
import { BrowserViewTopBar } from './BrowserViewTopBar';
import { type BrowserViewProps } from './browserView.shared';
import { useBrowserViewApplicationController } from './application';

export function BrowserView(props: BrowserViewProps) {
  const controller = useBrowserViewApplicationController(props);
  const { page } = controller;

  return (
    <div className="browser-workspace" aria-label="Browser">
      <BrowserViewTopBar {...page.topBar} />

      <BrowserViewDialogs {...page.dialogs} />

      <div className="browser-workspace__layout" style={page.layout.layoutStyle}>
        <BrowserRailPanel
          browserSession={page.rail.browserSession}
          isCollapsed={page.layout.isRailCollapsed}
          onExpand={page.layout.expandRail}
          onCollapse={page.layout.collapseRail}
          onAddScopeEntitiesToCanvas={page.rail.onAddScopeEntitiesToCanvas}
          onSelectEntity={page.rail.onSelectEntity}
          onAddEntityToCanvas={page.rail.onAddEntityToCanvas}
          onOpenViewpoints={page.rail.onOpenViewpoints}
        />

        <div
          className={`browser-workspace__resizer browser-workspace__resizer--rail ${page.layout.isRailCollapsed ? 'browser-workspace__resizer--hidden' : ''}`}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize navigation tree"
          onMouseDown={page.layout.isRailCollapsed ? undefined : page.layout.startPaneResize('rail')}
        />

        <section className="browser-workspace__center">
          {page.startup.shouldShowGate ? (
            <div className="browser-workspace__stage">
              <section className="card browser-workspace__startup-gate" aria-live="polite">
                <p className="eyebrow">Opening Browser</p>
                <h3>Preparing Browser</h3>
                <p className="muted">{page.startup.gateMessage}</p>
              </section>
            </div>
          ) : (
            <BrowserViewCenterContent {...page.center} />
          )}
        </section>

        <div
          className={`browser-workspace__resizer browser-workspace__resizer--inspector ${page.layout.isInspectorCollapsed ? 'browser-workspace__resizer--hidden' : ''}`}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize facts panel"
          onMouseDown={page.layout.isInspectorCollapsed ? undefined : page.layout.startPaneResize('inspector')}
        />

        <BrowserInspectorPanel
          browserSession={page.inspector.browserSession}
          isCollapsed={page.layout.isInspectorCollapsed}
          onExpand={page.layout.expandInspector}
          onCollapse={page.layout.collapseInspector}
          onSetActiveTab={page.inspector.onSetActiveTab}
        />
      </div>

      <BrowserViewFooter {...page.footer} />
    </div>
  );
}
