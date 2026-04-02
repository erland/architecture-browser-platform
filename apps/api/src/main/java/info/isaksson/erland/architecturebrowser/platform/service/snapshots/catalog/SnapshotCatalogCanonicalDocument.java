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
        Map<String, Object> metadata
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
