import type { SourceViewReadResponse } from '../../app-model';

export type SourceViewLine = {
  number: number;
  text: string;
  isFocused: boolean;
};

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

export function formatFocusRange(response: SourceViewReadResponse): string | null {
  if (response.requestedStartLine == null) {
    return null;
  }
  if (response.requestedEndLine == null || response.requestedEndLine === response.requestedStartLine) {
    return `Focus line ${response.requestedStartLine}`;
  }
  return `Focus lines ${response.requestedStartLine}-${response.requestedEndLine}`;
}
