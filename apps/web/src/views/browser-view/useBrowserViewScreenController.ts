/**
 * Compatibility facade for BrowserView page composition.
 *
 * The Browser screen now composes its feature controllers through the
 * `application/` layer. Keep importing `useBrowserViewScreenController` from the
 * BrowserView entrypoint for page-level composition, but prefer the application
 * layer for new internal screen-orchestration work.
 */
import { type BrowserViewProps } from './browserView.shared';
import { useBrowserViewApplicationController } from './application';

export type BrowserViewScreenController = ReturnType<typeof useBrowserViewScreenController>;

export function useBrowserViewScreenController(props: BrowserViewProps) {
  return useBrowserViewApplicationController(props);
}
