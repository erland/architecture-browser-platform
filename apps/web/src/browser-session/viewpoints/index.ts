import type { FullSnapshotViewpoint } from '../../app-model';
import { getViewpointById } from '../../browser-snapshot';
import type {
  BrowserSessionState,
  BrowserViewpointApplyMode,
  BrowserViewpointPresentationPreference,
  BrowserViewpointSelection,
} from '../model/types';
import {
  createCanvasEdgesForRelationshipIds,
  upsertCanvasEdge,
  upsertCanvasNode,
} from '../canvas/nodes';
import {
  arrangeViewpointCanvasNodes,
  buildAppliedViewpointGraph,
  buildAppliedViewpointGraphWithFallback,
} from './helpers';
import { planEntityInsertion } from '../../browser-canvas-placement';
import type { BrowserViewpointScopeMode, BrowserViewpointVariant } from '../../browser-snapshot';

function updateAppliedViewpoint(
  state: BrowserSessionState,
  selection: BrowserViewpointSelection = state.viewpointSelection,
  viewpointId: string | null = selection.viewpointId,
): BrowserSessionState {
  const viewpoint = viewpointId && state.index ? getViewpointById(state.index, viewpointId) : null;
  return {
    ...state,
    appliedViewpoint: viewpoint ? buildAppliedViewpointGraph(state, viewpoint, selection) : null,
  };
}

export function setSelectedViewpoint(state: BrowserSessionState, viewpointId: string | null): BrowserSessionState {
  const normalizedViewpointId = viewpointId && state.index?.viewpointsById.has(viewpointId) ? viewpointId : null;
  const nextState: BrowserSessionState = {
    ...state,
    viewpointSelection: {
      ...state.viewpointSelection,
      viewpointId: normalizedViewpointId,
    },
  };
  return updateAppliedViewpoint(nextState, nextState.viewpointSelection, normalizedViewpointId);
}

export function setViewpointScopeMode(state: BrowserSessionState, scopeMode: BrowserViewpointScopeMode): BrowserSessionState {
  const nextState: BrowserSessionState = {
    ...state,
    viewpointSelection: {
      ...state.viewpointSelection,
      scopeMode,
    },
  };
  return updateAppliedViewpoint(nextState);
}

export function setViewpointPresentationPreference(
  state: BrowserSessionState,
  preference: BrowserViewpointPresentationPreference,
): BrowserSessionState {
  return {
    ...state,
    viewpointPresentationPreference: preference,
  };
}

export function setViewpointApplyMode(state: BrowserSessionState, applyMode: BrowserViewpointApplyMode): BrowserSessionState {
  return {
    ...state,
    viewpointSelection: {
      ...state.viewpointSelection,
      applyMode,
    },
  };
}

export function setViewpointVariant(state: BrowserSessionState, variant: BrowserViewpointVariant): BrowserSessionState {
  const nextState: BrowserSessionState = {
    ...state,
    viewpointSelection: {
      ...state.viewpointSelection,
      variant,
    },
  };
  return updateAppliedViewpoint(nextState);
}

export function applySelectedViewpoint(state: BrowserSessionState): BrowserSessionState {
  if (!state.index || !state.viewpointSelection.viewpointId) {
    return state;
  }
  const viewpoint: FullSnapshotViewpoint | null = getViewpointById(state.index, state.viewpointSelection.viewpointId);
  if (!viewpoint || viewpoint.availability === 'unavailable') {
    return state;
  }
  const graph = buildAppliedViewpointGraphWithFallback(state, viewpoint, state.viewpointSelection);
  if (!graph || graph.entityIds.length === 0) {
    return {
      ...state,
      appliedViewpoint: graph,
    };
  }

  let canvasNodes = state.viewpointSelection.applyMode === 'replace'
    ? state.canvasNodes.filter((node) => node.kind === 'scope')
    : [...state.canvasNodes];
  for (const [index, entityId] of graph.entityIds.entries()) {
    const entity = state.index.entitiesById.get(entityId);
    if (!entity) {
      continue;
    }
    canvasNodes = upsertCanvasNode(
      canvasNodes,
      { kind: 'entity', id: entityId, pinned: graph.seedEntityIds.includes(entityId) },
      planEntityInsertion(canvasNodes, state.index, entity, {
        anchorEntityId: graph.seedEntityIds[0] ?? null,
        selectedScopeId: state.selectedScopeId,
        insertionIndex: index,
        insertionCount: graph.entityIds.length,
      }, { state }),
    );
  }
  const canvasEdges = state.viewpointSelection.applyMode === 'replace'
    ? createCanvasEdgesForRelationshipIds(state.index, graph.relationshipIds)
    : graph.relationshipIds.reduce((edges, relationshipId) => {
        const relationship = state.index?.relationshipsById.get(relationshipId);
        if (!relationship) {
          return edges;
        }
        return upsertCanvasEdge(edges, {
          relationshipId,
          fromEntityId: relationship.fromEntityId,
          toEntityId: relationship.toEntityId,
        });
      }, [...state.canvasEdges]);

  const arrangedNodes = arrangeViewpointCanvasNodes(state, canvasNodes, canvasEdges, graph);
  return {
    ...state,
    canvasNodes: arrangedNodes,
    canvasEdges,
    selectedEntityIds: [...(graph.seedEntityIds.length > 0 ? graph.seedEntityIds : graph.entityIds)],
    focusedElement: graph.seedEntityIds[0] ? { kind: 'entity', id: graph.seedEntityIds[0] } : state.focusedElement,
    factsPanelMode: graph.seedEntityIds[0] ? 'entity' : state.factsPanelMode,
    appliedViewpoint: graph,
    canvasLayoutMode: graph.entityIds.length > 0 ? 'radial' : 'grid',
    fitViewRequestedAt: new Date().toISOString(),
    routeRefreshRequestedAt: new Date().toISOString(),
  };
}
