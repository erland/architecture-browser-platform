import { useCallback } from 'react';
import type { FullSnapshotEntity } from '../../app-model';
import type { BrowserGraphWorkspaceInteractionHandlers, BrowserGraphWorkspaceProps } from './BrowserGraphWorkspace.types';

type Args = Pick<BrowserGraphWorkspaceProps,
  | 'onAddScopeAnalysis'
  | 'onAddContainedEntities'
  | 'onAddPeerEntities'
  | 'onFocusScope'
  | 'onFocusEntity'
  | 'onSelectEntity'
  | 'onFocusRelationship'
  | 'onExpandEntityDependencies'
  | 'onExpandInboundDependencies'
  | 'onExpandOutboundDependencies'
  | 'onRemoveEntity'
  | 'onTogglePinNode'
  | 'onSetClassPresentationMode'
  | 'onToggleClassPresentationMembers'
> & {
  selectedClassEntityIds: string[];
  focusedEntity: FullSnapshotEntity | null;
};

export function useBrowserGraphWorkspaceActionHandlers({
  focusedEntity,
  onAddScopeAnalysis,
  onAddContainedEntities,
  onAddPeerEntities,
  onFocusScope,
  onFocusEntity,
  onSelectEntity,
  onFocusRelationship,
  onExpandEntityDependencies,
  onExpandInboundDependencies,
  onExpandOutboundDependencies,
  onRemoveEntity,
  onTogglePinNode,
  onSetClassPresentationMode = () => {},
  onToggleClassPresentationMembers = () => {},
  selectedClassEntityIds,
}: Args): BrowserGraphWorkspaceInteractionHandlers {
  const onEntityAction = useCallback((actionKey: string) => {
    if (!focusedEntity) {
      return;
    }
    if (actionKey === 'contained') {
      onAddContainedEntities(focusedEntity.externalId);
      return;
    }
    if (actionKey === 'functions') {
      onAddContainedEntities(focusedEntity.externalId, ['FUNCTION']);
      return;
    }
    if (actionKey === 'dependencies') {
      onExpandEntityDependencies(focusedEntity.externalId);
      return;
    }
    if (actionKey === 'used-by' || actionKey === 'called-by') {
      onExpandInboundDependencies(focusedEntity.externalId);
      return;
    }
    if (actionKey === 'calls') {
      onExpandOutboundDependencies(focusedEntity.externalId);
      return;
    }
    if (actionKey === 'same-module') {
      onAddPeerEntities(focusedEntity.externalId, ['MODULE'], ['FUNCTION']);
      return;
    }
    if (actionKey === 'subpackages' && focusedEntity.scopeId) {
      onAddScopeAnalysis(focusedEntity.scopeId, 'children-primary', undefined, ['PACKAGE']);
      return;
    }
    if (actionKey === 'modules' && focusedEntity.scopeId) {
      onAddScopeAnalysis(focusedEntity.scopeId, 'subtree', ['MODULE']);
      return;
    }
    if (actionKey === 'classes' && focusedEntity.scopeId) {
      onAddScopeAnalysis(focusedEntity.scopeId, 'subtree', ['CLASS', 'INTERFACE']);
      return;
    }
    if (actionKey === 'remove') {
      onRemoveEntity(focusedEntity.externalId);
      return;
    }
    if (actionKey === 'pin') {
      onTogglePinNode({ kind: 'entity', id: focusedEntity.externalId });
      return;
    }
    if (actionKey === 'class-simple') {
      onSetClassPresentationMode(selectedClassEntityIds, 'simple');
      return;
    }
    if (actionKey === 'class-compartments') {
      onSetClassPresentationMode(selectedClassEntityIds, 'compartments');
      return;
    }
    if (actionKey === 'class-expanded') {
      onSetClassPresentationMode(selectedClassEntityIds, 'expanded');
      return;
    }
    if (actionKey === 'class-fields') {
      onToggleClassPresentationMembers(selectedClassEntityIds, 'fields');
      return;
    }
    if (actionKey === 'class-functions') {
      onToggleClassPresentationMembers(selectedClassEntityIds, 'functions');
    }
  }, [focusedEntity, onAddContainedEntities, onAddPeerEntities, onAddScopeAnalysis, onExpandEntityDependencies, onExpandInboundDependencies, onExpandOutboundDependencies, onRemoveEntity, onSetClassPresentationMode, onToggleClassPresentationMembers, onTogglePinNode, selectedClassEntityIds]);

  const onActivateRelationship = useCallback((relationshipId: string) => {
    onFocusRelationship(relationshipId);
  }, [onFocusRelationship]);

  const onActivateScopeNode = useCallback((scopeId: string) => {
    onFocusScope(scopeId);
  }, [onFocusScope]);

  const onActivateEntityNode = useCallback((entityId: string, additive?: boolean) => {
    onSelectEntity(entityId, additive);
    onFocusEntity(entityId);
  }, [onFocusEntity, onSelectEntity]);

  return {
    onEntityAction,
    onActivateRelationship,
    onActivateScopeNode,
    onActivateEntityNode,
  };
}
