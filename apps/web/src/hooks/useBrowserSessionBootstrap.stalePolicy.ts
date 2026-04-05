import type { SnapshotSummary } from '../app-model';
import type { BrowserSessionContextValue } from '../contexts/BrowserSessionContext';

export type BrowserSessionBootstrapStalePolicyInput = {
  workspaceId: string | null;
  repositoryId: string | null;
  snapshot: SnapshotSummary | null;
  currentState: Pick<BrowserSessionContextValue['state'], 'activeSnapshot'>;
};

export function shouldClearStaleBrowserSession(options: BrowserSessionBootstrapStalePolicyInput) {
  const activeSnapshot = options.currentState.activeSnapshot;
  if (!activeSnapshot) {
    return false;
  }

  if (!options.workspaceId) {
    return false;
  }

  if (activeSnapshot.workspaceId != options.workspaceId) {
    return true;
  }

  if (options.repositoryId && activeSnapshot.repositoryId !== options.repositoryId) {
    return true;
  }

  if (options.snapshot && activeSnapshot.snapshotId !== options.snapshot.id) {
    return true;
  }

  if (!options.snapshot && options.repositoryId && activeSnapshot.repositoryId === options.repositoryId) {
    return false;
  }

  return false;
}
