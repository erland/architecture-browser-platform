package info.isaksson.erland.architecturebrowser.platform.api;

import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotPayloadDtos.FullSnapshotPayloadResponse;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotResponseDtos.SnapshotDetailResponse;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotResponseDtos.SnapshotOverviewResponse;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotResponseDtos.SnapshotSummaryResponse;
import info.isaksson.erland.architecturebrowser.platform.service.snapshots.SnapshotCatalogService;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import java.util.List;

@Path("/api/workspaces/{workspaceId}")
@Produces(MediaType.APPLICATION_JSON)
public class SnapshotCatalogResource {
    @Inject
    SnapshotCatalogService snapshotCatalogService;

    @GET
    @Path("/snapshots")
    public List<SnapshotSummaryResponse> listByWorkspace(@PathParam("workspaceId") String workspaceId) {
        return snapshotCatalogService.listByWorkspace(workspaceId);
    }

    @GET
    @Path("/repositories/{repositoryId}/snapshots")
    public List<SnapshotSummaryResponse> listByRepository(@PathParam("workspaceId") String workspaceId,
                                                          @PathParam("repositoryId") String repositoryId) {
        return snapshotCatalogService.listByRepository(workspaceId, repositoryId);
    }

    @GET
    @Path("/snapshots/{snapshotId}")
    public SnapshotDetailResponse getDetail(@PathParam("workspaceId") String workspaceId,
                                            @PathParam("snapshotId") String snapshotId) {
        return snapshotCatalogService.getDetail(workspaceId, snapshotId);
    }

    @GET
    @Path("/snapshots/{snapshotId}/overview")
    public SnapshotOverviewResponse getOverview(@PathParam("workspaceId") String workspaceId,
                                                @PathParam("snapshotId") String snapshotId) {
        return snapshotCatalogService.getOverview(workspaceId, snapshotId);
    }

    @GET
    @Path("/snapshots/{snapshotId}/full")
    public FullSnapshotPayloadResponse getFullSnapshotPayload(@PathParam("workspaceId") String workspaceId,
                                                              @PathParam("snapshotId") String snapshotId) {
        return snapshotCatalogService.getFullSnapshotPayload(workspaceId, snapshotId);
    }
}
