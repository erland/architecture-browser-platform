package info.isaksson.erland.architecturebrowser.platform.service.operations;

import info.isaksson.erland.architecturebrowser.platform.api.dto.OperationsDtos.*;
import info.isaksson.erland.architecturebrowser.platform.domain.RepositoryRegistrationEntity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.time.Instant;
import java.util.List;

@ApplicationScoped
/**
 * Composes the operations overview from query and section-builder collaborators. The
 * top-level assembler stays intentionally thin so repository, run, and snapshot
 * attention sections can change without re-growing one large coordinator class.
 */
public class OperationsOverviewAssembler {
    @Inject
    OperationsOverviewWorkspaceQueryService workspaceQueryService;

    @Inject
    OperationsOverviewAttentionQueryService attentionQueryService;

    @Inject
    OperationsOverviewRepositorySectionBuilder repositorySectionBuilder;

    @Inject
    OperationsOverviewRunSectionBuilder runSectionBuilder;

    @Inject
    OperationsOverviewSnapshotAttentionBuilder snapshotAttentionBuilder;

    OperationsOverviewResponse buildOverview(String workspaceId) {
        List<RepositoryRegistrationEntity> repositories = workspaceQueryService.listRepositories(workspaceId);
        List<OperationsOverviewWorkspaceQueryService.RunSummaryProjection> runs = workspaceQueryService.listRuns(workspaceId);
        List<OperationsOverviewWorkspaceQueryService.SnapshotSummaryProjection> snapshots = workspaceQueryService.listSnapshots(workspaceId);
        long auditCount = workspaceQueryService.countAuditEvents(workspaceId);

        List<RepositoryAdminRow> repositoryRows = repositorySectionBuilder.buildRepositoryRows(repositories, runs, snapshots);
        List<RunAdminRow> recentRuns = runSectionBuilder.buildRecentRuns(runs, snapshots, repositories);
        List<FailedRunRow> failedRuns = runSectionBuilder.buildFailedRuns(attentionQueryService.listFailedRuns(workspaceId));
        List<FailedSnapshotRow> failedSnapshots = snapshotAttentionBuilder.buildFailedSnapshots(
            attentionQueryService.listFailedSnapshots(workspaceId)
        );

        return new OperationsOverviewResponse(
            workspaceId,
            new HealthStatus("UP", "architecture-browser-platform-api", "0.1.0", Instant.now()),
            repositorySectionBuilder.buildSummary(repositories, runs, snapshots, auditCount),
            repositoryRows,
            recentRuns,
            failedRuns,
            failedSnapshots,
            new RetentionPolicyDefaults(OperationsAdminService.DEFAULT_KEEP_SNAPSHOTS, OperationsAdminService.DEFAULT_KEEP_RUNS),
            Instant.now()
        );
    }
}
