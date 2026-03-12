import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppNavigation } from './components/AppNavigation';
import { useAppSelectionContext } from './contexts/AppSelectionContext';
import { normalizeRoutePath, type AppRoutePath } from './routing/appRoutes';
import { LegacyWorkspaceView } from './views/LegacyWorkspaceView';
import { RoutePlaceholderView } from './views/RoutePlaceholderView';
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
      return <LegacyWorkspaceView onOpenWorkspaces={() => handleNavigate('/workspaces')} />;
    }
    if (currentPath === '/workspaces') {
      return <WorkspacesView />;
    }
    return <RoutePlaceholderView path={currentPath} onOpenLegacy={() => handleNavigate('/legacy')} />;
  }, [currentPath, handleNavigate]);

  return (
    <main className="page">
      <section className="hero hero--compact">
        <p className="eyebrow">Architecture Browser Platform</p>
        <h1>Route-capable platform shell</h1>
        <p className="lead">
          Step 3 introduces a dedicated Workspaces view while keeping shared workspace, repository, and snapshot context available across routes.
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
