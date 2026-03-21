package info.isaksson.erland.architecturebrowser.platform.service.snapshots;

import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotDtos.FullSnapshotPayloadResponse;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotDtos.MetadataEnvelope;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotDtos.SnapshotDetailResponse;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotDtos.SnapshotOverviewResponse;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotDtos.SnapshotSummaryResponse;
import info.isaksson.erland.architecturebrowser.platform.contract.ArchitectureIndexDocument;
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

    public List<SnapshotSummaryResponse> listByWorkspace(String workspaceId) {
        workspaceManagementService.requireWorkspace(workspaceId);
        List<SnapshotEntity> snapshots = SnapshotEntity.list("workspaceId = ?1 order by importedAt desc", workspaceId);
        return mapSummaries(snapshots);
    }

    public List<SnapshotSummaryResponse> listByRepository(String workspaceId, String repositoryId) {
        workspaceManagementService.requireWorkspace(workspaceId);
        repositoryManagementService.requireRepository(workspaceId, repositoryId);
        List<SnapshotEntity> snapshots = SnapshotEntity.list(
            "workspaceId = ?1 and repositoryRegistrationId = ?2 order by importedAt desc",
            workspaceId,
            repositoryId
        );
        return mapSummaries(snapshots);
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

    private List<SnapshotSummaryResponse> mapSummaries(List<SnapshotEntity> snapshots) {
        return snapshots.stream().map(this::toSummary).toList();
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

    private RunOutcome deriveRunOutcome(SnapshotEntity snapshot) {
        return switch (snapshot.completenessStatus) {
            case COMPLETE -> RunOutcome.SUCCESS;
            case PARTIAL -> RunOutcome.PARTIAL;
            case FAILED -> RunOutcome.FAILED;
        };
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
