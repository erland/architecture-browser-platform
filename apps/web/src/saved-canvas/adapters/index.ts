/**
 * Canonical adapter-layer public entrypoint for the saved-canvas subsystem.
 *
 * Adapter exports own concrete storage and browser-session integration.
 */
export * from '../storage/localStore';
export * from '../storage/remoteStore';
export * from '../ports/browserSessionAdapter';
