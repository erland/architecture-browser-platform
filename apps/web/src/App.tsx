import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppNavigation } from './components/AppNavigation';
import { buildSelectedSourceTreeSummary } from './appModel.sourceTree';
import { useAppSelectionContext } from './contexts/AppSelectionContext';
import { type AppRoutePath } from './routing/appRoutes';
import { buildNavigationUrl, readRoutePath } from './routing/appRouteState';
import { LegacyWorkspaceView } from './views/LegacyWorkspaceView';
import { RoutePlaceholderView } from './views/RoutePlaceholderView';
import { BrowserView } from './views/BrowserView';
import { CompareView } from './views/CompareView';
import { WorkspacesView } from './views/WorkspacesView';
import { OperationsView } from './views/OperationsView';
import { ManageSourcesView } from './views/ManageSourcesView';

function readCurrentRoute(): AppRoutePath {
  if (typeof window === 'undefined') {
    return '/browser';
  }
  return readRoutePath(window.location.pathname);
}

export function App() {
  const [currentPath, setCurrentPath] = useState<AppRoutePath>(() => readCurrentRoute());
  const selection = useAppSelectionContext();
  const sourceTreeSummary = useMemo(() => buildSelectedSourceTreeSummary(selection), [selection]);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(readCurrentRoute());
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const normalizedPath = readRoutePath(window.location.pathname);
    if (normalizedPath !== window.location.pathname) {
      window.history.replaceState({}, '', buildNavigationUrl(normalizedPath, window.location.search, window.location.hash));
    }
    if (normalizedPath !== currentPath) {
      setCurrentPath(normalizedPath);
    }
  }, [currentPath]);

  const handleNavigate = useCallback((path: AppRoutePath) => {
    if (path === currentPath) {
      return;
    }
    window.history.pushState({}, '', buildNavigationUrl(path, window.location.search, window.location.hash));
    setCurrentPath(path);
  }, [currentPath]);

  const routeContent = useMemo(() => {
    if (currentPath === '/legacy') {
      return <LegacyWorkspaceView onOpenWorkspaces={() => handleNavigate('/workspaces')} onOpenRepositories={() => handleNavigate('/sources')} onOpenSnapshots={() => handleNavigate('/sources')} onOpenOperations={() => handleNavigate('/operations')} />;
    }
    if (currentPath === '/workspaces') {
      return <WorkspacesView />;
    }
    if (currentPath === '/sources') {
      return <ManageSourcesView onOpenBrowser={() => handleNavigate('/browser')} onOpenCompare={() => handleNavigate('/compare')} onOpenLegacy={() => handleNavigate('/legacy')} onOpenWorkspaces={() => handleNavigate('/workspaces')} />;
    }
    if (currentPath === '/browser') {
      return <BrowserView onOpenWorkspaces={() => handleNavigate('/workspaces')} onOpenSnapshots={() => handleNavigate('/sources')} onOpenRepositories={() => handleNavigate('/sources')} onOpenCompare={() => handleNavigate('/compare')} onOpenOperations={() => handleNavigate('/operations')} onOpenLegacy={() => handleNavigate('/legacy')} />;
    }
    if (currentPath === '/compare') {
      return <CompareView onOpenSnapshots={() => handleNavigate('/sources')} onOpenBrowser={() => handleNavigate('/browser')} onOpenLegacy={() => handleNavigate('/legacy')} />;
    }
    if (currentPath === '/operations') {
      return <OperationsView onOpenWorkspaces={() => handleNavigate('/workspaces')} onOpenRepositories={() => handleNavigate('/sources')} onOpenSnapshots={() => handleNavigate('/sources')} onOpenLegacy={() => handleNavigate('/legacy')} />;
    }
    return <RoutePlaceholderView path={currentPath} onOpenLegacy={() => handleNavigate('/legacy')} />;
  }, [currentPath, handleNavigate]);

  const isBrowserRoute = currentPath === '/browser';

  if (isBrowserRoute) {
    return (
      <main className="page page--browser">
        {routeContent}
      </main>
    );
  }

  return (
    <main className="page">
      <section className="hero hero--compact">
        <p className="eyebrow">Architecture Browser Platform</p>
        <h1>Open source trees, then analyze</h1>
        <p className="lead">
          Browser is now the default entry route so architects can open a source tree quickly, while source registration and indexed version management stay available behind Manage sources when needed.
        </p>
        <div className="selection-summary">
          <span className="badge">{sourceTreeSummary.sourceTreeLabel}</span>
          <span className="badge">{sourceTreeSummary.indexedVersionLabel}</span>
          <span className="badge">{sourceTreeSummary.workspaceContextLabel}</span>
        </div>
      </section>

      <AppNavigation currentPath={currentPath} onNavigate={handleNavigate} />

      <section className="route-content">
        {routeContent}
      </section>
    </main>
  );
}
