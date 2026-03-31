import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { BrowserDependencyDirection, BrowserTreeMode, BrowserViewpointScopeMode, BrowserViewpointVariant } from '../browserSnapshotIndex';
import type { FullSnapshotPayload } from '../appModel';
import type { BrowserAutoLayoutMode } from '../browser-auto-layout';
import {
  type BrowserFactsPanelLocation,
  type BrowserFactsPanelMode,
  type BrowserFocusedElement,
  type BrowserSessionState,
  type BrowserCanvasViewport,
  type BrowserViewpointApplyMode,
  type BrowserViewpointPresentationPreference,
  addDependenciesToCanvas,
  applySelectedViewpoint,
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
  arrangeAllCanvasNodesInteractive,
  arrangeCanvasNodesInteractivelyWithMode,
  arrangeCanvasAroundFocus,
  relayoutCanvas,
  removeCanvasSelection,
  removeEntityFromCanvas,
  requestFitCanvasView,
  moveCanvasNode,
  setCanvasViewport,
  panCanvasViewport,
  selectBrowserScope,
  setBrowserTreeMode,
  selectCanvasEntity,
  setBrowserSearch,
  setSelectedViewpoint,
  setViewpointApplyMode,
  setViewpointVariant,
  setViewpointScopeMode,
  setViewpointPresentationPreference,
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
  setSelectedViewpoint: (viewpointId: string | null) => void;
  setViewpointScopeMode: (scopeMode: BrowserViewpointScopeMode) => void;
  setViewpointApplyMode: (applyMode: BrowserViewpointApplyMode) => void;
  setViewpointVariant: (variant: BrowserViewpointVariant) => void;
  setViewpointPresentationPreference: (preference: BrowserViewpointPresentationPreference) => void;
  applySelectedViewpoint: () => void;
  selectCanvasEntity: (entityId: string, additive?: boolean) => void;
  addDependenciesToCanvas: (entityId: string, direction?: BrowserDependencyDirection) => void;
  removeEntityFromCanvas: (entityId: string) => void;
  focusElement: (focusedElement: BrowserFocusedElement) => void;
  openFactsPanel: (mode: BrowserFactsPanelMode, location?: BrowserFactsPanelLocation) => void;
  isolateCanvasSelection: () => void;
  removeCanvasSelection: () => void;
  toggleCanvasNodePin: (node: { kind: 'scope' | 'entity'; id: string }) => void;
  moveCanvasNode: (node: { kind: 'scope' | 'entity'; id: string }, position: { x: number; y: number }) => void;
  setCanvasViewport: (viewport: Partial<BrowserCanvasViewport>) => void;
  panCanvasViewport: (delta: { x: number; y: number }) => void;
  arrangeAllCanvasNodes: () => void;
  arrangeCanvasWithMode: (mode: BrowserAutoLayoutMode) => void;
  arrangeCanvasAroundFocus: () => void;
  relayoutCanvas: () => void;
  clearCanvas: () => void;
  fitCanvasView: () => void;
  setTreeMode: (treeMode: BrowserTreeMode) => void;
  replaceState: (state: BrowserSessionState) => void;
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
    setSelectedViewpoint: (viewpointId) => setState((current) => setSelectedViewpoint(current, viewpointId)),
    setViewpointScopeMode: (scopeMode) => setState((current) => setViewpointScopeMode(current, scopeMode)),
    setViewpointApplyMode: (applyMode) => setState((current) => setViewpointApplyMode(current, applyMode)),
    setViewpointVariant: (variant) => setState((current) => setViewpointVariant(current, variant)),
    setViewpointPresentationPreference: (preference) => setState((current) => setViewpointPresentationPreference(current, preference)),
    applySelectedViewpoint: () => setState((current) => applySelectedViewpoint(current)),
    selectCanvasEntity: (entityId, additive) => setState((current) => selectCanvasEntity(current, entityId, additive)),
    addDependenciesToCanvas: (entityId, direction) => setState((current) => addDependenciesToCanvas(current, entityId, direction)),
    removeEntityFromCanvas: (entityId) => setState((current) => removeEntityFromCanvas(current, entityId)),
    focusElement: (focusedElement) => setState((current) => focusBrowserElement(current, focusedElement)),
    openFactsPanel: (mode, location) => setState((current) => openFactsPanel(current, mode, location)),
    isolateCanvasSelection: () => setState((current) => isolateCanvasSelection(current)),
    removeCanvasSelection: () => setState((current) => removeCanvasSelection(current)),
    toggleCanvasNodePin: (node) => setState((current) => toggleCanvasNodePin(current, node)),
    moveCanvasNode: (node, position) => setState((current) => moveCanvasNode(current, node, position)),
    setCanvasViewport: (viewport) => setState((current) => setCanvasViewport(current, viewport)),
    panCanvasViewport: (delta) => setState((current) => panCanvasViewport(current, delta)),
    arrangeAllCanvasNodes: () => setState((current) => arrangeAllCanvasNodesInteractive(current)),
    arrangeCanvasWithMode: (mode) => setState((current) => arrangeCanvasNodesInteractivelyWithMode(current, mode)),
    arrangeCanvasAroundFocus: () => setState((current) => arrangeCanvasAroundFocus(current)),
    relayoutCanvas: () => setState((current) => relayoutCanvas(current)),
    clearCanvas: () => setState((current) => clearCanvas(current)),
    fitCanvasView: () => setState((current) => requestFitCanvasView(current)),
    setTreeMode: (treeMode) => setState((current) => setBrowserTreeMode(current, treeMode)),
    replaceState: (nextState) => setState(nextState),
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
