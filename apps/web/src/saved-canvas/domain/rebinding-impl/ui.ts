import type { SavedCanvasRebindResult } from './rebind';

export type SavedCanvasRebindingUiSummary = {
  rebindingState: 'EXACT' | 'PARTIAL' | 'UNRESOLVED';
  exactMatchCount: number;
  remappedCount: number;
  unresolvedCount: number;
  unresolvedNodeIds: string[];
  unresolvedEdgeIds: string[];
};

export function toSavedCanvasRebindingUiSummary(result: SavedCanvasRebindResult): SavedCanvasRebindingUiSummary {
  const rebindingState = result.document.bindings.rebinding?.rebindingState;
  return {
    rebindingState:
      rebindingState === 'EXACT' || rebindingState === 'PARTIAL' || rebindingState === 'UNRESOLVED'
        ? rebindingState
        : 'UNRESOLVED',
    exactMatchCount: result.exactMatchCount,
    remappedCount: result.remappedCount,
    unresolvedCount: result.unresolvedCount,
    unresolvedNodeIds: [...result.unresolvedNodeIds],
    unresolvedEdgeIds: [...result.unresolvedEdgeIds],
  };
}

export function buildSavedCanvasRebindingStatusMessage(input: {
  canvasName: string;
  targetSnapshotLabel: string;
  availabilityLabel?: string;
  summary: SavedCanvasRebindingUiSummary;
}) {
  const { canvasName, targetSnapshotLabel, availabilityLabel = '', summary } = input;
  const stateLabel = summary.rebindingState === 'EXACT'
    ? 'exactly rebound'
    : summary.rebindingState === 'PARTIAL'
      ? 'partially rebound'
      : 'could not be rebound cleanly';

  const matchSummary = summary.remappedCount > 0
    ? `${summary.exactMatchCount} exact matches and ${summary.remappedCount} fallback remap(s)`
    : `${summary.exactMatchCount} exact matches`;

  if (summary.unresolvedCount > 0) {
    return `${stateLabel[0].toUpperCase()}${stateLabel.slice(1)} ${canvasName} on selected snapshot ${targetSnapshotLabel}${availabilityLabel} with ${matchSummary} and ${summary.unresolvedCount} unresolved item(s). Review the unresolved items in the Canvases dialog.`;
  }
  if (summary.remappedCount > 0) {
    return `Partially rebound ${canvasName} on selected snapshot ${targetSnapshotLabel}${availabilityLabel} with ${matchSummary} and no unresolved items.`;
  }
  return `Exactly rebound ${canvasName} on selected snapshot ${targetSnapshotLabel}${availabilityLabel} with ${matchSummary}.`;
}
