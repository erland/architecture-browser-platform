import { SAVED_CANVAS_REGRESSION_FIXTURES } from './fixtures/savedCanvasRegressionFixtures';

describe('savedCanvas regression fixtures', () => {
  test.each(SAVED_CANVAS_REGRESSION_FIXTURES)('$name', ({ run }) => {
    run();
  });
});
