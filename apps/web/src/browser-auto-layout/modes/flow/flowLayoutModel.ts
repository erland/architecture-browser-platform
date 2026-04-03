import type {
  BrowserAutoLayoutEdge,
  BrowserAutoLayoutGraph,
  BrowserAutoLayoutNode,
} from '../../core/types';
import { buildUndirectedAdjacency, compareNodePriority, sortBandNodesByBarycenter } from '../../shared/ordering';
import { groupNodesByLevel } from '../../shared/layoutLevels';
import { assignFlowLevels } from './flowLayoutSemantics';

export type FlowBand = {
  level: number;
  nodes: BrowserAutoLayoutNode[];
};

export function buildFlowBands(
  componentNodes: BrowserAutoLayoutNode[],
  edges: BrowserAutoLayoutEdge[],
  graph: BrowserAutoLayoutGraph,
): FlowBand[] {
  const levels = assignFlowLevels(componentNodes, edges, graph);
  const adjacency = buildUndirectedAdjacency(componentNodes, edges);
  const grouped = groupNodesByLevel(componentNodes, levels);

  const fixedOrder = new Map<string, number>();
  return [...grouped.entries()]
    .sort((left, right) => left[0] - right[0])
    .map(([level, nodes]) => {
      const orderedNodes = level === 0
        ? [...nodes].sort((left, right) => compareNodePriority(left, right))
        : sortBandNodesByBarycenter(nodes, adjacency, fixedOrder, compareNodePriority);
      orderedNodes.forEach((node, index) => fixedOrder.set(node.id, index));
      return { level, nodes: orderedNodes };
    });
}
