package info.isaksson.erland.architecturebrowser.platform.api.dto;

import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotSharedDtos.CompletenessInfo;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotSharedDtos.DiagnosticSummary;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotSharedDtos.KindCount;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotSharedDtos.NameCount;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotSharedDtos.RunInfo;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotSharedDtos.SourceInfo;
import info.isaksson.erland.architecturebrowser.platform.domain.CompletenessStatus;
import info.isaksson.erland.architecturebrowser.platform.domain.RunOutcome;
import info.isaksson.erland.architecturebrowser.platform.domain.SnapshotStatus;

import java.time.Instant;
import java.util.List;

public final class SnapshotResponseDtos {
    private SnapshotResponseDtos() {
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

}
