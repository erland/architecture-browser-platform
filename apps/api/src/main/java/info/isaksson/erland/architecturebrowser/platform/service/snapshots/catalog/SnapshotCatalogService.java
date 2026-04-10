package info.isaksson.erland.architecturebrowser.platform.service.snapshots;

import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotPayloadDtos.FullSnapshotPayloadResponse;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotResponseDtos.SnapshotDetailResponse;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotResponseDtos.SnapshotOverviewResponse;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotResponseDtos.SnapshotSummaryResponse;
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
    SnapshotCatalogRequestContextLoader requestContextLoader;

    @Inject
    SnapshotCatalogReadWorkflowService readWorkflowService;

    @Inject
    SnapshotCatalogResponseAssembler responseAssembler;

    public List<SnapshotSummaryResponse> listByWorkspace(String workspaceId) {
        return responseAssembler.toSummaries(queryService.listByWorkspace(workspaceId));
    }

    public List<SnapshotSummaryResponse> listByRepository(String workspaceId, String repositoryId) {
        return responseAssembler.toSummaries(queryService.listByRepository(workspaceId, repositoryId));
    }

    public SnapshotDetailResponse getDetail(String workspaceId, String snapshotId) {
        return readWorkflowService.loadDetail(requestContextLoader.load(workspaceId, snapshotId));
    }

    public FullSnapshotPayloadResponse getFullSnapshotPayload(String workspaceId, String snapshotId) {
        return readWorkflowService.loadFullPayload(requestContextLoader.load(workspaceId, snapshotId));
    }

    public SnapshotOverviewResponse getOverview(String workspaceId, String snapshotId) {
        return readWorkflowService.loadOverview(requestContextLoader.load(workspaceId, snapshotId));
    }

    public SnapshotSummaryResponse getSummary(String workspaceId, String snapshotId) {
        return responseAssembler.toSummary(queryService.requireSummary(workspaceId, snapshotId));
    }
}
