import { BROWSER_SESSION_REGRESSION_FIXTURES } from './fixtures/browserSessionRegressionFixtures';

describe('browserSession regression fixtures', () => {
  test.each(BROWSER_SESSION_REGRESSION_FIXTURES)('$name', ({ run, verify }) => {
    const state = run();
    verify(state);
  });
});
