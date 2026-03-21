import type { FullSnapshotEntity, FullSnapshotScope } from './appModel';
import { appliesCompactUmlPresentation, resolveBrowserStateViewpointPresentationPolicy, type BrowserViewpointPresentationPolicy } from './browserViewpointPresentation';
import { BROWSER_ENTITY_NODE_SIZE, BROWSER_SCOPE_NODE_SIZE, UML_CLASS_BASE_HEIGHT, UML_CLASS_MAX_VISIBLE_ROWS_PER_COMPARTMENT, UML_CLASS_MIN_WIDTH, UML_CLASS_ROW_HEIGHT } from './browserCanvasSizing';
import type { BrowserCanvasEdge, BrowserCanvasNode, BrowserSessionState } from './browserSessionStore';
import { formatAssociationEdgeLabel } from './browserRelationshipSemantics';

export type BrowserProjectionNodeKind = 'scope' | 'entity' | 'uml-class';
export type BrowserProjectionCompartmentKind = 'attributes' | 'operations';

export type BrowserProjectionSource =
  | { kind: 'scope'; id: string }
  | { kind: 'entity'; id: string };

export type BrowserProjectionCompartmentItem = {
  entityId: string;
  kind: string;
  title: string;
  subtitle: string;
  selected: boolean;
  focused: boolean;
};

export type BrowserProjectionCompartment = {
  kind: BrowserProjectionCompartmentKind;
  items: BrowserProjectionCompartmentItem[];
};

