package info.isaksson.erland.architecturebrowser.platform.api;

import info.isaksson.erland.architecturebrowser.platform.api.dto.ComparisonDtos.SnapshotComparisonResponse;
import info.isaksson.erland.architecturebrowser.platform.service.snapshots.SnapshotComparisonService;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;

@Path("/api/workspaces/{workspaceId}/snapshots/{snapshotId}/compare")
@Produces(MediaType.APPLICATION_JSON)
public class SnapshotComparisonResource {
    @Inject
    SnapshotComparisonService snapshotComparisonService;

    @GET
    public SnapshotComparisonResponse compare(@PathParam("workspaceId") String workspaceId,
                                              @PathParam("snapshotId") String snapshotId,
                                              @QueryParam("otherSnapshotId") String otherSnapshotId) {
        if (otherSnapshotId == null || otherSnapshotId.isBlank()) {
            throw new info.isaksson.erland.architecturebrowser.platform.service.management.NotFoundException("Comparison snapshot is required");
        }
        return snapshotComparisonService.compare(workspaceId, snapshotId, otherSnapshotId);
    }
}
