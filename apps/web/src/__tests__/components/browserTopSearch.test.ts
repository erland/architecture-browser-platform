import type { BrowserSearchResult } from '../../browserSnapshotIndex';
import { toBrowserTopSearchAction, toBrowserTopSearchAddAction } from '../../components/browser-search/BrowserTopSearch';

function createResult(kind: BrowserSearchResult['kind'], id: string, scopeId: string | null = 'scope:web'): BrowserSearchResult {
  return {
    kind,
    id,
    title: id,
    subtitle: 'test',
    scopeId,
    score: 100,
  };
}

describe('BrowserTopSearch helpers', () => {
  test('maps scope hits to scope-selection actions', () => {
    expect(toBrowserTopSearchAction(createResult('scope', 'scope:browser'))).toEqual({
      type: 'select-scope',
      id: 'scope:browser',
      scopeId: 'scope:web',
      kind: 'scope',
    });
  });

  test('maps scope add actions to primary-entity analysis actions', () => {
    expect(toBrowserTopSearchAddAction(createResult('scope', 'scope:browser'))).toEqual({
      type: 'add-scope-primary-entities',
      id: 'scope:browser',
      scopeId: 'scope:web',
      kind: 'scope',
    });
  });

  test('maps entity/relationship/diagnostic hits to the correct activation actions', () => {
    expect(toBrowserTopSearchAction(createResult('entity', 'entity:browser')).type).toBe('open-entity');
    expect(toBrowserTopSearchAction(createResult('relationship', 'rel:1')).type).toBe('open-relationship');
    expect(toBrowserTopSearchAction(createResult('diagnostic', 'diag:1')).type).toBe('open-diagnostic');
  });
});
