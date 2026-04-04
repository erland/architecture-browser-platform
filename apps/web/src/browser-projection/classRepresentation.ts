import type { FullSnapshotEntity } from '../app-model';
import type { BrowserViewpointPresentationPolicy } from '../browser-graph/presentation';
import {
  createDefaultBrowserClassPresentationPolicy,
  isClassLikeCanvasEntityKind,
  normalizeBrowserClassPresentationPolicy,
} from '../browser-session/model/classPresentation';
import type { BrowserCanvasNode, BrowserClassPresentationPolicy, BrowserSessionState } from '../browser-session';
import { compareProjectionStrings, displayProjectionName } from './sourceMapping';
import type { BrowserProjectionCompartment, BrowserProjectionCompartmentItem, BrowserProjectionNodeKind } from './types';

const ATTRIBUTE_MEMBER_KINDS = new Set(['FIELD', 'PROPERTY']);
const OPERATION_MEMBER_KINDS = new Set(['FUNCTION', 'METHOD']);

export type BrowserDerivedClassRepresentation = {
  mode: 'simple' | 'compartments' | 'expanded';
  nodeKind: BrowserProjectionNodeKind;
  compartments: BrowserProjectionCompartment[];
  memberEntityIds: string[];
  inlineMemberEntityIds: string[];
  expandedMemberEntityIds: string[];
  suppressedEntityIds: string[];
  selected: boolean;
  focused: boolean;
};

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

function isDefaultCanvasClassPresentation(policy: BrowserClassPresentationPolicy | undefined): boolean {
  if (!policy) {
    return false;
  }
  const defaults = createDefaultBrowserClassPresentationPolicy();
  return policy.mode === defaults.mode
    && policy.showFields === defaults.showFields
    && policy.showFunctions === defaults.showFunctions;
}

function resolveCanvasClassPresentationPolicy(
  canvasNode: BrowserCanvasNode,
  presentationPolicy: BrowserViewpointPresentationPolicy,
): BrowserClassPresentationPolicy {
  if (!canvasNode.classPresentation && presentationPolicy.mode === 'compact-uml') {
    return {
      mode: 'compartments',
      showFields: presentationPolicy.showAttributeCompartment,
      showFunctions: presentationPolicy.showOperationCompartment,
    };
  }

  const normalized = normalizeBrowserClassPresentationPolicy(canvasNode.classPresentation);

  if (normalized.mode === 'simple'
    && normalized.showFields
    && normalized.showFunctions
    && presentationPolicy.mode === 'compact-uml'
    && isDefaultCanvasClassPresentation(canvasNode.classPresentation)) {
    return {
      mode: 'compartments',
      showFields: presentationPolicy.showAttributeCompartment,
      showFunctions: presentationPolicy.showOperationCompartment,
    };
  }

  return normalized;
}

function getVisibleMembers(
  state: BrowserSessionState,
  entity: FullSnapshotEntity,
  classPresentation: BrowserClassPresentationPolicy,
): { attributes: FullSnapshotEntity[]; operations: FullSnapshotEntity[] } {
  const index = state.index;
  if (!index) {
    return { attributes: [], operations: [] };
  }

  const containedMemberIds = index.containedEntityIdsByEntityId.get(entity.externalId) ?? [];
  const members = containedMemberIds
    .map((memberId) => index.entitiesById.get(memberId))
    .filter((member): member is FullSnapshotEntity => Boolean(member));

  const attributes = classPresentation.showFields
    ? members
      .filter((member) => ATTRIBUTE_MEMBER_KINDS.has(member.kind))
      .sort((left, right) => compareProjectionStrings(displayProjectionName(left), displayProjectionName(right)))
    : [];
  const operations = classPresentation.showFunctions
    ? members
      .filter((member) => OPERATION_MEMBER_KINDS.has(member.kind))
      .sort((left, right) => compareProjectionStrings(displayProjectionName(left), displayProjectionName(right)))
    : [];

  return { attributes, operations };
}

export function deriveBrowserClassRepresentation(
  state: BrowserSessionState,
  canvasNode: BrowserCanvasNode,
  entity: FullSnapshotEntity,
  presentationPolicy: BrowserViewpointPresentationPolicy,
): BrowserDerivedClassRepresentation {
  if (canvasNode.kind !== 'entity' || !isClassLikeCanvasEntityKind(entity.kind)) {
    return {
      mode: 'simple',
      nodeKind: 'entity',
      compartments: [],
      memberEntityIds: [],
      inlineMemberEntityIds: [],
      expandedMemberEntityIds: [],
      suppressedEntityIds: [],
      selected: false,
      focused: false,
    };
  }

  const classPresentation = resolveCanvasClassPresentationPolicy(canvasNode, presentationPolicy);
  const requestedMode = classPresentation.showFields || classPresentation.showFunctions
    ? classPresentation.mode
    : 'simple';
  const visibleMembers = getVisibleMembers(state, entity, classPresentation);

  const compartments: BrowserProjectionCompartment[] = [];
  if (requestedMode === 'compartments') {
    if (visibleMembers.attributes.length > 0) {
      compartments.push({
        kind: 'attributes',
        items: visibleMembers.attributes.map((member) => buildCompartmentItem(state, member, member.kind)),
      });
    }
    if (visibleMembers.operations.length > 0) {
      compartments.push({
        kind: 'operations',
        items: visibleMembers.operations.map((member) => buildCompartmentItem(state, member, member.kind)),
      });
    }
  }

  const inlineMemberEntityIds = compartments.flatMap((compartment) => compartment.items.map((item) => item.entityId));
  const expandedMemberEntityIds = requestedMode === 'expanded'
    ? [...visibleMembers.attributes, ...visibleMembers.operations].map((member) => member.externalId)
    : [];
  const memberEntityIds = requestedMode === 'expanded' ? expandedMemberEntityIds : inlineMemberEntityIds;
  const selected = compartments.some((compartment) => compartment.items.some((item) => item.selected));
  const focused = compartments.some((compartment) => compartment.items.some((item) => item.focused));
  const nodeKind: BrowserProjectionNodeKind = requestedMode === 'simple' ? 'entity' : 'uml-class';
  const suppressedEntityIds = requestedMode === 'compartments' ? [...inlineMemberEntityIds] : [];

  return {
    mode: requestedMode,
    nodeKind,
    compartments,
    memberEntityIds,
    inlineMemberEntityIds,
    expandedMemberEntityIds,
    suppressedEntityIds,
    selected,
    focused,
  };
}
