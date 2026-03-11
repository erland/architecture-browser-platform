package info.isaksson.erland.architecturebrowser.platform.service.runs;

import info.isaksson.erland.architecturebrowser.platform.service.management.AuditService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class RunAuditService {
    @Inject
    AuditService auditService;

    public void recordRunEvent(String workspaceId, String repositoryRegistrationId, String runId, String eventType, String detailsJson) {
        auditService.recordRunEvent(workspaceId, repositoryRegistrationId, runId, eventType, detailsJson);
    }
}
