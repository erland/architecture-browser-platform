import type { BrowserSessionState } from './browserSessionStore';

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

function compareStrings(left: string, right: string) {
  return left.localeCompare(right, undefined, { sensitivity: 'base' });
}

function buildScopeNodes(state: BrowserSessionState) {
  const index = state.index;
  if (!index) {
    return [];
  }
  return state.canvasNodes
    .filter((node) => node.kind === 'scope')
    .map((node) => {
      const scope = index.scopesById.get(node.id);
      if (!scope) {
        return null;
      }
      return {
        id: node.id,
        kind: 'scope' as const,
        title: scope.displayName?.trim() || scope.name,
        subtitle: index.scopePathById.get(node.id) ?? scope.kind,
        pinned: Boolean(node.pinned),
      };
    })
    .filter((node): node is NonNullable<typeof node> => Boolean(node))
    .sort((left, right) => compareStrings(left.subtitle, right.subtitle));
}

function buildEntityNodes(state: BrowserSessionState) {
  const index = state.index;
  if (!index) {
    return [];
  }
  const edgeDegreeByEntityId = new Map<string, number>();
  for (const edge of state.canvasEdges) {
    edgeDegreeByEntityId.set(edge.fromEntityId, (edgeDegreeByEntityId.get(edge.fromEntityId) ?? 0) + 1);
    edgeDegreeByEntityId.set(edge.toEntityId, (edgeDegreeByEntityId.get(edge.toEntityId) ?? 0) + 1);
  }

  return state.canvasNodes
    .filter((node) => node.kind === 'entity')
    .map((node) => {
      const entity = index.entitiesById.get(node.id);
      if (!entity) {
        return null;
      }
      const scopePath = entity.scopeId ? index.scopePathById.get(entity.scopeId) : null;
      return {
        id: node.id,
        kind: 'entity' as const,
        title: entity.displayName?.trim() || entity.name,
        subtitle: scopePath ?? entity.kind,
        pinned: Boolean(node.pinned),
        degree: edgeDegreeByEntityId.get(node.id) ?? 0,
        score: state.focusedElement?.kind === 'entity' && state.focusedElement.id === node.id ? 1000 : 0,
      };
    })
    .filter((node): node is NonNullable<typeof node> => Boolean(node))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      if (right.degree !== left.degree) {
        return right.degree - left.degree;
      }
      return compareStrings(left.title, right.title);
    });
}

function buildGridLayout(state: BrowserSessionState, scopeNodes: ReturnType<typeof buildScopeNodes>, entityNodes: ReturnType<typeof buildEntityNodes>) {
  const nodes: BrowserWorkspaceNodeModel[] = [];
  const nodePositions = new Map<string, { x: number; y: number; width: number; height: number }>();
  const scopeColumnX = 56;
  const entityBaseX = scopeNodes.length > 0 ? 344 : 72;

  scopeNodes.forEach((node, indexPosition) => {
    const x = scopeColumnX;
    const y = 72 + indexPosition * 132;
    const width = 228;
    const height = 96;
    nodes.push({
      ...node,
      x,
      y,
      width,
      height,
      selected: state.selectedScopeId === node.id,
      focused: state.focusedElement?.kind === 'scope' && state.focusedElement.id === node.id,
    });
    nodePositions.set(node.id, { x, y, width, height });
  });

  entityNodes.forEach((node, indexPosition) => {
    const pinned = node.pinned;
    const column = pinned ? 0 : indexPosition % 3;
    const row = pinned ? Math.floor(indexPosition / 1) : Math.floor(indexPosition / 3);
    const x = pinned ? entityBaseX : entityBaseX + column * 268;
    const y = pinned ? 72 + row * 132 : 72 + row * 152;
    const width = 236;
    const height = 108;
    nodes.push({
      ...node,
      x,
      y,
      width,
      height,
      selected: state.selectedEntityIds.includes(node.id),
      focused: state.focusedElement?.kind === 'entity' && state.focusedElement.id === node.id,
    });
    nodePositions.set(node.id, { x, y, width, height });
  });

  return { nodes, nodePositions };
}

function buildRadialLayout(state: BrowserSessionState, scopeNodes: ReturnType<typeof buildScopeNodes>, entityNodes: ReturnType<typeof buildEntityNodes>) {
  const nodes: BrowserWorkspaceNodeModel[] = [];
  const nodePositions = new Map<string, { x: number; y: number; width: number; height: number }>();
  const centerX = 620;
  const centerY = 320;

  scopeNodes.forEach((node, indexPosition) => {
    const x = 40;
    const y = 56 + indexPosition * 116;
    const width = 220;
    const height = 92;
    nodes.push({
      ...node,
      x,
      y,
      width,
      height,
      selected: state.selectedScopeId === node.id,
      focused: state.focusedElement?.kind === 'scope' && state.focusedElement.id === node.id,
    });
    nodePositions.set(node.id, { x, y, width, height });
  });

  const focusIndex = entityNodes.findIndex((node) => state.focusedElement?.kind === 'entity' && state.focusedElement.id === node.id);
  const ordered = focusIndex > 0
    ? [entityNodes[focusIndex], ...entityNodes.slice(0, focusIndex), ...entityNodes.slice(focusIndex + 1)]
    : entityNodes;
  const centerNode = ordered[0] ?? null;

  ordered.forEach((node, indexPosition) => {
    const width = 236;
    const height = 108;
    let x = centerX;
    let y = centerY;
    if (indexPosition > 0) {
      const angle = ((indexPosition - 1) / Math.max(1, ordered.length - 1)) * Math.PI * 2;
      const radius = node.pinned ? 170 : 250;
      x = centerX + Math.cos(angle) * radius;
      y = centerY + Math.sin(angle) * radius;
    }
    if (centerNode && node.id === centerNode.id) {
      x = centerX;
      y = centerY;
    }
    x = Math.max(300, x - width / 2);
    y = Math.max(40, y - height / 2);
    nodes.push({
      ...node,
      x,
      y,
      width,
      height,
      selected: state.selectedEntityIds.includes(node.id),
      focused: state.focusedElement?.kind === 'entity' && state.focusedElement.id === node.id,
    });
    nodePositions.set(node.id, { x, y, width, height });
  });

  return { nodes, nodePositions };
}

export function buildBrowserGraphWorkspaceModel(state: BrowserSessionState): BrowserGraphWorkspaceModel {
  const index = state.index;
  if (!index) {
    return { width: 1280, height: 720, nodes: [], edges: [] };
  }

  const scopeNodes = buildScopeNodes(state);
  const entityNodes = buildEntityNodes(state);
  const layout = state.canvasLayoutMode === 'radial'
    ? buildRadialLayout(state, scopeNodes, entityNodes)
    : buildGridLayout(state, scopeNodes, entityNodes);

  const edges: BrowserWorkspaceEdgeModel[] = state.canvasEdges
    .map((edge) => {
      const from = layout.nodePositions.get(edge.fromEntityId);
      const to = layout.nodePositions.get(edge.toEntityId);
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

  const maxNodeRight = layout.nodes.reduce((current, node) => Math.max(current, node.x + node.width), 0);
  const maxNodeBottom = layout.nodes.reduce((current, node) => Math.max(current, node.y + node.height), 0);

  return {
    width: Math.max(1280, maxNodeRight + 80),
    height: Math.max(720, maxNodeBottom + 80),
    nodes: layout.nodes,
    edges,
  };
}
