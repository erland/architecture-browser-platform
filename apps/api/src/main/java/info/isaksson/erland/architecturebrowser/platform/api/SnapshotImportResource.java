package info.isaksson.erland.architecturebrowser.platform.api;

import com.fasterxml.jackson.databind.JsonNode;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotImportDtos.SnapshotImportResponse;
import info.isaksson.erland.architecturebrowser.platform.service.SnapshotImportService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/api/workspaces/{workspaceId}/repositories/{repositoryId}")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class SnapshotImportResource {
    @Inject
    SnapshotImportService snapshotImportService;

    @POST
    @Path("/imports/indexer-ir")
    public Response importForRepository(@PathParam("workspaceId") String workspaceId,
                                        @PathParam("repositoryId") String repositoryId,
                                        JsonNode payload) {
        SnapshotImportResponse response = snapshotImportService.importForRepository(workspaceId, repositoryId, payload);
        return Response.status(Response.Status.CREATED).entity(response).build();
    }

    @POST
    @Path("/runs/{runId}/imports/indexer-ir")
    public Response importForRun(@PathParam("workspaceId") String workspaceId,
                                 @PathParam("repositoryId") String repositoryId,
                                 @PathParam("runId") String runId,
                                 JsonNode payload) {
        SnapshotImportResponse response = snapshotImportService.importForRun(workspaceId, repositoryId, runId, payload);
        return Response.status(Response.Status.CREATED).entity(response).build();
    }
}
