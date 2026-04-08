import type { BrowserSessionState } from '../../browser-session';
import { isClassLikeCanvasEntityKind, normalizeBrowserClassPresentationPolicy, resolveCanvasClassPresentationTargetEntityIds } from '../../browser-session/model/classPresentation';
import { buildBrowserFactsPanelModel } from './BrowserFactsPanel.model';
import type {
  BrowserFactsPanelActionsModel,
  BrowserFactsPanelDiagnosticsSectionModel,
  BrowserFactsPanelClassPresentationSummary,
  BrowserFactsPanelEntitySectionModel,
  BrowserFactsPanelHeaderModel,
  BrowserFactsPanelPresentationModel,
  BrowserFactsPanelRelationshipConnectedEntity,
  BrowserFactsPanelRelationshipSectionModel,
  BrowserFactsPanelSourceRefsSectionModel,
  BrowserFactsPanelScopeSectionModel,
  BrowserFactsPanelViewpointSectionModel,
} from './BrowserFactsPanel.types';
import { buildEntitySummaryHeadline, displayScopeName, formatEntityKindLabel, getEntityArchitecturalRoles } from './BrowserFactsPanel.utils';

function buildHeaderModel(state: BrowserSessionState, model: NonNullable<ReturnType<typeof buildBrowserFactsPanelModel>>): BrowserFactsPanelHeaderModel {
  return {
    title: model.title,
    subtitle: model.subtitle,
    badges: model.badges,
    summary: model.summary,
    actions: buildActionsModel(state, model),
  };
}

function buildActionsModel(state: BrowserSessionState, model: NonNullable<ReturnType<typeof buildBrowserFactsPanelModel>>): BrowserFactsPanelActionsModel {
  const selectedEntityId = model.entityFacts?.entity.externalId ?? null;
  const selectedCanvasEntityNode = model.mode === 'entity' && selectedEntityId
    ? state.canvasNodes.find((node) => node.kind === 'entity' && node.id === selectedEntityId)
    : null;
  const selectedCanvasEntityIds = state.selectedEntityIds.filter((entityId) => state.canvasNodes.some((node) => node.kind === 'entity' && node.id === entityId));
  const classPresentationEntityIds = resolveCanvasClassPresentationTargetEntityIds(state);
  const classPresentationNodes = state.canvasNodes.filter((node) => node.kind === 'entity' && classPresentationEntityIds.includes(node.id) && node.classPresentation);
  const classPresentationNode = classPresentationNodes[0] ?? null;
  const focusedCanvasScopeNode = state.focusedElement?.kind === 'scope'
    ? state.canvasNodes.find((node) => node.kind === 'scope' && node.id === state.focusedElement?.id)
    : null;

  return {
    addEntityAction: model.mode === 'entity' && model.entityFacts && !selectedCanvasEntityNode
      ? {
          entityId: model.entityFacts.entity.externalId,
          label: 'Add entity to canvas',
        }
      : null,
    pinEntityAction: model.mode === 'entity' && model.entityFacts && selectedCanvasEntityNode
      ? {
          entityId: model.entityFacts.entity.externalId,
          label: selectedCanvasEntityNode.pinned ? 'Unpin entity' : 'Pin entity',
        }
      : null,
    openSourceAction: model.sourceRefs.length > 0 && (model.mode === 'scope' || model.mode === 'entity' || model.mode === 'relationship')
      ? {
          label: 'View source',
        }
      : null,
    classPresentationActions: classPresentationEntityIds.length > 0 && classPresentationNode?.classPresentation
      ? {
          entityIds: classPresentationEntityIds,
          mode: classPresentationNode.classPresentation.mode,
          showFields: classPresentationNode.classPresentation.showFields,
          showFunctions: classPresentationNode.classPresentation.showFunctions,
        }
      : null,
    canIsolateSelection: selectedCanvasEntityIds.length > 0 || Boolean(focusedCanvasScopeNode),
    canRemoveSelection: selectedCanvasEntityIds.length > 0 || Boolean(focusedCanvasScopeNode),
  };
}


const FIELD_MEMBER_KINDS = new Set(['FIELD', 'PROPERTY']);
const FUNCTION_MEMBER_KINDS = new Set(['FUNCTION', 'METHOD']);

