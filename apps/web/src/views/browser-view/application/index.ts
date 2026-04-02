/**
 * Internal BrowserView application layer.
 *
 * Owns screen-level composition across BrowserView feature controllers. Page
 * shells should prefer this layer over wiring workspace, canvas, and dialog
 * controllers independently.
 */

export { useBrowserViewApplicationController } from './useBrowserViewApplicationController';
export type { BrowserViewApplicationController } from './useBrowserViewApplicationController';
export * from './useBrowserViewPageSections';
