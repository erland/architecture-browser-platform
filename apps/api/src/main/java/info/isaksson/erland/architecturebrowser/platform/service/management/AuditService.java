package info.isaksson.erland.architecturebrowser.platform.service.management;

import info.isaksson.erland.architecturebrowser.platform.domain.AuditActorType;
import info.isaksson.erland.architecturebrowser.platform.domain.AuditEventEntity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

import java.time.Instant;
import java.util.UUID;

@ApplicationScoped
public class AuditService {
    @Transactional
    public AuditEventEntity recordWorkspaceEvent(String workspaceId, String eventType, String detailsJson) {
        return persist(workspaceId, null, null, null, eventType, detailsJson);
    }

    @Transactional
    public AuditEventEntity recordRepositoryEvent(String workspaceId, String repositoryRegistrationId, String eventType, String detailsJson) {
        return persist(workspaceId, repositoryRegistrationId, null, null, eventType, detailsJson);
    }

    @Transactional
    public AuditEventEntity recordRunEvent(String workspaceId, String repositoryRegistrationId, String runId, String eventType, String detailsJson) {
        return persist(workspaceId, repositoryRegistrationId, runId, null, eventType, detailsJson);
    }

    @Transactional
    public AuditEventEntity recordSnapshotEvent(String workspaceId, String repositoryRegistrationId, String runId, String snapshotId, String eventType, String detailsJson) {
        return persist(workspaceId, repositoryRegistrationId, runId, snapshotId, eventType, detailsJson);
    }

    private AuditEventEntity persist(String workspaceId, String repositoryRegistrationId, String runId, String snapshotId, String eventType, String detailsJson) {
        AuditEventEntity event = new AuditEventEntity();
        event.id = UUID.randomUUID().toString();
        event.workspaceId = workspaceId;
        event.repositoryRegistrationId = repositoryRegistrationId;
        event.runId = runId;
        event.snapshotId = snapshotId;
        event.eventType = eventType;
        event.actorType = AuditActorType.API_CLIENT;
        event.actorId = "platform-api";
        event.happenedAt = Instant.now();
        event.detailsJson = detailsJson;
        event.persist();
        return event;
    }
}
