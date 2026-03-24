import { useEffect } from 'react';
import { useAppSelectionContext } from './contexts/AppSelectionContext';
import { normalizeRoutePath } from './routing/appRoutes';
import { BrowserView } from './views/BrowserView';

export function App() {
  useAppSelectionContext();

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const normalizedPath = normalizeRoutePath(window.location.pathname);
    const currentPath = window.location.pathname;
    if (normalizedPath !== currentPath) {
      window.history.replaceState({}, '', `${normalizedPath}${window.location.search}${window.location.hash}`);
    }
  }, []);

  return (
    <main className="page page--browser">
      <BrowserView />
    </main>
  );
}