function countContainedMembersByKind(state: BrowserSessionState, entityId: string): { fields: number; functions: number } {
  const containedIds = state.index?.containedEntityIdsByEntityId.get(entityId) ?? [];
  let fields = 0;
  let functions = 0;
  for (const memberId of containedIds) {
    const member = state.index?.entitiesById.get(memberId);
    if (!member) {
      continue;
    }
    if (FIELD_MEMBER_KINDS.has(member.kind)) {
      fields += 1;
      continue;
    }
    if (FUNCTION_MEMBER_KINDS.has(member.kind)) {
      functions += 1;
    }
  }
  return { fields, functions };
}

function buildClassPresentationSummary(
  state: BrowserSessionState,
  entityId: string,
): BrowserFactsPanelClassPresentationSummary | null {
  const entity = state.index?.entitiesById.get(entityId);
  if (!isClassLikeCanvasEntityKind(entity?.kind)) {
    return null;
  }
  const canvasNode = state.canvasNodes.find((node) => node.kind === 'entity' && node.id === entityId);
  if (!canvasNode?.classPresentation) {
    return null;
  }

  const classPresentation = normalizeBrowserClassPresentationPolicy(canvasNode.classPresentation);
  const effectiveMode = classPresentation.showFields || classPresentation.showFunctions ? classPresentation.mode : 'simple';
  const counts = countContainedMembersByKind(state, entityId);
  const visibleDetails: string[] = [];
  const hiddenDetails: string[] = [];

  visibleDetails.push(`Canvas presentation ${effectiveMode}.`);

  if (classPresentation.showFields) {
    visibleDetails.push(counts.fields > 0 ? `Fields are available (${counts.fields}).` : 'No field members are available.');
  } else if (counts.fields > 0) {
    hiddenDetails.push(`Fields are hidden (${counts.fields} available).`);
  }

  if (classPresentation.showFunctions) {
    visibleDetails.push(counts.functions > 0 ? `Functions are available (${counts.functions}).` : 'No function members are available.');
  } else if (counts.functions > 0) {
    hiddenDetails.push(`Functions are hidden (${counts.functions} available).`);
  }

  const visibleMemberCount = (classPresentation.showFields ? counts.fields : 0) + (classPresentation.showFunctions ? counts.functions : 0);
  if (effectiveMode !== 'expanded' && visibleMemberCount > 0) {
    hiddenDetails.push(`Member detail is compacted into the class node (${visibleMemberCount} visible in compartments).`);
  }

  return {
    mode: effectiveMode,
    hiddenDetails,
    visibleDetails,
  };
}

function buildViewpointSectionModel(model: NonNullable<ReturnType<typeof buildBrowserFactsPanelModel>>): BrowserFactsPanelViewpointSectionModel | null {
  const explanation = model.viewpointExplanation;
  if (!explanation) {
    return null;
  }
  return {
    title: explanation.title,
    viewpointId: explanation.viewpointId,
    description: explanation.description,
    scopeModeLabel: explanation.scopeModeLabel,
    scopeLabel: explanation.scopeLabel,
    recommendedLayout: explanation.recommendedLayout,
    metrics: [
      { value: explanation.availability, label: 'Availability' },
      { value: explanation.confidenceLabel, label: 'Confidence' },
      { value: explanation.confidenceBand, label: 'Confidence band' },
      { value: explanation.variantLabel, label: 'Variant' },
      { value: String(explanation.entityCount), label: 'Entities' },
      { value: String(explanation.relationshipCount), label: 'Relationships' },
    ],
    seedEntities: explanation.seedEntities,
    seedRoleIds: explanation.seedRoleIds,
    expandViaSemantics: explanation.expandViaSemantics,
    preferredDependencyViews: explanation.preferredDependencyViews,
    evidenceSources: explanation.evidenceSources,
  };
}

function buildScopeSectionModel(model: NonNullable<ReturnType<typeof buildBrowserFactsPanelModel>>): BrowserFactsPanelScopeSectionModel | null {
  if (!model.scopeFacts || !model.scopeBridge) {
    return null;
  }
  return {
    scopeFacts: model.scopeFacts,
    bridge: model.scopeBridge,
    summary: [
      `Display ${displayScopeName(model.scopeFacts.scope)}`,
      `Path ${model.scopeFacts.path}`,
      `Parent ${model.scopeBridge.parentScope?.path ?? 'Root scope'}`,
    ],
    metrics: [
      { value: model.scopeFacts.scope.kind, label: 'Kind' },
      { value: model.scopeBridge.parentScope ? 'Yes' : 'No', label: 'Has parent' },
      { value: String(model.scopeBridge.childScopes.length), label: 'Child scopes' },
      { value: String(model.scopeFacts.descendantScopeCount), label: 'Descendant scopes' },
    ],
  };
}

