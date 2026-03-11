package info.isaksson.erland.architecturebrowser.platform.api.dto;

import info.isaksson.erland.architecturebrowser.platform.domain.WorkspaceStatus;

import java.time.Instant;

public final class WorkspaceDtos {
    private WorkspaceDtos() {
    }

    public record CreateWorkspaceRequest(String workspaceKey, String name, String description) {
    }

    public record UpdateWorkspaceRequest(String name, String description) {
    }

    public record WorkspaceResponse(
        String id,
        String workspaceKey,
        String name,
        String description,
        WorkspaceStatus status,
        Instant createdAt,
        Instant updatedAt,
        long repositoryCount
    ) {
    }
}
