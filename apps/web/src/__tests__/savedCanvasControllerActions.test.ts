import {
  runSavedCanvasBusyControllerAction,
  runSavedCanvasPassiveControllerAction,
} from '../views/savedCanvasControllerActions';

describe('savedCanvasControllerActions', () => {
  it('wraps busy controller actions with busy state transitions', async () => {
    const busyStates: boolean[] = [];
    const messages: Array<string | null> = [];

    await runSavedCanvasBusyControllerAction({
      setBusy: (busy) => busyStates.push(busy),
      setStatusMessage: (message) => messages.push(message),
      failureMessage: 'fallback',
      action: async () => {},
    });

    expect(busyStates).toEqual([true, false]);
    expect(messages).toEqual([]);
  });

  it('reports thrown errors from busy controller actions', async () => {
    const busyStates: boolean[] = [];
    const messages: Array<string | null> = [];

    await runSavedCanvasBusyControllerAction({
      setBusy: (busy) => busyStates.push(busy),
      setStatusMessage: (message) => messages.push(message),
      failureMessage: 'fallback',
      action: async () => {
        throw new Error('broken');
      },
    });

    expect(busyStates).toEqual([true, false]);
    expect(messages).toEqual(['broken']);
  });

  it('uses fallback messages for passive controller actions with unknown failures', async () => {
    const messages: Array<string | null> = [];

    await runSavedCanvasPassiveControllerAction({
      setStatusMessage: (message) => messages.push(message),
      failureMessage: 'fallback',
      action: async () => {
        throw 'unknown';
      },
    });

    expect(messages).toEqual(['fallback']);
  });
});
