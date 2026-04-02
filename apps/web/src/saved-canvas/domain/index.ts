/**
 * Canonical domain-layer public entrypoint for the saved-canvas subsystem.
 *
 * Domain exports should stay pure and avoid direct storage, networking, or
 * browser-session orchestration concerns.
 */
export * from './document';
export * from './rebinding';
export * from '../rebinding/ui';
