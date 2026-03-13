import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { BrowserDependencyDirection, BrowserTreeMode } from '../browserSnapshotIndex';
import type { FullSnapshotPayload } from '../appModel';
import {
  type BrowserFactsPanelLocation,
  type BrowserFactsPanelMode,
  type BrowserFocusedElement,
  type BrowserSessionState,
  addDependenciesToCanvas,
  addEntityToCanvas,
  addEntitiesToCanvas,
  addPrimaryEntitiesForScope,
  addScopeToCanvas,
  clearCanvas,
  focusBrowserElement,
  hydrateBrowserSessionState,
  isolateCanvasSelection,
  openFactsPanel,
  openSnapshotSession,
  persistBrowserSession,
  readPersistedBrowserSession,
  relayoutCanvas,
  removeCanvasSelection,
  removeEntityFromCanvas,
  requestFitCanvasView,
  selectBrowserScope,
  setBrowserTreeMode,
  selectCanvasEntity,
  setBrowserSearch,
  toggleCanvasNodePin,
} from '../browserSessionStore';

export type OpenBrowserSessionOptions = {
  workspaceId: string;
  repositoryId: string | null;
  payload: FullSnapshotPayload;
  preparedAt?: string;
  keepViewState?: boolean;
};

export type BrowserSessionContextValue = {
  state: BrowserSessionState;
  openSnapshotSession: (options: OpenBrowserSessionOptions) => void;
  selectScope: (scopeId: string | null) => void;
  setSearch: (query: string, scopeId?: string | null) => void;
  addScopeToCanvas: (scopeId: string) => void;
  addEntityToCanvas: (entityId: string) => void;
  addEntitiesToCanvas: (entityIds: string[]) => void;
  addPrimaryEntitiesForScope: (scopeId: string) => void;
  selectCanvasEntity: (entityId: string, additive?: boolean) => void;
  addDependenciesToCanvas: (entityId: string, direction?: BrowserDependencyDirection) => void;
  removeEntityFromCanvas: (entityId: string) => void;
  focusElement: (focusedElement: BrowserFocusedElement) => void;
  openFactsPanel: (mode: BrowserFactsPanelMode, location?: BrowserFactsPanelLocation) => void;
  isolateCanvasSelection: () => void;
  removeCanvasSelection: () => void;
  toggleCanvasNodePin: (node: { kind: 'scope' | 'entity'; id: string }) => void;
  relayoutCanvas: () => void;
  clearCanvas: () => void;
  fitCanvasView: () => void;
  setTreeMode: (treeMode: BrowserTreeMode) => void;
};

const BrowserSessionContext = createContext<BrowserSessionContextValue | null>(null);

export function BrowserSessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BrowserSessionState>(() => hydrateBrowserSessionState(readPersistedBrowserSession()));

  useEffect(() => {
    persistBrowserSession(state);
  }, [state]);

  const value = useMemo<BrowserSessionContextValue>(() => ({
    state,
    openSnapshotSession: (options) => setState((current) => openSnapshotSession(current, options)),
    selectScope: (scopeId) => setState((current) => selectBrowserScope(current, scopeId)),
    setSearch: (query, scopeId) => setState((current) => setBrowserSearch(current, query, scopeId)),
    addScopeToCanvas: (scopeId) => setState((current) => addScopeToCanvas(current, scopeId)),
    addEntityToCanvas: (entityId) => setState((current) => addEntityToCanvas(current, entityId)),
    addEntitiesToCanvas: (entityIds) => setState((current) => addEntitiesToCanvas(current, entityIds)),
    addPrimaryEntitiesForScope: (scopeId) => setState((current) => addPrimaryEntitiesForScope(current, scopeId)),
    selectCanvasEntity: (entityId, additive) => setState((current) => selectCanvasEntity(current, entityId, additive)),
    addDependenciesToCanvas: (entityId, direction) => setState((current) => addDependenciesToCanvas(current, entityId, direction)),
    removeEntityFromCanvas: (entityId) => setState((current) => removeEntityFromCanvas(current, entityId)),
    focusElement: (focusedElement) => setState((current) => focusBrowserElement(current, focusedElement)),
    openFactsPanel: (mode, location) => setState((current) => openFactsPanel(current, mode, location)),
    isolateCanvasSelection: () => setState((current) => isolateCanvasSelection(current)),
    removeCanvasSelection: () => setState((current) => removeCanvasSelection(current)),
    toggleCanvasNodePin: (node) => setState((current) => toggleCanvasNodePin(current, node)),
    relayoutCanvas: () => setState((current) => relayoutCanvas(current)),
    clearCanvas: () => setState((current) => clearCanvas(current)),
    fitCanvasView: () => setState((current) => requestFitCanvasView(current)),
    setTreeMode: (treeMode) => setState((current) => setBrowserTreeMode(current, treeMode)),
  }), [state]);

  return <BrowserSessionContext.Provider value={value}>{children}</BrowserSessionContext.Provider>;
}

export function useBrowserSession() {
  const context = useContext(BrowserSessionContext);
  if (!context) {
    throw new Error('useBrowserSession must be used within a BrowserSessionProvider');
  }
  return context;
}
