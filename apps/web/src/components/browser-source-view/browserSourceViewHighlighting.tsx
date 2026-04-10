import type { ReactNode } from 'react';

export type HighlightToken = {
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

export function renderHighlightedLine(text: string, language: string | null): ReactNode {
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
