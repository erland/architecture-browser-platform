import type { FullSnapshotEntity, FullSnapshotRelationship } from '../app-model';
import {
  createBrowserAutoLayoutPipelineContext,
  type BrowserAutoLayoutGraph,
} from '../browser-auto-layout/stage';
import type { BrowserSnapshotIndex } from '../browser-snapshot';
import type { BrowserCanvasNode, BrowserGraphPlacementState } from '../browser-graph/contracts';
import { syncMeaningfulCanvasEdges } from '../browser-graph/semantics';
import type { BrowserCanvasPlacementOptions } from './types';
import type {
  BrowserIncrementalPlacementContext,
  BrowserIncrementalPlacementOptions,
} from './incrementalPlacementPhases';

export function compareInsertionRelationships(left: FullSnapshotRelationship, right: FullSnapshotRelationship) {
  return left.externalId.localeCompare(right.externalId);
}

export function getVisibleInsertionRelationships(index: BrowserSnapshotIndex, visibleEntityIds: Set<string>) {
  return [...index.relationshipsById.values()]
    .filter((relationship) => visibleEntityIds.has(relationship.fromEntityId) && visibleEntityIds.has(relationship.toEntityId))
    .sort(compareInsertionRelationships);
}

function buildSyntheticInsertionState(
  state: BrowserGraphPlacementState,
  nodes: BrowserCanvasNode[],
  entityId: string,
) {
  const syntheticNodes = [...nodes, { kind: 'entity' as const, id: entityId, x: 0, y: 0 }];
  const syntheticState = {
    ...state,
    canvasNodes: syntheticNodes,
    canvasEdges: syncMeaningfulCanvasEdges({ ...state, canvasNodes: syntheticNodes }, syntheticNodes),
  };
  return { syntheticNodes, syntheticState };
}

function buildIncrementalPlacementGraph(
  nodes: BrowserCanvasNode[],
  entityId: string,
  layoutOptions?: BrowserCanvasPlacementOptions,
): BrowserAutoLayoutGraph | null {
  if (!layoutOptions?.state) {
    return null;
  }
  const { syntheticNodes, syntheticState } = buildSyntheticInsertionState(layoutOptions.state, nodes, entityId);
  return createBrowserAutoLayoutPipelineContext({
    mode: 'structure',
    nodes: syntheticNodes,
    edges: syntheticState.canvasEdges,
    options: layoutOptions,
    state: syntheticState,
  }).graph;
}

export function createIncrementalPlacementContext(
  nodes: BrowserCanvasNode[],
  index: BrowserSnapshotIndex,
  entity: FullSnapshotEntity,
  insertionOptions?: BrowserIncrementalPlacementOptions,
  layoutOptions?: BrowserCanvasPlacementOptions,
): BrowserIncrementalPlacementContext {
  const visibleEntityIds = new Set(
    nodes
      .filter((node) => node.kind === 'entity')
      .map((node) => node.id),
  );
  visibleEntityIds.add(entity.externalId);

  const relevantRelationships = getVisibleInsertionRelationships(index, visibleEntityIds)
    .filter((relationship) => relationship.fromEntityId === entity.externalId || relationship.toEntityId === entity.externalId);

  return {
    nodes,
    index,
    entity,
    insertionIndex: insertionOptions?.insertionIndex ?? 0,
    insertionCount: insertionOptions?.insertionCount ?? 1,
    requestedAnchorEntityId: insertionOptions?.anchorEntityId ?? null,
    requestedAnchorDirection: insertionOptions?.anchorDirection ?? null,
    selectedScopeId: insertionOptions?.selectedScopeId ?? null,
    layoutOptions,
    visibleEntityIds,
    relevantRelationships,
    graph: buildIncrementalPlacementGraph(nodes, entity.externalId, layoutOptions),
  };
}
