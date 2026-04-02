import type { FullSnapshotViewpoint } from '../../app-model';
import type { BrowserResolvedViewpointGraph, BrowserSnapshotIndex, BrowserViewpointScopeMode, BrowserViewpointVariant } from '../../browser-snapshot';
import type { BrowserViewpointApplyMode, BrowserViewpointPresentationPreference, BrowserViewpointSelection } from '../../browser-session';
import { getAvailableViewpoints } from '../../browser-snapshot';

const VIEWPOINT_SCOPE_MODE_META: Record<BrowserViewpointScopeMode, { label: string; description: string }> = {
  'selected-scope': { label: 'Current scope', description: 'Only entities inside the selected scope.' },
  'selected-subtree': { label: 'Current subtree', description: 'Include descendants below the selected scope.' },
  'whole-snapshot': { label: 'Whole snapshot', description: 'Ignore scope limits and search the full snapshot.' },
};

const VIEWPOINT_VARIANT_META: Record<BrowserViewpointVariant, { label: string; description: string }> = {
  'default': { label: 'Default', description: 'Use the exported viewpoint as-is.' },
  'show-writers': { label: 'Show writers', description: 'Bias persistence views toward components that update stored structures.' },
  'show-readers': { label: 'Show readers', description: 'Bias persistence views toward components that read stored structures.' },
  'show-upstream-callers': { label: 'Show upstream callers', description: 'Expand to upstream callers that trigger the selected flow.' },
  'show-entity-relations': { label: 'Show entity relations', description: 'Show persistent entities and the relations between them.' },
};


const VIEWPOINT_PRESENTATION_META: Record<BrowserViewpointPresentationPreference, { label: string; description: string }> = {
  auto: { label: 'Auto', description: "Use the browser's local default for the selected viewpoint." },
  'entity-graph': { label: 'Entity graph', description: 'Show separate class, field, and method nodes on the canvas.' },
  'compact-uml': { label: 'Compact UML', description: 'Collapse class members into UML-style classifier compartments when possible.' },
};

const VIEWPOINT_APPLY_MODE_META: Record<BrowserViewpointApplyMode, { label: string; description: string }> = {
  replace: { label: 'Replace canvas', description: 'Clear the canvas before adding viewpoint entities.' },
  merge: { label: 'Add to canvas', description: 'Keep current canvas content and merge the viewpoint.' },
};

