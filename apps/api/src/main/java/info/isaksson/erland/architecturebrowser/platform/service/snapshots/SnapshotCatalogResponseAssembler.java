package info.isaksson.erland.architecturebrowser.platform.service.snapshots;

import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotDtos.FullSnapshotPayloadResponse;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotDtos.MetadataEnvelope;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotDtos.SnapshotDetailResponse;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotDtos.SnapshotOverviewResponse;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotDtos.SnapshotSummaryResponse;
import info.isaksson.erland.architecturebrowser.platform.domain.CompletenessStatus;
import info.isaksson.erland.architecturebrowser.platform.domain.FactType;
import info.isaksson.erland.architecturebrowser.platform.domain.RepositoryRegistrationEntity;
import info.isaksson.erland.architecturebrowser.platform.domain.RunOutcome;
import info.isaksson.erland.architecturebrowser.platform.domain.SnapshotEntity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.List;

@ApplicationScoped
public class SnapshotCatalogResponseAssembler {
    @Inject
    SnapshotCatalogDocumentMapper documentMapper;

    @Inject
    SnapshotCatalogOverviewBuilder overviewBuilder;

    public List<SnapshotSummaryResponse> toSummaries(List<SnapshotCatalogSummaryProjection> snapshots) {
        return snapshots.stream().map(this::toSummary).toList();
    }

    public SnapshotSummaryResponse toSummary(SnapshotEntity snapshot) {
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

    public SnapshotSummaryResponse toSummary(SnapshotCatalogSummaryProjection snapshot) {
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

    public SnapshotDetailResponse toDetail(SnapshotCatalogPayloadLoader.SnapshotCatalogDocumentContext context) {
        return new SnapshotDetailResponse(
            toSummary(context.snapshot()),
            documentMapper.toSourceInfo(context.document()),
            documentMapper.toRunInfo(context.document()),
            overviewBuilder.collectWarnings(context.document())
        );
    }

    public FullSnapshotPayloadResponse toFullPayload(SnapshotCatalogPayloadLoader.SnapshotCatalogDocumentContext context) {
        return new FullSnapshotPayloadResponse(
            toSummary(context.snapshot()),
            documentMapper.toSourceInfo(context.document()),
            documentMapper.toRunInfo(context.document()),
            documentMapper.toCompletenessInfo(context.document()),
            documentMapper.mapScopes(context.document()),
            documentMapper.mapEntities(context.document()),
            documentMapper.mapRelationships(context.document()),
            documentMapper.mapViewpoints(context.document()),
            documentMapper.mapDiagnostics(context.document()),
            new MetadataEnvelope(documentMapper.metadataEnvelope(context.document())),
            overviewBuilder.collectWarnings(context.document())
        );
    }

    public SnapshotOverviewResponse toOverview(SnapshotCatalogPayloadLoader.SnapshotCatalogDocumentContext context) {
        return new SnapshotOverviewResponse(
            toSummary(context.snapshot()),
            documentMapper.toSourceInfo(context.document()),
            documentMapper.toRunInfo(context.document()),
            documentMapper.toCompletenessInfo(context.document()),
            overviewBuilder.summarizeKinds(context.facts(), FactType.SCOPE),
            overviewBuilder.summarizeKinds(context.facts(), FactType.ENTITY),
            overviewBuilder.summarizeKinds(context.facts(), FactType.RELATIONSHIP),
            overviewBuilder.summarizeKinds(context.facts(), FactType.DIAGNOSTIC),
            overviewBuilder.buildTopScopes(context.document(), context.facts()),
            overviewBuilder.buildRecentDiagnostics(context.document()),
            overviewBuilder.collectWarnings(context.document())
        );
    }

    private RunOutcome deriveRunOutcome(CompletenessStatus completenessStatus) {
        return switch (completenessStatus) {
            case COMPLETE -> RunOutcome.SUCCESS;
            case PARTIAL -> RunOutcome.PARTIAL;
            case FAILED -> RunOutcome.FAILED;
        };
    }
}
