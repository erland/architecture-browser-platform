package info.isaksson.erland.architecturebrowser.platform.api;

import info.isaksson.erland.architecturebrowser.platform.api.dto.SavedCanvasDtos;
import info.isaksson.erland.architecturebrowser.platform.service.snapshots.SnapshotSavedCanvasService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/api/workspaces/{workspaceId}/snapshots/{snapshotId}/saved-canvases")
@Produces(MediaType.APPLICATION_JSON)
public class SnapshotSavedCanvasResource {
    @Inject
    SnapshotSavedCanvasService snapshotSavedCanvasService;

    @GET
    public java.util.List<SavedCanvasDtos.SavedCanvasResponse> listSavedCanvases(@PathParam("workspaceId") String workspaceId,
                                                                                  @PathParam("snapshotId") String snapshotId) {
        return snapshotSavedCanvasService.listSavedCanvases(workspaceId, snapshotId);
    }

    @GET
    @Path("/{savedCanvasId}")
    public SavedCanvasDtos.SavedCanvasResponse getSavedCanvas(@PathParam("workspaceId") String workspaceId,
                                                              @PathParam("snapshotId") String snapshotId,
                                                              @PathParam("savedCanvasId") String savedCanvasId) {
        return snapshotSavedCanvasService.getSavedCanvas(workspaceId, snapshotId, savedCanvasId);
    }

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    public Response createSavedCanvas(@PathParam("workspaceId") String workspaceId,
                                      @PathParam("snapshotId") String snapshotId,
                                      SavedCanvasDtos.CreateSavedCanvasRequest request) {
        return Response.status(Response.Status.CREATED).entity(snapshotSavedCanvasService.createSavedCanvas(workspaceId, snapshotId, request)).build();
    }

    @PUT
    @Path("/{savedCanvasId}")
    @Consumes(MediaType.APPLICATION_JSON)
    public SavedCanvasDtos.SavedCanvasResponse updateSavedCanvas(@PathParam("workspaceId") String workspaceId,
                                                                 @PathParam("snapshotId") String snapshotId,
                                                                 @PathParam("savedCanvasId") String savedCanvasId,
                                                                 SavedCanvasDtos.UpdateSavedCanvasRequest request) {
        return snapshotSavedCanvasService.updateSavedCanvas(workspaceId, snapshotId, savedCanvasId, request);
    }

    @POST
    @Path("/{savedCanvasId}/duplicate")
    public Response duplicateSavedCanvas(@PathParam("workspaceId") String workspaceId,
                                         @PathParam("snapshotId") String snapshotId,
                                         @PathParam("savedCanvasId") String savedCanvasId) {
        return Response.status(Response.Status.CREATED).entity(snapshotSavedCanvasService.duplicateSavedCanvas(workspaceId, snapshotId, savedCanvasId)).build();
    }

    @DELETE
    @Path("/{savedCanvasId}")
    public Response deleteSavedCanvas(@PathParam("workspaceId") String workspaceId,
                                      @PathParam("snapshotId") String snapshotId,
                                      @PathParam("savedCanvasId") String savedCanvasId,
                                      @QueryParam("expectedBackendVersion") String expectedBackendVersion) {
        snapshotSavedCanvasService.deleteSavedCanvas(workspaceId, snapshotId, savedCanvasId, expectedBackendVersion);
        return Response.noContent().build();
    }
}
