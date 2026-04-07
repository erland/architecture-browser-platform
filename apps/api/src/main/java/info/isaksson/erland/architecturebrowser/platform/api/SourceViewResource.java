package info.isaksson.erland.architecturebrowser.platform.api;

import info.isaksson.erland.architecturebrowser.platform.api.dto.ApiErrorResponse;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SourceViewDtos.ReadSourceRequest;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SourceViewDtos.ReadSourceResponse;
import info.isaksson.erland.architecturebrowser.platform.service.management.ValidationException;
import info.isaksson.erland.architecturebrowser.platform.service.sourceview.PlatformSourceViewProxyService;
import info.isaksson.erland.architecturebrowser.platform.service.sourceview.SourceViewReadRequest;
import info.isaksson.erland.architecturebrowser.platform.service.sourceview.SourceViewReadResponse;
import info.isaksson.erland.architecturebrowser.platform.service.sourceview.SourceViewSelectionRequest;
import info.isaksson.erland.architecturebrowser.platform.service.sourceview.SourceViewSelectionResolverService;
import info.isaksson.erland.architecturebrowser.platform.service.snapshotsourcefiles.SnapshotSourceFileLookupResult;
import info.isaksson.erland.architecturebrowser.platform.service.snapshotsourcefiles.SnapshotSourceFileLookupService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;

@Path("/api/workspaces/{workspaceId}")
@Produces(MediaType.APPLICATION_JSON)
public class SourceViewResource {
    @Inject
    PlatformSourceViewProxyService sourceViewProxyService;

    @Inject
    SourceViewSelectionResolverService sourceViewSelectionResolverService;

    @Inject
    SnapshotSourceFileLookupService snapshotSourceFileLookupService;

    @POST
    @Path("/source-view/read")
    @Consumes(MediaType.APPLICATION_JSON)
    public ReadSourceResponse readSource(@PathParam("workspaceId") String workspaceId,
                                         ReadSourceRequest request) {
        if (request == null) {
            throw new ValidationException(List.of("Source view request body is required."));
        }
        try {
            if (isDirectRequest(request)) {
                return readFromWorker(request);
            }
            return readFromSnapshotStore(workspaceId, request);
        } catch (IllegalArgumentException exception) {
            throw new ValidationException(List.of(exception.getMessage()));
        } catch (IllegalStateException exception) {
            throw new WebApplicationException(Response.status(Response.Status.BAD_GATEWAY)
                .type(MediaType.APPLICATION_JSON)
                .entity(new ApiErrorResponse("upstream_error", exception.getMessage(), List.of()))
                .build());
        }
    }

    private boolean isDirectRequest(ReadSourceRequest request) {
        return (request.sourceHandle() != null && !request.sourceHandle().isBlank())
            || (request.path() != null && !request.path().isBlank());
    }

    private ReadSourceResponse readFromWorker(ReadSourceRequest request) {
        SourceViewReadRequest resolvedRequest = new SourceViewReadRequest(
            request.sourceHandle(),
            request.path(),
            request.startLine(),
            request.endLine()
        );
        SourceViewReadResponse response = sourceViewProxyService.readSourceFile(resolvedRequest);
        return new ReadSourceResponse(
            response.sourceHandle(),
            response.path(),
            response.language(),
            response.totalLineCount(),
            response.fileSizeBytes(),
            response.requestedStartLine(),
            response.requestedEndLine(),
            response.sourceText()
        );
    }

    private ReadSourceResponse readFromSnapshotStore(String workspaceId, ReadSourceRequest request) {
        SourceViewReadRequest resolvedRequest = sourceViewSelectionResolverService.resolve(workspaceId, new SourceViewSelectionRequest(
            request.snapshotId(),
            request.selectedObjectType(),
            request.selectedObjectId(),
            request.sourceRefIndex(),
            request.startLine(),
            request.endLine()
        ));
        SnapshotSourceFileLookupResult result = snapshotSourceFileLookupService.requireFile(
            workspaceId,
            request.snapshotId(),
            resolvedRequest.path()
        );
        return new ReadSourceResponse(
            null,
            result.relativePath(),
            result.language(),
            result.totalLineCount(),
            result.sizeBytes(),
            resolvedRequest.startLine(),
            resolvedRequest.endLine(),
            result.textContent()
        );
    }
}
