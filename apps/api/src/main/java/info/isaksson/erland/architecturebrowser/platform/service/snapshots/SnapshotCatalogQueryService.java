package info.isaksson.erland.architecturebrowser.platform.service.snapshots;

import info.isaksson.erland.architecturebrowser.platform.domain.SnapshotEntity;
import info.isaksson.erland.architecturebrowser.platform.service.management.NotFoundException;
import info.isaksson.erland.architecturebrowser.platform.service.management.RepositoryManagementService;
import info.isaksson.erland.architecturebrowser.platform.service.management.WorkspaceManagementService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;

import java.util.List;

@ApplicationScoped
public class SnapshotCatalogQueryService {
    @Inject
    WorkspaceManagementService workspaceManagementService;

    @Inject
    RepositoryManagementService repositoryManagementService;

    @Inject
    EntityManager entityManager;

    public List<SnapshotCatalogSummaryProjection> listByWorkspace(String workspaceId) {
        workspaceManagementService.requireWorkspace(workspaceId);
        return entityManager.createQuery(baseSummaryQuery() + """
            where s.workspaceId = :workspaceId
            order by s.importedAt desc
            """, SnapshotCatalogSummaryProjection.class)
            .setParameter("workspaceId", workspaceId)
            .getResultList();
    }

    public List<SnapshotCatalogSummaryProjection> listByRepository(String workspaceId, String repositoryId) {
        workspaceManagementService.requireWorkspace(workspaceId);
        repositoryManagementService.requireRepository(workspaceId, repositoryId);
        return entityManager.createQuery(baseSummaryQuery() + """
            where s.workspaceId = :workspaceId and s.repositoryRegistrationId = :repositoryId
            order by s.importedAt desc
            """, SnapshotCatalogSummaryProjection.class)
            .setParameter("workspaceId", workspaceId)
            .setParameter("repositoryId", repositoryId)
            .getResultList();
    }

    public SnapshotEntity requireSnapshot(String workspaceId, String snapshotId) {
        workspaceManagementService.requireWorkspace(workspaceId);
        SnapshotEntity snapshot = SnapshotEntity.findById(snapshotId);
        if (snapshot == null || !workspaceId.equals(snapshot.workspaceId)) {
            throw new NotFoundException("Snapshot not found: " + snapshotId);
        }
        return snapshot;
    }

    private String baseSummaryQuery() {
        return """
            select new info.isaksson.erland.architecturebrowser.platform.service.snapshots.SnapshotCatalogSummaryProjection(
                s.id, s.workspaceId, s.repositoryRegistrationId, r.repositoryKey, r.name, s.runId, s.snapshotKey,
                s.status, s.completenessStatus, s.schemaVersion, s.indexerVersion, s.sourceRevision, s.sourceBranch,
                s.importedAt, s.scopeCount, s.entityCount, s.relationshipCount, s.diagnosticCount,
                s.indexedFileCount, s.totalFileCount, s.degradedFileCount
            )
            from SnapshotEntity s
            left join RepositoryRegistrationEntity r on r.id = s.repositoryRegistrationId
            """;
    }
}