function buildEntitySectionModel(state: BrowserSessionState, model: NonNullable<ReturnType<typeof buildBrowserFactsPanelModel>>): BrowserFactsPanelEntitySectionModel | null {
  if (!model.entityFacts) {
    return null;
  }
  const entityFacts = model.entityFacts;
  const entity = entityFacts.entity;
  const scopeLabel = entityFacts.scope ? displayScopeName(entityFacts.scope) : 'the prepared snapshot';
  const architecturalRoles = getEntityArchitecturalRoles(entity);
  const onCanvas = state.canvasNodes.some((node) => node.kind === 'entity' && node.id === entity.externalId);
  const classPresentationSummary = onCanvas ? buildClassPresentationSummary(state, entity.externalId) : null;
  return {
    entityFacts,
    inboundRelationships: entityFacts.inboundRelationships.slice(0, 8),
    outboundRelationships: entityFacts.outboundRelationships.slice(0, 8),
    scopeId: entityFacts.scope?.externalId ?? null,
    summary: [
      buildEntitySummaryHeadline(entity, scopeLabel),
      entityFacts.path ? `Path ${entityFacts.path}` : 'No scope path exported for this entity.',
      onCanvas ? 'Already present on the analysis canvas.' : 'Selected from the tree only; not yet added to the canvas.',
      architecturalRoles.length > 0 ? `Roles ${architecturalRoles.join(', ')}` : `Kind ${formatEntityKindLabel(entity.kind)}`,
    ],
    metrics: [
      { value: entity.kind, label: 'Kind' },
      { value: entity.origin ?? 'local', label: 'Origin' },
      { value: onCanvas ? 'Yes' : 'No', label: 'On canvas' },
      { value: String(entityFacts.sourceRefs.length), label: 'Source refs' },
    ],
    classPresentationSummary,
  };
}

function buildRelationshipSectionModel(state: BrowserSessionState, model: NonNullable<ReturnType<typeof buildBrowserFactsPanelModel>>): BrowserFactsPanelRelationshipSectionModel | null {
  if (!model.relationship) {
    return null;
  }
  const connectedEntities: BrowserFactsPanelRelationshipConnectedEntity[] = [model.relationship.fromEntityId, model.relationship.toEntityId].map((entityId) => {
    const entity = state.index?.entitiesById.get(entityId);
    return {
      id: entityId,
      label: entity?.displayName?.trim() || entity?.name || entityId,
      kind: entity?.kind ?? 'ENTITY',
    };
  });

  return {
    relationship: model.relationship,
    connectedEntities,
    metadata: model.relationshipMetadata,
    evidenceRelationships: model.evidenceRelationships ?? [],
  };
}

function buildDiagnosticsSectionModel(model: NonNullable<ReturnType<typeof buildBrowserFactsPanelModel>>): BrowserFactsPanelDiagnosticsSectionModel {
  return {
    diagnostics: model.diagnostics.slice(0, 8),
  };
}

function buildSourceRefsSectionModel(model: NonNullable<ReturnType<typeof buildBrowserFactsPanelModel>>): BrowserFactsPanelSourceRefsSectionModel {
  return {
    sourceRefs: model.sourceRefs.slice(0, 8),
  };
}

export function buildBrowserFactsPanelPresentation(state: BrowserSessionState): BrowserFactsPanelPresentationModel | null {
  const model = buildBrowserFactsPanelModel(state);
  if (!model) {
    return null;
  }

  return {
    model,
    header: buildHeaderModel(state, model),
    viewpoint: buildViewpointSectionModel(model),
    scope: buildScopeSectionModel(model),
    entity: buildEntitySectionModel(state, model),
    relationship: buildRelationshipSectionModel(state, model),
    diagnostics: buildDiagnosticsSectionModel(model),
    sourceRefs: buildSourceRefsSectionModel(model),
  };
}
