import type { FullSnapshotEntity, FullSnapshotScope } from '../app-model';
import {
  BROWSER_ENTITY_NODE_SIZE,
  BROWSER_SCOPE_NODE_SIZE,
  UML_CLASS_BASE_HEIGHT,
  UML_CLASS_MIN_WIDTH,
  UML_CLASS_ROW_HEIGHT,
} from '../browser-graph';
import { appliesCompactUmlPresentation, type BrowserViewpointPresentationPolicy } from '../browser-graph';
import type { BrowserCanvasNode, BrowserSessionState } from '../browser-session';
import { compareProjectionStrings, displayProjectionName, formatProjectionKindBadgeLabel, resolveProjectionSourceForCanvasNode } from './sourceMapping';
import type {
  BrowserNodeFrame,
  BrowserProjectionCompartment,
  BrowserProjectionCompartmentItem,
  BrowserProjectionNode,
} from './types';

const CLASSIFIER_KINDS = new Set(['CLASS', 'INTERFACE', 'ENUM', 'TYPE']);
const ATTRIBUTE_MEMBER_KINDS = new Set(['FIELD', 'PROPERTY']);
const OPERATION_MEMBER_KINDS = new Set(['FUNCTION', 'METHOD']);

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
    title: displayProjectionName(entity),
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
      .sort((left, right) => compareProjectionStrings(displayProjectionName(left), displayProjectionName(right)))
      .map((member) => buildCompartmentItem(state, member, member.kind));
    if (attributes.length > 0) {
      compartments.push({ kind: 'attributes', items: attributes });
    }
  }

  if (policy.showOperationCompartment) {
    const operations = members
      .filter((member) => OPERATION_MEMBER_KINDS.has(member.kind))
      .sort((left, right) => compareProjectionStrings(displayProjectionName(left), displayProjectionName(right)))
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
    (sum, compartment) => sum + compartment.items.length,
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
    badgeLabel: formatProjectionKindBadgeLabel(scope.kind),
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
    badgeLabel: formatProjectionKindBadgeLabel(entity.kind),
    title: displayProjectionName(entity),
    subtitle: '',
    ...frame,
    pinned: Boolean(canvasNode.pinned),
    selected: state.selectedEntityIds.includes(canvasNode.id) || hasSelectedMember,
    focused: (state.focusedElement?.kind === 'entity' && state.focusedElement.id === canvasNode.id) || hasFocusedMember,
    memberEntityIds,
    compartments,
  };
}

export function buildProjectionNodes(
  state: BrowserSessionState,
  presentationPolicy: BrowserViewpointPresentationPolicy,
): { nodes: BrowserProjectionNode[]; suppressedEntityIds: string[] } {
  const nodes = state.canvasNodes
    .map((canvasNode) => {
      const source = resolveProjectionSourceForCanvasNode(state, canvasNode);
      if (!source) {
        return null;
      }
      return source.kind === 'scope'
        ? buildScopeProjectionNode(state, canvasNode, source.scope)
        : buildEntityProjectionNode(state, canvasNode, source.entity, presentationPolicy);
    })
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
        return compareProjectionStrings(left.title, right.title);
      }),
    suppressedEntityIds: Array.from(suppressedEntityIds).sort(compareProjectionStrings),
  };
}
