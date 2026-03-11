package info.isaksson.erland.architecturebrowser.platform.api.dto;

import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotDtos.SnapshotSummaryResponse;

import java.util.List;

public final class ComparisonDtos {
    private ComparisonDtos() {
    }

    public record SnapshotComparisonResponse(
        SnapshotSummaryResponse baseSnapshot,
        SnapshotSummaryResponse targetSnapshot,
        ComparisonSummary summary,
        List<ScopeChange> addedScopes,
        List<ScopeChange> removedScopes,
        List<EntityChange> addedEntities,
        List<EntityChange> removedEntities,
        List<EntityChange> addedEntryPoints,
        List<EntityChange> removedEntryPoints,
        List<EntityChange> changedIntegrationAndPersistence,
        List<RelationshipChange> addedDependencies,
        List<RelationshipChange> removedDependencies
    ) {
    }

    public record ComparisonSummary(
        int addedScopeCount,
        int removedScopeCount,
        int addedEntityCount,
        int removedEntityCount,
        int addedRelationshipCount,
        int removedRelationshipCount,
        int addedEntryPointCount,
        int removedEntryPointCount,
        int changedIntegrationAndPersistenceCount
    ) {
    }

    public record ScopeChange(
        String externalId,
        String kind,
        String name,
        String displayName,
        String path
    ) {
    }

    public record EntityChange(
        String externalId,
        String kind,
        String name,
        String displayName,
        String scopePath
    ) {
    }

    public record RelationshipChange(
        String externalId,
        String kind,
        String label,
        String fromEntityId,
        String fromDisplayName,
        String fromScopePath,
        String toEntityId,
        String toDisplayName,
        String toScopePath
    ) {
    }
}
