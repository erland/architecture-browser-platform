package info.isaksson.erland.architecturebrowser.platform.service.operations;

import info.isaksson.erland.architecturebrowser.platform.api.dto.OperationsDtos.RetentionRunCandidate;
import info.isaksson.erland.architecturebrowser.platform.api.dto.OperationsDtos.RetentionSnapshotCandidate;
import info.isaksson.erland.architecturebrowser.platform.domain.IndexRunEntity;
import info.isaksson.erland.architecturebrowser.platform.domain.RepositoryRegistrationEntity;
import info.isaksson.erland.architecturebrowser.platform.domain.RunStatus;
import info.isaksson.erland.architecturebrowser.platform.domain.SnapshotEntity;
import info.isaksson.erland.architecturebrowser.platform.service.management.ValidationException;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@ApplicationScoped
public class OperationsRetentionPlanner {
    int normalizeKeepCount(Integer requested, int defaultValue, String fieldName) {
        int value = requested == null ? defaultValue : requested;
        if (value < 1) {
            throw new ValidationException(List.of(fieldName + " must be at least 1."));
        }
        return value;
    }

    OperationsRetentionPlan planRetention(String workspaceId, int keepSnapshots, int keepRuns) {
        List<RepositoryRegistrationEntity> repositories = RepositoryRegistrationEntity.list("workspaceId", workspaceId);
        Map<String, RepositoryRegistrationEntity> repositoryById = repositories.stream()
            .collect(Collectors.toMap(repo -> repo.id, Function.identity()));
        List<SnapshotEntity> snapshots = SnapshotEntity.list("workspaceId", workspaceId);
        List<IndexRunEntity> runs = IndexRunEntity.list("workspaceId", workspaceId);

        List<SnapshotEntity> snapshotEntitiesToDelete = collectSnapshotsToDelete(repositories, snapshots, keepSnapshots);
        Set<String> retainedSnapshotIds = snapshots.stream().map(snapshot -> snapshot.id).collect(Collectors.toSet());
        snapshotEntitiesToDelete.forEach(snapshot -> retainedSnapshotIds.remove(snapshot.id));

        Set<String> retainedRunIds = snapshots.stream()
            .filter(snapshot -> retainedSnapshotIds.contains(snapshot.id))
            .map(snapshot -> snapshot.runId)
            .filter(Objects::nonNull)
            .collect(Collectors.toSet());

        List<IndexRunEntity> runEntitiesToDelete = collectRunsToDelete(repositories, runs, retainedRunIds, keepRuns);

        List<RetentionSnapshotCandidate> snapshotCandidates = snapshotEntitiesToDelete.stream()
            .sorted(Comparator.comparing((SnapshotEntity snapshot) -> snapshot.importedAt).reversed())
            .map(snapshot -> toSnapshotCandidate(snapshot, repositoryById.get(snapshot.repositoryRegistrationId)))
            .toList();
        List<RetentionRunCandidate> runCandidates = runEntitiesToDelete.stream()
            .sorted(Comparator.comparing((IndexRunEntity run) -> run.requestedAt).reversed())
            .map(run -> toRunCandidate(run, repositoryById.get(run.repositoryRegistrationId), retainedRunIds.contains(run.id)))
            .toList();

        return new OperationsRetentionPlan(
            workspaceId,
            keepSnapshots,
            keepRuns,
            snapshotCandidates,
            runCandidates,
            snapshotEntitiesToDelete,
            runEntitiesToDelete
        );
    }

    private List<SnapshotEntity> collectSnapshotsToDelete(
        List<RepositoryRegistrationEntity> repositories,
        List<SnapshotEntity> snapshots,
        int keepSnapshots
    ) {
        List<SnapshotEntity> snapshotEntitiesToDelete = new ArrayList<>();
        for (RepositoryRegistrationEntity repository : repositories) {
            List<SnapshotEntity> repositorySnapshots = snapshots.stream()
                .filter(snapshot -> repository.id.equals(snapshot.repositoryRegistrationId))
                .sorted(Comparator.comparing((SnapshotEntity snapshot) -> snapshot.importedAt).reversed())
                .toList();
            if (repositorySnapshots.size() > keepSnapshots) {
                snapshotEntitiesToDelete.addAll(repositorySnapshots.subList(keepSnapshots, repositorySnapshots.size()));
            }
        }
        return snapshotEntitiesToDelete;
    }

    private List<IndexRunEntity> collectRunsToDelete(
        List<RepositoryRegistrationEntity> repositories,
        List<IndexRunEntity> runs,
        Set<String> retainedRunIds,
        int keepRuns
    ) {
        List<IndexRunEntity> runEntitiesToDelete = new ArrayList<>();
        for (RepositoryRegistrationEntity repository : repositories) {
            List<IndexRunEntity> repositoryRuns = runs.stream()
                .filter(run -> repository.id.equals(run.repositoryRegistrationId))
                .sorted(Comparator.comparing((IndexRunEntity run) -> run.requestedAt).reversed())
                .toList();
            int keptTerminalRuns = 0;
            for (IndexRunEntity run : repositoryRuns) {
                if (!isTerminal(run.status) || retainedRunIds.contains(run.id)) {
                    continue;
                }
                if (keptTerminalRuns < keepRuns) {
                    keptTerminalRuns++;
                    continue;
                }
                runEntitiesToDelete.add(run);
            }
        }
        return runEntitiesToDelete;
    }

    private boolean isTerminal(RunStatus status) {
        return status == RunStatus.COMPLETED || status == RunStatus.FAILED || status == RunStatus.CANCELED;
    }

    private RetentionSnapshotCandidate toSnapshotCandidate(SnapshotEntity snapshot, RepositoryRegistrationEntity repository) {
        return new RetentionSnapshotCandidate(
            snapshot.id,
            snapshot.repositoryRegistrationId,
            repository != null ? repository.repositoryKey : null,
            repository != null ? repository.name : null,
            snapshot.snapshotKey,
            snapshot.importedAt,
            snapshot.entityCount,
            snapshot.relationshipCount,
            snapshot.diagnosticCount
        );
    }

    private RetentionRunCandidate toRunCandidate(IndexRunEntity run, RepositoryRegistrationEntity repository, boolean retainedBySnapshot) {
        return new RetentionRunCandidate(
            run.id,
            run.repositoryRegistrationId,
            repository != null ? repository.repositoryKey : null,
            repository != null ? repository.name : null,
            run.status,
            run.outcome,
            run.requestedAt,
            retainedBySnapshot,
            run.errorSummary
        );
    }
}
