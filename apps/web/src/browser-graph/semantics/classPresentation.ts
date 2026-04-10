import type { BrowserViewpointPresentationPolicy } from '../presentation';
import type { BrowserViewpointVariant } from '../../browser-snapshot';
import type { BrowserSnapshotIndex } from '../../browser-snapshot';
import type { BrowserCanvasNode, BrowserClassPresentationPolicy, BrowserFocusedElement } from '../contracts';

const CLASSIFIER_KINDS = new Set(['CLASS', 'INTERFACE', 'ENUM', 'TYPE']);

export function isClassLikeCanvasEntityKind(kind: string | null | undefined): boolean {
  return typeof kind === 'string' && CLASSIFIER_KINDS.has(kind);
}

export function createDefaultBrowserClassPresentationPolicy(): BrowserClassPresentationPolicy {
  return {
    mode: 'simple',
    showFields: true,
    showFunctions: true,
  };
}

export function normalizeBrowserClassPresentationPolicy(
  value?: Partial<BrowserClassPresentationPolicy> | null,
): BrowserClassPresentationPolicy {
  const defaults = createDefaultBrowserClassPresentationPolicy();
  return {
    mode: value?.mode === 'compartments' || value?.mode === 'expanded' ? value.mode : defaults.mode,
    showFields: typeof value?.showFields === 'boolean' ? value.showFields : defaults.showFields,
    showFunctions: typeof value?.showFunctions === 'boolean' ? value.showFunctions : defaults.showFunctions,
  };
}

export function normalizeCanvasNodeClassPresentation(
  node: BrowserCanvasNode,
  index?: BrowserSnapshotIndex | null,
): BrowserCanvasNode {
  if (node.kind !== 'entity') {
    return node;
  }
  const entity = index?.entitiesById.get(node.id);
  if (!isClassLikeCanvasEntityKind(entity?.kind)) {
    if (!('classPresentation' in node) || node.classPresentation === null) {
      return node;
    }
    const { classPresentation: _classPresentation, ...rest } = node;
    return rest;
  }
  return {
    ...node,
    classPresentation: normalizeBrowserClassPresentationPolicy(node.classPresentation),
  };
}

export function createDefaultCanvasEntityClassPresentation(
  entityId: string,
  index?: BrowserSnapshotIndex | null,
): BrowserClassPresentationPolicy | undefined {
  const entity = index?.entitiesById.get(entityId);
  return isClassLikeCanvasEntityKind(entity?.kind)
    ? createDefaultBrowserClassPresentationPolicy()
    : undefined;
}

function resolveScenarioDefaultClassPresentation(
  viewpointId: string | null | undefined,
  variant: BrowserViewpointVariant | null | undefined,
): BrowserClassPresentationPolicy | null {
  if (!viewpointId) {
    return null;
  }
  if (viewpointId === 'persistence-model') {
    return {
      mode: 'compartments',
      showFields: true,
      showFunctions: false,
    };
  }
  if (viewpointId === 'request-handling' || viewpointId === 'api-surface') {
    return {
      mode: variant === 'show-upstream-callers' ? 'expanded' : 'compartments',
      showFields: false,
      showFunctions: true,
    };
  }
  if (viewpointId === 'module-dependencies' || viewpointId === 'integration-map' || viewpointId === 'ui-navigation') {
    return createDefaultBrowserClassPresentationPolicy();
  }
  return null;
}

export function createCanvasEntityClassPresentationFromViewpointPolicy(
  entityId: string,
  index: BrowserSnapshotIndex | null | undefined,
  presentationPolicy: Pick<BrowserViewpointPresentationPolicy, 'viewpointId' | 'variant' | 'mode' | 'showAttributeCompartment' | 'showOperationCompartment'> | null | undefined,
): BrowserClassPresentationPolicy | undefined {
  const defaults = createDefaultCanvasEntityClassPresentation(entityId, index);
  if (!defaults) {
    return undefined;
  }
  const scenarioDefault = resolveScenarioDefaultClassPresentation(presentationPolicy?.viewpointId, presentationPolicy?.variant);
  if (scenarioDefault) {
    return scenarioDefault;
  }
  if (presentationPolicy?.mode !== 'compact-uml') {
    return defaults;
  }
  return {
    mode: 'compartments',
    showFields: Boolean(presentationPolicy.showAttributeCompartment),
    showFunctions: Boolean(presentationPolicy.showOperationCompartment),
  };
}

export function applyCanvasNodeClassPresentationDefaults(
  node: BrowserCanvasNode,
  index: BrowserSnapshotIndex | null | undefined,
  presentationPolicy: Pick<BrowserViewpointPresentationPolicy, 'viewpointId' | 'variant' | 'mode' | 'showAttributeCompartment' | 'showOperationCompartment'> | null | undefined,
): BrowserCanvasNode {
  if (node.kind !== 'entity' || node.classPresentation) {
    return node;
  }
  const classPresentation = createCanvasEntityClassPresentationFromViewpointPolicy(node.id, index, presentationPolicy);
  if (!classPresentation) {
    return node;
  }
  return {
    ...node,
    classPresentation,
  };
}

export function resolveCanvasClassPresentationTargetEntityIds(
  state: {
    selectedEntityIds: string[];
    focusedElement: BrowserFocusedElement | null;
    canvasNodes: BrowserCanvasNode[];
    index?: BrowserSnapshotIndex | null;
  },
): string[] {
  const selectedIds = state.selectedEntityIds.filter((entityId) => {
    const entity = state.index?.entitiesById.get(entityId);
    return Boolean(state.canvasNodes.some((node) => node.kind === 'entity' && node.id === entityId))
      && isClassLikeCanvasEntityKind(entity?.kind);
  });
  if (selectedIds.length > 0) {
    return selectedIds;
  }
  const focusedEntityId = state.focusedElement?.kind === 'entity'
    ? state.focusedElement.id
    : null;
  if (!focusedEntityId) {
    return [];
  }
  const entity = state.index?.entitiesById.get(focusedEntityId);
  return state.canvasNodes.some((node) => node.kind === 'entity' && node.id === focusedEntityId) && isClassLikeCanvasEntityKind(entity?.kind)
    ? [focusedEntityId]
    : [];
}
