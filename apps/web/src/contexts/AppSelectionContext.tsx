import { createContext, useCallback, useContext, useEffect, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import {
  buildAppSelectionSearch,
  emptyAppSelectionState,
  mergeAppSelectionState,
  parseAppSelectionSearch,
  type AppSelectionState,
} from '../routing/appSelectionState';

const STORAGE_KEY = 'architecture-browser-platform.app-selection.v1';

type AppSelectionContextValue = AppSelectionState & {
  setSelectedWorkspaceId: Dispatch<SetStateAction<string | null>>;
  setSelectedRepositoryId: Dispatch<SetStateAction<string | null>>;
  setSelectedSnapshotId: Dispatch<SetStateAction<string | null>>;
  resetSelections: () => void;
};

const AppSelectionContext = createContext<AppSelectionContextValue | null>(null);

function readPersistedSelection(): Partial<AppSelectionState> {
  if (typeof window === 'undefined') {
    return emptyAppSelectionState;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return emptyAppSelectionState;
    }
    return JSON.parse(raw) as Partial<AppSelectionState>;
  } catch {
    return emptyAppSelectionState;
  }
}

function readInitialSelection(): AppSelectionState {
  if (typeof window === 'undefined') {
    return emptyAppSelectionState;
  }

  return mergeAppSelectionState(
    readPersistedSelection(),
    parseAppSelectionSearch(window.location.search),
  );
}

export function AppSelectionProvider({ children }: { children: ReactNode }) {
  const [selection, setSelection] = useState<AppSelectionState>(() => readInitialSelection());

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(selection));
    const nextSearch = buildAppSelectionSearch(window.location.search, selection);
    if (nextSearch !== window.location.search) {
      window.history.replaceState({}, '', `${window.location.pathname}${nextSearch}${window.location.hash}`);
    }
  }, [selection]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handlePopState = () => {
      setSelection((current) => mergeAppSelectionState(current, parseAppSelectionSearch(window.location.search)));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const resetSelections = useCallback(() => {
    setSelection(emptyAppSelectionState);
  }, []);

  const value = useMemo<AppSelectionContextValue>(() => ({
    ...selection,
    setSelectedWorkspaceId: (nextValue) => {
      setSelection((current) => {
        const resolvedWorkspaceId = typeof nextValue === 'function' ? nextValue(current.selectedWorkspaceId) : nextValue;
        if (resolvedWorkspaceId === current.selectedWorkspaceId) {
          return current;
        }
        return {
          selectedWorkspaceId: resolvedWorkspaceId,
          selectedRepositoryId: null,
          selectedSnapshotId: null,
        };
      });
    },
    setSelectedRepositoryId: (nextValue) => {
      setSelection((current) => ({
        ...current,
        selectedRepositoryId: typeof nextValue === 'function' ? nextValue(current.selectedRepositoryId) : nextValue,
      }));
    },
    setSelectedSnapshotId: (nextValue) => {
      setSelection((current) => ({
        ...current,
        selectedSnapshotId: typeof nextValue === 'function' ? nextValue(current.selectedSnapshotId) : nextValue,
      }));
    },
    resetSelections,
  }), [resetSelections, selection]);

  return <AppSelectionContext.Provider value={value}>{children}</AppSelectionContext.Provider>;
}

export function useAppSelectionContext() {
  const context = useContext(AppSelectionContext);
  if (!context) {
    throw new Error('useAppSelectionContext must be used within an AppSelectionProvider');
  }
  return context;
}
