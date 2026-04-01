import { buildDirectedAdjacency, compareIds } from './layoutShared';
import type { BrowserAutoLayoutEdge, BrowserAutoLayoutNode } from './types';

export function assignSignedLevelsFromAnchor(
  componentNodes: BrowserAutoLayoutNode[],
  componentEdges: BrowserAutoLayoutEdge[],
  anchorId: string,
) {
  const adjacency = buildDirectedAdjacency(componentNodes, componentEdges);
  const outboundLevels = new Map<string, number>([[anchorId, 0]]);
  const inboundLevels = new Map<string, number>([[anchorId, 0]]);
  const outboundQueue = [anchorId];
  const inboundQueue = [anchorId];

  while (outboundQueue.length > 0) {
    const currentId = outboundQueue.shift();
    if (!currentId) {
      continue;
    }
    const currentLevel = outboundLevels.get(currentId) ?? 0;
    for (const neighborId of [...(adjacency.outbound.get(currentId) ?? [])].sort(compareIds)) {
      const candidate = currentLevel + 1;
      const existing = outboundLevels.get(neighborId);
      if (existing === undefined || candidate < existing) {
        outboundLevels.set(neighborId, candidate);
        outboundQueue.push(neighborId);
      }
    }
  }

  while (inboundQueue.length > 0) {
    const currentId = inboundQueue.shift();
    if (!currentId) {
      continue;
    }
    const currentLevel = inboundLevels.get(currentId) ?? 0;
    for (const neighborId of [...(adjacency.inbound.get(currentId) ?? [])].sort(compareIds)) {
      const candidate = currentLevel + 1;
      const existing = inboundLevels.get(neighborId);
      if (existing === undefined || candidate < existing) {
        inboundLevels.set(neighborId, candidate);
        inboundQueue.push(neighborId);
      }
    }
  }

  const signedLevels = new Map<string, number>([[anchorId, 0]]);
  for (const node of componentNodes) {
    if (node.id === anchorId) {
      continue;
    }
    const inboundDistance = inboundLevels.get(node.id);
    const outboundDistance = outboundLevels.get(node.id);
    if (inboundDistance !== undefined && outboundDistance !== undefined) {
      signedLevels.set(node.id, outboundDistance <= inboundDistance ? outboundDistance : -inboundDistance);
      continue;
    }
    if (outboundDistance !== undefined) {
      signedLevels.set(node.id, outboundDistance);
      continue;
    }
    if (inboundDistance !== undefined) {
      signedLevels.set(node.id, -inboundDistance);
    }
  }
  return signedLevels;
}
