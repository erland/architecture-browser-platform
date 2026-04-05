import {
  browserSessionCanvasCommands,
  browserSessionCanvasMutations,
  browserSessionFactsPanelCommands,
  browserSessionFactsPanelMutations,
  browserSessionLifecycleCommands,
  browserSessionLifecycleMutations,
  browserSessionNavigationCommands,
  browserSessionNavigationMutations,
  browserSessionViewpointCommands,
  browserSessionViewpointMutations,
} from '../../browser-session';

describe('browser session command seams', () => {
  it('keeps command bundles as aliases of the canonical mutation groups', () => {
    expect(browserSessionLifecycleCommands).toBe(browserSessionLifecycleMutations);
    expect(browserSessionNavigationCommands).toBe(browserSessionNavigationMutations);
    expect(browserSessionViewpointCommands).toBe(browserSessionViewpointMutations);
    expect(browserSessionCanvasCommands).toBe(browserSessionCanvasMutations);
    expect(browserSessionFactsPanelCommands).toBe(browserSessionFactsPanelMutations);
  });
});
