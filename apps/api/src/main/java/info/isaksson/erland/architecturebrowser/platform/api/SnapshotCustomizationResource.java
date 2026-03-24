package info.isaksson.erland.architecturebrowser.platform.api;

import info.isaksson.erland.architecturebrowser.platform.api.dto.CustomizationDtos;
import info.isaksson.erland.architecturebrowser.platform.service.snapshots.SnapshotCustomizationService;
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

@Path("/api/workspaces/{workspaceId}/snapshots/{snapshotId}")
@Produces(MediaType.APPLICATION_JSON)
public class SnapshotCustomizationResource {
    @Inject
    SnapshotCustomizationService snapshotCustomizationService;

    @GET
    @Path("/customizations")
    public CustomizationDtos.CustomizationOverviewResponse overview(@PathParam("workspaceId") String workspaceId,
                                                                    @PathParam("snapshotId") String snapshotId) {
        return snapshotCustomizationService.overview(workspaceId, snapshotId);
    }

    @POST
    @Path("/overlays")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response createOverlay(@PathParam("workspaceId") String workspaceId,
                                  @PathParam("snapshotId") String snapshotId,
                                  CustomizationDtos.CreateOverlayRequest request) {
        return Response.status(Response.Status.CREATED).entity(snapshotCustomizationService.createOverlay(workspaceId, snapshotId, request)).build();
    }

    @PUT
    @Path("/overlays/{overlayId}")
    @Consumes(MediaType.APPLICATION_JSON)
    public CustomizationDtos.OverlayResponse updateOverlay(@PathParam("workspaceId") String workspaceId,
                                                           @PathParam("snapshotId") String snapshotId,
                                                           @PathParam("overlayId") String overlayId,
                                                           CustomizationDtos.UpdateOverlayRequest request) {
        return snapshotCustomizationService.updateOverlay(workspaceId, snapshotId, overlayId, request);
    }

    @DELETE
    @Path("/overlays/{overlayId}")
    public Response deleteOverlay(@PathParam("workspaceId") String workspaceId,
                                  @PathParam("snapshotId") String snapshotId,
                                  @PathParam("overlayId") String overlayId) {
        snapshotCustomizationService.deleteOverlay(workspaceId, snapshotId, overlayId);
        return Response.noContent().build();
    }


    @GET
    @Path("/saved-canvases")
    public java.util.List<CustomizationDtos.SavedCanvasResponse> listSavedCanvases(@PathParam("workspaceId") String workspaceId,
                                                                                    @PathParam("snapshotId") String snapshotId) {
        return snapshotCustomizationService.listSavedCanvases(workspaceId, snapshotId);
    }

    @GET
    @Path("/saved-canvases/{savedCanvasId}")
    public CustomizationDtos.SavedCanvasResponse getSavedCanvas(@PathParam("workspaceId") String workspaceId,
                                                                @PathParam("snapshotId") String snapshotId,
                                                                @PathParam("savedCanvasId") String savedCanvasId) {
        return snapshotCustomizationService.getSavedCanvas(workspaceId, snapshotId, savedCanvasId);
    }

    @POST
    @Path("/saved-canvases")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response createSavedCanvas(@PathParam("workspaceId") String workspaceId,
                                      @PathParam("snapshotId") String snapshotId,
                                      CustomizationDtos.CreateSavedCanvasRequest request) {
        return Response.status(Response.Status.CREATED).entity(snapshotCustomizationService.createSavedCanvas(workspaceId, snapshotId, request)).build();
    }

    @PUT
    @Path("/saved-canvases/{savedCanvasId}")
    @Consumes(MediaType.APPLICATION_JSON)
    public CustomizationDtos.SavedCanvasResponse updateSavedCanvas(@PathParam("workspaceId") String workspaceId,
                                                                   @PathParam("snapshotId") String snapshotId,
                                                                   @PathParam("savedCanvasId") String savedCanvasId,
                                                                   CustomizationDtos.UpdateSavedCanvasRequest request) {
        return snapshotCustomizationService.updateSavedCanvas(workspaceId, snapshotId, savedCanvasId, request);
    }

    @POST
    @Path("/saved-canvases/{savedCanvasId}/duplicate")
    public Response duplicateSavedCanvas(@PathParam("workspaceId") String workspaceId,
                                         @PathParam("snapshotId") String snapshotId,
                                         @PathParam("savedCanvasId") String savedCanvasId) {
        return Response.status(Response.Status.CREATED).entity(snapshotCustomizationService.duplicateSavedCanvas(workspaceId, snapshotId, savedCanvasId)).build();
    }

    @DELETE
    @Path("/saved-canvases/{savedCanvasId}")
    public Response deleteSavedCanvas(@PathParam("workspaceId") String workspaceId,
                                      @PathParam("snapshotId") String snapshotId,
                                      @PathParam("savedCanvasId") String savedCanvasId,
                                      @QueryParam("expectedBackendVersion") String expectedBackendVersion) {
        snapshotCustomizationService.deleteSavedCanvas(workspaceId, snapshotId, savedCanvasId, expectedBackendVersion);
        return Response.noContent().build();
    }

    @POST
    @Path("/saved-views")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response createSavedView(@PathParam("workspaceId") String workspaceId,
                                    @PathParam("snapshotId") String snapshotId,
                                    CustomizationDtos.CreateSavedViewRequest request) {
        return Response.status(Response.Status.CREATED).entity(snapshotCustomizationService.createSavedView(workspaceId, snapshotId, request)).build();
    }

    @PUT
    @Path("/saved-views/{savedViewId}")
    @Consumes(MediaType.APPLICATION_JSON)
    public CustomizationDtos.SavedViewResponse updateSavedView(@PathParam("workspaceId") String workspaceId,
                                                               @PathParam("snapshotId") String snapshotId,
                                                               @PathParam("savedViewId") String savedViewId,
                                                               CustomizationDtos.UpdateSavedViewRequest request) {
        return snapshotCustomizationService.updateSavedView(workspaceId, snapshotId, savedViewId, request);
    }

    @POST
    @Path("/saved-views/{savedViewId}/duplicate")
    public Response duplicateSavedView(@PathParam("workspaceId") String workspaceId,
                                       @PathParam("snapshotId") String snapshotId,
                                       @PathParam("savedViewId") String savedViewId) {
        return Response.status(Response.Status.CREATED).entity(snapshotCustomizationService.duplicateSavedView(workspaceId, snapshotId, savedViewId)).build();
    }

    @DELETE
    @Path("/saved-views/{savedViewId}")
    public Response deleteSavedView(@PathParam("workspaceId") String workspaceId,
                                    @PathParam("snapshotId") String snapshotId,
                                    @PathParam("savedViewId") String savedViewId) {
        snapshotCustomizationService.deleteSavedView(workspaceId, snapshotId, savedViewId);
        return Response.noContent().build();
    }
}
