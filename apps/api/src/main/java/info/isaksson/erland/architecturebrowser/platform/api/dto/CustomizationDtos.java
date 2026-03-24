package info.isaksson.erland.architecturebrowser.platform.api.dto;

import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotDtos.SnapshotSummaryResponse;
import info.isaksson.erland.architecturebrowser.platform.domain.OverlayKind;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public final class CustomizationDtos {
    private CustomizationDtos() {
    }

    public record CustomizationOverviewResponse(
        SnapshotSummaryResponse snapshot,
        List<OverlayResponse> overlays,
        List<SavedViewResponse> savedViews
    ) {
    }

    public record CreateOverlayRequest(
        String name,
        OverlayKind kind,
        List<String> targetEntityIds,
        List<String> targetScopeIds,
        String note,
        Map<String, Object> attributes
    ) {
    }

    public record UpdateOverlayRequest(
        String name,
        OverlayKind kind,
        List<String> targetEntityIds,
        List<String> targetScopeIds,
        String note,
        Map<String, Object> attributes
    ) {
    }

    public record OverlayResponse(
        String id,
        String workspaceId,
        String snapshotId,
        String name,
        OverlayKind kind,
        int targetEntityCount,
        int targetScopeCount,
        String note,
        String definitionJson,
        Instant createdAt,
        Instant updatedAt
    ) {
    }

    public record CreateSavedViewRequest(
        String name,
        String viewType,
        Map<String, Object> queryState,
        Map<String, Object> layoutState
    ) {
    }

    public record UpdateSavedViewRequest(
        String name,
        String viewType,
        Map<String, Object> queryState,
        Map<String, Object> layoutState
    ) {
    }

    public record SavedViewResponse(
        String id,
        String workspaceId,
        String snapshotId,
        String name,
        String viewType,
        String queryJson,
        String layoutJson,
        Instant createdAt,
        Instant updatedAt
    ) {
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
