import type { FullSnapshotPayload } from '../../app-model';
import {
  type BrowserTreeMode,
  detectDefaultBrowserTreeMode,
  getOrBuildBrowserSnapshotIndex,
  getViewpointById,
} from '../../browser-snapshot';
import { syncMeaningfulCanvasEdges } from '../canvas/relationships';
import { normalizeCanvasNodes } from '../canvas/nodes';
import { createPersistedBrowserSessionState, hydrateBrowserSessionState } from '../model/state';
import { normalizeFocusedBrowserContext, normalizeSearchScopeId, recomputeBrowserSearchState } from '../navigation/invariants';
import type {
  BrowserSessionSnapshot,
  BrowserSessionState,
} from '../model/types';

export function openSnapshotSession(
  state: BrowserSessionState,
  args: {
    workspaceId: string;
    repositoryId: string | null;
    payload: FullSnapshotPayload;
    preparedAt?: string;
    keepViewState?: boolean;
  },
): BrowserSessionState {
  const index = getOrBuildBrowserSnapshotIndex(args.payload);
  const nextState = args.keepViewState ? hydrateBrowserSessionState(createPersistedBrowserSessionState(state)) : hydrateBrowserSessionState();
  const preparedAt = args.preparedAt ?? new Date().toISOString();
  const activeSnapshot: BrowserSessionSnapshot = {
    workspaceId: args.workspaceId,
    repositoryId: args.repositoryId,
    snapshotId: args.payload.snapshot.id,
    snapshotKey: args.payload.snapshot.snapshotKey,
    preparedAt,
  };
  const selectedScopeId = nextState.selectedScopeId && index.scopesById.has(nextState.selectedScopeId)
    ? nextState.selectedScopeId
    : args.payload.scopes[0]?.externalId ?? null;
  const selectedEntityIds = nextState.selectedEntityIds.filter((entityId) => index.entitiesById.has(entityId));
  const canvasNodes = normalizeCanvasNodes(nextState.canvasNodes.filter((node) => node.kind === 'scope' ? index.scopesById.has(node.id) : index.entitiesById.has(node.id)));
  const persistedCanvasEdges = nextState.canvasEdges.filter((edge) => index.relationshipsById.has(edge.relationshipId));
  const searchScopeId = normalizeSearchScopeId({ ...nextState, index }, nextState.searchScopeId);
  const canvasEdges = syncMeaningfulCanvasEdges({
    ...nextState,
    payload: args.payload,
    index,
    selectedEntityIds,
    searchScopeId,
    canvasNodes,
    canvasEdges: persistedCanvasEdges,
  }, canvasNodes);
  const treeMode: BrowserTreeMode = args.keepViewState ? nextState.treeMode : detectDefaultBrowserTreeMode(index);
  const selectedViewpointId = nextState.viewpointSelection.viewpointId && getViewpointById(index, nextState.viewpointSelection.viewpointId)
    ? nextState.viewpointSelection.viewpointId
    : null;

  const reopenedState: BrowserSessionState = {
    ...nextState,
    activeSnapshot,
    payload: args.payload,
    index,
    selectedScopeId,
    canvasNodes,
    canvasEdges,
    viewpointSelection: {
      ...nextState.viewpointSelection,
      viewpointId: selectedViewpointId,
    },
    appliedViewpoint: null,
    treeMode,
    canvasViewport: nextState.canvasViewport,
  };

  return {
    ...reopenedState,
    ...normalizeFocusedBrowserContext(reopenedState, {
      selectedEntityIds,
      canvasEdges,
      fallbackScopeId: selectedScopeId,
    }),
    ...recomputeBrowserSearchState(reopenedState, {
      query: reopenedState.searchQuery,
      searchScopeId,
    }),
  };
}
