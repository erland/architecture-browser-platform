package info.isaksson.erland.architecturebrowser.platform.api;

import info.isaksson.erland.architecturebrowser.platform.api.dto.AuditDtos.AuditEventResponse;
import info.isaksson.erland.architecturebrowser.platform.api.dto.WorkspaceDtos.CreateWorkspaceRequest;
import info.isaksson.erland.architecturebrowser.platform.api.dto.WorkspaceDtos.UpdateWorkspaceRequest;
import info.isaksson.erland.architecturebrowser.platform.api.dto.WorkspaceDtos.WorkspaceResponse;
import info.isaksson.erland.architecturebrowser.platform.domain.AuditEventEntity;
import info.isaksson.erland.architecturebrowser.platform.service.management.WorkspaceManagementService;
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

@Path("/api/workspaces")
@Produces(MediaType.APPLICATION_JSON)
public class WorkspaceResource {
    @Inject
    WorkspaceManagementService workspaceManagementService;

    @GET
    public List<WorkspaceResponse> list() {
        return workspaceManagementService.list();
    }

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    public Response create(CreateWorkspaceRequest request) {
        WorkspaceResponse response = workspaceManagementService.create(request);
        return Response.status(Response.Status.CREATED).entity(response).build();
    }

    @GET
    @Path("/{workspaceId}")
    public WorkspaceResponse get(@PathParam("workspaceId") String workspaceId) {
        return workspaceManagementService.get(workspaceId);
    }

    @PUT
    @Path("/{workspaceId}")
    @Consumes(MediaType.APPLICATION_JSON)
    public WorkspaceResponse update(@PathParam("workspaceId") String workspaceId, UpdateWorkspaceRequest request) {
        return workspaceManagementService.update(workspaceId, request);
    }

    @POST
    @Path("/{workspaceId}/archive")
    public WorkspaceResponse archive(@PathParam("workspaceId") String workspaceId) {
        return workspaceManagementService.archive(workspaceId);
    }

    @GET
    @Path("/{workspaceId}/audit-events")
    public List<AuditEventResponse> listAuditEvents(@PathParam("workspaceId") String workspaceId) {
        workspaceManagementService.requireWorkspace(workspaceId);
        return AuditEventEntity.<AuditEventEntity>list("workspaceId", workspaceId).stream()
            .sorted((left, right) -> right.happenedAt.compareTo(left.happenedAt))
            .map(this::toAuditResponse)
            .toList();
    }

    private AuditEventResponse toAuditResponse(AuditEventEntity entity) {
        return new AuditEventResponse(
            entity.id,
            entity.workspaceId,
            entity.repositoryRegistrationId,
            entity.runId,
            entity.snapshotId,
            entity.eventType,
            entity.actorType,
            entity.actorId,
            entity.happenedAt,
            entity.detailsJson
        );
    }
}
