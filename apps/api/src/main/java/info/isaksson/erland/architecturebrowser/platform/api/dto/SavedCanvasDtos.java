package info.isaksson.erland.architecturebrowser.platform.api.dto;

import java.time.Instant;
import java.util.Map;

public final class SavedCanvasDtos {
    private SavedCanvasDtos() {
    }

    public record CreateSavedCanvasRequest(
        String name,
        Map<String, Object> document
    ) {
    }

    public record UpdateSavedCanvasRequest(
        String name,
        Map<String, Object> document,
        String expectedBackendVersion
    ) {
    }

    public record SavedCanvasResponse(
        String id,
        String workspaceId,
        String snapshotId,
        String name,
        String documentJson,
        long documentVersion,
        String backendVersion,
        Instant createdAt,
        Instant updatedAt
    ) {
    }
}
