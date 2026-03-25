package info.isaksson.erland.architecturebrowser.platform.service.snapshots;

import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotDtos.FullSnapshotPayloadResponse;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotDtos.SnapshotDetailResponse;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotDtos.SnapshotOverviewResponse;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotDtos.SnapshotSummaryResponse;
import info.isaksson.erland.architecturebrowser.platform.domain.SnapshotEntity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.List;

@ApplicationScoped
/**
 * Thin application-service coordinator for snapshot catalog reads. Querying, payload
 * loading, and DTO assembly are delegated to dedicated collaborators so future work
 * can evolve each concern independently.
 */
public class SnapshotCatalogService {
    @Inject
    SnapshotCatalogQueryService queryService;

    @Inject
    SnapshotCatalogPayloadLoader payloadLoader;

    @Inject
    SnapshotCatalogResponseAssembler responseAssembler;

    public List<SnapshotSummaryResponse> listByWorkspace(String workspaceId) {
        return responseAssembler.toSummaries(queryService.listByWorkspace(workspaceId));
    }

    public List<SnapshotSummaryResponse> listByRepository(String workspaceId, String repositoryId) {
        return responseAssembler.toSummaries(queryService.listByRepository(workspaceId, repositoryId));
    }

    public SnapshotDetailResponse getDetail(String workspaceId, String snapshotId) {
        return responseAssembler.toDetail(loadDocumentContext(workspaceId, snapshotId));
    }

    public FullSnapshotPayloadResponse getFullSnapshotPayload(String workspaceId, String snapshotId) {
        return responseAssembler.toFullPayload(loadDocumentContext(workspaceId, snapshotId));
    }

    public SnapshotOverviewResponse getOverview(String workspaceId, String snapshotId) {
        return responseAssembler.toOverview(loadDocumentContext(workspaceId, snapshotId));
    }

    public SnapshotSummaryResponse getSummary(String workspaceId, String snapshotId) {
        return responseAssembler.toSummary(queryService.requireSnapshot(workspaceId, snapshotId));
    }

    private SnapshotCatalogPayloadLoader.SnapshotCatalogDocumentContext loadDocumentContext(String workspaceId, String snapshotId) {
        SnapshotEntity snapshot = queryService.requireSnapshot(workspaceId, snapshotId);
        return payloadLoader.load(snapshot);
    }
}
