import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { hydrateBrowserSessionState, persistBrowserSession, readPersistedBrowserSession, type BrowserSessionState } from '../browser-session';
import { createBrowserSessionActionGroups } from './browserSessionActions';
import type { BrowserSessionContextValue } from './browserSession.types';

export type { BrowserSessionContextValue, OpenBrowserSessionOptions } from './browserSession.types';

const BrowserSessionContext = createContext<BrowserSessionContextValue | null>(null);

export function BrowserSessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BrowserSessionState>(() => hydrateBrowserSessionState(readPersistedBrowserSession()));

  useEffect(() => {
    persistBrowserSession(state);
  }, [state]);

  const actions = useMemo(() => createBrowserSessionActionGroups(setState), []);
  const value = useMemo<BrowserSessionContextValue>(() => ({
    state,
    ...actions,
  }), [actions, state]);

  return <BrowserSessionContext.Provider value={value}>{children}</BrowserSessionContext.Provider>;
}

export function useBrowserSession() {
  const context = useContext(BrowserSessionContext);
  if (!context) {
    throw new Error('useBrowserSession must be used within a BrowserSessionProvider');
  }
  return context;
}