export type BrowserProjectionNode = {
  id: string;
  kind: BrowserProjectionNodeKind;
  source: BrowserProjectionSource;
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

export type BrowserProjectionEdge = {
  id: string;
  relationshipId: string;
  fromNodeId: string;
  toNodeId: string;
  fromEntityId: string;
  toEntityId: string;
  label: string;
  focused: boolean;
};

export type BrowserProjectionModel = {
  width: number;
  height: number;
  nodes: BrowserProjectionNode[];
  edges: BrowserProjectionEdge[];
  presentationPolicy: BrowserViewpointPresentationPolicy;
  suppressedEntityIds: string[];
};

const CLASSIFIER_KINDS = new Set(['CLASS', 'INTERFACE', 'ENUM', 'TYPE']);
const ATTRIBUTE_MEMBER_KINDS = new Set(['FIELD', 'PROPERTY']);
const OPERATION_MEMBER_KINDS = new Set(['FUNCTION', 'METHOD']);

type BrowserNodeFrame = {
  x: number;
  y: number;
  width: number;
  height: number;
};


function compareStrings(left: string, right: string) {
  return left.localeCompare(right, undefined, { sensitivity: 'base' });
}

function displayNameOf(item: { displayName: string | null; name: string }) {
  return item.displayName?.trim() || item.name;
}

function formatKindBadgeLabel(kind: string) {
  return kind
    .toLowerCase()
    .split(/[_-]+/g)
    .map((part) => part ? part.charAt(0).toUpperCase() + part.slice(1) : part)
    .join(' ');
}

function isCompactUmlClassifierEntity(
  entity: FullSnapshotEntity,
  policy: BrowserViewpointPresentationPolicy,
) {
  return appliesCompactUmlPresentation(policy) && CLASSIFIER_KINDS.has(entity.kind);
}

function buildCompartmentItem(state: BrowserSessionState, entity: FullSnapshotEntity, subtitle: string): BrowserProjectionCompartmentItem {
  return {
    entityId: entity.externalId,
    kind: entity.kind,
    title: displayNameOf(entity),
    subtitle,
    selected: state.selectedEntityIds.includes(entity.externalId),
    focused: state.focusedElement?.kind === 'entity' && state.focusedElement.id === entity.externalId,
  };
}

function buildCompactUmlCompartments(
  state: BrowserSessionState,
  entity: FullSnapshotEntity,
  policy: BrowserViewpointPresentationPolicy,
): BrowserProjectionCompartment[] {
  const index = state.index;
  if (!index) {
    return [];
  }

  const allowedMemberKinds = new Set(policy.compactMemberKinds);
  const containedMemberIds = index.containedEntityIdsByEntityId.get(entity.externalId) ?? [];
  const members = containedMemberIds
    .map((memberId) => index.entitiesById.get(memberId))
    .filter((member): member is FullSnapshotEntity => Boolean(member))
    .filter((member) => allowedMemberKinds.has(member.kind));

  const compartments: BrowserProjectionCompartment[] = [];

  if (policy.showAttributeCompartment) {
    const attributes = members
      .filter((member) => ATTRIBUTE_MEMBER_KINDS.has(member.kind))
      .sort((left, right) => compareStrings(displayNameOf(left), displayNameOf(right)))
      .map((member) => buildCompartmentItem(state, member, member.kind));
    if (attributes.length > 0) {
      compartments.push({ kind: 'attributes', items: attributes });
    }
  }

  if (policy.showOperationCompartment) {
    const operations = members
      .filter((member) => OPERATION_MEMBER_KINDS.has(member.kind))
      .sort((left, right) => compareStrings(displayNameOf(left), displayNameOf(right)))
      .map((member) => buildCompartmentItem(state, member, member.kind));
    if (operations.length > 0) {
      compartments.push({ kind: 'operations', items: operations });
    }
  }

  return compartments;
}

function getNodeFrame(node: BrowserCanvasNode): BrowserNodeFrame {
  if (node.kind === 'scope') {
    return {
      x: node.x,
      y: node.y,
      width: BROWSER_SCOPE_NODE_SIZE.width,
      height: BROWSER_SCOPE_NODE_SIZE.height,
    };
  }
  return {
    x: node.x,
    y: node.y,
    width: BROWSER_ENTITY_NODE_SIZE.width,
    height: BROWSER_ENTITY_NODE_SIZE.height,
  };
}

function getCompactUmlNodeFrame(
  canvasNode: BrowserCanvasNode,
  compartments: BrowserProjectionCompartment[],
): BrowserNodeFrame {
  const visibleRowCount = compartments.reduce(
    (sum, compartment) => sum + Math.min(compartment.items.length, UML_CLASS_MAX_VISIBLE_ROWS_PER_COMPARTMENT),
    0,
  );
  const compartmentDividerCount = compartments.length;
  return {
    x: canvasNode.x,
    y: canvasNode.y,
    width: UML_CLASS_MIN_WIDTH,
    height: UML_CLASS_BASE_HEIGHT + (visibleRowCount * UML_CLASS_ROW_HEIGHT) + (compartmentDividerCount * 8),
  };
}

function buildScopeProjectionNode(state: BrowserSessionState, canvasNode: BrowserCanvasNode, scope: FullSnapshotScope): BrowserProjectionNode {
  const frame = getNodeFrame(canvasNode);
  return {
    id: `scope:${canvasNode.id}`,
    kind: 'scope',
    source: { kind: 'scope', id: canvasNode.id },
    badgeLabel: formatKindBadgeLabel(scope.kind),
    title: scope.displayName?.trim() || scope.name,
    subtitle: '',
    ...frame,
    pinned: Boolean(canvasNode.pinned),
    selected: state.selectedScopeId === canvasNode.id,
    focused: state.focusedElement?.kind === 'scope' && state.focusedElement.id === canvasNode.id,
    memberEntityIds: [],
    compartments: [],
  };
}

function buildEntityProjectionNode(
  state: BrowserSessionState,
  canvasNode: BrowserCanvasNode,
  entity: FullSnapshotEntity,
  presentationPolicy: BrowserViewpointPresentationPolicy,
): BrowserProjectionNode {
  const subtitle = '';
  const compartments = isCompactUmlClassifierEntity(entity, presentationPolicy)
    ? buildCompactUmlCompartments(state, entity, presentationPolicy)
    : [];
  const frame = compartments.length > 0 ? getCompactUmlNodeFrame(canvasNode, compartments) : getNodeFrame(canvasNode);
  const memberEntityIds = compartments.flatMap((compartment) => compartment.items.map((item) => item.entityId));
  const hasSelectedMember = compartments.some((compartment) => compartment.items.some((item) => item.selected));
  const hasFocusedMember = compartments.some((compartment) => compartment.items.some((item) => item.focused));
  return {
    id: `entity:${canvasNode.id}`,
    kind: compartments.length > 0 ? 'uml-class' : 'entity',
    source: { kind: 'entity', id: canvasNode.id },
    badgeLabel: formatKindBadgeLabel(entity.kind),
    title: displayNameOf(entity),
    subtitle,
    ...frame,
    pinned: Boolean(canvasNode.pinned),
    selected: state.selectedEntityIds.includes(canvasNode.id) || hasSelectedMember,
    focused: (state.focusedElement?.kind === 'entity' && state.focusedElement.id === canvasNode.id) || hasFocusedMember,
    memberEntityIds,
    compartments,
  };
}

function buildProjectionNode(
  state: BrowserSessionState,
  canvasNode: BrowserCanvasNode,
  presentationPolicy: BrowserViewpointPresentationPolicy,
): BrowserProjectionNode | null {
  const index = state.index;
  if (!index) {
    return null;
  }

  if (canvasNode.kind === 'scope') {
    const scope = index.scopesById.get(canvasNode.id);
    return scope ? buildScopeProjectionNode(state, canvasNode, scope) : null;
  }

  const entity = index.entitiesById.get(canvasNode.id);
  return entity ? buildEntityProjectionNode(state, canvasNode, entity, presentationPolicy) : null;
}

function buildProjectionNodes(state: BrowserSessionState, presentationPolicy: BrowserViewpointPresentationPolicy) {
  const nodes = state.canvasNodes
    .map((node) => buildProjectionNode(state, node, presentationPolicy))
    .filter((node): node is BrowserProjectionNode => Boolean(node));

  const suppressedEntityIds = new Set<string>();
  if (appliesCompactUmlPresentation(presentationPolicy) && presentationPolicy.collapseMembersByDefault) {
    for (const node of nodes) {
      if (node.kind === 'uml-class') {
        for (const memberEntityId of node.memberEntityIds) {
          suppressedEntityIds.add(memberEntityId);
        }
      }
    }
  }

  return {
    nodes: nodes
      .filter((node) => !(node.source.kind === 'entity' && suppressedEntityIds.has(node.source.id)))
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
      }),
    suppressedEntityIds: Array.from(suppressedEntityIds).sort(compareStrings),
  };
}

