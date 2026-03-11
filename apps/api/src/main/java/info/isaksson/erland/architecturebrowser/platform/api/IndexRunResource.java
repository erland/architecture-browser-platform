package info.isaksson.erland.architecturebrowser.platform.api;

import info.isaksson.erland.architecturebrowser.platform.api.dto.RunDtos.RequestRunRequest;
import info.isaksson.erland.architecturebrowser.platform.api.dto.RunDtos.RunResponse;
import info.isaksson.erland.architecturebrowser.platform.service.runs.IndexRunService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;

@Path("/api/workspaces/{workspaceId}")
@Produces(MediaType.APPLICATION_JSON)
public class IndexRunResource {
    @Inject
    IndexRunService indexRunService;

    @GET
    @Path("/runs/recent")
    public List<RunResponse> listRecentByWorkspace(@PathParam("workspaceId") String workspaceId) {
        return indexRunService.listRecentByWorkspace(workspaceId);
    }

    @GET
    @Path("/repositories/{repositoryId}/runs")
    public List<RunResponse> listByRepository(@PathParam("workspaceId") String workspaceId,
                                              @PathParam("repositoryId") String repositoryId) {
        return indexRunService.listByRepository(workspaceId, repositoryId);
    }

    @GET
    @Path("/repositories/{repositoryId}/runs/{runId}")
    public RunResponse get(@PathParam("workspaceId") String workspaceId,
                           @PathParam("repositoryId") String repositoryId,
                           @PathParam("runId") String runId) {
        return indexRunService.get(workspaceId, repositoryId, runId);
    }

    @POST
    @Path("/repositories/{repositoryId}/runs")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response requestRun(@PathParam("workspaceId") String workspaceId,
                               @PathParam("repositoryId") String repositoryId,
                               RequestRunRequest request) {
        RunResponse response = indexRunService.requestRun(workspaceId, repositoryId, request);
        return Response.status(Response.Status.CREATED).entity(response).build();
    }
}
