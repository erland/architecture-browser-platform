package info.isaksson.erland.architecturebrowser.platform.api;

import info.isaksson.erland.architecturebrowser.platform.api.dto.LayoutDtos.LayoutScopeDetailResponse;
import info.isaksson.erland.architecturebrowser.platform.api.dto.LayoutDtos.LayoutTreeResponse;
import info.isaksson.erland.architecturebrowser.platform.service.snapshots.SnapshotLayoutExplorerService;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/api/workspaces/{workspaceId}/snapshots/{snapshotId}/layout")
@Produces(MediaType.APPLICATION_JSON)
public class SnapshotLayoutResource {
    @Inject
    SnapshotLayoutExplorerService snapshotLayoutExplorerService;

    @GET
    @Path("/tree")
    public LayoutTreeResponse getTree(@PathParam("workspaceId") String workspaceId,
                                      @PathParam("snapshotId") String snapshotId) {
        return snapshotLayoutExplorerService.getTree(workspaceId, snapshotId);
    }

    @GET
    @Path("/scopes/{scopeId}")
    public LayoutScopeDetailResponse getScopeDetail(@PathParam("workspaceId") String workspaceId,
                                                    @PathParam("snapshotId") String snapshotId,
                                                    @PathParam("scopeId") String scopeId) {
        return snapshotLayoutExplorerService.getScopeDetail(workspaceId, snapshotId, scopeId);
    }
}
