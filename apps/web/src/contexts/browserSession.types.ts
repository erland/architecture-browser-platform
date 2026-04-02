import type { BrowserAutoLayoutMode } from '../browser-auto-layout';
import type { BrowserDependencyDirection, BrowserTreeMode, BrowserViewpointScopeMode, BrowserViewpointVariant } from '../browser-snapshot';
import type { FullSnapshotPayload } from '../app-model';
import type {
  BrowserCanvasViewport,
  BrowserFactsPanelLocation,
  BrowserFactsPanelMode,
  BrowserFocusedElement,
  BrowserSessionState,
  BrowserViewpointApplyMode,
  BrowserViewpointPresentationPreference,
} from '../browser-session';

export type OpenBrowserSessionOptions = {
  workspaceId: string;
  repositoryId: string | null;
  payload: FullSnapshotPayload;
  preparedAt?: string;
  keepViewState?: boolean;
};

export type BrowserSessionActionGroups = {
  lifecycle: {
    openSnapshotSession: (options: OpenBrowserSessionOptions) => void;
    replaceState: (state: BrowserSessionState) => void;
  };
  navigation: {
    selectScope: (scopeId: string | null) => void;
    setSearch: (query: string, scopeId?: string | null) => void;
    setTreeMode: (treeMode: BrowserTreeMode) => void;
  };
  viewpoint: {
    setSelectedViewpoint: (viewpointId: string | null) => void;
    setScopeMode: (scopeMode: BrowserViewpointScopeMode) => void;
    setApplyMode: (applyMode: BrowserViewpointApplyMode) => void;
    setVariant: (variant: BrowserViewpointVariant) => void;
    setPresentationPreference: (preference: BrowserViewpointPresentationPreference) => void;
    applySelectedViewpoint: () => void;
  };
  canvas: {
    addScopeToCanvas: (scopeId: string) => void;
    addEntityToCanvas: (entityId: string) => void;
    addEntitiesToCanvas: (entityIds: string[]) => void;
    addPrimaryEntitiesForScope: (scopeId: string) => void;
    selectEntity: (entityId: string, additive?: boolean) => void;
    addDependenciesToCanvas: (entityId: string, direction?: BrowserDependencyDirection) => void;
    removeEntityFromCanvas: (entityId: string) => void;
    isolateSelection: () => void;
    removeSelection: () => void;
    toggleNodePin: (node: { kind: 'scope' | 'entity'; id: string }) => void;
    moveNode: (node: { kind: 'scope' | 'entity'; id: string }, position: { x: number; y: number }) => void;
    reconcileNodePositions: (updates: Array<{ kind: 'scope' | 'entity'; id: string; x?: number; y?: number }>) => void;
    setViewport: (viewport: Partial<BrowserCanvasViewport>) => void;
    panViewport: (delta: { x: number; y: number }) => void;
    arrangeAllNodes: () => void;
    arrangeWithMode: (mode: BrowserAutoLayoutMode) => void;
    arrangeAroundFocus: () => void;
    relayout: () => void;
    clear: () => void;
    fitView: () => void;
  };
  factsPanel: {
    focusElement: (focusedElement: BrowserFocusedElement) => void;
    open: (mode: BrowserFactsPanelMode, location?: BrowserFactsPanelLocation) => void;
  };
};

export type BrowserSessionContextValue = {
  state: BrowserSessionState;
} & BrowserSessionActionGroups;
