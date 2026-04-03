package info.isaksson.erland.architecturebrowser.platform.service.operations;

import info.isaksson.erland.architecturebrowser.platform.api.dto.OperationsDtos.OperationsOverviewResponse;
import info.isaksson.erland.architecturebrowser.platform.api.dto.OperationsDtos.RetentionApplyRequest;
import info.isaksson.erland.architecturebrowser.platform.api.dto.OperationsDtos.RetentionPreviewResponse;
import info.isaksson.erland.architecturebrowser.platform.service.management.WorkspaceManagementService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class OperationsAdminService {
    static final int DEFAULT_KEEP_SNAPSHOTS = 2;
    static final int DEFAULT_KEEP_RUNS = 5;

    @Inject
    WorkspaceManagementService workspaceManagementService;

    @Inject
    OperationsOverviewAssembler operationsOverviewAssembler;

    @Inject
    OperationsRetentionPolicyResolver retentionPolicyResolver;

    @Inject
    OperationsRetentionPlanner operationsRetentionPlanner;

    @Inject
    OperationsRetentionExecutionService operationsRetentionExecutionService;

    public OperationsOverviewResponse getOverview(String workspaceId) {
        workspaceManagementService.requireWorkspace(workspaceId);
        return operationsOverviewAssembler.buildOverview(workspaceId);
    }

    public RetentionPreviewResponse previewRetention(String workspaceId, Integer keepSnapshotsPerRepository, Integer keepRunsPerRepository) {
        workspaceManagementService.requireWorkspace(workspaceId);
        OperationsRetentionPolicy retentionPolicy = retentionPolicyResolver.resolve(keepSnapshotsPerRepository, keepRunsPerRepository);
        return operationsRetentionPlanner.planRetention(
            workspaceId,
            retentionPolicy.keepSnapshotsPerRepository(),
            retentionPolicy.keepRunsPerRepository()
        ).toResponse(true);
    }

    @Transactional
    public RetentionPreviewResponse applyRetention(String workspaceId, RetentionApplyRequest request) {
        workspaceManagementService.requireWorkspace(workspaceId);
        OperationsRetentionPolicy retentionPolicy = retentionPolicyResolver.resolve(
            request != null ? request.keepSnapshotsPerRepository() : null,
            request != null ? request.keepRunsPerRepository() : null
        );
        boolean dryRun = request != null && request.dryRun();

        OperationsRetentionPlan retentionPlan = operationsRetentionPlanner.planRetention(
            workspaceId,
            retentionPolicy.keepSnapshotsPerRepository(),
            retentionPolicy.keepRunsPerRepository()
        );
        if (!dryRun) {
            operationsRetentionExecutionService.apply(workspaceId, retentionPolicy, retentionPlan);
        }
        return retentionPlan.toResponse(dryRun);
    }
}
