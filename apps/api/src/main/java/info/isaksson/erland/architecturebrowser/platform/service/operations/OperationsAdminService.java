package info.isaksson.erland.architecturebrowser.platform.service.operations;

import info.isaksson.erland.architecturebrowser.platform.api.dto.OperationsDtos.OperationsOverviewResponse;
import info.isaksson.erland.architecturebrowser.platform.api.dto.OperationsDtos.RetentionApplyRequest;
import info.isaksson.erland.architecturebrowser.platform.api.dto.OperationsDtos.RetentionPreviewResponse;
import info.isaksson.erland.architecturebrowser.platform.service.JsonSupport;
import info.isaksson.erland.architecturebrowser.platform.service.management.AuditService;
import info.isaksson.erland.architecturebrowser.platform.service.management.WorkspaceManagementService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.util.Map;

@ApplicationScoped
public class OperationsAdminService {
    static final int DEFAULT_KEEP_SNAPSHOTS = 2;
    static final int DEFAULT_KEEP_RUNS = 5;

    @Inject
    WorkspaceManagementService workspaceManagementService;

    @Inject
    AuditService auditService;

    @Inject
    JsonSupport jsonSupport;

    @Inject
    OperationsOverviewAssembler operationsOverviewAssembler;

    @Inject
    OperationsRetentionPlanner operationsRetentionPlanner;

    @Inject
    OperationsRetentionCleanupService operationsRetentionCleanupService;

    public OperationsOverviewResponse getOverview(String workspaceId) {
        workspaceManagementService.requireWorkspace(workspaceId);
        return operationsOverviewAssembler.buildOverview(workspaceId);
    }

    public RetentionPreviewResponse previewRetention(String workspaceId, Integer keepSnapshotsPerRepository, Integer keepRunsPerRepository) {
        workspaceManagementService.requireWorkspace(workspaceId);
        int keepSnapshots = operationsRetentionPlanner.normalizeKeepCount(
            keepSnapshotsPerRepository,
            DEFAULT_KEEP_SNAPSHOTS,
            "keepSnapshotsPerRepository"
        );
        int keepRuns = operationsRetentionPlanner.normalizeKeepCount(
            keepRunsPerRepository,
            DEFAULT_KEEP_RUNS,
            "keepRunsPerRepository"
        );
        return operationsRetentionPlanner.planRetention(workspaceId, keepSnapshots, keepRuns).toResponse(true);
    }

    @Transactional
    public RetentionPreviewResponse applyRetention(String workspaceId, RetentionApplyRequest request) {
        workspaceManagementService.requireWorkspace(workspaceId);
        int keepSnapshots = operationsRetentionPlanner.normalizeKeepCount(
            request != null ? request.keepSnapshotsPerRepository() : null,
            DEFAULT_KEEP_SNAPSHOTS,
            "keepSnapshotsPerRepository"
        );
        int keepRuns = operationsRetentionPlanner.normalizeKeepCount(
            request != null ? request.keepRunsPerRepository() : null,
            DEFAULT_KEEP_RUNS,
            "keepRunsPerRepository"
        );
        boolean dryRun = request != null && request.dryRun();

        OperationsRetentionPlan retentionPlan = operationsRetentionPlanner.planRetention(workspaceId, keepSnapshots, keepRuns);
        if (!dryRun) {
            operationsRetentionCleanupService.applySnapshotDeletes(retentionPlan.snapshotEntitiesToDelete());
            operationsRetentionCleanupService.applyRunDeletes(retentionPlan.runEntitiesToDelete());
            auditService.recordWorkspaceEvent(workspaceId, "retention.applied", jsonSupport.write(Map.of(
                "keepSnapshotsPerRepository", keepSnapshots,
                "keepRunsPerRepository", keepRuns,
                "snapshotDeleteCount", retentionPlan.snapshotCandidates().size(),
                "runDeleteCount", retentionPlan.runCandidates().size()
            )));
        }
        return retentionPlan.toResponse(dryRun);
    }
}
