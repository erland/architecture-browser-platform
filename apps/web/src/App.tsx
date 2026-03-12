import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppNavigation } from './components/AppNavigation';
import { useAppSelectionContext } from './contexts/AppSelectionContext';
import { normalizeRoutePath, type AppRoutePath } from './routing/appRoutes';
import { LegacyWorkspaceView } from './views/LegacyWorkspaceView';
import { RepositoriesView } from './views/RepositoriesView';
import { RoutePlaceholderView } from './views/RoutePlaceholderView';
import { SnapshotsView } from './views/SnapshotsView';
import { WorkspacesView } from './views/WorkspacesView';

function readCurrentRoute(): AppRoutePath {
  if (typeof window === 'undefined') {
    return '/legacy';
  }
  return normalizeRoutePath(window.location.pathname);
}

export function App() {
  const [currentPath, setCurrentPath] = useState<AppRoutePath>(() => readCurrentRoute());
  const selection = useAppSelectionContext();

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(readCurrentRoute());
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const normalizedPath = normalizeRoutePath(window.location.pathname);
    if (normalizedPath !== window.location.pathname) {
      window.history.replaceState({}, '', `${normalizedPath}${window.location.search}${window.location.hash}`);
    }
    if (normalizedPath !== currentPath) {
      setCurrentPath(normalizedPath);
    }
  }, [currentPath]);

  const handleNavigate = useCallback((path: AppRoutePath) => {
    if (path === currentPath) {
      return;
    }
    window.history.pushState({}, '', `${path}${window.location.search}${window.location.hash}`);
    setCurrentPath(path);
  }, [currentPath]);

  const routeContent = useMemo(() => {
    if (currentPath === '/legacy') {
      return <LegacyWorkspaceView onOpenWorkspaces={() => handleNavigate('/workspaces')} onOpenRepositories={() => handleNavigate('/repositories')} onOpenSnapshots={() => handleNavigate('/snapshots')} />;
    }
    if (currentPath === '/workspaces') {
      return <WorkspacesView />;
    }
    if (currentPath === '/repositories') {
      return <RepositoriesView />;
    }
    if (currentPath === '/snapshots') {
      return <SnapshotsView onOpenBrowser={() => handleNavigate('/browser')} onOpenCompare={() => handleNavigate('/compare')} onOpenLegacy={() => handleNavigate('/legacy')} />;
    }
    return <RoutePlaceholderView path={currentPath} onOpenLegacy={() => handleNavigate('/legacy')} />;
  }, [currentPath, handleNavigate]);

  return (
    <main className="page">
      <section className="hero hero--compact">
        <p className="eyebrow">Architecture Browser Platform</p>
        <h1>Route-capable platform shell</h1>
        <p className="lead">
          Step 5 introduces a dedicated Snapshots view so snapshot selection now has its own route and acts as the bridge between indexing outputs and the upcoming Browser and Compare views.
        </p>
        <div className="selection-summary">
          <span className="badge">Workspace: {selection.selectedWorkspaceId ?? '—'}</span>
          <span className="badge">Repository: {selection.selectedRepositoryId ?? '—'}</span>
          <span className="badge">Snapshot: {selection.selectedSnapshotId ?? '—'}</span>
        </div>
      </section>

      <AppNavigation currentPath={currentPath} onNavigate={handleNavigate} />

      <section className="route-content">
        {routeContent}
      </section>
    </main>
  );
}
