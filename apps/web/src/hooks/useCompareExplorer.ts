import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { comparisonSnapshotOptions } from '../compareViewModel';
import { platformApi } from '../platformApi';
import type { SnapshotComparison, SnapshotSummary } from '../appModel';

type CompareExplorerFeedback = {
  setError: (value: string | null) => void;
};

function toErrorMessage(caught: unknown) {
  return caught instanceof Error ? caught.message : 'Unknown error';
}

export type UseCompareExplorerArgs = {
  selectedWorkspaceId: string | null;
  snapshots: SnapshotSummary[];
  selectedSnapshotId: string | null;
  setSelectedSnapshotId: Dispatch<SetStateAction<string | null>>;
  feedback: CompareExplorerFeedback;
};

export function useCompareExplorer({
  selectedWorkspaceId,
  snapshots,
  selectedSnapshotId,
  setSelectedSnapshotId,
  feedback,
}: UseCompareExplorerArgs) {
  const { setError } = feedback;
  const [comparisonSnapshotId, setComparisonSnapshotId] = useState<string>('');
  const [snapshotComparison, setSnapshotComparison] = useState<SnapshotComparison | null>(null);

  const selectedSnapshot = useMemo(
    () => snapshots.find((snapshot) => snapshot.id === selectedSnapshotId) ?? null,
    [selectedSnapshotId, snapshots],
  );

  const comparisonOptions = useMemo(
    () => comparisonSnapshotOptions(snapshots, selectedSnapshotId),
    [snapshots, selectedSnapshotId],
  );

  useEffect(() => {
    setSelectedSnapshotId((current) => (
      current && snapshots.some((snapshot) => snapshot.id === current)
        ? current
        : (snapshots[0]?.id ?? null)
    ));
  }, [snapshots, setSelectedSnapshotId]);

  useEffect(() => {
    setComparisonSnapshotId((current) => (
      current && current !== selectedSnapshotId && snapshots.some((snapshot) => snapshot.id === current)
        ? current
        : ''
    ));
  }, [selectedSnapshotId, snapshots]);

  useEffect(() => {
    if (selectedWorkspaceId && selectedSnapshotId && comparisonSnapshotId) {
      void loadSnapshotComparison(selectedWorkspaceId, selectedSnapshotId, comparisonSnapshotId);
      return;
    }
    setSnapshotComparison(null);
  }, [selectedWorkspaceId, selectedSnapshotId, comparisonSnapshotId]);

  async function loadSnapshotComparison(workspaceId: string, snapshotId: string, otherSnapshotId: string) {
    try {
      const payload = await platformApi.getSnapshotComparison<SnapshotComparison>(workspaceId, snapshotId, otherSnapshotId);
      setSnapshotComparison(payload);
      setError(null);
    } catch (caught) {
      setError(toErrorMessage(caught));
    }
  }

  return {
    selectedSnapshot,
    comparisonSnapshotId,
    setComparisonSnapshotId,
    comparisonOptions,
    snapshotComparison,
  };
}
