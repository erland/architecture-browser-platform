package info.isaksson.erland.architecturebrowser.platform.service.snapshots;

import java.util.List;
import java.util.Map;

record SnapshotCatalogCanonicalDocument(
    SourceData source,
    RunData run,
    CompletenessData completeness,
    List<ScopeData> scopes,
    List<EntityData> entities,
    List<RelationshipData> relationships,
    DependencyViewsData dependencyViews,
    List<ViewpointData> viewpoints,
    List<DiagnosticData> diagnostics,
    Map<String, Object> metadata
) {
    record SourceData(
        String repositoryId,
        String acquisitionType,
        String path,
        String remoteUrl,
        String branch,
        String revision,
        String acquiredAt
    ) {
    }

    record RunData(
        String startedAt,
        String completedAt,
        String outcome,
        List<String> detectedTechnologies
    ) {
    }

    record CompletenessData(
        String status,
        int indexedFileCount,
        int totalFileCount,
        int degradedFileCount,
        List<String> omittedPaths,
        List<String> notes
    ) {
    }

    record SourceRefData(
        String path,
        Integer startLine,
        Integer endLine,
        String snippet,
        Map<String, Object> metadata
    ) {
    }

    record ScopeData(
        String id,
        String kind,
        String name,
        String displayName,
        String parentScopeId,
        List<SourceRefData> sourceRefs,
        Map<String, Object> metadata
    ) {
    }

    record EntityData(
        String id,
        String kind,
        String origin,
        String name,
        String displayName,
        String scopeId,
        List<SourceRefData> sourceRefs,
        List<String> architecturalRoles,
        List<String> architecturalTraits,
        Map<String, Object> metadata
    ) {
    }

    record RelationshipData(
        String id,
        String kind,
        String fromEntityId,
        String toEntityId,
        String label,
        List<SourceRefData> sourceRefs,
        NormalizedAssociationData normalizedAssociation,
        Map<String, Object> metadata
    ) {
    }

    record NormalizedAssociationData(
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

    record DependencyViewsData(
        List<EntityAssociationRelationshipData> entityAssociationRelationships,
        RelationshipCatalogsData relationshipCatalogs,
        JavaBrowserViewsData javaBrowserViews
    ) {
    }

    record EntityAssociationRelationshipData(
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

    record RelationshipCatalogsData(
        RelationshipCatalogData entityAssociations
    ) {
    }

    record RelationshipCatalogData(
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

    record JavaBrowserViewsData(
        List<JavaBrowserViewData> views,
        List<String> availableViews,
        String defaultViewId
    ) {
    }

    record JavaBrowserViewData(
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

    record ViewpointData(
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

    record DiagnosticData(
        String id,
        String severity,
        String phase,
        String code,
        String message,
        boolean fatal,
        String filePath,
        String scopeId,
        String entityId,
        List<SourceRefData> sourceRefs,
        Map<String, Object> metadata
    ) {
    }
}
