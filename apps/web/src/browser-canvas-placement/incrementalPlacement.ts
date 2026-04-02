import type { FullSnapshotEntity } from '../app-model';
import type { BrowserSnapshotIndex } from '../browserSnapshotIndex';
import type { BrowserCanvasNode } from '../browserSessionStore';
import type {
  BrowserCanvasPlacement,
  BrowserCanvasPlacementOptions,
} from './types';
import {
  planEntityIncrementalPlacement,
  type BrowserIncrementalPlacementOptions,
} from './incrementalPlacementPhases';
import { placeAppendedCanvasNode, placeFirstCanvasNode } from './initialPlacement';

export {
  getCanvasNodeById,
  placeCanvasNodeNearAnchor,
  placeContainedCanvasNode,
  placePeerCanvasNode,
} from './incrementalPlacementStrategies';

export function planEntityInsertion(
  nodes: BrowserCanvasNode[],
  index: BrowserSnapshotIndex,
  entity: FullSnapshotEntity,
  insertionOptions?: BrowserIncrementalPlacementOptions,
  layoutOptions?: BrowserCanvasPlacementOptions,
): BrowserCanvasPlacement {
  return planEntityIncrementalPlacement(nodes, index, entity, insertionOptions, layoutOptions);
}

export function planScopeInsertion(
  nodes: BrowserCanvasNode[],
  _scopeId: string,
  insertionIndex = 0,
): BrowserCanvasPlacement {
  if (nodes.length === 0) {
    return placeFirstCanvasNode('scope');
  }
  return placeAppendedCanvasNode(nodes, 'scope', insertionIndex);
}
