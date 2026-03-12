import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppNavigation } from './components/AppNavigation';
import { normalizeRoutePath, type AppRoutePath } from './routing/appRoutes';
import { LegacyWorkspaceView } from './views/LegacyWorkspaceView';
import { RoutePlaceholderView } from './views/RoutePlaceholderView';

function readCurrentRoute(): AppRoutePath {
  if (typeof window === 'undefined') {
    return '/legacy';
  }
  return normalizeRoutePath(window.location.pathname);
}

export function App() {
  const [currentPath, setCurrentPath] = useState<AppRoutePath>(() => readCurrentRoute());

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
      window.history.replaceState({}, '', normalizedPath);
    }
    if (normalizedPath !== currentPath) {
      setCurrentPath(normalizedPath);
    }
  }, [currentPath]);

  const handleNavigate = useCallback((path: AppRoutePath) => {
    if (path === currentPath) {
      return;
    }
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  }, [currentPath]);

  const routeContent = useMemo(() => {
    if (currentPath === '/legacy') {
      return <LegacyWorkspaceView />;
    }
    return <RoutePlaceholderView path={currentPath} onOpenLegacy={() => handleNavigate('/legacy')} />;
  }, [currentPath, handleNavigate]);

  return (
    <main className="page">
      <section className="hero hero--compact">
        <p className="eyebrow">Architecture Browser Platform</p>
        <h1>Route-capable platform shell</h1>
        <p className="lead">
          Step 1 introduces top-level navigation and route-specific content areas. The current stacked workspace remains available while the
          dedicated views are introduced incrementally.
        </p>
      </section>

      <AppNavigation currentPath={currentPath} onNavigate={handleNavigate} />

      <section className="route-content">
        {routeContent}
      </section>
    </main>
  );
}
