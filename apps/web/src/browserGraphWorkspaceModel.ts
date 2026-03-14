import type { BrowserCanvasNode, BrowserSessionState } from './browserSessionStore';

export type BrowserWorkspaceNodeModel = {
  id: string;
  kind: 'scope' | 'entity';
  title: string;
  subtitle: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pinned: boolean;
  selected: boolean;
  focused: boolean;
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
};

type BrowserNodeFrame = {
  x: number;
  y: number;
  width: number;
  height: number;
};

function compareStrings(left: string, right: string) {
  return left.localeCompare(right, undefined, { sensitivity: 'base' });
}

function getNodeFrame(node: BrowserCanvasNode): BrowserNodeFrame {
  if (node.kind === 'scope') {
    return {
      x: node.x,
      y: node.y,
      width: 204,
      height: 82,
    };
  }
  return {
    x: node.x,
    y: node.y,
    width: 196,
    height: 84,
  };
}

function buildWorkspaceNodeModel(state: BrowserSessionState, canvasNode: BrowserCanvasNode): BrowserWorkspaceNodeModel | null {
  const index = state.index;
  if (!index) {
    return null;
  }
  const frame = getNodeFrame(canvasNode);

  if (canvasNode.kind === 'scope') {
    const scope = index.scopesById.get(canvasNode.id);
    if (!scope) {
      return null;
    }
    return {
      id: canvasNode.id,
      kind: 'scope',
      title: scope.displayName?.trim() || scope.name,
      subtitle: index.scopePathById.get(canvasNode.id) ?? scope.kind,
      ...frame,
      pinned: Boolean(canvasNode.pinned),
      selected: state.selectedScopeId === canvasNode.id,
      focused: state.focusedElement?.kind === 'scope' && state.focusedElement.id === canvasNode.id,
    };
  }

  const entity = index.entitiesById.get(canvasNode.id);
  if (!entity) {
    return null;
  }
  const scopePath = entity.scopeId ? index.scopePathById.get(entity.scopeId) : null;
  return {
    id: canvasNode.id,
    kind: 'entity',
    title: entity.displayName?.trim() || entity.name,
    subtitle: scopePath ?? entity.kind,
    ...frame,
    pinned: Boolean(canvasNode.pinned),
    selected: state.selectedEntityIds.includes(canvasNode.id),
    focused: state.focusedElement?.kind === 'entity' && state.focusedElement.id === canvasNode.id,
  };
}

function buildWorkspaceNodeModels(state: BrowserSessionState) {
  return state.canvasNodes
    .map((node) => buildWorkspaceNodeModel(state, node))
    .filter((node): node is BrowserWorkspaceNodeModel => Boolean(node))
    .sort((left, right) => {
      if (left.kind !== right.kind) {
        return left.kind === 'scope' ? -1 : 1;
      }
      if (left.y !== right.y) {
        return left.y - right.y;
      }
      if (left.x !== right.x) {
        return left.x - right.x;
      }
      return compareStrings(left.title, right.title);
    });
}

export function buildBrowserGraphWorkspaceModel(state: BrowserSessionState): BrowserGraphWorkspaceModel {
  const index = state.index;
  if (!index) {
    return { width: 1280, height: 720, nodes: [], edges: [] };
  }

  const nodes = buildWorkspaceNodeModels(state);
  const nodeFrames = new Map<string, BrowserNodeFrame>(nodes.map((node) => [node.id, {
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
  }]));

  const edges: BrowserWorkspaceEdgeModel[] = state.canvasEdges
    .map((edge) => {
      const from = nodeFrames.get(edge.fromEntityId);
      const to = nodeFrames.get(edge.toEntityId);
      const relationship = index.relationshipsById.get(edge.relationshipId);
      if (!from || !to || !relationship) {
        return null;
      }
      return {
        relationshipId: edge.relationshipId,
        fromEntityId: edge.fromEntityId,
        toEntityId: edge.toEntityId,
        label: relationship.label?.trim() || relationship.kind,
        x1: from.x + from.width,
        y1: from.y + from.height / 2,
        x2: to.x,
        y2: to.y + to.height / 2,
        focused: state.focusedElement?.kind === 'relationship' && state.focusedElement.id === edge.relationshipId,
      };
    })
    .filter((edge): edge is BrowserWorkspaceEdgeModel => Boolean(edge));

  const maxNodeRight = nodes.reduce((current, node) => Math.max(current, node.x + node.width), 0);
  const maxNodeBottom = nodes.reduce((current, node) => Math.max(current, node.y + node.height), 0);

  return {
    width: Math.max(1280, maxNodeRight + 80),
    height: Math.max(720, maxNodeBottom + 80),
    nodes,
    edges,
  };
}
