import type { FullSnapshotViewpoint } from '../../app-model';
import type { BrowserViewpointVariant } from '../../browser-snapshot';
import type { BrowserSessionState, BrowserViewpointPresentationPreference } from '../../browser-graph/contracts';

export type BrowserViewpointPresentationMode = 'entity-graph' | 'compact-uml';

export type BrowserViewpointPresentationPolicy = {
  viewpointId: string | null;
  variant: BrowserViewpointVariant;
  mode: BrowserViewpointPresentationMode;
  collapseMembersByDefault: boolean;
  showAttributeCompartment: boolean;
  showOperationCompartment: boolean;
  compactMemberKinds: string[];
  reason: string;
};

const DEFAULT_BROWSER_VIEWPOINT_PRESENTATION_POLICY: BrowserViewpointPresentationPolicy = {
  viewpointId: null,
  variant: 'default',
  mode: 'entity-graph',
  collapseMembersByDefault: false,
  showAttributeCompartment: false,
  showOperationCompartment: false,
  compactMemberKinds: [],
  reason: 'No viewpoint is applied, so the browser uses the standard entity graph projection.',
};

const COMPACT_UML_VIEWPOINT_IDS = new Set([
  'persistence-model',
  'domain-model',
  'api-contract-model',
  'type-hierarchy',
  'repository-entity-model',
]);

function prefersCompactUmlFor(viewpointId: string, variant: BrowserViewpointVariant) {
  return COMPACT_UML_VIEWPOINT_IDS.has(viewpointId) || (viewpointId === 'persistence-model' && variant === 'show-entity-relations');
}

function uniqKinds(kinds: string[]) {
  return [...new Set(kinds)];
}

export function resolveBrowserViewpointPresentationPolicy(
  viewpoint: Pick<FullSnapshotViewpoint, 'id'> | null | undefined,
  variant: BrowserViewpointVariant = 'default',
  preference: BrowserViewpointPresentationPreference = 'auto',
): BrowserViewpointPresentationPolicy {
  if (!viewpoint) {
    return DEFAULT_BROWSER_VIEWPOINT_PRESENTATION_POLICY;
  }

  const prefersCompactUml = prefersCompactUmlFor(viewpoint.id, variant);

  if (preference === 'entity-graph') {
    return {
      viewpointId: viewpoint.id,
      variant,
      mode: 'entity-graph',
      collapseMembersByDefault: false,
      showAttributeCompartment: false,
      showOperationCompartment: false,
      compactMemberKinds: [],
      reason: 'Compact UML is disabled by the local browser presentation toggle, so the canvas uses the standard entity graph projection.',
    };
  }

  if (preference === 'compact-uml') {
    return {
      viewpointId: viewpoint.id,
      variant,
      mode: 'compact-uml',
      collapseMembersByDefault: true,
      showAttributeCompartment: true,
      showOperationCompartment: true,
      compactMemberKinds: uniqKinds(['FIELD', 'PROPERTY', 'FUNCTION', 'METHOD']),
      reason: prefersCompactUml
        ? 'This viewpoint is class-centric, so the browser prefers compact UML-style classifier rendering.'
        : 'Compact UML is enabled by the local browser presentation toggle, so the browser collapses class-like entities into classifier nodes when possible.',
    };
  }

  if (prefersCompactUml) {
    return {
      viewpointId: viewpoint.id,
      variant,
      mode: 'compact-uml',
      collapseMembersByDefault: true,
      showAttributeCompartment: true,
      showOperationCompartment: true,
      compactMemberKinds: uniqKinds(['FIELD', 'PROPERTY', 'FUNCTION', 'METHOD']),
      reason: 'This viewpoint is class-centric, so the browser prefers compact UML-style classifier rendering.',
    };
  }

  return {
    viewpointId: viewpoint.id,
    variant,
    mode: 'entity-graph',
    collapseMembersByDefault: false,
    showAttributeCompartment: false,
    showOperationCompartment: false,
    compactMemberKinds: [],
    reason: 'This viewpoint emphasizes relationships and flow, so the browser keeps the standard node-per-entity projection.',
  };
}

export function resolveBrowserStateViewpointPresentationPolicy(state: BrowserSessionState): BrowserViewpointPresentationPolicy {
  const appliedViewpoint = state.appliedViewpoint?.viewpoint ?? null;
  if (appliedViewpoint) {
    return resolveBrowserViewpointPresentationPolicy(appliedViewpoint, state.viewpointSelection.variant, state.viewpointPresentationPreference);
  }
  const selectedViewpointId = state.viewpointSelection.viewpointId;
  const selectedViewpoint = selectedViewpointId && state.index?.viewpointsById.get(selectedViewpointId)
    ? state.index.viewpointsById.get(selectedViewpointId) ?? null
    : null;
  return resolveBrowserViewpointPresentationPolicy(selectedViewpoint, state.viewpointSelection.variant, state.viewpointPresentationPreference);
}

export function appliesCompactUmlPresentation(
  policy: Pick<BrowserViewpointPresentationPolicy, 'mode' | 'collapseMembersByDefault'> | null | undefined,
) {
  return policy?.mode === 'compact-uml' && Boolean(policy.collapseMembersByDefault);
}
