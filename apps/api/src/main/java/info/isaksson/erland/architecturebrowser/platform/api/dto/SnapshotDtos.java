package info.isaksson.erland.architecturebrowser.platform.api.dto;

import info.isaksson.erland.architecturebrowser.platform.domain.CompletenessStatus;
import info.isaksson.erland.architecturebrowser.platform.domain.RunOutcome;
import info.isaksson.erland.architecturebrowser.platform.domain.SnapshotStatus;

import java.time.Instant;
import java.util.List;

public final class SnapshotDtos {
    private SnapshotDtos() {
    }

    public record SnapshotImportResponse(
        String snapshotId,
        String workspaceId,
        String repositoryRegistrationId,
        String runId,
        String snapshotKey,
        SnapshotStatus status,
        CompletenessStatus completenessStatus,
        RunOutcome derivedRunOutcome,
        String schemaVersion,
        String indexerVersion,
        Instant importedAt,
        int scopeCount,
        int entityCount,
        int relationshipCount,
        int diagnosticCount,
        int indexedFileCount,
        int totalFileCount,
        int degradedFileCount,
        List<String> warnings
    ) {
    }

    public record SnapshotSummaryResponse(
        String id,
        String workspaceId,
        String repositoryRegistrationId,
        String repositoryKey,
        String repositoryName,
        String runId,
        String snapshotKey,
        SnapshotStatus status,
        CompletenessStatus completenessStatus,
        RunOutcome derivedRunOutcome,
        String schemaVersion,
        String indexerVersion,
        String sourceRevision,
        String sourceBranch,
        Instant importedAt,
        int scopeCount,
        int entityCount,
        int relationshipCount,
        int diagnosticCount,
        int indexedFileCount,
        int totalFileCount,
        int degradedFileCount
    ) {
    }

    public record SnapshotDetailResponse(
        SnapshotSummaryResponse snapshot,
        SourceInfo source,
        RunInfo run,
        List<String> warnings
    ) {
    }

    public record SnapshotOverviewResponse(
        SnapshotSummaryResponse snapshot,
        SourceInfo source,
        RunInfo run,
        CompletenessInfo completeness,
        List<KindCount> scopeKinds,
        List<KindCount> entityKinds,
        List<KindCount> relationshipKinds,
        List<KindCount> diagnosticCodes,
        List<NameCount> topScopes,
        List<DiagnosticSummary> recentDiagnostics,
        List<String> warnings
    ) {
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
