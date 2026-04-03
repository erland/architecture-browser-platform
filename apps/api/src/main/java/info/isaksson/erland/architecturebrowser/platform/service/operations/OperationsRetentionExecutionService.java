package info.isaksson.erland.architecturebrowser.platform.service.operations;

import info.isaksson.erland.architecturebrowser.platform.service.JsonSupport;
import info.isaksson.erland.architecturebrowser.platform.service.management.AuditService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.Map;

@ApplicationScoped
public class OperationsRetentionExecutionService {
    @Inject
    OperationsRetentionCleanupService operationsRetentionCleanupService;

    @Inject
    AuditService auditService;

    @Inject
    JsonSupport jsonSupport;

    void apply(String workspaceId, OperationsRetentionPolicy retentionPolicy, OperationsRetentionPlan retentionPlan) {
        operationsRetentionCleanupService.applySnapshotDeletes(retentionPlan.snapshotEntitiesToDelete());
        operationsRetentionCleanupService.applyRunDeletes(retentionPlan.runEntitiesToDelete());
        recordRetentionApplied(workspaceId, retentionPolicy, retentionPlan);
    }

    private void recordRetentionApplied(String workspaceId,
                                        OperationsRetentionPolicy retentionPolicy,
                                        OperationsRetentionPlan retentionPlan) {
        auditService.recordWorkspaceEvent(workspaceId, "retention.applied", jsonSupport.write(Map.of(
            "keepSnapshotsPerRepository", retentionPolicy.keepSnapshotsPerRepository(),
            "keepRunsPerRepository", retentionPolicy.keepRunsPerRepository(),
            "snapshotDeleteCount", retentionPlan.snapshotCandidates().size(),
            "runDeleteCount", retentionPlan.runCandidates().size()
        )));
    }
}
