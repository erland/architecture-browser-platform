package info.isaksson.erland.architecturebrowser.platform.api;

import info.isaksson.erland.architecturebrowser.platform.api.dto.SearchDtos.EntityDetailResponse;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SearchDtos.EntitySearchResponse;
import info.isaksson.erland.architecturebrowser.platform.service.snapshots.SnapshotSearchService;
import jakarta.inject.Inject;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;

@Path("/api/workspaces/{workspaceId}/snapshots/{snapshotId}")
@Produces(MediaType.APPLICATION_JSON)
public class SnapshotSearchResource {
    @Inject
    SnapshotSearchService snapshotSearchService;

    @GET
    @Path("/search")
    public EntitySearchResponse search(@PathParam("workspaceId") String workspaceId,
                                       @PathParam("snapshotId") String snapshotId,
                                       @QueryParam("q") String query,
                                       @QueryParam("scopeId") String scopeId,
                                       @QueryParam("limit") @DefaultValue("25") int limit) {
        return snapshotSearchService.search(workspaceId, snapshotId, query, scopeId, limit);
    }

    @GET
    @Path("/entities/{entityId}")
    public EntityDetailResponse getEntityDetail(@PathParam("workspaceId") String workspaceId,
                                                @PathParam("snapshotId") String snapshotId,
                                                @PathParam("entityId") String entityId) {
        return snapshotSearchService.getEntityDetail(workspaceId, snapshotId, entityId);
    }
}
