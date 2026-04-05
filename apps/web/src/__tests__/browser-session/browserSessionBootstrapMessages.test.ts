import {
  buildBrowserSessionLoadingMessage,
  buildBrowserSessionReadyMessage,
  buildPreparedSnapshotFetchFailureMessage,
  buildPreparedSnapshotUnavailableMessage,
  toBrowserSessionBootstrapErrorMessage,
} from '../../hooks/useBrowserSessionBootstrap.messages';

describe('browser session bootstrap messages', () => {
  test('builds ready and loading messages from the snapshot key', () => {
    expect(buildBrowserSessionReadyMessage('platform-main')).toBe(
      'Browser session ready for snapshot platform-main.',
    );
    expect(buildBrowserSessionLoadingMessage('platform-main')).toBe(
      'Loading prepared Browser session for snapshot platform-main…',
    );
  });

  test('builds unavailable and fetch-failure messages from the snapshot key', () => {
    expect(buildPreparedSnapshotUnavailableMessage('platform-main')).toBe(
      'Snapshot platform-main is not available locally and cannot be prepared right now.',
    );
    expect(buildPreparedSnapshotFetchFailureMessage('platform-main', new Error('boom'))).toBe(
      'Failed to prepare snapshot platform-main for Browser use. boom',
    );
  });

  test('normalizes unknown bootstrap errors', () => {
    expect(toBrowserSessionBootstrapErrorMessage(new Error('nope'))).toBe('nope');
    expect(toBrowserSessionBootstrapErrorMessage('mystery')).toBe('Unknown error');
  });
});
