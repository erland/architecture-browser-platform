export { collectDescendantStats, buildContainingScopeIds, buildScopePath, buildScopeTree, collectSubtreeEntityIds, pushToMapArray } from './browserSnapshotIndex.aggregates';
export { buildSearchableDocuments, compactScopeDisplayName, createSearchDocument, displayNameOf, normalizeSearchText } from './browserSnapshotIndex.display';
export { collectSourceRefs } from './browserSnapshotIndex.sourceRefs';
export {
  getArchitecturalRoles,
  getArchitecturalSemantics,
  includeIntegrationMapImmediateNeighbors,
  isEntityWithinScopeMode,
  isScopeWithin,
  matchesTreeModeScopeKind,
  resolvePersistentEntityAssociationRelationships,
} from './browserSnapshotIndex.semantics';
export {
  compareByDisplayName,
  compareEntityIds,
  compareScopeIds,
  getApiSurfaceRolePriority,
  getIntegrationMapRolePriority,
  getModuleDependenciesRolePriority,
  getPersistenceModelRolePriority,
  getRequestHandlingRolePriority,
  getUiNavigationRolePriority,
  sortEntityIds,
  sortScopeIds,
  sortViewpointEntityIds,
  sortViewpointRelationshipIds,
  stableSortRelationships,
} from './browserSnapshotIndex.sort';
