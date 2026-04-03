package info.isaksson.erland.architecturebrowser.platform.service.operations;

import info.isaksson.erland.architecturebrowser.platform.domain.AuditEventEntity;
import info.isaksson.erland.architecturebrowser.platform.domain.CompletenessStatus;
import info.isaksson.erland.architecturebrowser.platform.domain.IndexRunEntity;
import info.isaksson.erland.architecturebrowser.platform.domain.RepositoryRegistrationEntity;
import info.isaksson.erland.architecturebrowser.platform.domain.RunOutcome;
import info.isaksson.erland.architecturebrowser.platform.domain.RunStatus;
import info.isaksson.erland.architecturebrowser.platform.domain.SnapshotEntity;
import info.isaksson.erland.architecturebrowser.platform.domain.SnapshotStatus;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;

import java.time.Instant;
import java.util.List;

@ApplicationScoped
public class OperationsOverviewWorkspaceQueryService {
    @Inject
    EntityManager entityManager;

    List<RepositoryRegistrationEntity> listRepositories(String workspaceId) {
        return RepositoryRegistrationEntity.list("workspaceId", workspaceId);
    }

    List<RunSummaryProjection> listRuns(String workspaceId) {
        return entityManager.createQuery("""
            select new info.isaksson.erland.architecturebrowser.platform.service.operations.OperationsOverviewWorkspaceQueryService$RunSummaryProjection(
                r.id, r.repositoryRegistrationId, r.status, r.outcome, r.requestedAt, r.completedAt, r.errorSummary
            )
            from IndexRunEntity r
            where r.workspaceId = :workspaceId
            """, RunSummaryProjection.class)
            .setParameter("workspaceId", workspaceId)
            .getResultList();
    }

    List<SnapshotSummaryProjection> listSnapshots(String workspaceId) {
        return entityManager.createQuery("""
            select new info.isaksson.erland.architecturebrowser.platform.service.operations.OperationsOverviewWorkspaceQueryService$SnapshotSummaryProjection(
                s.id, s.repositoryRegistrationId, s.runId, s.snapshotKey, s.status, s.completenessStatus,
                s.importedAt, s.diagnosticCount
            )
            from SnapshotEntity s
            where s.workspaceId = :workspaceId
            """, SnapshotSummaryProjection.class)
            .setParameter("workspaceId", workspaceId)
            .getResultList();
    }

    long countAuditEvents(String workspaceId) {
        return AuditEventEntity.count("workspaceId", workspaceId);
    }

    public static final class RunSummaryProjection {
        public final String id;
        public final String repositoryRegistrationId;
        public final RunStatus status;
        public final RunOutcome outcome;
        public final Instant requestedAt;
        public final Instant completedAt;
        public final String errorSummary;

        public RunSummaryProjection(String id, String repositoryRegistrationId, RunStatus status, RunOutcome outcome, Instant requestedAt, Instant completedAt, String errorSummary) {
            this.id = id;
            this.repositoryRegistrationId = repositoryRegistrationId;
            this.status = status;
            this.outcome = outcome;
            this.requestedAt = requestedAt;
            this.completedAt = completedAt;
            this.errorSummary = errorSummary;
        }
    }

    public static final class SnapshotSummaryProjection {
        public final String id;
        public final String repositoryRegistrationId;
        public final String runId;
        public final String snapshotKey;
        public final SnapshotStatus status;
        public final CompletenessStatus completenessStatus;
        public final Instant importedAt;
        public final int diagnosticCount;

        public SnapshotSummaryProjection(String id, String repositoryRegistrationId, String runId, String snapshotKey, SnapshotStatus status, CompletenessStatus completenessStatus, Instant importedAt, int diagnosticCount) {
            this.id = id;
            this.repositoryRegistrationId = repositoryRegistrationId;
            this.runId = runId;
            this.snapshotKey = snapshotKey;
            this.status = status;
            this.completenessStatus = completenessStatus;
            this.importedAt = importedAt;
            this.diagnosticCount = diagnosticCount;
        }
    }
}
