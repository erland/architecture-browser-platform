export {
  createSavedCanvasEntityReference,
  createSavedCanvasRelationshipReference,
  createSavedCanvasScopeReference,
} from './stableReferenceCreation';
export {
  buildEntitySemanticFingerprint,
  buildRelationshipSemanticFingerprint,
  buildStableEntityKey,
  buildStableRelationshipKey,
  buildStableScopeKey,
  buildScopeSemanticFingerprint,
} from './stableReferenceKeys';
export {
  getSavedCanvasStableReferenceLookup,
  resolveSavedCanvasReferenceIdByStableKey,
} from './stableReferenceLookup';
export {
  resolveSavedCanvasReference,
  resolveSavedCanvasReferenceWithFallback,
} from './stableReferenceResolution';
export type {
  SavedCanvasReferenceResolution,
  SavedCanvasReferenceResolutionStrategy,
  SavedCanvasStableReferenceLookup,
} from './stableReferenceShared';
export {
  asString,
  classifyEntityCategory,
  classifyScopeCategory,
  deriveEntityQualifiedName,
  deriveEntitySignature,
  deriveScopePath,
  isRecord,
  normalizeToken,
  pickPrimarySourcePath,
  readFirstStringMetadata,
} from './stableReferenceShared';
