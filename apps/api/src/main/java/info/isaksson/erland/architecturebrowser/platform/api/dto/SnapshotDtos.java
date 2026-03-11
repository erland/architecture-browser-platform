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
}
