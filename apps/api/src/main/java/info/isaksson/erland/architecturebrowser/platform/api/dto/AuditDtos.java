package info.isaksson.erland.architecturebrowser.platform.api.dto;

import info.isaksson.erland.architecturebrowser.platform.domain.AuditActorType;

import java.time.Instant;

public final class AuditDtos {
    private AuditDtos() {
    }

    public record AuditEventResponse(
        String id,
        String workspaceId,
        String repositoryRegistrationId,
        String runId,
        String snapshotId,
        String eventType,
        AuditActorType actorType,
        String actorId,
        Instant happenedAt,
        String detailsJson
    ) {
    }
}
