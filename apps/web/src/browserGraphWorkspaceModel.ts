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

export function buildBrowserGraphWorkspaceModel(state: BrowserSessionState): BrowserGraphWorkspaceModel {
  const index = state.index;
  if (!index) {
    return { width: 1280, height: 720, nodes: [], edges: [] };
  }

  const scopeNodes = state.canvasNodes
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

  const edgeDegreeByEntityId = new Map<string, number>();
  for (const edge of state.canvasEdges) {
    edgeDegreeByEntityId.set(edge.fromEntityId, (edgeDegreeByEntityId.get(edge.fromEntityId) ?? 0) + 1);
    edgeDegreeByEntityId.set(edge.toEntityId, (edgeDegreeByEntityId.get(edge.toEntityId) ?? 0) + 1);
  }

  const entityNodes = state.canvasNodes
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
    const column = indexPosition % 3;
    const row = Math.floor(indexPosition / 3);
    const x = entityBaseX + column * 268;
    const y = 72 + row * 152;
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

  const edges: BrowserWorkspaceEdgeModel[] = state.canvasEdges
    .map((edge) => {
      const from = nodePositions.get(edge.fromEntityId);
      const to = nodePositions.get(edge.toEntityId);
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
