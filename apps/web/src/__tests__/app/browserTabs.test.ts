import { browserTabs, isBrowserTabKey } from '../../routing/browserTabs';

describe('browserTabs', () => {
  test('describe local-only Browser modes', () => {
    expect(browserTabs).toHaveLength(5);
    expect(browserTabs.find((tab) => tab.key === 'layout')?.label).toBe('Structure');
    expect(browserTabs.find((tab) => tab.key === 'search')?.label).toBe('Inspect');
    expect(browserTabs.every((tab) => /local|browser|canvas|facts|search|scope|relationship|entity|architecture/i.test(tab.description))).toBe(true);
  });

  test('recognizes valid Browser mode keys', () => {
    expect(isBrowserTabKey('overview')).toBe(true);
    expect(isBrowserTabKey('layout')).toBe(true);
    expect(isBrowserTabKey('not-a-tab')).toBe(false);
  });
});
