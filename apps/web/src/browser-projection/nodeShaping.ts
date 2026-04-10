import type { FullSnapshotEntity, FullSnapshotScope } from '../app-model';
import {
  BROWSER_ENTITY_NODE_SIZE,
  BROWSER_SCOPE_NODE_SIZE,
  UML_CLASS_BASE_HEIGHT,
  UML_CLASS_MIN_WIDTH,
  UML_CLASS_ROW_HEIGHT,
} from '../browser-graph/canvas';
import type { BrowserViewpointPresentationPolicy } from '../browser-graph/presentation';
import type { BrowserCanvasNode, BrowserSessionState } from '../browser-graph/contracts';
import { deriveBrowserClassRepresentation } from './classRepresentation';
import { compareProjectionStrings, displayProjectionName, formatProjectionKindBadgeLabel, resolveProjectionSourceForCanvasNode } from './sourceMapping';
import type {
  BrowserNodeFrame,
  BrowserProjectionCompartment,
  BrowserProjectionNode,
} from './types';

const EXPANDED_CLASS_MEMBER_INDENT = 28;
const EXPANDED_CLASS_MEMBER_VERTICAL_GAP = 16;
const EXPANDED_CLASS_MEMBER_ROW_GAP = 12;

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
    classPresentationMode: undefined,
    classVisibleCompartmentKinds: [],
    isExpandedClassMember: false,
    parentClassEntityId: undefined,
    memberKind: undefined,
  };
}

function buildExpandedMemberProjectionNodes(
  state: BrowserSessionState,
  parentCanvasNode: BrowserCanvasNode,
  parentFrame: BrowserNodeFrame,
  expandedMemberEntityIds: string[],
  parentEntityId: string,
): BrowserProjectionNode[] {
  const index = state.index;
  if (!index || expandedMemberEntityIds.length === 0) {
    return [];
  }

  const nodes: BrowserProjectionNode[] = [];

  expandedMemberEntityIds.forEach((memberEntityId, indexPosition) => {
      const member = index.entitiesById.get(memberEntityId);
      if (!member) {
        return null;
      }

      nodes.push({
        id: `entity:${member.externalId}`,
        kind: 'entity',
        source: { kind: 'entity' as const, id: member.externalId },
        badgeLabel: formatProjectionKindBadgeLabel(member.kind),
        title: displayProjectionName(member),
        subtitle: formatProjectionKindBadgeLabel(member.kind),
        x: parentCanvasNode.x + EXPANDED_CLASS_MEMBER_INDENT,
        y: parentFrame.y + parentFrame.height + EXPANDED_CLASS_MEMBER_VERTICAL_GAP + (indexPosition * (BROWSER_ENTITY_NODE_SIZE.height + EXPANDED_CLASS_MEMBER_ROW_GAP)),
        width: BROWSER_ENTITY_NODE_SIZE.width,
        height: BROWSER_ENTITY_NODE_SIZE.height,
        pinned: Boolean(parentCanvasNode.pinned),
        selected: state.selectedEntityIds.includes(member.externalId),
        focused: state.focusedElement?.kind === 'entity' && state.focusedElement.id === member.externalId,
        memberEntityIds: [],
        compartments: [],
        classPresentationMode: undefined,
        classVisibleCompartmentKinds: [],
        isExpandedClassMember: true,
        parentClassEntityId: parentEntityId,
        memberKind: member.kind,
      } satisfies BrowserProjectionNode);
    });

  return nodes;
}

function buildEntityProjectionNodes(
  state: BrowserSessionState,
  canvasNode: BrowserCanvasNode,
  entity: FullSnapshotEntity,
  presentationPolicy: BrowserViewpointPresentationPolicy,
): BrowserProjectionNode[] {
  const classRepresentation = deriveBrowserClassRepresentation(state, canvasNode, entity, presentationPolicy);
  const frame = classRepresentation.nodeKind === 'uml-class'
    ? getCompactUmlNodeFrame(canvasNode, classRepresentation.compartments)
    : getNodeFrame(canvasNode);
  const parentNode: BrowserProjectionNode = {
    id: `entity:${canvasNode.id}`,
    kind: classRepresentation.nodeKind,
    source: { kind: 'entity', id: canvasNode.id },
    badgeLabel: formatProjectionKindBadgeLabel(entity.kind),
    title: displayProjectionName(entity),
    subtitle: '',
    ...frame,
    pinned: Boolean(canvasNode.pinned),
    selected: state.selectedEntityIds.includes(canvasNode.id) || classRepresentation.selected,
    focused: (state.focusedElement?.kind === 'entity' && state.focusedElement.id === canvasNode.id) || classRepresentation.focused,
    memberEntityIds: classRepresentation.memberEntityIds,
    compartments: classRepresentation.compartments,
    classPresentationMode: classRepresentation.mode,
    classVisibleCompartmentKinds: classRepresentation.compartments.map((compartment) => compartment.kind),
    isExpandedClassMember: false,
    parentClassEntityId: undefined,
    memberKind: undefined,
  };

  if (classRepresentation.mode !== 'expanded') {
    return [parentNode];
  }

  return [
    parentNode,
    ...buildExpandedMemberProjectionNodes(
      state,
      canvasNode,
      frame,
      classRepresentation.expandedMemberEntityIds,
      entity.externalId,
    ),
  ];
}

export function buildProjectionNodes(
  state: BrowserSessionState,
  presentationPolicy: BrowserViewpointPresentationPolicy,
): { nodes: BrowserProjectionNode[]; suppressedEntityIds: string[] } {
  const nodes = state.canvasNodes
    .flatMap((canvasNode) => {
      const source = resolveProjectionSourceForCanvasNode(state, canvasNode);
      if (!source) {
        return [];
      }
      return source.kind === 'scope'
        ? [buildScopeProjectionNode(state, canvasNode, source.scope)]
        : buildEntityProjectionNodes(state, canvasNode, source.entity, presentationPolicy);
    });

  const suppressedEntityIds = new Set<string>();
  for (const canvasNode of state.canvasNodes) {
    const source = resolveProjectionSourceForCanvasNode(state, canvasNode);
    if (!source || source.kind !== 'entity') {
      continue;
    }
    const classRepresentation = deriveBrowserClassRepresentation(state, canvasNode, source.entity, presentationPolicy);
    for (const memberEntityId of [...classRepresentation.suppressedEntityIds, ...classRepresentation.expandedMemberEntityIds]) {
      suppressedEntityIds.add(memberEntityId);
    }
  }

  return {
    nodes: nodes
      .filter((node) => !(node.source.kind === 'entity' && suppressedEntityIds.has(node.source.id) && !node.isExpandedClassMember))
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
