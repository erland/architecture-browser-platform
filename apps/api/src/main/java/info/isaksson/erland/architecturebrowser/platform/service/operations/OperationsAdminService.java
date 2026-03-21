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
        int keepSnapshots = resolveKeepSnapshots(keepSnapshotsPerRepository);
        int keepRuns = resolveKeepRuns(keepRunsPerRepository);
        return operationsRetentionPlanner.planRetention(workspaceId, keepSnapshots, keepRuns).toResponse(true);
    }

    @Transactional
    public RetentionPreviewResponse applyRetention(String workspaceId, RetentionApplyRequest request) {
        workspaceManagementService.requireWorkspace(workspaceId);
        int keepSnapshots = resolveKeepSnapshots(request != null ? request.keepSnapshotsPerRepository() : null);
        int keepRuns = resolveKeepRuns(request != null ? request.keepRunsPerRepository() : null);
        boolean dryRun = request != null && request.dryRun();

        OperationsRetentionPlan retentionPlan = operationsRetentionPlanner.planRetention(workspaceId, keepSnapshots, keepRuns);
        if (!dryRun) {
            operationsRetentionCleanupService.applySnapshotDeletes(retentionPlan.snapshotEntitiesToDelete());
            operationsRetentionCleanupService.applyRunDeletes(retentionPlan.runEntitiesToDelete());
            recordRetentionApplied(workspaceId, keepSnapshots, keepRuns, retentionPlan);
        }
        return retentionPlan.toResponse(dryRun);
    }

    private int resolveKeepSnapshots(Integer requested) {
        return operationsRetentionPlanner.normalizeKeepCount(requested, DEFAULT_KEEP_SNAPSHOTS, "keepSnapshotsPerRepository");
    }

    private int resolveKeepRuns(Integer requested) {
        return operationsRetentionPlanner.normalizeKeepCount(requested, DEFAULT_KEEP_RUNS, "keepRunsPerRepository");
    }

    private void recordRetentionApplied(String workspaceId,
                                        int keepSnapshots,
                                        int keepRuns,
                                        OperationsRetentionPlan retentionPlan) {
        auditService.recordWorkspaceEvent(workspaceId, "retention.applied", jsonSupport.write(Map.of(
            "keepSnapshotsPerRepository", keepSnapshots,
            "keepRunsPerRepository", keepRuns,
            "snapshotDeleteCount", retentionPlan.snapshotCandidates().size(),
            "runDeleteCount", retentionPlan.runCandidates().size()
        )));
    }
}
