import { createEmptyBrowserSessionState } from '../../browser-session/state';
import { createBoundBrowserSessionActionGroups } from '../../browser-session/commands-api';
import type { BrowserSessionState } from '../../browser-session/types';

describe('browserSession action bindings', () => {
  test('binds pure browser-session mutations to a setState boundary', () => {
    let currentState: BrowserSessionState = createEmptyBrowserSessionState();
    const setState = (next: BrowserSessionState | ((state: BrowserSessionState) => BrowserSessionState)) => {
      currentState = typeof next === 'function' ? next(currentState) : next;
    };

    const actions = createBoundBrowserSessionActionGroups(setState);
    actions.navigation.setTreeMode('package');
    actions.factsPanel.open('entity', 'right');

    expect(currentState.treeMode).toBe('package');
    expect(currentState.factsPanelMode).toBe('entity');
    expect(currentState.factsPanelLocation).toBe('right');
  });
});
