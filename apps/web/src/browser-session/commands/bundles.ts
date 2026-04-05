import {
  browserSessionCanvasMutations,
  browserSessionFactsPanelMutations,
  browserSessionLifecycleMutations,
  browserSessionNavigationMutations,
  browserSessionViewpointMutations,
} from './mutations';

/**
 * Backward-compatible command aliases for callers that still use the older
 * "commands" naming while applying the same mutation functions directly.
 *
 * Keep these as aliases only so the canonical grouped surfaces remain the
 * focused mutation collections in mutations.ts.
 */
export const browserSessionLifecycleCommands = browserSessionLifecycleMutations;
export const browserSessionNavigationCommands = browserSessionNavigationMutations;
export const browserSessionViewpointCommands = browserSessionViewpointMutations;
export const browserSessionCanvasCommands = browserSessionCanvasMutations;
export const browserSessionFactsPanelCommands = browserSessionFactsPanelMutations;