function titleCaseWords(value: string) {
  return value
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatViewpointLabel(viewpoint: Pick<FullSnapshotViewpoint, 'id' | 'title'>) {
  return viewpoint.title?.trim() || titleCaseWords(viewpoint.id);
}

export function formatViewpointAvailability(viewpoint: Pick<FullSnapshotViewpoint, 'availability' | 'confidence'>) {
  const availabilityLabel = titleCaseWords(viewpoint.availability);
  return `${availabilityLabel} · ${Math.round(viewpoint.confidence * 100)}% confidence`;
}

export type BrowserViewpointControlsProps = {
  index: BrowserSnapshotIndex | null;
  selectedScopeLabel: string | null;
  selection: BrowserViewpointSelection;
  appliedViewpoint: BrowserResolvedViewpointGraph | null;
  presentationPreference: BrowserViewpointPresentationPreference;
  onSelectViewpoint: (viewpointId: string | null) => void;
  onSelectScopeMode: (scopeMode: BrowserViewpointScopeMode) => void;
  onSelectApplyMode: (applyMode: BrowserViewpointApplyMode) => void;
  onSelectVariant: (variant: BrowserViewpointVariant) => void;
  onSelectPresentationPreference: (preference: BrowserViewpointPresentationPreference) => void;
  onApplyViewpoint: () => void;
};

export function BrowserViewpointControls({
  index,
  selectedScopeLabel,
  selection,
  appliedViewpoint,
  presentationPreference,
  onSelectViewpoint,
  onSelectScopeMode,
  onSelectApplyMode,
  onSelectVariant,
  onSelectPresentationPreference,
  onApplyViewpoint,
}: BrowserViewpointControlsProps) {
  const viewpoints = index ? getAvailableViewpoints(index, { includePartial: true }) : [];
  const selectedViewpoint = selection.viewpointId ? viewpoints.find((viewpoint) => viewpoint.id === selection.viewpointId) ?? null : null;
  const supportedVariants: BrowserViewpointVariant[] = !selectedViewpoint ? ['default'] : selectedViewpoint.id === 'persistence-model' ? ['default', 'show-writers', 'show-readers', 'show-upstream-callers', 'show-entity-relations'] : selectedViewpoint.id === 'request-handling' ? ['default', 'show-upstream-callers'] : ['default'];
  const helperText = selection.scopeMode === 'selected-scope'
    ? selectedScopeLabel ? `Viewpoint seeds are limited to ${selectedScopeLabel}.` : 'Select a scope to limit viewpoint seeding to the current branch.'
    : selection.scopeMode === 'selected-subtree'
      ? selectedScopeLabel ? `Viewpoint seeds include descendants under ${selectedScopeLabel}.` : 'Select a scope to limit viewpoint seeding to the current subtree.'
      : 'Viewpoint seeds are resolved across the full prepared snapshot.';

  return (
    <section className="card browser-viewpoint-controls" aria-label="Viewpoint controls">
      <div className="browser-viewpoint-controls__header">
        <div>
          <p className="eyebrow">Viewpoints</p>
          <h3>Auto-seed canvas analysis</h3>
        </div>
        {appliedViewpoint ? <span className="badge badge--status">Applied</span> : <span className="badge">Manual canvas</span>}
      </div>

      <p className="muted browser-viewpoint-controls__hint">
        Choose a predefined architectural slice and let the Browser add matching entities and relationships to the canvas.
      </p>

      <label className="browser-viewpoint-controls__field" htmlFor="browser-viewpoint-select">
        <span className="eyebrow">Viewpoint</span>
        <select
          id="browser-viewpoint-select"
          value={selection.viewpointId ?? ''}
          onChange={(event) => onSelectViewpoint(event.target.value || null)}
          disabled={!index || viewpoints.length === 0}
        >
          <option value="">Select viewpoint</option>
          {viewpoints.map((viewpoint) => (
            <option key={viewpoint.id} value={viewpoint.id}>
              {formatViewpointLabel(viewpoint)}
            </option>
          ))}
        </select>
      </label>

      {selectedViewpoint ? (
        <div className="browser-viewpoint-controls__selection card">
          <div className="browser-viewpoint-controls__selection-header">
            <strong>{formatViewpointLabel(selectedViewpoint)}</strong>
            <span className="badge">{formatViewpointAvailability(selectedViewpoint)}</span>
            {selectedViewpoint.availability === 'partial' ? <span className="badge">Partial coverage</span> : null}
          </div>
          <p className="muted">{selectedViewpoint.description}</p>
          <p className="muted">{helperText}</p>
          <div className="browser-viewpoint-controls__stats" aria-label="Selected viewpoint coverage">
            <span className="badge">{selectedViewpoint.seedRoleIds.length} seed roles</span>
            <span className="badge">{selectedViewpoint.seedEntityIds.length} explicit seeds</span>
            <span className="badge">{selectedViewpoint.expandViaSemantics.length} expansion semantics</span>
          </div>
          {appliedViewpoint?.viewpoint.id === selectedViewpoint.id ? (
            <div className="browser-viewpoint-controls__stats" aria-label="Applied viewpoint result">
              <span className="badge badge--status">{appliedViewpoint?.entityIds.length ?? 0} entities on canvas</span>
              <span className="badge badge--status">{appliedViewpoint?.relationshipIds.length ?? 0} relationships on canvas</span>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="muted browser-viewpoint-controls__empty">No viewpoint selected yet.</p>
      )}

      <div className="browser-viewpoint-controls__toggles" role="group" aria-label="Viewpoint scope mode">
        {Object.entries(VIEWPOINT_SCOPE_MODE_META).map(([scopeMode, meta]) => (
          <button
            key={scopeMode}
            type="button"
            className={selection.scopeMode === scopeMode ? 'button-secondary browser-viewpoint-controls__toggle browser-viewpoint-controls__toggle--active' : 'button-secondary browser-viewpoint-controls__toggle'}
            onClick={() => onSelectScopeMode(scopeMode as BrowserViewpointScopeMode)}
            disabled={!index}
            title={meta.description}
          >
            {meta.label}
          </button>
        ))}
      </div>

      <div className="browser-viewpoint-controls__toggles" role="group" aria-label="Viewpoint variant">
        {supportedVariants.map((variant) => {
          const meta = VIEWPOINT_VARIANT_META[variant];
          return (
            <button
              key={variant}
              type="button"
              className={selection.variant === variant ? 'button-secondary browser-viewpoint-controls__toggle browser-viewpoint-controls__toggle--active' : 'button-secondary browser-viewpoint-controls__toggle'}
              onClick={() => onSelectVariant(variant)}
              disabled={!index || !selectedViewpoint}
              title={meta.description}
            >
              {meta.label}
            </button>
          );
        })}
      </div>

      <div className="browser-viewpoint-controls__toggles" role="group" aria-label="Viewpoint presentation mode">
        {Object.entries(VIEWPOINT_PRESENTATION_META).map(([preference, meta]) => (
          <button
            key={preference}
            type="button"
            className={presentationPreference === preference ? 'button-secondary browser-viewpoint-controls__toggle browser-viewpoint-controls__toggle--active' : 'button-secondary browser-viewpoint-controls__toggle'}
            onClick={() => onSelectPresentationPreference(preference as BrowserViewpointPresentationPreference)}
            disabled={!index || !selectedViewpoint}
            title={meta.description}
          >
            {meta.label}
          </button>
        ))}
      </div>

      <div className="browser-viewpoint-controls__toggles" role="group" aria-label="Viewpoint apply mode">
        {Object.entries(VIEWPOINT_APPLY_MODE_META).map(([applyMode, meta]) => (
          <button
            key={applyMode}
            type="button"
            className={selection.applyMode === applyMode ? 'button-secondary browser-viewpoint-controls__toggle browser-viewpoint-controls__toggle--active' : 'button-secondary browser-viewpoint-controls__toggle'}
            onClick={() => onSelectApplyMode(applyMode as BrowserViewpointApplyMode)}
            disabled={!index}
            title={meta.description}
          >
            {meta.label}
          </button>
        ))}
      </div>

      <div className="browser-viewpoint-controls__actions">
        <button
          type="button"
          onClick={onApplyViewpoint}
          disabled={!index || !selectedViewpoint || selectedViewpoint.availability === 'unavailable'}
        >
          Apply viewpoint
        </button>
        <span className="muted">{viewpoints.length > 0 ? `${viewpoints.length} viewpoint${viewpoints.length === 1 ? '' : 's'} available` : 'No viewpoints exported for this snapshot'}</span>
      </div>
    </section>
  );
}
