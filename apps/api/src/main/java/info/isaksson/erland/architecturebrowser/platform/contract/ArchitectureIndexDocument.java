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
    List<ArchitectureViewpoint> viewpoints,
    List<Diagnostic> diagnostics,
    CompletenessMetadata completeness,
    Map<String, Object> metadata
) {
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
        Map<String, Object> metadata
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ArchitectureRelationship(
        String id,
        String kind,
        String fromEntityId,
        String toEntityId,
        String label,
        List<SourceReference> sourceRefs,
        Map<String, Object> metadata
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
