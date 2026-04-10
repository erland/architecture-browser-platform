import type { FullSnapshotEntity, FullSnapshotRelationship } from '../app-model';
import type { BrowserAutoLayoutGraph } from '../browser-auto-layout/stage';
import type { BrowserSnapshotIndex } from '../browser-snapshot';
import type { BrowserCanvasNode } from '../browser-graph/contracts';
import type { BrowserCanvasPlacementOptions } from './types';
import { createIncrementalPlacementContext } from './incrementalPlacementContextBuilder';
import { executeIncrementalPlacementPlan, resolveIncrementalPlacementPlan } from './incrementalPlacementPlanner';

export type InsertionDirection = 'around' | 'left' | 'right';

export type BrowserIncrementalPlacementOptions = {
  anchorEntityId?: string | null;
  anchorDirection?: InsertionDirection;
  selectedScopeId?: string | null;
  insertionIndex?: number;
  insertionCount?: number;
};

export type BrowserIncrementalPlacementContext = {
  nodes: BrowserCanvasNode[];
  index: BrowserSnapshotIndex;
  entity: FullSnapshotEntity;
  insertionIndex: number;
  insertionCount: number;
  requestedAnchorEntityId: string | null;
  requestedAnchorDirection: InsertionDirection | null;
  selectedScopeId: string | null;
  layoutOptions?: BrowserCanvasPlacementOptions;
  visibleEntityIds: Set<string>;
  relevantRelationships: FullSnapshotRelationship[];
  graph: BrowserAutoLayoutGraph | null;
};

export { createIncrementalPlacementContext } from './incrementalPlacementContextBuilder';
export {
  executeIncrementalPlacementPlan,
  resolveExplicitAnchorPlan,
  resolveGraphAwareAnchorPlan,
  resolveIncrementalPlacementPlan,
  resolvePeerAwarePlan,
  resolveScopeAwarePlan,
} from './incrementalPlacementPlanner';
export {
  chooseGraphAnchorCandidate,
  compareGraphAnchorCandidates,
  resolveInsertionDirection,
} from './incrementalPlacementGraphAnchorPolicy';

export function planEntityIncrementalPlacement(
  nodes: BrowserCanvasNode[],
  index: BrowserSnapshotIndex,
  entity: FullSnapshotEntity,
  insertionOptions?: BrowserIncrementalPlacementOptions,
  layoutOptions?: BrowserCanvasPlacementOptions,
) {
  const context = createIncrementalPlacementContext(nodes, index, entity, insertionOptions, layoutOptions);
  const plan = resolveIncrementalPlacementPlan(context);
  return executeIncrementalPlacementPlan(context, plan);
}
