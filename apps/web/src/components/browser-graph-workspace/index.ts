/**
 * Canonical renderer-stage entrypoint for the browser graph pipeline.
 *
 * Ownership:
 * - React rendering of workspace nodes, edges, menus, and toolbar fragments
 * - pointer interaction hooks local to rendering
 *
 * Non-ownership:
 * - projection building
 * - graph layout algorithms
 * - edge-routing engine logic
 */

export { BrowserGraphWorkspace } from './BrowserGraphWorkspace';
export type * from './BrowserGraphWorkspace.types';
export { useBrowserGraphWorkspaceInteractions } from './useBrowserGraphWorkspaceInteractions';
