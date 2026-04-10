package info.isaksson.erland.architecturebrowser.platform.contract;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ArchitectureIndexDocument(
    String schemaVersion,
    String indexerVersion,
    RunMetadata runMetadata,
    RepositorySource source,
    List<LogicalScope> scopes,
    List<ArchitectureEntity> entities,
    List<ArchitectureRelationship> relationships,
    DependencyViews dependencyViews,
    List<ArchitectureViewpoint> viewpoints,
    List<Diagnostic> diagnostics,
    CompletenessMetadata completeness,
    Map<String, Object> metadata
) {
    public ArchitectureIndexDocument(
        String schemaVersion,
        String indexerVersion,
        RunMetadata runMetadata,
        RepositorySource source,
        List<LogicalScope> scopes,
        List<ArchitectureEntity> entities,
        List<ArchitectureRelationship> relationships,
        List<ArchitectureViewpoint> viewpoints,
        List<Diagnostic> diagnostics,
        CompletenessMetadata completeness,
        Map<String, Object> metadata
    ) {
        this(schemaVersion, indexerVersion, runMetadata, source, scopes, entities, relationships, null, viewpoints, diagnostics, completeness, metadata);
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record RunMetadata(
        String startedAt,
        String completedAt,
        String outcome,
        List<String> detectedTechnologies,
        Map<String, Object> metadata
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record RepositorySource(
        String repositoryId,
        String acquisitionType,
        String path,
        String remoteUrl,
        String branch,
        String revision,
        String acquiredAt,
        Map<String, Object> metadata
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record LogicalScope(
        String id,
        String kind,
        String name,
        String displayName,
        String parentScopeId,
        List<SourceReference> sourceRefs,
        Map<String, Object> metadata
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ArchitectureEntity(
        String id,
        String kind,
        String origin,
        String name,
        String displayName,
        String scopeId,
        List<SourceReference> sourceRefs,
        List<String> architecturalRoles,
        List<String> architecturalTraits,
        Map<String, Object> metadata
    ) {
        public ArchitectureEntity(
            String id,
            String kind,
            String origin,
            String name,
            String displayName,
            String scopeId,
            List<SourceReference> sourceRefs,
            Map<String, Object> metadata
        ) {
            this(id, kind, origin, name, displayName, scopeId, sourceRefs, null, null, metadata);
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ArchitectureRelationship(
        String id,
        String kind,
        String fromEntityId,
        String toEntityId,
        String label,
        List<SourceReference> sourceRefs,
        NormalizedAssociation normalizedAssociation,
        Map<String, Object> metadata
    ) {
        public ArchitectureRelationship(
            String id,
            String kind,
            String fromEntityId,
            String toEntityId,
            String label,
            List<SourceReference> sourceRefs,
            Map<String, Object> metadata
        ) {
            this(id, kind, fromEntityId, toEntityId, label, sourceRefs, null, metadata);
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record NormalizedAssociation(
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
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record DependencyViews(
        List<EntityAssociationRelationship> entityAssociationRelationships,
        RelationshipCatalogs relationshipCatalogs,
        JavaBrowserViews javaBrowserViews
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record EntityAssociationRelationship(
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
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record RelationshipCatalogs(
        RelationshipCatalog entityAssociations
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record RelationshipCatalog(
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
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record JavaBrowserViews(
        List<JavaBrowserView> views,
        List<String> availableViews,
        String defaultViewId
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record JavaBrowserView(
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
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ArchitectureViewpoint(
        String id,
        String title,
        String description,
        String availability,
        Double confidence,
        List<String> seedEntityIds,
        List<String> seedRoleIds,
        List<String> expandViaSemantics,
        List<String> preferredDependencyViews,
        List<String> evidenceSources
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Diagnostic(
        String id,
        String severity,
        String phase,
        String code,
        String message,
        boolean fatal,
        String filePath,
        String scopeId,
        String entityId,
        List<SourceReference> sourceRefs,
        Map<String, Object> metadata
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record SourceReference(
        String path,
        Integer startLine,
        Integer endLine,
        String snippet,
        Map<String, Object> metadata
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record CompletenessMetadata(
        String status,
        int indexedFileCount,
        int totalFileCount,
        int degradedFileCount,
        List<String> omittedPaths,
        List<String> notes
    ) {}
}
