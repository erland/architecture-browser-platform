package info.isaksson.erland.architecturebrowser.platform.api.dto;

import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotResponseDtos.SnapshotSummaryResponse;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotSharedDtos.CompletenessInfo;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotSharedDtos.MetadataEnvelope;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotSharedDtos.RunInfo;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotSharedDtos.SourceInfo;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotSharedDtos.SourceRef;

import java.util.List;

public final class SnapshotPayloadDtos {
    private SnapshotPayloadDtos() {
    }

    public record FullSnapshotPayloadResponse(
        SnapshotSummaryResponse snapshot,
        SourceInfo source,
        RunInfo run,
        CompletenessInfo completeness,
        List<FullScope> scopes,
        List<FullEntity> entities,
        List<FullRelationship> relationships,
        FullDependencyViews dependencyViews,
        List<FullViewpoint> viewpoints,
        List<FullDiagnostic> diagnostics,
        MetadataEnvelope metadata,
        List<String> warnings
    ) {
    }

    public record FullScope(
        String externalId,
        String kind,
        String name,
        String displayName,
        String parentScopeId,
        List<SourceRef> sourceRefs,
        java.util.Map<String, Object> metadata
    ) {
    }

    public record FullEntity(
        String externalId,
        String kind,
        String origin,
        String name,
        String displayName,
        String scopeId,
        List<SourceRef> sourceRefs,
        java.util.Map<String, Object> metadata
    ) {
    }

    public record FullRelationship(
        String externalId,
        String kind,
        String fromEntityId,
        String toEntityId,
        String label,
        List<SourceRef> sourceRefs,
        FullNormalizedAssociation normalizedAssociation,
        java.util.Map<String, Object> metadata
    ) {
    }

    public record FullNormalizedAssociation(
        String associationKind,
        String associationCardinality,
        String sourceLowerBound,
        String sourceUpperBound,
        String targetLowerBound,
        String targetUpperBound,
        Boolean bidirectional,
        List<String> evidenceRelationshipIds,
        String owningSideEntityId,
        String owningSideMemberId,
        String inverseSideEntityId,
        String inverseSideMemberId
    ) {
    }

    public record FullDependencyViews(
        List<FullEntityAssociationRelationship> entityAssociationRelationships,
        FullRelationshipCatalogs relationshipCatalogs,
        FullJavaBrowserViews javaBrowserViews
    ) {
    }

    public record FullEntityAssociationRelationship(
        String relationshipId,
        String canonicalRelationshipId,
        String relationshipKind,
        String relationshipType,
        String framework,
        String browserViewKind,
        List<String> architectureViewKinds,
        String sourceEntityId,
        String sourceEntityName,
        String targetEntityId,
        String targetEntityName,
        String label,
        String associationKind,
        String associationCardinality,
        String sourceLowerBound,
        String sourceUpperBound,
        String targetLowerBound,
        String targetUpperBound,
        Boolean bidirectional,
        String owningSideEntityId,
        String owningSideMemberId,
        String inverseSideEntityId,
        String inverseSideMemberId,
        List<String> evidenceRelationshipIds,
        Integer evidenceRelationshipCount,
        Boolean recommendedForArchitectureViews,
        Boolean canonicalForEntityViews,
        Boolean rawRelationshipEvidenceRetained,
        String jpaAssociationHandling
    ) {
    }

    public record FullRelationshipCatalogs(
        FullRelationshipCatalog entityAssociations
    ) {
    }

    public record FullRelationshipCatalog(
        String id,
        String title,
        String description,
        String relationshipCatalogKind,
        String browserViewKind,
        String framework,
        List<String> frameworks,
        List<String> architectureViewKinds,
        Boolean available,
        Integer relationshipCount,
        List<String> associationCardinalities,
        List<String> associationKinds,
        Boolean recommendedForArchitectureViews,
        Boolean canonicalForEntityViews,
        Boolean retainsRawRelationshipEvidence
    ) {
    }

    public record FullJavaBrowserViews(
        List<FullJavaBrowserView> views,
        List<String> availableViews,
        String defaultViewId
    ) {
    }

    public record FullJavaBrowserView(
        String id,
        String title,
        String description,
        String framework,
        String architectureViewKind,
        String typeDependencyView,
        String moduleDependencyView,
        String relationshipCatalogView,
        List<String> frameworkRelationships,
        Boolean available,
        Integer typeDependencyCount,
        Integer moduleDependencyCount,
        Integer relationshipCatalogCount,
        String preferredDependencyView,
        String browserViewKind,
        Boolean recommendedForArchitectureViews,
        List<String> relationshipKinds,
        List<String> availableFrameworks,
        List<String> availableArchitectureViewKinds
    ) {
    }

    public record FullViewpoint(
        String id,
        String title,
        String description,
        String availability,
        double confidence,
        List<String> seedEntityIds,
        List<String> seedRoleIds,
        List<String> expandViaSemantics,
        List<String> preferredDependencyViews,
        List<String> evidenceSources
    ) {
    }

    public record FullDiagnostic(
        String externalId,
        String severity,
        String phase,
        String code,
        String message,
        boolean fatal,
        String filePath,
        String scopeId,
        String entityId,
        List<SourceRef> sourceRefs,
        java.util.Map<String, Object> metadata
    ) {
    }
}
