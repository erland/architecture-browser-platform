import { buildAppSelectionSearch, emptyAppSelectionState, type AppSelectionState } from '../../routing/appSelectionState';
import {
  APP_SELECTION_STORAGE_KEY,
  LAST_OPEN_BROWSER_SOURCE_STORAGE_KEY,
  resolveInitialSelection,
} from './appSelectionPolicy';

export function readPersistedRecord(key: string): Partial<AppSelectionState> {
  if (typeof window === 'undefined') {
    return emptyAppSelectionState;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return emptyAppSelectionState;
    }
    return JSON.parse(raw) as Partial<AppSelectionState>;
  } catch {
    return emptyAppSelectionState;
  }
}

export function readPersistedSelection(): Partial<AppSelectionState> {
  return readPersistedRecord(APP_SELECTION_STORAGE_KEY);
}

export function readLastOpenedBrowserSource(): Partial<AppSelectionState> {
  return readPersistedRecord(LAST_OPEN_BROWSER_SOURCE_STORAGE_KEY);
}

export function readInitialSelection(): AppSelectionState {
  if (typeof window === 'undefined') {
    return emptyAppSelectionState;
  }

  return resolveInitialSelection({
    persistedSelection: readPersistedSelection(),
    lastOpenedBrowserSource: readLastOpenedBrowserSource(),
    locationSearch: window.location.search,
  });
}

export function persistAppSelection(selection: AppSelectionState) {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(APP_SELECTION_STORAGE_KEY, JSON.stringify(selection));
}

export function persistLastOpenedBrowserSource(selection: AppSelectionState) {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(LAST_OPEN_BROWSER_SOURCE_STORAGE_KEY, JSON.stringify(selection));
}

export function syncAppSelectionSearch(selection: AppSelectionState) {
  if (typeof window === 'undefined') {
    return;
  }

  const nextSearch = buildAppSelectionSearch(window.location.search, selection);
  if (nextSearch !== window.location.search) {
    window.history.replaceState({}, '', `${window.location.pathname}${nextSearch}${window.location.hash}`);
  }
}
