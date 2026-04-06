import { useEffect, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import type { SourceViewReadResponse } from '../../app-model';

export type BrowserSourceViewStatus = 'idle' | 'loading' | 'ready' | 'error';

export type BrowserSourceViewDialogProps = {
  source: SourceViewReadResponse | null;
  status?: BrowserSourceViewStatus;
  errorMessage?: string | null;
  onClose: () => void;
};

type SourceViewLine = {
  number: number;
  text: string;
  isFocused: boolean;
};

type HighlightToken = {
  text: string;
  className?: string;
};

const KEYWORDS_BY_LANGUAGE: Record<string, Set<string>> = {
  java: new Set([
    'abstract', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class', 'const', 'continue', 'default',
    'do', 'double', 'else', 'enum', 'extends', 'final', 'finally', 'float', 'for', 'if', 'implements', 'import',
    'instanceof', 'int', 'interface', 'long', 'native', 'new', 'package', 'private', 'protected', 'public', 'record',
    'return', 'short', 'static', 'super', 'switch', 'synchronized', 'this', 'throw', 'throws', 'transient', 'try',
    'var', 'void', 'volatile', 'while', 'true', 'false', 'null'
  ]),
  javascript: new Set([
    'as', 'async', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default', 'delete',
    'do', 'else', 'export', 'extends', 'false', 'finally', 'for', 'from', 'function', 'if', 'import', 'in', 'instanceof',
    'let', 'new', 'null', 'of', 'return', 'static', 'super', 'switch', 'this', 'throw', 'true', 'try', 'typeof',
    'undefined', 'var', 'void', 'while', 'yield'
  ]),
  typescript: new Set([
    'as', 'async', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'declare', 'default',
    'delete', 'do', 'else', 'enum', 'export', 'extends', 'false', 'finally', 'for', 'from', 'function', 'if', 'implements',
    'import', 'in', 'infer', 'instanceof', 'interface', 'keyof', 'let', 'module', 'namespace', 'new', 'null', 'of', 'private',
    'protected', 'public', 'readonly', 'return', 'static', 'super', 'switch', 'this', 'throw', 'true', 'try', 'type', 'typeof',
    'undefined', 'var', 'void', 'while'
  ]),
  tsx: new Set([]),
  jsx: new Set([]),
  json: new Set(['true', 'false', 'null']),
  yaml: new Set(['true', 'false', 'null', 'yes', 'no', 'on', 'off']),
  sql: new Set([
    'select', 'from', 'where', 'insert', 'into', 'update', 'delete', 'join', 'left', 'right', 'inner', 'outer', 'on', 'group',
    'by', 'order', 'having', 'create', 'table', 'view', 'index', 'and', 'or', 'not', 'as', 'distinct', 'limit', 'offset',
    'values', 'set', 'alter', 'drop', 'primary', 'key', 'foreign', 'constraint', 'null', 'is'
  ]),
  properties: new Set([]),
  xml: new Set([]),
  markdown: new Set([]),
  plaintext: new Set([]),
};
KEYWORDS_BY_LANGUAGE.jsx = KEYWORDS_BY_LANGUAGE.javascript;
KEYWORDS_BY_LANGUAGE.tsx = KEYWORDS_BY_LANGUAGE.typescript;

function normalizeSourceLines(sourceText: string): string[] {
  const normalized = sourceText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n');
  if (normalized.endsWith('\n')) {
    lines.pop();
  }
  return lines.length > 0 ? lines : [''];
}

export function buildSourceViewLines(response: SourceViewReadResponse): SourceViewLine[] {
  const startLine = response.requestedStartLine ?? null;
  const endLine = response.requestedEndLine ?? startLine;
  return normalizeSourceLines(response.sourceText).map((text, index) => {
    const number = index + 1;
    const isFocused = startLine !== null
      ? number >= startLine && number <= (endLine ?? startLine)
      : false;
    return {
      number,
      text,
      isFocused,
    };
  });
}

function formatFocusRange(response: SourceViewReadResponse): string | null {
  if (response.requestedStartLine == null) {
    return null;
  }
  if (response.requestedEndLine == null || response.requestedEndLine === response.requestedStartLine) {
    return `Focus line ${response.requestedStartLine}`;
  }
  return `Focus lines ${response.requestedStartLine}-${response.requestedEndLine}`;
}

function classifyIdentifier(text: string, language: string | null): string | undefined {
  if (!language) {
    return undefined;
  }
  const keywords = KEYWORDS_BY_LANGUAGE[language] ?? KEYWORDS_BY_LANGUAGE.plaintext;
  if (language === 'sql') {
    if (keywords.has(text.toLowerCase())) {
      return 'browser-source-view__token browser-source-view__token--keyword';
    }
    return /^[A-Z_][A-Z0-9_]*$/.test(text)
      ? 'browser-source-view__token browser-source-view__token--type'
      : undefined;
  }
  if (keywords.has(text)) {
    return 'browser-source-view__token browser-source-view__token--keyword';
  }
  return /^[A-Z][A-Za-z0-9_]*$/.test(text)
    ? 'browser-source-view__token browser-source-view__token--type'
    : undefined;
}

function highlightGenericCode(text: string, language: string | null): HighlightToken[] {
  const tokens: HighlightToken[] = [];
  const pattern = /(\/\/.*$|\/\*[\s\S]*?\*\/|#.*$|@[A-Za-z_$][\w$-]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b\d+(?:\.\d+)?\b|[A-Za-z_$][\w$-]*|\s+|.)/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    const token = match[0];
    if (/^\s+$/.test(token)) {
      tokens.push({ text: token });
      continue;
    }
    if (/^(\/\/.*|\/\*[\s\S]*\*\/|#.*)$/.test(token)) {
      tokens.push({ text: token, className: 'browser-source-view__token browser-source-view__token--comment' });
      continue;
    }
    if (/^@[A-Za-z_$][\w$-]*$/.test(token)) {
      tokens.push({ text: token, className: 'browser-source-view__token browser-source-view__token--annotation' });
      continue;
    }
    if (/^("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)$/.test(token)) {
      tokens.push({ text: token, className: 'browser-source-view__token browser-source-view__token--string' });
      continue;
    }
    if (/^\d/.test(token)) {
      tokens.push({ text: token, className: 'browser-source-view__token browser-source-view__token--number' });
      continue;
    }
    const className = classifyIdentifier(token, language);
    if (className) {
      tokens.push({ text: token, className });
      continue;
    }
    if (/^[{}()[\].,;:+\-*/%=!<>?|&]+$/.test(token)) {
      tokens.push({ text: token, className: 'browser-source-view__token browser-source-view__token--punctuation' });
      continue;
    }
    tokens.push({ text: token });
  }
  return tokens;
}

function highlightJson(text: string): HighlightToken[] {
  const tokens: HighlightToken[] = [];
  const pattern = /("(?:\\.|[^"\\])*"\s*:|"(?:\\.|[^"\\])*")|(\b-?\d+(?:\.\d+)?\b)|(true|false|null)|(\s+)|./g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    const token = match[0];
    if (match[4]) {
      tokens.push({ text: token });
    } else if (match[1]) {
      const isKey = /:\s*$/.test(token);
      tokens.push({
        text: token,
        className: isKey
          ? 'browser-source-view__token browser-source-view__token--property'
          : 'browser-source-view__token browser-source-view__token--string',
      });
    } else if (match[2]) {
      tokens.push({ text: token, className: 'browser-source-view__token browser-source-view__token--number' });
    } else if (match[3]) {
      tokens.push({ text: token, className: 'browser-source-view__token browser-source-view__token--keyword' });
    } else if (/^[{}\[\],:]$/.test(token)) {
      tokens.push({ text: token, className: 'browser-source-view__token browser-source-view__token--punctuation' });
    } else {
      tokens.push({ text: token });
    }
  }
  return tokens;
}

function highlightXml(text: string): HighlightToken[] {
  const tagPattern = /(<!--.*?-->|<\/?[A-Za-z_][\w:.-]*|\/>|>|\s+[A-Za-z_:][\w:.-]*(?==)|=(?=\s*["'])|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/g;
  const tokens: HighlightToken[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = tagPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ text: text.slice(lastIndex, match.index) });
    }
    const token = match[0];
    let className: string | undefined;
    if (token.startsWith('<!--')) {
      className = 'browser-source-view__token browser-source-view__token--comment';
    } else if (token.startsWith('<')) {
      className = 'browser-source-view__token browser-source-view__token--tag';
    } else if (/^\/>$|^>$/.test(token)) {
      className = 'browser-source-view__token browser-source-view__token--tag';
    } else if (token.startsWith('"') || token.startsWith('\'')) {
      className = 'browser-source-view__token browser-source-view__token--string';
    } else if (/^=/.test(token)) {
      className = 'browser-source-view__token browser-source-view__token--punctuation';
    } else if (/^\s+/.test(token)) {
      className = 'browser-source-view__token browser-source-view__token--attribute';
    }
    tokens.push({ text: token, className });
    lastIndex = tagPattern.lastIndex;
  }
  if (lastIndex < text.length) {
    tokens.push({ text: text.slice(lastIndex) });
  }
  return tokens;
}

function highlightYaml(text: string): HighlightToken[] {
  const match = /^(\s*-?\s*)([A-Za-z0-9_.-]+:)(\s*)(.*)$/.exec(text);
  if (!match) {
    return highlightGenericCode(text, 'yaml');
  }
  const [, prefix, key, middle, rest] = match;
  return [
    { text: prefix },
    { text: key, className: 'browser-source-view__token browser-source-view__token--property' },
    { text: middle },
    ...highlightGenericCode(rest, 'yaml'),
  ];
}

function highlightJsxLike(text: string, baseLanguage: 'javascript' | 'typescript'): HighlightToken[] {
  const tagPattern = /<\/?[A-Za-z_][\w:.-]*(?:\s+[^<>]*)?\/?>/g;
  const tokens: HighlightToken[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = tagPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(...highlightGenericCode(text.slice(lastIndex, match.index), baseLanguage));
    }
    tokens.push(...highlightXml(match[0]));
    lastIndex = tagPattern.lastIndex;
  }
  if (lastIndex < text.length) {
    tokens.push(...highlightGenericCode(text.slice(lastIndex), baseLanguage));
  }
  return tokens;
}

function highlightProperties(text: string): HighlightToken[] {
  if (/^\s*[#!]/.test(text)) {
    return [{ text, className: 'browser-source-view__token browser-source-view__token--comment' }];
  }
  const separatorIndex = text.search(/[:=]/);
  if (separatorIndex === -1) {
    return [{ text }];
  }
  return [
    { text: text.slice(0, separatorIndex), className: 'browser-source-view__token browser-source-view__token--property' },
    { text: text.charAt(separatorIndex), className: 'browser-source-view__token browser-source-view__token--punctuation' },
    ...highlightGenericCode(text.slice(separatorIndex + 1), 'properties'),
  ];
}

export function buildHighlightedSourceTokens(text: string, language: string | null): HighlightToken[] {
  switch (language) {
    case 'json':
      return highlightJson(text);
    case 'xml':
      return highlightXml(text);
    case 'jsx':
      return highlightJsxLike(text, 'javascript');
    case 'tsx':
      return highlightJsxLike(text, 'typescript');
    case 'yaml':
      return highlightYaml(text);
    case 'properties':
      return highlightProperties(text);
    case 'markdown':
    case 'plaintext':
    case null:
      return [{ text }];
    default:
      return highlightGenericCode(text, language);
  }
}

function renderHighlightedLine(text: string, language: string | null): ReactNode {
  const tokens = buildHighlightedSourceTokens(text, language);
  return tokens.map((token, index) => (
    <span
      key={`${index}:${token.text}`}
      className={token.className}
    >
      {token.text}
    </span>
  ));
}

export function BrowserSourceViewDialog({
  source,
  status = source ? 'ready' : 'idle',
  errorMessage = null,
  onClose,
}: BrowserSourceViewDialogProps) {
  const codeContainerRef = useRef<HTMLDivElement | null>(null);
  const focusedLineRef = useRef<HTMLDivElement | null>(null);
  const lines = useMemo(() => (source ? buildSourceViewLines(source) : []), [source]);

  useEffect(() => {
    if (status !== 'ready' || !focusedLineRef.current) {
      return;
    }
    focusedLineRef.current.scrollIntoView({ block: 'center', inline: 'nearest' });
  }, [status, source?.path, source?.requestedStartLine, source?.requestedEndLine]);

  useEffect(() => {
    if (status !== 'ready' || !source || !codeContainerRef.current || focusedLineRef.current) {
      return;
    }
    codeContainerRef.current.scrollTop = 0;
  }, [status, source]);

  if (status === 'idle' && !source && !errorMessage) {
    return null;
  }

  const metadata = source
    ? [
        source.language ? `Language ${source.language}` : null,
        `Lines ${source.totalLineCount}`,
        `Bytes ${source.fileSizeBytes}`,
        formatFocusRange(source),
      ].filter(Boolean)
    : [];

  return (
    <div className="browser-source-view" role="dialog" aria-modal="true" aria-label="Source viewer">
      <div className="browser-source-view__backdrop" onClick={onClose} />
      <section className="browser-source-view__panel card">
        <header className="browser-source-view__header">
          <div className="browser-source-view__header-main">
            <p className="eyebrow">Source view</p>
            <h3>{source?.path ?? 'Loading source'}</h3>
            {metadata.length > 0 ? (
              <div className="browser-source-view__meta">
                {metadata.map((entry) => (
                  <span key={entry} className="badge">{entry}</span>
                ))}
              </div>
            ) : null}
          </div>
          <button type="button" className="button-secondary" onClick={onClose}>Close</button>
        </header>

        <div
          ref={codeContainerRef}
          className={`browser-source-view__body browser-source-view__body--${status}`}
        >
          {status === 'loading' ? (
            <div className="browser-source-view__status" role="status" aria-live="polite">
              <p className="browser-source-view__status-title">Loading source…</p>
              <p className="muted">Fetching the selected file and focusing the requested source range.</p>
            </div>
          ) : null}

          {status === 'error' ? (
            <div className="browser-source-view__status browser-source-view__status--error" role="alert">
              <p className="browser-source-view__status-title">Unable to open source</p>
              <p className="muted">{errorMessage ?? 'The platform could not load source for the selected object.'}</p>
            </div>
          ) : null}

          {status === 'ready' && source ? (
            <div className="browser-source-view__code" role="region" aria-label={`Source file ${source.path}`} data-language={source.language ?? 'plaintext'}>
              {lines.map((line) => {
                const isFocusTarget = line.isFocused && line.number === (source.requestedStartLine ?? line.number);
                return (
                  <div
                    key={line.number}
                    ref={isFocusTarget ? focusedLineRef : null}
                    className={[
                      'browser-source-view__line',
                      line.isFocused ? 'browser-source-view__line--focused' : '',
                      isFocusTarget ? 'browser-source-view__line--focus-target' : '',
                    ].filter(Boolean).join(' ')}
                    data-line-number={line.number}
                    data-focus-target={isFocusTarget ? 'true' : undefined}
                  >
                    <span className="browser-source-view__line-number" aria-hidden="true">{line.number}</span>
                    <code className="browser-source-view__line-text">
                      {line.text ? renderHighlightedLine(line.text, source.language) : ' '}
                    </code>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
