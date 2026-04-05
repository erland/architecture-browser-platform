import { bootstrapPreparedBrowserSession as legacyBootstrapPreparedBrowserSession } from '../../hooks/useBrowserSessionBootstrap';
import { bootstrapPreparedBrowserSession } from '../../hooks/useBrowserSessionBootstrap.bootstrapPrepared';

describe('browser session bootstrap seams', () => {
  test('legacy hook module re-export stays aligned with canonical prepared bootstrap implementation', () => {
    expect(legacyBootstrapPreparedBrowserSession).toBe(bootstrapPreparedBrowserSession);
  });
});
