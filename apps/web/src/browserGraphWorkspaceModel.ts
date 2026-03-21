import { buildBrowserProjectionModel, type BrowserProjectionCompartment } from './browserProjectionModel';
import type { BrowserSessionState } from './browserSessionStore';

export type BrowserWorkspaceNodeModel = {
  id: string;
  kind: 'scope' | 'entity' | 'uml-class';
  badgeLabel: string;
  title: string;
  subtitle: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pinned: boolean;
  selected: boolean;
  focused: boolean;
  memberEntityIds: string[];
  compartments: BrowserProjectionCompartment[];
};

export type BrowserWorkspaceEdgeModel = {
  relationshipId: string;
  fromEntityId: string;
  toEntityId: string;
  label: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  focused: boolean;
};

export type BrowserGraphWorkspaceModel = {
  width: number;
  height: number;
  nodes: BrowserWorkspaceNodeModel[];
  edges: BrowserWorkspaceEdgeModel[];
  presentationMode: 'entity-graph' | 'compact-uml';
  suppressedEntityIds: string[];
};

export function buildBrowserGraphWorkspaceModel(state: BrowserSessionState): BrowserGraphWorkspaceModel {
  const projection = buildBrowserProjectionModel(state);
  const nodeFrames = new Map<string, { x: number; y: number; width: number; height: number }>(
    projection.nodes.map((node) => [node.id, {
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height,
    }]),
  );

  return {
    width: projection.width,
    height: projection.height,
    presentationMode: projection.presentationPolicy.mode,
    suppressedEntityIds: projection.suppressedEntityIds,
    nodes: projection.nodes.map((node) => ({
      id: node.source.id,
      kind: node.kind,
      badgeLabel: node.badgeLabel,
      title: node.title,
      subtitle: node.subtitle,
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height,
      pinned: node.pinned,
      selected: node.selected,
      focused: node.focused,
      memberEntityIds: node.memberEntityIds,
      compartments: node.compartments,
    })),
    edges: projection.edges
      .map((edge) => {
        const from = nodeFrames.get(edge.fromNodeId);
        const to = nodeFrames.get(edge.toNodeId);
        if (!from || !to) {
          return null;
        }
        return {
          relationshipId: edge.relationshipId,
          fromEntityId: edge.fromEntityId,
          toEntityId: edge.toEntityId,
          label: edge.label,
          x1: from.x + from.width,
          y1: from.y + from.height / 2,
          x2: to.x,
          y2: to.y + to.height / 2,
          focused: edge.focused,
        };
      })
      .filter((edge): edge is BrowserWorkspaceEdgeModel => Boolean(edge)),
  };
}
