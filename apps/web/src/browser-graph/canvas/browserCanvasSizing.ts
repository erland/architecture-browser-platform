import type { FullSnapshotEntity } from '../../app-model';
import { resolveBrowserStateViewpointPresentationPolicy } from '../presentation';
import type { BrowserCanvasNode, BrowserSessionState } from '../../browser-graph/contracts';

export const BROWSER_SCOPE_NODE_SIZE = { width: 204, height: 82 } as const;
export const BROWSER_ENTITY_NODE_SIZE = { width: 196, height: 84 } as const;
export const UML_CLASS_MIN_WIDTH = 240;
export const UML_CLASS_BASE_HEIGHT = 92;
export const UML_CLASS_ROW_HEIGHT = 20;

const CLASSIFIER_KINDS = new Set(['CLASS', 'INTERFACE', 'ENUM', 'TYPE']);
const ATTRIBUTE_MEMBER_KINDS = new Set(['FIELD', 'PROPERTY']);
const OPERATION_MEMBER_KINDS = new Set(['FUNCTION', 'METHOD']);

function isCompactUmlClassifierEntity(entity: FullSnapshotEntity, state: BrowserSessionState) {
  const policy = resolveBrowserStateViewpointPresentationPolicy(state);
  return policy.mode === 'compact-uml' && policy.collapseMembersByDefault && CLASSIFIER_KINDS.has(entity.kind);
}

function getCompactUmlVisibleRowCount(state: BrowserSessionState, entity: FullSnapshotEntity) {
  const index = state.index;
  if (!index) {
    return { attributes: 0, operations: 0, compartmentCount: 0 };
  }

  const containedMemberIds = index.containedEntityIdsByEntityId.get(entity.externalId) ?? [];
  let attributeCount = 0;
  let operationCount = 0;
  for (const memberId of containedMemberIds) {
    const member = index.entitiesById.get(memberId);
    if (!member) {
      continue;
    }
    if (ATTRIBUTE_MEMBER_KINDS.has(member.kind)) {
      attributeCount += 1;
    } else if (OPERATION_MEMBER_KINDS.has(member.kind)) {
      operationCount += 1;
    }
  }

  return {
    attributes: attributeCount,
    operations: operationCount,
    compartmentCount: (attributeCount > 0 ? 1 : 0) + (operationCount > 0 ? 1 : 0),
  };
}

export function getProjectionAwareEntityNodeSize(state: BrowserSessionState, entityId: string) {
  const entity = state.index?.entitiesById.get(entityId);
  if (!entity || !isCompactUmlClassifierEntity(entity, state)) {
    return BROWSER_ENTITY_NODE_SIZE;
  }

  const rowInfo = getCompactUmlVisibleRowCount(state, entity);
  return {
    width: UML_CLASS_MIN_WIDTH,
    height: UML_CLASS_BASE_HEIGHT + ((rowInfo.attributes + rowInfo.operations) * UML_CLASS_ROW_HEIGHT) + (rowInfo.compartmentCount * 8),
  };
}

export function getProjectionAwareCanvasNodeSize(state: BrowserSessionState | null | undefined, node: Pick<BrowserCanvasNode, 'kind' | 'id'>) {
  if (node.kind === 'scope' || !state) {
    return node.kind === 'scope' ? BROWSER_SCOPE_NODE_SIZE : BROWSER_ENTITY_NODE_SIZE;
  }
  return getProjectionAwareEntityNodeSize(state, node.id);
}
