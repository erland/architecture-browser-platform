package info.isaksson.erland.architecturebrowser.platform.api.dto;

import java.util.List;

public final class SnapshotSharedDtos {
    private SnapshotSharedDtos() {
    }

    public record SourceInfo(
        String repositoryId,
        String acquisitionType,
        String path,
        String remoteUrl,
        String branch,
        String revision,
        String acquiredAt
    ) {
    }

    public record RunInfo(
        String startedAt,
        String completedAt,
        String outcome,
        List<String> detectedTechnologies
    ) {
    }

    public record CompletenessInfo(
        String status,
        int indexedFileCount,
        int totalFileCount,
        int degradedFileCount,
        List<String> omittedPaths,
        List<String> notes
    ) {
    }

    public record SourceRef(
        String path,
        Integer startLine,
        Integer endLine,
        String snippet,
        java.util.Map<String, Object> metadata
    ) {
    }

    public record MetadataEnvelope(java.util.Map<String, Object> metadata) {
    }

    public record KindCount(String key, long count) {
    }

    public record NameCount(String externalId, String name, long count) {
    }

    public record DiagnosticSummary(
        String externalId,
        String code,
        String severity,
        String message,
        String filePath,
        String entityId,
        String scopeId
    ) {
    }
}
