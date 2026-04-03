import {
  browserSessionCanvasMutations,
  browserSessionFactsPanelMutations,
  browserSessionLifecycleMutations,
  browserSessionNavigationMutations,
  browserSessionViewpointMutations,
} from './mutations';

// Backward-compatible command surface for callers that apply mutations directly to a state snapshot.
export const browserSessionLifecycleCommands = browserSessionLifecycleMutations;
export const browserSessionNavigationCommands = browserSessionNavigationMutations;
export const browserSessionViewpointCommands = browserSessionViewpointMutations;
export const browserSessionCanvasCommands = browserSessionCanvasMutations;
export const browserSessionFactsPanelCommands = browserSessionFactsPanelMutations;
