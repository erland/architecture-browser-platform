package info.isaksson.erland.architecturebrowser.platform.api;

import info.isaksson.erland.architecturebrowser.platform.api.dto.OperationsDtos.OperationsOverviewResponse;
import info.isaksson.erland.architecturebrowser.platform.api.dto.OperationsDtos.RetentionApplyRequest;
import info.isaksson.erland.architecturebrowser.platform.api.dto.OperationsDtos.RetentionPreviewResponse;
import info.isaksson.erland.architecturebrowser.platform.service.operations.OperationsAdminService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

@Path("/api/workspaces/{workspaceId}/operations")
@Produces(MediaType.APPLICATION_JSON)
public class OperationsAdminResource {
    @Inject
    OperationsAdminService operationsAdminService;

    @GET
    @Path("/overview")
    public OperationsOverviewResponse getOverview(@PathParam("workspaceId") String workspaceId) {
        return operationsAdminService.getOverview(workspaceId);
    }

    @GET
    @Path("/retention/preview")
    public RetentionPreviewResponse previewRetention(@PathParam("workspaceId") String workspaceId,
                                                     @QueryParam("keepSnapshotsPerRepository") Integer keepSnapshotsPerRepository,
                                                     @QueryParam("keepRunsPerRepository") Integer keepRunsPerRepository) {
        return operationsAdminService.previewRetention(workspaceId, keepSnapshotsPerRepository, keepRunsPerRepository);
    }

    @POST
    @Path("/retention/apply")
    @Consumes(MediaType.APPLICATION_JSON)
    public RetentionPreviewResponse applyRetention(@PathParam("workspaceId") String workspaceId,
                                                   RetentionApplyRequest request) {
        return operationsAdminService.applyRetention(workspaceId, request);
    }
}
