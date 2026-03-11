package info.isaksson.erland.architecturebrowser.platform.api;

import info.isaksson.erland.architecturebrowser.platform.api.dto.DependencyDtos.DependencyDirection;
import info.isaksson.erland.architecturebrowser.platform.api.dto.DependencyDtos.DependencyViewResponse;
import info.isaksson.erland.architecturebrowser.platform.service.snapshots.SnapshotDependencyExplorerService;
import jakarta.inject.Inject;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;

@Path("/api/workspaces/{workspaceId}/snapshots/{snapshotId}/dependencies")
@Produces(MediaType.APPLICATION_JSON)
public class SnapshotDependencyResource {
    @Inject
    SnapshotDependencyExplorerService snapshotDependencyExplorerService;

    @GET
    public DependencyViewResponse getView(@PathParam("workspaceId") String workspaceId,
                                          @PathParam("snapshotId") String snapshotId,
                                          @QueryParam("scopeId") String scopeId,
                                          @QueryParam("focusEntityId") String focusEntityId,
                                          @QueryParam("direction") @DefaultValue("ALL") DependencyDirection direction) {
        return snapshotDependencyExplorerService.getView(workspaceId, snapshotId, scopeId, direction, focusEntityId);
    }
}
