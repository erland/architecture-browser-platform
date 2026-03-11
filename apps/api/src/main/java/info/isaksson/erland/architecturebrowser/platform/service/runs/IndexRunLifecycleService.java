package info.isaksson.erland.architecturebrowser.platform.service.runs;

import info.isaksson.erland.architecturebrowser.platform.domain.IndexRunEntity;
import info.isaksson.erland.architecturebrowser.platform.domain.RunOutcome;
import info.isaksson.erland.architecturebrowser.platform.domain.RunStatus;
import info.isaksson.erland.architecturebrowser.platform.service.management.NotFoundException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.transaction.Transactional.TxType;

import java.time.Instant;

@ApplicationScoped
public class IndexRunLifecycleService {
    @Inject
    RunAuditService runAuditService;

    @Transactional(TxType.REQUIRES_NEW)
    public IndexRunEntity markRunning(String runId) {
        IndexRunEntity entity = requireRun(runId);
        entity.status = RunStatus.RUNNING;
        if (entity.startedAt == null) {
            entity.startedAt = Instant.now();
        }
        runAuditService.recordRunEvent(entity.workspaceId, entity.repositoryRegistrationId, entity.id,
            "run.running", "{\"status\":\"RUNNING\"}");
        return entity;
    }

    @Transactional(TxType.REQUIRES_NEW)
    public IndexRunEntity markCompleted(String runId, String schemaVersion, String indexerVersion, String metadataJson) {
        IndexRunEntity entity = requireRun(runId);
        entity.status = RunStatus.COMPLETED;
        entity.outcome = RunOutcome.SUCCESS;
        entity.completedAt = Instant.now();
        entity.schemaVersion = normalizeNullable(schemaVersion, entity.schemaVersion);
        entity.indexerVersion = normalizeNullable(indexerVersion, entity.indexerVersion);
        entity.errorSummary = null;
        entity.metadataJson = normalizeNullable(metadataJson, entity.metadataJson);
        runAuditService.recordRunEvent(entity.workspaceId, entity.repositoryRegistrationId, entity.id,
            "run.completed", "{\"status\":\"COMPLETED\",\"outcome\":\"SUCCESS\"}");
        return entity;
    }

    @Transactional(TxType.REQUIRES_NEW)
    public IndexRunEntity markFailed(String runId, String schemaVersion, String indexerVersion, String metadataJson, String errorSummary) {
        IndexRunEntity entity = requireRun(runId);
        entity.status = RunStatus.FAILED;
        entity.outcome = RunOutcome.FAILED;
        entity.completedAt = Instant.now();
        entity.schemaVersion = normalizeNullable(schemaVersion, entity.schemaVersion);
        entity.indexerVersion = normalizeNullable(indexerVersion, entity.indexerVersion);
        entity.metadataJson = normalizeNullable(metadataJson, entity.metadataJson);
        entity.errorSummary = errorSummary;
        runAuditService.recordRunEvent(entity.workspaceId, entity.repositoryRegistrationId, entity.id,
            "run.failed", "{\"status\":\"FAILED\",\"outcome\":\"FAILED\"}");
        return entity;
    }

    public IndexRunEntity requireRun(String runId) {
        IndexRunEntity entity = IndexRunEntity.findById(runId);
        if (entity == null) {
            throw new NotFoundException("Run not found: " + runId);
        }
        return entity;
    }

    private String normalizeNullable(String value, String currentValue) {
        if (value == null || value.isBlank()) {
            return currentValue;
        }
        return value.trim();
    }
}
