package info.isaksson.erland.architecturebrowser.platform.service.operations;

import info.isaksson.erland.architecturebrowser.platform.api.dto.OperationsDtos.OperationsSummary;
import info.isaksson.erland.architecturebrowser.platform.api.dto.OperationsDtos.RepositoryAdminRow;
import info.isaksson.erland.architecturebrowser.platform.domain.CompletenessStatus;
import info.isaksson.erland.architecturebrowser.platform.domain.RepositoryRegistrationEntity;
import info.isaksson.erland.architecturebrowser.platform.domain.RepositoryStatus;
import info.isaksson.erland.architecturebrowser.platform.domain.RunOutcome;
import info.isaksson.erland.architecturebrowser.platform.domain.RunStatus;
import info.isaksson.erland.architecturebrowser.platform.domain.SnapshotStatus;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@ApplicationScoped
public class OperationsOverviewRepositorySectionBuilder {
    List<RepositoryAdminRow> buildRepositoryRows(
        List<RepositoryRegistrationEntity> repositories,
        List<OperationsOverviewWorkspaceQueryService.RunSummaryProjection> runs,
        List<OperationsOverviewWorkspaceQueryService.SnapshotSummaryProjection> snapshots
    ) {
        Map<String, Long> snapshotCountsByRepo = snapshots.stream()
            .collect(Collectors.groupingBy(snapshot -> snapshot.repositoryRegistrationId, Collectors.counting()));
        Map<String, Long> runCountsByRepo = runs.stream()
            .collect(Collectors.groupingBy(run -> run.repositoryRegistrationId, Collectors.counting()));
        Map<String, OperationsOverviewWorkspaceQueryService.SnapshotSummaryProjection> latestSnapshotByRepo = snapshots.stream()
            .collect(Collectors.toMap(snapshot -> snapshot.repositoryRegistrationId, Function.identity(), this::latestSnapshot));
        Map<String, OperationsOverviewWorkspaceQueryService.RunSummaryProjection> latestRunByRepo = runs.stream()
            .collect(Collectors.toMap(run -> run.repositoryRegistrationId, Function.identity(), this::latestRun));

        return repositories.stream()
            .sorted(Comparator.comparing((RepositoryRegistrationEntity repo) -> repo.name, String.CASE_INSENSITIVE_ORDER)
                .thenComparing(repo -> repo.repositoryKey, String.CASE_INSENSITIVE_ORDER))
            .map(repo -> toRepositoryRow(repo, latestSnapshotByRepo, latestRunByRepo, snapshotCountsByRepo, runCountsByRepo))
            .toList();
    }

    OperationsSummary buildSummary(
        List<RepositoryRegistrationEntity> repositories,
        List<OperationsOverviewWorkspaceQueryService.RunSummaryProjection> runs,
        List<OperationsOverviewWorkspaceQueryService.SnapshotSummaryProjection> snapshots,
        long auditCount
    ) {
        return new OperationsSummary(
            repositories.size(),
            repositories.stream().filter(repo -> repo.status == RepositoryStatus.ACTIVE).count(),
            runs.size(),
            runs.stream().filter(run -> run.status == RunStatus.FAILED || run.outcome == RunOutcome.FAILED).count(),
            snapshots.size(),
            snapshots.stream().filter(snapshot -> snapshot.status == SnapshotStatus.FAILED
                || snapshot.completenessStatus != CompletenessStatus.COMPLETE
                || snapshot.diagnosticCount > 0).count(),
            auditCount
        );
    }

    private RepositoryAdminRow toRepositoryRow(
        RepositoryRegistrationEntity repo,
        Map<String, OperationsOverviewWorkspaceQueryService.SnapshotSummaryProjection> latestSnapshotByRepo,
        Map<String, OperationsOverviewWorkspaceQueryService.RunSummaryProjection> latestRunByRepo,
        Map<String, Long> snapshotCountsByRepo,
        Map<String, Long> runCountsByRepo
    ) {
        OperationsOverviewWorkspaceQueryService.SnapshotSummaryProjection latestSnapshot = latestSnapshotByRepo.get(repo.id);
        OperationsOverviewWorkspaceQueryService.RunSummaryProjection latestRun = latestRunByRepo.get(repo.id);
        return new RepositoryAdminRow(
            repo.id,
            repo.repositoryKey,
            repo.name,
            repo.status,
            snapshotCountsByRepo.getOrDefault(repo.id, 0L),
            runCountsByRepo.getOrDefault(repo.id, 0L),
            latestSnapshot != null ? latestSnapshot.id : null,
            latestSnapshot != null ? latestSnapshot.importedAt : null,
            latestRun != null ? latestRun.id : null,
            latestRun != null ? latestRun.status : null,
            latestRun != null ? latestRun.outcome : null,
            latestRun != null ? latestRun.requestedAt : null
        );
    }

    private OperationsOverviewWorkspaceQueryService.SnapshotSummaryProjection latestSnapshot(
        OperationsOverviewWorkspaceQueryService.SnapshotSummaryProjection left,
        OperationsOverviewWorkspaceQueryService.SnapshotSummaryProjection right
    ) {
        return left.importedAt.isAfter(right.importedAt) ? left : right;
    }

    private OperationsOverviewWorkspaceQueryService.RunSummaryProjection latestRun(
        OperationsOverviewWorkspaceQueryService.RunSummaryProjection left,
        OperationsOverviewWorkspaceQueryService.RunSummaryProjection right
    ) {
        return left.requestedAt.isAfter(right.requestedAt) ? left : right;
    }
}
