import { useEffect, useMemo, useRef } from 'react';
import type { SourceViewReadResponse } from '../../app-model';
import { buildSourceViewLines, formatFocusRange } from './browserSourceViewLines';
import { buildHighlightedSourceTokens, renderHighlightedLine } from './browserSourceViewHighlighting';

export type BrowserSourceViewStatus = 'idle' | 'loading' | 'ready' | 'error';

export type BrowserSourceViewDialogProps = {
  source: SourceViewReadResponse | null;
  status?: BrowserSourceViewStatus;
  errorMessage?: string | null;
  onClose: () => void;
};

export { buildSourceViewLines, buildHighlightedSourceTokens };

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
