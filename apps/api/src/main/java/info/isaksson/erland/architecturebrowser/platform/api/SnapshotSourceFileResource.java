package info.isaksson.erland.architecturebrowser.platform.api;

import info.isaksson.erland.architecturebrowser.platform.api.dto.SourceViewDtos.ReadSnapshotSourceFileRequest;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SourceViewDtos.ReadSourceResponse;
import info.isaksson.erland.architecturebrowser.platform.service.management.ValidationException;
import info.isaksson.erland.architecturebrowser.platform.service.snapshotsourcefiles.SnapshotSourceFileLookupResult;
import info.isaksson.erland.architecturebrowser.platform.service.snapshotsourcefiles.SnapshotSourceFileLookupService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import java.util.List;

@Path("/api/workspaces/{workspaceId}")
@Produces(MediaType.APPLICATION_JSON)
public class SnapshotSourceFileResource {
    @Inject
    SnapshotSourceFileLookupService snapshotSourceFileLookupService;

    @POST
    @Path("/snapshot-source-files/read")
    @Consumes(MediaType.APPLICATION_JSON)
    public ReadSourceResponse readSnapshotSourceFile(@PathParam("workspaceId") String workspaceId,
                                                     ReadSnapshotSourceFileRequest request) {
        if (request == null) {
            throw new ValidationException(List.of("Snapshot source file request body is required."));
        }
        try {
            SnapshotSourceFileLookupResult result = snapshotSourceFileLookupService.requireFile(
                workspaceId,
                request.snapshotId(),
                request.path()
            );
            return new ReadSourceResponse(
                null,
                result.relativePath(),
                result.language(),
                result.totalLineCount(),
                result.sizeBytes(),
                request.startLine(),
                request.endLine(),
                result.textContent()
            );
        } catch (IllegalArgumentException exception) {
            throw new ValidationException(List.of(exception.getMessage()));
        }
    }
}
