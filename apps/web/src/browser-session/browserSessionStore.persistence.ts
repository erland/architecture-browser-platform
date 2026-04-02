import type { BrowserSessionState } from './browserSessionStore.types';
import { createPersistedBrowserSessionState } from './browserSessionStore.state';

const STORAGE_KEY = 'architecture-browser-platform.browser-session.v2';

export function readPersistedBrowserSession(storage: Pick<Storage, 'getItem'> | undefined = typeof window !== 'undefined' ? window.localStorage : undefined) {
  if (!storage) {
    return null;
  }
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function persistBrowserSession(state: BrowserSessionState, storage: Pick<Storage, 'setItem'> | undefined = typeof window !== 'undefined' ? window.localStorage : undefined) {
  if (!storage) {
    return;
  }
  storage.setItem(STORAGE_KEY, JSON.stringify(createPersistedBrowserSessionState(state)));
}
