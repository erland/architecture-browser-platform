package info.isaksson.erland.architecturebrowser.platform.api.dto;

import info.isaksson.erland.architecturebrowser.platform.domain.RepositoryStatus;
import info.isaksson.erland.architecturebrowser.platform.domain.RunOutcome;
import info.isaksson.erland.architecturebrowser.platform.domain.RunStatus;
import info.isaksson.erland.architecturebrowser.platform.domain.SnapshotStatus;

import java.time.Instant;
import java.util.List;

public final class OperationsDtos {
    private OperationsDtos() {
    }

    public record OperationsOverviewResponse(
        String workspaceId,
        HealthStatus health,
        OperationsSummary summary,
        List<RepositoryAdminRow> repositories,
        List<RunAdminRow> recentRuns,
        List<FailedRunRow> failedRuns,
        List<FailedSnapshotRow> failedSnapshots,
        RetentionPolicyDefaults retentionDefaults,
        Instant generatedAt
    ) {
    }

    public record HealthStatus(
        String status,
        String service,
        String version,
        Instant time
    ) {
    }

    public record OperationsSummary(
        long repositoryCount,
        long activeRepositoryCount,
        long runCount,
        long failedRunCount,
        long snapshotCount,
        long failedSnapshotCount,
        long auditEventCount
    ) {
    }

    public record RepositoryAdminRow(
        String id,
        String repositoryKey,
        String name,
        RepositoryStatus status,
        long snapshotCount,
        long runCount,
        String latestSnapshotId,
        Instant latestSnapshotImportedAt,
        String latestRunId,
        RunStatus latestRunStatus,
        RunOutcome latestRunOutcome,
        Instant latestRunRequestedAt
    ) {
    }

    public record RunAdminRow(
        String id,
        String repositoryRegistrationId,
        String repositoryKey,
        String repositoryName,
        RunStatus status,
        RunOutcome outcome,
        Instant requestedAt,
        Instant completedAt,
        String errorSummary,
        boolean retainedBySnapshot
    ) {
    }

    public record FailedRunRow(
        String id,
        String repositoryRegistrationId,
        String repositoryKey,
        String repositoryName,
        RunStatus status,
        RunOutcome outcome,
        Instant requestedAt,
        Instant completedAt,
        String errorSummary,
        String metadataJson
    ) {
    }

    public record FailedSnapshotRow(
        String id,
        String repositoryRegistrationId,
        String repositoryKey,
        String repositoryName,
        String snapshotKey,
        SnapshotStatus status,
        String completenessStatus,
        Instant importedAt,
        int diagnosticCount,
        List<DiagnosticRow> diagnostics,
        List<String> warnings
    ) {
    }

    public record DiagnosticRow(
        String externalId,
        String severity,
        String phase,
        String code,
        String message,
        boolean fatal,
        String filePath,
        String entityId,
        String scopeId
    ) {
    }

    public record RetentionPolicyDefaults(
        int keepSnapshotsPerRepository,
        int keepRunsPerRepository
    ) {
    }

    public record RetentionApplyRequest(
        Integer keepSnapshotsPerRepository,
        Integer keepRunsPerRepository,
        boolean dryRun
    ) {
    }

    public record RetentionPreviewResponse(
        String workspaceId,
        int keepSnapshotsPerRepository,
        int keepRunsPerRepository,
        long snapshotDeleteCount,
        long runDeleteCount,
        List<RetentionSnapshotCandidate> snapshotsToDelete,
        List<RetentionRunCandidate> runsToDelete,
        Instant generatedAt,
        boolean dryRun
    ) {
    }

    public record RetentionSnapshotCandidate(
        String snapshotId,
        String repositoryRegistrationId,
        String repositoryKey,
        String repositoryName,
        String snapshotKey,
        Instant importedAt,
        int entityCount,
        int relationshipCount,
        int diagnosticCount
    ) {
    }

    public record RetentionRunCandidate(
        String runId,
        String repositoryRegistrationId,
        String repositoryKey,
        String repositoryName,
        RunStatus status,
        RunOutcome outcome,
        Instant requestedAt,
        boolean retainedBySnapshot,
        String errorSummary
    ) {
    }
}
