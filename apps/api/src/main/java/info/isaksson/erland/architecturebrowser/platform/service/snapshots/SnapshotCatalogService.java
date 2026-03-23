package info.isaksson.erland.architecturebrowser.platform.service.snapshots;

import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotDtos.FullSnapshotPayloadResponse;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotDtos.MetadataEnvelope;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotDtos.SnapshotDetailResponse;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotDtos.SnapshotOverviewResponse;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotDtos.SnapshotSummaryResponse;
import info.isaksson.erland.architecturebrowser.platform.contract.ArchitectureIndexDocument;
import info.isaksson.erland.architecturebrowser.platform.domain.CompletenessStatus;
import info.isaksson.erland.architecturebrowser.platform.domain.FactType;
import info.isaksson.erland.architecturebrowser.platform.domain.ImportedFactEntity;
import info.isaksson.erland.architecturebrowser.platform.domain.RepositoryRegistrationEntity;
import info.isaksson.erland.architecturebrowser.platform.domain.RunOutcome;
import info.isaksson.erland.architecturebrowser.platform.domain.SnapshotEntity;
import info.isaksson.erland.architecturebrowser.platform.service.management.NotFoundException;
import info.isaksson.erland.architecturebrowser.platform.service.management.RepositoryManagementService;
import info.isaksson.erland.architecturebrowser.platform.service.management.WorkspaceManagementService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;

import java.time.Instant;
import java.util.List;

@ApplicationScoped
public class SnapshotCatalogService {
    @Inject
    WorkspaceManagementService workspaceManagementService;

    @Inject
    RepositoryManagementService repositoryManagementService;

    @Inject
    SnapshotCatalogDocumentReader documentReader;

    @Inject
    SnapshotCatalogDocumentMapper documentMapper;

    @Inject
    SnapshotCatalogOverviewBuilder overviewBuilder;

    @Inject
    EntityManager entityManager;

    public List<SnapshotSummaryResponse> listByWorkspace(String workspaceId) {
        workspaceManagementService.requireWorkspace(workspaceId);
        List<SnapshotSummaryProjection> snapshots = entityManager.createQuery("""
            select new info.isaksson.erland.architecturebrowser.platform.service.snapshots.SnapshotCatalogService$SnapshotSummaryProjection(
                s.id, s.workspaceId, s.repositoryRegistrationId, r.repositoryKey, r.name, s.runId, s.snapshotKey,
                s.status, s.completenessStatus, s.schemaVersion, s.indexerVersion, s.sourceRevision, s.sourceBranch,
                s.importedAt, s.scopeCount, s.entityCount, s.relationshipCount, s.diagnosticCount,
                s.indexedFileCount, s.totalFileCount, s.degradedFileCount
            )
            from SnapshotEntity s
            left join RepositoryRegistrationEntity r on r.id = s.repositoryRegistrationId
            where s.workspaceId = :workspaceId
            order by s.importedAt desc
            """, SnapshotSummaryProjection.class)
            .setParameter("workspaceId", workspaceId)
            .getResultList();
        return snapshots.stream().map(this::toSummary).toList();
    }

    public List<SnapshotSummaryResponse> listByRepository(String workspaceId, String repositoryId) {
        workspaceManagementService.requireWorkspace(workspaceId);
        repositoryManagementService.requireRepository(workspaceId, repositoryId);
        List<SnapshotSummaryProjection> snapshots = entityManager.createQuery("""
            select new info.isaksson.erland.architecturebrowser.platform.service.snapshots.SnapshotCatalogService$SnapshotSummaryProjection(
                s.id, s.workspaceId, s.repositoryRegistrationId, r.repositoryKey, r.name, s.runId, s.snapshotKey,
                s.status, s.completenessStatus, s.schemaVersion, s.indexerVersion, s.sourceRevision, s.sourceBranch,
                s.importedAt, s.scopeCount, s.entityCount, s.relationshipCount, s.diagnosticCount,
                s.indexedFileCount, s.totalFileCount, s.degradedFileCount
            )
            from SnapshotEntity s
            left join RepositoryRegistrationEntity r on r.id = s.repositoryRegistrationId
            where s.workspaceId = :workspaceId and s.repositoryRegistrationId = :repositoryId
            order by s.importedAt desc
            """, SnapshotSummaryProjection.class)
            .setParameter("workspaceId", workspaceId)
            .setParameter("repositoryId", repositoryId)
            .getResultList();
        return snapshots.stream().map(this::toSummary).toList();
    }

