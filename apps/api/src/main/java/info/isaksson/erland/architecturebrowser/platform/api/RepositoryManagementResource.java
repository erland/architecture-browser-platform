package info.isaksson.erland.architecturebrowser.platform.api;

import info.isaksson.erland.architecturebrowser.platform.api.dto.RepositoryDtos.CreateRepositoryRequest;
import info.isaksson.erland.architecturebrowser.platform.api.dto.RepositoryDtos.RepositoryResponse;
import info.isaksson.erland.architecturebrowser.platform.api.dto.RepositoryDtos.UpdateRepositoryRequest;
import info.isaksson.erland.architecturebrowser.platform.service.management.RepositoryManagementService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;

@Path("/api/workspaces/{workspaceId}/repositories")
@Produces(MediaType.APPLICATION_JSON)
public class RepositoryManagementResource {
    @Inject
    RepositoryManagementService repositoryManagementService;

    @GET
    public List<RepositoryResponse> list(@PathParam("workspaceId") String workspaceId) {
        return repositoryManagementService.listByWorkspace(workspaceId);
    }

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    public Response create(@PathParam("workspaceId") String workspaceId, CreateRepositoryRequest request) {
        RepositoryResponse response = repositoryManagementService.create(workspaceId, request);
        return Response.status(Response.Status.CREATED).entity(response).build();
    }

    @GET
    @Path("/{repositoryId}")
    public RepositoryResponse get(@PathParam("workspaceId") String workspaceId,
                                  @PathParam("repositoryId") String repositoryId) {
        return repositoryManagementService.get(workspaceId, repositoryId);
    }

    @PUT
    @Path("/{repositoryId}")
    @Consumes(MediaType.APPLICATION_JSON)
    public RepositoryResponse update(@PathParam("workspaceId") String workspaceId,
                                     @PathParam("repositoryId") String repositoryId,
                                     UpdateRepositoryRequest request) {
        return repositoryManagementService.update(workspaceId, repositoryId, request);
    }

    @POST
    @Path("/{repositoryId}/archive")
    public RepositoryResponse archive(@PathParam("workspaceId") String workspaceId,
                                      @PathParam("repositoryId") String repositoryId) {
        return repositoryManagementService.archive(workspaceId, repositoryId);
    }
}
