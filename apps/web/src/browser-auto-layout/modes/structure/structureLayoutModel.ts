import type {
  BrowserAutoLayoutEdge,
  BrowserAutoLayoutNode,
} from '../../core/types';
import { buildUndirectedAdjacency, compareNodePriority, reduceLayerCrossings, sortBandNodesByBarycenter } from '../../shared/ordering';
import { buildDirectedAdjacency } from '../../shared/layoutShared';
import { groupNodesByLevel } from '../../shared/layoutLevels';
import { assignStructureLevels } from './structureLayoutSemantics';

export type StructureBand = {
  level: number;
  nodes: BrowserAutoLayoutNode[];
};

export function buildStructureBands(
  componentNodes: BrowserAutoLayoutNode[],
  edges: BrowserAutoLayoutEdge[],
  root: BrowserAutoLayoutNode,
): StructureBand[] {
  const levels = assignStructureLevels(componentNodes, edges, root);
  const adjacency = buildUndirectedAdjacency(componentNodes, edges);
  const { outbound, inbound } = buildDirectedAdjacency(componentNodes, edges);
  const grouped = groupNodesByLevel(componentNodes, levels);

  const fixedOrder = new Map<string, number>([[root.id, 0]]);
  const initialBands = [...grouped.entries()]
    .sort((left, right) => left[0] - right[0])
    .map(([level, nodes]) => {
      const orderedNodes = level === 0
        ? [...nodes].sort(compareNodePriority)
        : sortBandNodesByBarycenter(nodes, adjacency, fixedOrder, compareNodePriority);
      orderedNodes.forEach((node, index) => fixedOrder.set(node.id, index));
      return { level, nodes: orderedNodes };
    });

  return reduceLayerCrossings(initialBands, inbound, outbound, compareNodePriority);
}
