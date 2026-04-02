import { useEffect } from 'react';
import type { BrowserSnapshotIndex } from '../../browser-snapshot';
import type { BrowserResolvedViewpointGraph, BrowserViewpointScopeMode, BrowserViewpointVariant } from '../../browser-snapshot';
import type { BrowserViewpointApplyMode, BrowserViewpointPresentationPreference, BrowserViewpointSelection } from '../../browser-session';
import { BrowserViewpointControls } from './BrowserViewpointControls';

export type BrowserViewpointDialogProps = {
  isOpen: boolean;
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
  onClose: () => void;
};

export function BrowserViewpointDialog({
  isOpen,
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
  onClose,
}: BrowserViewpointDialogProps) {
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const currentViewpointLabel = appliedViewpoint?.viewpoint.title ?? appliedViewpoint?.viewpoint.id ?? selection.viewpointId ?? 'Manual canvas';

  return (
    <div className="browser-dialog" role="presentation">
      <button
        type="button"
        className="browser-dialog__backdrop"
        aria-label="Close viewpoints dialog"
        onClick={onClose}
      />
      <section
        className="card browser-dialog__surface browser-dialog__surface--viewpoints"
        role="dialog"
        aria-modal="true"
        aria-labelledby="browser-viewpoint-dialog-title"
      >
        <div className="browser-dialog__header">
          <div>
            <p className="eyebrow">Canvas analysis</p>
            <h2 id="browser-viewpoint-dialog-title">Viewpoints</h2>
            <p className="muted browser-dialog__lead">
              Add or replace canvas content from predefined architectural viewpoints without keeping the viewpoint controls visible all the time.
            </p>
          </div>
          <button type="button" className="button-secondary" onClick={onClose}>Close</button>
        </div>

        <div className="browser-dialog__summary" aria-label="Current viewpoint summary">
          <span className="badge">Current {currentViewpointLabel}</span>
          {selectedScopeLabel ? <span className="badge">Scope {selectedScopeLabel}</span> : <span className="badge">Scope Entire snapshot</span>}
        </div>

        <BrowserViewpointControls
          index={index}
          selectedScopeLabel={selectedScopeLabel}
          selection={selection}
          appliedViewpoint={appliedViewpoint}
          presentationPreference={presentationPreference}
          onSelectViewpoint={onSelectViewpoint}
          onSelectScopeMode={onSelectScopeMode}
          onSelectApplyMode={onSelectApplyMode}
          onSelectVariant={onSelectVariant}
          onSelectPresentationPreference={onSelectPresentationPreference}
          onApplyViewpoint={onApplyViewpoint}
        />
      </section>
    </div>
  );
}
