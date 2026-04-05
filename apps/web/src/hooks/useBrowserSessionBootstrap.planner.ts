import type { SnapshotSummary } from '../app-model';
import type { BrowserSessionContextValue } from '../contexts/BrowserSessionContext';
import { shouldClearStaleBrowserSession } from './useBrowserSessionBootstrap.stalePolicy';
import { buildBrowserSessionLoadingMessage, buildBrowserSessionReadyMessage } from './useBrowserSessionBootstrap.messages';

export type BrowserSessionBootstrapPlannerInput = {
  workspaceId: string | null;
  repositoryId: string | null;
  snapshot: SnapshotSummary | null;
  currentState: Pick<BrowserSessionContextValue['state'], 'activeSnapshot' | 'index' | 'payload'>;
  activeSnapshotId: string | null;
  hasIndex: boolean;
  hasPayload: boolean;
  completedBootstrapKey: string | null;
};

export type BrowserSessionBootstrapPlan =
  | {
      kind: 'idle';
      status: 'idle';
      message: null;
      bootstrapTargetKey: null;
      shouldClearStaleSession: boolean;
    }
  | {
      kind: 'already-ready';
      status: 'ready';
      message: string;
      bootstrapTargetKey: string;
      shouldClearStaleSession: false;
    }
  | {
      kind: 'bootstrap-prepared-snapshot';
      status: 'loading';
      message: string;
      bootstrapTargetKey: string;
      shouldClearStaleSession: false;
    };

export function computeBrowserSessionBootstrapPlan(
  options: BrowserSessionBootstrapPlannerInput,
): BrowserSessionBootstrapPlan {
  const snapshotId = options.snapshot?.id ?? null;
  const bootstrapTargetKey = snapshotId && options.workspaceId ? `${options.workspaceId}:${snapshotId}` : null;

  if (!options.workspaceId || !options.snapshot || !bootstrapTargetKey) {
    return {
      kind: 'idle',
      status: 'idle',
      message: null,
      bootstrapTargetKey: null,
      shouldClearStaleSession: shouldClearStaleBrowserSession({
        workspaceId: options.workspaceId,
        repositoryId: options.repositoryId,
        snapshot: options.snapshot,
        currentState: options.currentState,
      }),
    };
  }

  if (
    options.completedBootstrapKey === bootstrapTargetKey &&
    options.activeSnapshotId === snapshotId &&
    options.hasIndex &&
    options.hasPayload
  ) {
    return {
      kind: 'already-ready',
      status: 'ready',
      message: buildBrowserSessionReadyMessage(options.snapshot.snapshotKey),
      bootstrapTargetKey,
      shouldClearStaleSession: false,
    };
  }

  return {
    kind: 'bootstrap-prepared-snapshot',
    status: 'loading',
    message: buildBrowserSessionLoadingMessage(options.snapshot.snapshotKey),
    bootstrapTargetKey,
    shouldClearStaleSession: false,
  };
}
