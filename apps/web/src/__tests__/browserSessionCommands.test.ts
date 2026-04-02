import {
  browserSessionCanvasCommands,
  browserSessionFactsPanelCommands,
  browserSessionLifecycleCommands,
  browserSessionNavigationCommands,
  browserSessionViewpointCommands,
} from '../browserSessionStore';

describe('browserSessionStore command groups', () => {
  it('exposes lifecycle commands separately from state helpers', () => {
    expect(typeof browserSessionLifecycleCommands.openSnapshotSession).toBe('function');
  });

  it('exposes navigation commands for scope, search, and tree mode changes', () => {
    expect(typeof browserSessionNavigationCommands.selectBrowserScope).toBe('function');
    expect(typeof browserSessionNavigationCommands.setBrowserSearch).toBe('function');
    expect(typeof browserSessionNavigationCommands.setBrowserTreeMode).toBe('function');
  });

  it('exposes viewpoint commands as a focused command surface', () => {
    expect(typeof browserSessionViewpointCommands.setSelectedViewpoint).toBe('function');
    expect(typeof browserSessionViewpointCommands.setViewpointScopeMode).toBe('function');
    expect(typeof browserSessionViewpointCommands.setViewpointApplyMode).toBe('function');
    expect(typeof browserSessionViewpointCommands.setViewpointVariant).toBe('function');
    expect(typeof browserSessionViewpointCommands.setViewpointPresentationPreference).toBe('function');
    expect(typeof browserSessionViewpointCommands.applySelectedViewpoint).toBe('function');
  });

  it('exposes canvas commands separately from facts-panel commands', () => {
    expect(typeof browserSessionCanvasCommands.addEntityToCanvas).toBe('function');
    expect(typeof browserSessionCanvasCommands.arrangeAllCanvasNodesInteractive).toBe('function');
    expect(typeof browserSessionCanvasCommands.setCanvasViewport).toBe('function');
    expect(typeof browserSessionFactsPanelCommands.focusBrowserElement).toBe('function');
    expect(typeof browserSessionFactsPanelCommands.openFactsPanel).toBe('function');
  });
});
