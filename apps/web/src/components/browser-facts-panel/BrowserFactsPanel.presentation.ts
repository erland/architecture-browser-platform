import type { BrowserSessionState } from '../../browserSessionStore';
import { buildBrowserFactsPanelModel } from './BrowserFactsPanel.model';
import type {
  BrowserFactsPanelActionsModel,
  BrowserFactsPanelDiagnosticsSectionModel,
  BrowserFactsPanelEntitySectionModel,
  BrowserFactsPanelHeaderModel,
  BrowserFactsPanelPresentationModel,
  BrowserFactsPanelRelationshipConnectedEntity,
  BrowserFactsPanelRelationshipSectionModel,
  BrowserFactsPanelSourceRefsSectionModel,
  BrowserFactsPanelScopeSectionModel,
  BrowserFactsPanelViewpointSectionModel,
} from './BrowserFactsPanel.types';
import { displayScopeName } from './BrowserFactsPanel.utils';

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

  return {
    pinEntityAction: model.mode === 'entity' && model.entityFacts
      ? {
          entityId: model.entityFacts.entity.externalId,
          label: selectedCanvasEntityNode?.pinned ? 'Unpin entity' : 'Pin entity',
        }
      : null,
    canIsolateSelection: state.selectedEntityIds.length > 0 || state.focusedElement?.kind === 'scope',
    canRemoveSelection: state.selectedEntityIds.length > 0 || state.focusedElement?.kind === 'scope',
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

function buildEntitySectionModel(model: NonNullable<ReturnType<typeof buildBrowserFactsPanelModel>>): BrowserFactsPanelEntitySectionModel | null {
  if (!model.entityFacts) {
    return null;
  }
  return {
    entityFacts: model.entityFacts,
    inboundRelationships: model.entityFacts.inboundRelationships.slice(0, 8),
    outboundRelationships: model.entityFacts.outboundRelationships.slice(0, 8),
    scopeId: model.entityFacts.scope?.externalId ?? null,
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
    entity: buildEntitySectionModel(model),
    relationship: buildRelationshipSectionModel(state, model),
    diagnostics: buildDiagnosticsSectionModel(model),
    sourceRefs: buildSourceRefsSectionModel(model),
  };
}
