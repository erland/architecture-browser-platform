package info.isaksson.erland.architecturebrowser.platform.service.operations;

import info.isaksson.erland.architecturebrowser.platform.api.dto.OperationsDtos.FailedRunRow;
import info.isaksson.erland.architecturebrowser.platform.api.dto.OperationsDtos.RunAdminRow;
import info.isaksson.erland.architecturebrowser.platform.domain.RepositoryRegistrationEntity;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@ApplicationScoped
public class OperationsOverviewRunSectionBuilder {
    List<RunAdminRow> buildRecentRuns(
        List<OperationsOverviewWorkspaceQueryService.RunSummaryProjection> runs,
        List<OperationsOverviewWorkspaceQueryService.SnapshotSummaryProjection> snapshots,
        List<RepositoryRegistrationEntity> repositories
    ) {
        Map<String, RepositoryRegistrationEntity> repositoryById = repositories.stream()
            .collect(Collectors.toMap(repo -> repo.id, Function.identity()));
        Set<String> retainedRunIds = snapshots.stream()
            .map(snapshot -> snapshot.runId)
            .filter(Objects::nonNull)
            .collect(Collectors.toSet());

        return runs.stream()
            .sorted(Comparator.comparing((OperationsOverviewWorkspaceQueryService.RunSummaryProjection run) -> run.requestedAt).reversed())
            .limit(20)
            .map(run -> toRunAdminRow(run, repositoryById.get(run.repositoryRegistrationId), retainedRunIds.contains(run.id)))
            .toList();
    }

    List<FailedRunRow> buildFailedRuns(List<OperationsOverviewAttentionQueryService.FailedRunProjection> failedRunProjections) {
        return failedRunProjections.stream()
            .map(this::toFailedRunRow)
            .toList();
    }

    private RunAdminRow toRunAdminRow(
        OperationsOverviewWorkspaceQueryService.RunSummaryProjection run,
        RepositoryRegistrationEntity repository,
        boolean retainedBySnapshot
    ) {
        return new RunAdminRow(
            run.id,
            run.repositoryRegistrationId,
            repository != null ? repository.repositoryKey : null,
            repository != null ? repository.name : null,
            run.status,
            run.outcome,
            run.requestedAt,
            run.completedAt,
            run.errorSummary,
            retainedBySnapshot
        );
    }

    private FailedRunRow toFailedRunRow(OperationsOverviewAttentionQueryService.FailedRunProjection run) {
        return new FailedRunRow(
            run.id,
            run.repositoryRegistrationId,
            run.repositoryKey,
            run.repositoryName,
            run.status,
            run.outcome,
            run.requestedAt,
            run.completedAt,
            run.errorSummary,
            run.metadataJson
        );
    }
}
