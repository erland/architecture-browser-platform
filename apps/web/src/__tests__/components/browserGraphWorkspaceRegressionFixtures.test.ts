import { BROWSER_GRAPH_WORKSPACE_REGRESSION_FIXTURES } from './fixtures/browserGraphWorkspaceRegressionFixtures';

describe('BrowserGraphWorkspace regression fixtures', () => {
  test.each(BROWSER_GRAPH_WORKSPACE_REGRESSION_FIXTURES)('$name', ({ run }) => {
    run();
  });
});
