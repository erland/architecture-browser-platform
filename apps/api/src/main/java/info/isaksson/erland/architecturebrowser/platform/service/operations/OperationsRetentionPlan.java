package info.isaksson.erland.architecturebrowser.platform.service.operations;

import info.isaksson.erland.architecturebrowser.platform.api.dto.OperationsDtos.RetentionPreviewResponse;
import info.isaksson.erland.architecturebrowser.platform.api.dto.OperationsDtos.RetentionRunCandidate;
import info.isaksson.erland.architecturebrowser.platform.api.dto.OperationsDtos.RetentionSnapshotCandidate;
import info.isaksson.erland.architecturebrowser.platform.domain.IndexRunEntity;
import info.isaksson.erland.architecturebrowser.platform.domain.SnapshotEntity;

import java.time.Instant;
import java.util.List;

record OperationsRetentionPlan(
    String workspaceId,
    int keepSnapshotsPerRepository,
    int keepRunsPerRepository,
    List<RetentionSnapshotCandidate> snapshotCandidates,
    List<RetentionRunCandidate> runCandidates,
    List<SnapshotEntity> snapshotEntitiesToDelete,
    List<IndexRunEntity> runEntitiesToDelete
) {
    RetentionPreviewResponse toResponse(boolean dryRun) {
        return new RetentionPreviewResponse(
            workspaceId,
            keepSnapshotsPerRepository,
            keepRunsPerRepository,
            snapshotCandidates.size(),
            runCandidates.size(),
            snapshotCandidates,
            runCandidates,
            Instant.now(),
            dryRun
        );
    }
}
