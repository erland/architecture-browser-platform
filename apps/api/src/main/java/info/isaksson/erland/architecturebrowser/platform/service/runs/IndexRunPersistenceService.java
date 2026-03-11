package info.isaksson.erland.architecturebrowser.platform.service.runs;

import info.isaksson.erland.architecturebrowser.platform.api.dto.RunDtos.RequestRunRequest;
import info.isaksson.erland.architecturebrowser.platform.domain.IndexRunEntity;
import info.isaksson.erland.architecturebrowser.platform.domain.RepositoryRegistrationEntity;
import info.isaksson.erland.architecturebrowser.platform.domain.RunStatus;
import info.isaksson.erland.architecturebrowser.platform.domain.WorkspaceEntity;
import info.isaksson.erland.architecturebrowser.platform.service.management.AuditService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.transaction.Transactional.TxType;

import java.time.Instant;
import java.util.UUID;

@ApplicationScoped
public class IndexRunPersistenceService {
    @Inject
    AuditService auditService;

    @Transactional(TxType.REQUIRES_NEW)
    public IndexRunEntity createRequestedRun(WorkspaceEntity workspace, RepositoryRegistrationEntity repository, RequestRunRequest request) {
        Instant now = Instant.now();
        IndexRunEntity entity = new IndexRunEntity();
        entity.id = UUID.randomUUID().toString();
        entity.workspaceId = workspace.id;
        entity.repositoryRegistrationId = repository.id;
        entity.triggerType = request.triggerType();
        entity.status = RunStatus.REQUESTED;
        entity.outcome = null;
        entity.requestedAt = now;
        entity.schemaVersion = normalizeNullable(request.requestedSchemaVersion());
        entity.indexerVersion = normalizeNullable(request.requestedIndexerVersion());
        entity.metadataJson = normalizeNullable(request.metadataJson());
        entity.errorSummary = null;
        entity.persist();

        auditService.recordRunEvent(entity.workspaceId, entity.repositoryRegistrationId, entity.id,
            "run.requested", "{\"status\":\"REQUESTED\"}");
        return entity;
    }

    private String normalizeNullable(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
