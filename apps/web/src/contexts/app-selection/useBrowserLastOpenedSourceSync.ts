import { useEffect } from 'react';
import { useBrowserSession } from '../BrowserSessionContext';
import { buildLastOpenedBrowserSourceSelection } from './appSelectionPolicy';
import { persistLastOpenedBrowserSource } from './appSelectionStorage';

export function useBrowserLastOpenedSourceSync() {
  const browserSession = useBrowserSession();

  useEffect(() => {
    const activeSnapshot = browserSession.state.activeSnapshot;
    if (!activeSnapshot) {
      return;
    }

    const lastOpenedSelection = buildLastOpenedBrowserSourceSelection(activeSnapshot);
    persistLastOpenedBrowserSource(lastOpenedSelection);
  }, [browserSession.state.activeSnapshot]);
}