    public SnapshotDetailResponse getDetail(String workspaceId, String snapshotId) {
        SnapshotEntity snapshot = requireSnapshot(workspaceId, snapshotId);
        ArchitectureIndexDocument document = documentReader.parseDocument(snapshot.rawPayloadJson);
        return new SnapshotDetailResponse(
            toSummary(snapshot),
            documentMapper.toSourceInfo(document),
            documentMapper.toRunInfo(document),
            overviewBuilder.collectWarnings(document)
        );
    }

    public FullSnapshotPayloadResponse getFullSnapshotPayload(String workspaceId, String snapshotId) {
        SnapshotEntity snapshot = requireSnapshot(workspaceId, snapshotId);
        ArchitectureIndexDocument document = documentReader.parseDocument(snapshot.rawPayloadJson);
        return new FullSnapshotPayloadResponse(
            toSummary(snapshot),
            documentMapper.toSourceInfo(document),
            documentMapper.toRunInfo(document),
            documentMapper.toCompletenessInfo(document),
            documentMapper.mapScopes(document),
            documentMapper.mapEntities(document),
            documentMapper.mapRelationships(document),
            documentMapper.mapViewpoints(document),
            documentMapper.mapDiagnostics(document),
            new MetadataEnvelope(documentMapper.metadataEnvelope(document)),
            overviewBuilder.collectWarnings(document)
        );
    }

    public SnapshotOverviewResponse getOverview(String workspaceId, String snapshotId) {
        SnapshotEntity snapshot = requireSnapshot(workspaceId, snapshotId);
        ArchitectureIndexDocument document = documentReader.parseDocument(snapshot.rawPayloadJson);
        List<ImportedFactEntity> facts = ImportedFactEntity.list("snapshotId", snapshot.id);

        return new SnapshotOverviewResponse(
            toSummary(snapshot),
            documentMapper.toSourceInfo(document),
            documentMapper.toRunInfo(document),
            documentMapper.toCompletenessInfo(document),
            overviewBuilder.summarizeKinds(facts, FactType.SCOPE),
            overviewBuilder.summarizeKinds(facts, FactType.ENTITY),
            overviewBuilder.summarizeKinds(facts, FactType.RELATIONSHIP),
            overviewBuilder.summarizeKinds(facts, FactType.DIAGNOSTIC),
            overviewBuilder.buildTopScopes(document, facts),
            overviewBuilder.buildRecentDiagnostics(document),
            overviewBuilder.collectWarnings(document)
        );
    }

    public SnapshotSummaryResponse getSummary(String workspaceId, String snapshotId) {
        return toSummary(requireSnapshot(workspaceId, snapshotId));
    }

    private SnapshotSummaryResponse toSummary(SnapshotEntity snapshot) {
        RepositoryRegistrationEntity repository = RepositoryRegistrationEntity.findById(snapshot.repositoryRegistrationId);
        return new SnapshotSummaryResponse(
            snapshot.id,
            snapshot.workspaceId,
            snapshot.repositoryRegistrationId,
            repository != null ? repository.repositoryKey : null,
            repository != null ? repository.name : null,
            snapshot.runId,
            snapshot.snapshotKey,
            snapshot.status,
            snapshot.completenessStatus,
            deriveRunOutcome(snapshot),
            snapshot.schemaVersion,
            snapshot.indexerVersion,
            snapshot.sourceRevision,
            snapshot.sourceBranch,
            snapshot.importedAt,
            snapshot.scopeCount,
            snapshot.entityCount,
            snapshot.relationshipCount,
            snapshot.diagnosticCount,
            snapshot.indexedFileCount,
            snapshot.totalFileCount,
            snapshot.degradedFileCount
        );
    }

