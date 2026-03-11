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
        return persist(workspaceId, null, eventType, detailsJson);
    }

    @Transactional
    public AuditEventEntity recordRepositoryEvent(String workspaceId, String repositoryRegistrationId, String eventType, String detailsJson) {
        return persist(workspaceId, repositoryRegistrationId, eventType, detailsJson);
    }

    private AuditEventEntity persist(String workspaceId, String repositoryRegistrationId, String eventType, String detailsJson) {
        AuditEventEntity event = new AuditEventEntity();
        event.id = UUID.randomUUID().toString();
        event.workspaceId = workspaceId;
        event.repositoryRegistrationId = repositoryRegistrationId;
        event.eventType = eventType;
        event.actorType = AuditActorType.API_CLIENT;
        event.actorId = "step3-management-api";
        event.happenedAt = Instant.now();
        event.detailsJson = detailsJson;
        event.persist();
        return event;
    }
}
