import type { SnapshotSummary } from '../app-model';
import type { BrowserSessionContextValue } from '../contexts/BrowserSessionContext';
import { resetBrowserSessionForBootstrap } from './useBrowserSessionBootstrap.application';
import {
  deriveBrowserSessionBootstrapImmediateState,
  executeBrowserSessionBootstrapPlan,
  resolveBrowserSessionBootstrapCompletedKey,
} from './useBrowserSessionBootstrap.execution';
import { toBrowserSessionBootstrapErrorMessage } from './useBrowserSessionBootstrap.messages';
import { computeBrowserSessionBootstrapPlan } from './useBrowserSessionBootstrap.planner';
import type { BrowserSessionBootstrapStatus, BrowserSessionBootstrapReplaceState } from './useBrowserSessionBootstrap.types';

export type BrowserSessionBootstrapOrchestrationInput = {
  workspaceId: string | null;
  repositoryId: string | null;
  snapshot: SnapshotSummary | null;
  currentState: Pick<BrowserSessionContextValue['state'], 'activeSnapshot' | 'index' | 'payload'>;
  activeSnapshotId: string | null;
  hasIndex: boolean;
  hasPayload: boolean;
  completedBootstrapKey: string | null;
  openSnapshotSession: BrowserSessionContextValue['lifecycle']['openSnapshotSession'];
  replaceState: BrowserSessionBootstrapReplaceState;
  applyRenderState: (status: BrowserSessionBootstrapStatus, message: string | null) => void;
  updateCompletedBootstrapKey: (nextCompletedBootstrapKey: string | null) => void;
};

export async function orchestrateBrowserSessionBootstrap(
  options: BrowserSessionBootstrapOrchestrationInput,
): Promise<void> {
  const plan = computeBrowserSessionBootstrapPlan({
    workspaceId: options.workspaceId,
    repositoryId: options.repositoryId,
    snapshot: options.snapshot,
    currentState: options.currentState,
    activeSnapshotId: options.activeSnapshotId,
    hasIndex: options.hasIndex,
    hasPayload: options.hasPayload,
    completedBootstrapKey: options.completedBootstrapKey,
  });

  const immediateState = deriveBrowserSessionBootstrapImmediateState(plan);
  options.updateCompletedBootstrapKey(immediateState.completedBootstrapKey);
  if (immediateState.shouldClearStaleSession) {
    resetBrowserSessionForBootstrap(options.replaceState);
  }
  options.applyRenderState(immediateState.status, immediateState.message);
  if (immediateState.shouldStop) {
    return;
  }

  try {
    const outcome = await executeBrowserSessionBootstrapPlan({
      plan,
      workspaceId: options.workspaceId,
      repositoryId: options.repositoryId,
      snapshot: options.snapshot,
      currentState: options.currentState,
      openSnapshotSession: options.openSnapshotSession,
      clearSnapshotSession: () => resetBrowserSessionForBootstrap(options.replaceState),
    });
    if (!outcome) {
      return;
    }

    options.updateCompletedBootstrapKey(resolveBrowserSessionBootstrapCompletedKey({
      plan,
      outcome,
      previousCompletedBootstrapKey: immediateState.completedBootstrapKey,
    }));
    options.applyRenderState(outcome.status, outcome.message);
  } catch (caught) {
    options.applyRenderState('failed', `Browser session bootstrap failed: ${toBrowserSessionBootstrapErrorMessage(caught)}`);
  }
}
