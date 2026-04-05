import type { SnapshotSummary } from '../app-model';
import type { BrowserSessionContextValue } from '../contexts/BrowserSessionContext';
import { getBrowserPreparedSnapshotCache, type PreparedSnapshotCachePort } from '../browser-snapshot';
import type { BrowserSessionBootstrapOutcome, BrowserSessionBootstrapStatus } from './useBrowserSessionBootstrap.types';
import type { BrowserSessionBootstrapPlan } from './useBrowserSessionBootstrap.planner';
import { bootstrapPreparedBrowserSession } from './useBrowserSessionBootstrap.bootstrapPrepared';

export type BrowserSessionBootstrapImmediateState = {
  status: BrowserSessionBootstrapStatus;
  message: string | null;
  shouldClearStaleSession: boolean;
  shouldStop: boolean;
  completedBootstrapKey: string | null;
};

export function deriveBrowserSessionBootstrapImmediateState(
  plan: BrowserSessionBootstrapPlan,
): BrowserSessionBootstrapImmediateState {
  if (plan.kind === 'idle') {
    return {
      status: plan.status,
      message: plan.message,
      shouldClearStaleSession: plan.shouldClearStaleSession,
      shouldStop: true,
      completedBootstrapKey: null,
    };
  }

  if (plan.kind === 'already-ready') {
    return {
      status: plan.status,
      message: plan.message,
      shouldClearStaleSession: false,
      shouldStop: true,
      completedBootstrapKey: plan.bootstrapTargetKey,
    };
  }

  return {
    status: plan.status,
    message: plan.message,
    shouldClearStaleSession: false,
    shouldStop: false,
    completedBootstrapKey: null,
  };
}

export function resolveBrowserSessionBootstrapCompletedKey(options: {
  plan: BrowserSessionBootstrapPlan;
  outcome: BrowserSessionBootstrapOutcome;
  previousCompletedBootstrapKey: string | null;
}) {
  const { plan, outcome, previousCompletedBootstrapKey } = options;
  if (plan.kind === 'bootstrap-prepared-snapshot' && outcome.status === 'ready') {
    return plan.bootstrapTargetKey;
  }
  return previousCompletedBootstrapKey;
}

export type BrowserSessionBootstrapExecutionInput = {
  plan: BrowserSessionBootstrapPlan;
  workspaceId: string | null;
  repositoryId: string | null;
  snapshot: SnapshotSummary | null;
  currentState: Pick<BrowserSessionContextValue['state'], 'activeSnapshot' | 'index' | 'payload'>;
  openSnapshotSession: BrowserSessionContextValue['lifecycle']['openSnapshotSession'];
  clearSnapshotSession: () => void;
  cache?: PreparedSnapshotCachePort;
};

export async function executeBrowserSessionBootstrapPlan(
  options: BrowserSessionBootstrapExecutionInput,
): Promise<BrowserSessionBootstrapOutcome | null> {
  const { plan } = options;
  if (plan.kind !== 'bootstrap-prepared-snapshot') {
    return null;
  }

  return bootstrapPreparedBrowserSession({
    cache: options.cache ?? getBrowserPreparedSnapshotCache(),
    workspaceId: options.workspaceId,
    repositoryId: options.repositoryId,
    snapshot: options.snapshot,
    currentState: options.currentState,
    openSnapshotSession: options.openSnapshotSession,
    clearSnapshotSession: options.clearSnapshotSession,
  });
}