    private SnapshotSummaryResponse toSummary(SnapshotSummaryProjection snapshot) {
        return new SnapshotSummaryResponse(
            snapshot.id,
            snapshot.workspaceId,
            snapshot.repositoryRegistrationId,
            snapshot.repositoryKey,
            snapshot.repositoryName,
            snapshot.runId,
            snapshot.snapshotKey,
            snapshot.status,
            snapshot.completenessStatus,
            deriveRunOutcome(snapshot.completenessStatus),
            snapshot.schemaVersion,
            snapshot.indexerVersion,
            snapshot.sourceRevision,
            snapshot.sourceBranch,
            snapshot.importedAt,
            snapshot.scopeCount,
            snapshot.entityCount,
            snapshot.relationshipCount,
            snapshot.diagnosticCount,
            snapshot.indexedFileCount,
            snapshot.totalFileCount,
            snapshot.degradedFileCount
        );
    }

    private RunOutcome deriveRunOutcome(SnapshotEntity snapshot) {
        return deriveRunOutcome(snapshot.completenessStatus);
    }

    private RunOutcome deriveRunOutcome(CompletenessStatus completenessStatus) {
        return switch (completenessStatus) {
            case COMPLETE -> RunOutcome.SUCCESS;
            case PARTIAL -> RunOutcome.PARTIAL;
            case FAILED -> RunOutcome.FAILED;
        };
    }


    public static class SnapshotSummaryProjection {
        public final String id;
        public final String workspaceId;
        public final String repositoryRegistrationId;
        public final String repositoryKey;
        public final String repositoryName;
        public final String runId;
        public final String snapshotKey;
        public final info.isaksson.erland.architecturebrowser.platform.domain.SnapshotStatus status;
        public final info.isaksson.erland.architecturebrowser.platform.domain.CompletenessStatus completenessStatus;
        public final String schemaVersion;
        public final String indexerVersion;
        public final String sourceRevision;
        public final String sourceBranch;
        public final Instant importedAt;
        public final int scopeCount;
        public final int entityCount;
        public final int relationshipCount;
        public final int diagnosticCount;
        public final int indexedFileCount;
        public final int totalFileCount;
        public final int degradedFileCount;

        public SnapshotSummaryProjection(String id, String workspaceId, String repositoryRegistrationId, String repositoryKey, String repositoryName,
                                         String runId, String snapshotKey, info.isaksson.erland.architecturebrowser.platform.domain.SnapshotStatus status,
                                         info.isaksson.erland.architecturebrowser.platform.domain.CompletenessStatus completenessStatus, String schemaVersion,
                                         String indexerVersion, String sourceRevision, String sourceBranch, Instant importedAt, int scopeCount, int entityCount,
                                         int relationshipCount, int diagnosticCount, int indexedFileCount, int totalFileCount, int degradedFileCount) {
            this.id = id;
            this.workspaceId = workspaceId;
            this.repositoryRegistrationId = repositoryRegistrationId;
            this.repositoryKey = repositoryKey;
            this.repositoryName = repositoryName;
            this.runId = runId;
            this.snapshotKey = snapshotKey;
            this.status = status;
            this.completenessStatus = completenessStatus;
            this.schemaVersion = schemaVersion;
            this.indexerVersion = indexerVersion;
            this.sourceRevision = sourceRevision;
            this.sourceBranch = sourceBranch;
            this.importedAt = importedAt;
            this.scopeCount = scopeCount;
            this.entityCount = entityCount;
            this.relationshipCount = relationshipCount;
            this.diagnosticCount = diagnosticCount;
            this.indexedFileCount = indexedFileCount;
            this.totalFileCount = totalFileCount;
            this.degradedFileCount = degradedFileCount;
        }
    }

    private SnapshotEntity requireSnapshot(String workspaceId, String snapshotId) {
        workspaceManagementService.requireWorkspace(workspaceId);
        SnapshotEntity snapshot = SnapshotEntity.findById(snapshotId);
        if (snapshot == null || !workspaceId.equals(snapshot.workspaceId)) {
            throw new NotFoundException("Snapshot not found: " + snapshotId);
        }
        return snapshot;
    }
}
