/**
 * Canonical application-layer public entrypoint for the saved-canvas subsystem.
 *
 * Application exports should compose domain rules into browser workflows
 * without owning concrete persistence implementations.
 */
export * from './browserState';
export * from './opening';
export * from './sync';