function buildProjectionEdges(
  state: BrowserSessionState,
  nodesBySourceEntityId: Map<string, BrowserProjectionNode>,
  edges: BrowserCanvasEdge[],
): BrowserProjectionEdge[] {
  const index = state.index;
  if (!index) {
    return [];
  }

  return edges
    .map((edge) => {
      const relationship = index.relationshipsById.get(edge.relationshipId);
      const fromNode = nodesBySourceEntityId.get(edge.fromEntityId);
      const toNode = nodesBySourceEntityId.get(edge.toEntityId);
      if (!relationship || !fromNode || !toNode) {
        return null;
      }
      return {
        id: `relationship:${edge.relationshipId}`,
        relationshipId: edge.relationshipId,
        fromNodeId: fromNode.id,
        toNodeId: toNode.id,
        fromEntityId: edge.fromEntityId,
        toEntityId: edge.toEntityId,
        label: state.appliedViewpoint?.viewpoint.id === 'persistence-model' && state.appliedViewpoint?.variant === 'show-entity-relations'
          ? (formatAssociationEdgeLabel(relationship) ?? (relationship.label?.trim() || relationship.kind))
          : (relationship.label?.trim() || relationship.kind),
        focused: state.focusedElement?.kind === 'relationship' && state.focusedElement.id === edge.relationshipId,
      };
    })
    .filter((edge): edge is BrowserProjectionEdge => Boolean(edge));
}

export function buildBrowserProjectionModel(state: BrowserSessionState): BrowserProjectionModel {
  const index = state.index;
  const presentationPolicy = resolveBrowserStateViewpointPresentationPolicy(state);
  if (!index) {
    return { width: 1280, height: 720, nodes: [], edges: [], presentationPolicy, suppressedEntityIds: [] };
  }

  const { nodes, suppressedEntityIds } = buildProjectionNodes(state, presentationPolicy);
  const nodesBySourceEntityId = new Map(
    nodes
      .filter((node) => node.source.kind === 'entity')
      .map((node) => [node.source.id, node] as const),
  );
  const edges = buildProjectionEdges(state, nodesBySourceEntityId, state.canvasEdges);
  const maxNodeRight = nodes.reduce((current, node) => Math.max(current, node.x + node.width), 0);
  const maxNodeBottom = nodes.reduce((current, node) => Math.max(current, node.y + node.height), 0);

  return {
    width: Math.max(1280, maxNodeRight + 80),
    height: Math.max(720, maxNodeBottom + 80),
    nodes,
    edges,
    presentationPolicy,
    suppressedEntityIds,
  };
}
