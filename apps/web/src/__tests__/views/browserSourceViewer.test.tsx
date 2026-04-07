import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { SourceViewReadResponse } from '../../app-model';
import { BrowserSourceViewDialog, buildHighlightedSourceTokens, buildSourceViewLines } from '../../components/browser-source-view';

const response: SourceViewReadResponse = {
  path: 'src/components/BrowserFactsPanel.tsx',
  language: 'tsx',
  totalLineCount: 3,
  fileSizeBytes: 74,
  requestedStartLine: 2,
  requestedEndLine: 3,
  sourceText: 'export function BrowserFactsPanel() {\n  return <div />;\n}\n',
};

describe('BrowserSourceViewDialog', () => {
  test('builds line models with focused range', () => {
    expect(buildSourceViewLines(response)).toEqual([
      { number: 1, text: 'export function BrowserFactsPanel() {', isFocused: false },
      { number: 2, text: '  return <div />;', isFocused: true },
      { number: 3, text: '}', isFocused: true },
    ]);
  });

  test('builds highlighted tokens for language-aware rendering', () => {
    expect(buildHighlightedSourceTokens('export function test() {', 'typescript')).toEqual([
      { text: 'export', className: 'browser-source-view__token browser-source-view__token--keyword' },
      { text: ' ' },
      { text: 'function', className: 'browser-source-view__token browser-source-view__token--keyword' },
      { text: ' ' },
      { text: 'test' },
      { text: '(', className: 'browser-source-view__token browser-source-view__token--punctuation' },
      { text: ')', className: 'browser-source-view__token browser-source-view__token--punctuation' },
      { text: ' ' },
      { text: '{', className: 'browser-source-view__token browser-source-view__token--punctuation' },
    ]);
  });


  test('highlights java annotations and types, and colors xml closing delimiters', () => {
    expect(buildHighlightedSourceTokens('@Entity public class Team {', 'java')).toEqual([
      { text: '@Entity', className: 'browser-source-view__token browser-source-view__token--annotation' },
      { text: ' ' },
      { text: 'public', className: 'browser-source-view__token browser-source-view__token--keyword' },
      { text: ' ' },
      { text: 'class', className: 'browser-source-view__token browser-source-view__token--keyword' },
      { text: ' ' },
      { text: 'Team', className: 'browser-source-view__token browser-source-view__token--type' },
      { text: ' ' },
      { text: '{', className: 'browser-source-view__token browser-source-view__token--punctuation' },
    ]);

    expect(buildHighlightedSourceTokens('<artifactId>something</artifactId>', 'xml')).toEqual([
      { text: '<artifactId', className: 'browser-source-view__token browser-source-view__token--tag' },
      { text: '>', className: 'browser-source-view__token browser-source-view__token--tag' },
      { text: 'something' },
      { text: '</artifactId', className: 'browser-source-view__token browser-source-view__token--tag' },
      { text: '>', className: 'browser-source-view__token browser-source-view__token--tag' },
    ]);
  });

  test('renders embedded source view markup with metadata, focus, and syntax-highlight spans', () => {
    const markup = renderToStaticMarkup(createElement(BrowserSourceViewDialog, {
      source: response,
      status: 'ready',
      onClose: () => undefined,
    }));

    expect(markup).toContain('Source view');
    expect(markup).toContain('src/components/BrowserFactsPanel.tsx');
    expect(markup).toContain('Language tsx');
    expect(markup).toContain('Focus lines 2-3');
    expect(markup).toContain('browser-source-view__line--focused');
    expect(markup).toContain('data-focus-target="true"');
    expect(markup).toContain('data-language="tsx"');
    expect(markup).toContain('browser-source-view__token--keyword');
    expect(markup).toContain('browser-source-view__token--tag');
    expect(markup).toContain('return');
    expect(markup).toContain('&lt;div');
  });

  test('renders loading state while source is being fetched', () => {
    const markup = renderToStaticMarkup(createElement(BrowserSourceViewDialog, {
      source: null,
      status: 'loading',
      onClose: () => undefined,
    }));

    expect(markup).toContain('Loading source…');
    expect(markup).toContain('Fetching the selected file');
  });

  test('renders error state when source fetch fails', () => {
    const markup = renderToStaticMarkup(createElement(BrowserSourceViewDialog, {
      source: null,
      status: 'error',
      errorMessage: 'Source handle has expired.',
      onClose: () => undefined,
    }));

    expect(markup).toContain('Unable to open source');
    expect(markup).toContain('Source handle has expired.');
  });

  test('renders nothing when no source is open', () => {
    const markup = renderToStaticMarkup(createElement(BrowserSourceViewDialog, {
      source: null,
      status: 'idle',
      onClose: () => undefined,
    }));

    expect(markup).toBe('');
  });
});
