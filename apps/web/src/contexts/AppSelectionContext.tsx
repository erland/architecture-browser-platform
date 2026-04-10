import { createContext, useCallback, useContext, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { type AppSelectionState } from '../routing/appSelectionState';
import {
  APP_SELECTION_STORAGE_KEY,
  LAST_OPEN_BROWSER_SOURCE_STORAGE_KEY,
  applyRepositorySelection,
  applySnapshotSelection,
  applyWorkspaceSelection,
  buildLastOpenedBrowserSourceSelection,
  emptySelection,
  resolveInitialSelection,
} from './app-selection/appSelectionPolicy';
import { readInitialSelection } from './app-selection/appSelectionStorage';
import { useAppSelectionLocationSync } from './app-selection/useAppSelectionLocationSync';
import { useAppSelectionPersistence } from './app-selection/useAppSelectionPersistence';
import { useBrowserLastOpenedSourceSync } from './app-selection/useBrowserLastOpenedSourceSync';

type AppSelectionContextValue = AppSelectionState & {
  setSelectedWorkspaceId: Dispatch<SetStateAction<string | null>>;
  setSelectedRepositoryId: Dispatch<SetStateAction<string | null>>;
  setSelectedSnapshotId: Dispatch<SetStateAction<string | null>>;
  resetSelections: () => void;
};

const AppSelectionContext = createContext<AppSelectionContextValue | null>(null);

export function AppSelectionProvider({ children }: { children: ReactNode }) {
  const [selection, setSelection] = useState<AppSelectionState>(() => readInitialSelection());

  useAppSelectionLocationSync(setSelection);
  useAppSelectionPersistence(selection);
  useBrowserLastOpenedSourceSync();

  const resetSelections = useCallback(() => {
    setSelection(emptySelection());
  }, []);

  const value = useMemo<AppSelectionContextValue>(() => ({
    ...selection,
    setSelectedWorkspaceId: (nextValue) => {
      setSelection((current) => applyWorkspaceSelection(current, nextValue));
    },
    setSelectedRepositoryId: (nextValue) => {
      setSelection((current) => applyRepositorySelection(current, nextValue));
    },
    setSelectedSnapshotId: (nextValue) => {
      setSelection((current) => applySnapshotSelection(current, nextValue));
    },
    resetSelections,
  }), [resetSelections, selection]);

  return (
    <AppSelectionContext.Provider value={value}>
      {children}
    </AppSelectionContext.Provider>
  );
}

export function useAppSelectionContext() {
  const context = useContext(AppSelectionContext);
  if (!context) {
    throw new Error('useAppSelectionContext must be used within an AppSelectionProvider');
  }
  return context;
}

export const __appSelectionContextTestExports = {
  STORAGE_KEY: APP_SELECTION_STORAGE_KEY,
  LAST_OPEN_BROWSER_SOURCE_KEY: LAST_OPEN_BROWSER_SOURCE_STORAGE_KEY,
  readInitialSelection,
  resolveInitialSelection,
  buildLastOpenedBrowserSourceSelection,
};
