package info.isaksson.erland.architecturebrowser.platform.api;

import info.isaksson.erland.architecturebrowser.platform.api.dto.EntryPointDtos.EntryCategory;
import info.isaksson.erland.architecturebrowser.platform.api.dto.EntryPointDtos.EntryPointViewResponse;
import info.isaksson.erland.architecturebrowser.platform.service.snapshots.SnapshotEntryPointExplorerService;
import jakarta.inject.Inject;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;

@Path("/api/workspaces/{workspaceId}/snapshots/{snapshotId}/entry-points")
@Produces(MediaType.APPLICATION_JSON)
public class SnapshotEntryPointResource {
    @Inject
    SnapshotEntryPointExplorerService snapshotEntryPointExplorerService;

    @GET
    public EntryPointViewResponse getView(@PathParam("workspaceId") String workspaceId,
                                          @PathParam("snapshotId") String snapshotId,
                                          @QueryParam("scopeId") String scopeId,
                                          @QueryParam("focusEntityId") String focusEntityId,
                                          @QueryParam("category") @DefaultValue("ALL") EntryCategory category) {
        return snapshotEntryPointExplorerService.getView(workspaceId, snapshotId, scopeId, category, focusEntityId);
    }
}
