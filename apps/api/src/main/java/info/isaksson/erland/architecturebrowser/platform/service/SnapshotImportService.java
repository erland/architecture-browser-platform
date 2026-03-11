package info.isaksson.erland.architecturebrowser.platform.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotDtos.SnapshotImportResponse;
import info.isaksson.erland.architecturebrowser.platform.contract.ArchitectureIndexDocument;
import info.isaksson.erland.architecturebrowser.platform.contract.ContractValidationResult;
import info.isaksson.erland.architecturebrowser.platform.domain.CompletenessStatus;
import info.isaksson.erland.architecturebrowser.platform.domain.FactType;
import info.isaksson.erland.architecturebrowser.platform.domain.ImportedFactEntity;
import info.isaksson.erland.architecturebrowser.platform.domain.IndexRunEntity;
import info.isaksson.erland.architecturebrowser.platform.domain.RepositoryRegistrationEntity;
import info.isaksson.erland.architecturebrowser.platform.domain.RunOutcome;
import info.isaksson.erland.architecturebrowser.platform.domain.SnapshotEntity;
import info.isaksson.erland.architecturebrowser.platform.domain.SnapshotStatus;
import info.isaksson.erland.architecturebrowser.platform.domain.WorkspaceEntity;
import info.isaksson.erland.architecturebrowser.platform.service.management.AuditService;
import info.isaksson.erland.architecturebrowser.platform.service.management.RepositoryManagementService;
import info.isaksson.erland.architecturebrowser.platform.service.management.ValidationException;
import info.isaksson.erland.architecturebrowser.platform.service.management.WorkspaceManagementService;
import info.isaksson.erland.architecturebrowser.platform.service.runs.IndexRunLifecycleService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@ApplicationScoped
public class SnapshotImportService {
    @Inject
    IndexerImportContractValidator contractValidator;

    @Inject
    SnapshotImportSemanticValidator semanticValidator;

    @Inject
    WorkspaceManagementService workspaceManagementService;

    @Inject
    RepositoryManagementService repositoryManagementService;

    @Inject
    IndexRunLifecycleService runLifecycleService;

    @Inject
    AuditService auditService;

    @Inject
    JsonSupport jsonSupport;

    @Inject
    ObjectMapper objectMapper;

    @Transactional
    public SnapshotImportResponse importForRepository(String workspaceId, String repositoryId, JsonNode payload) {
        WorkspaceEntity workspace = workspaceManagementService.requireWorkspace(workspaceId);
        RepositoryRegistrationEntity repository = repositoryManagementService.requireRepository(workspaceId, repositoryId);
        return importDocument(workspace, repository, null, payload);
    }

    @Transactional
    public SnapshotImportResponse importForRun(String workspaceId, String repositoryId, String runId, JsonNode payload) {
        WorkspaceEntity workspace = workspaceManagementService.requireWorkspace(workspaceId);
        RepositoryRegistrationEntity repository = repositoryManagementService.requireRepository(workspaceId, repositoryId);
        IndexRunEntity run = runLifecycleService.requireRun(runId);
        if (!workspaceId.equals(run.workspaceId) || !repositoryId.equals(run.repositoryRegistrationId)) {
            throw new ValidationException(List.of("Run does not belong to the supplied workspace/repository path."));
        }
        runLifecycleService.markImporting(runId);
        try {
            SnapshotImportResponse response = importDocument(workspace, repository, run, payload);
            if (response.derivedRunOutcome() == RunOutcome.PARTIAL) {
                runLifecycleService.markPartial(runId, response.schemaVersion(), response.indexerVersion(), buildRunMetadataJson(payload));
            } else if (response.derivedRunOutcome() == RunOutcome.FAILED) {
                runLifecycleService.markFailed(runId, response.schemaVersion(), response.indexerVersion(), buildRunMetadataJson(payload), "Indexer payload reported a FAILED outcome.");
            } else {
                runLifecycleService.markCompleted(runId, response.schemaVersion(), response.indexerVersion(), buildRunMetadataJson(payload));
            }
            return response;
        } catch (RuntimeException ex) {
            runLifecycleService.markFailed(runId, extractSchemaVersion(payload), extractIndexerVersion(payload), safeWrite(payload), summarize(ex));
            throw ex;
        }
    }

    private SnapshotImportResponse importDocument(WorkspaceEntity workspace, RepositoryRegistrationEntity repository, IndexRunEntity run, JsonNode payload) {
        ContractValidationResult contractResult = contractValidator.validate(payload);
        if (!contractResult.valid()) {
            throw new ValidationException(contractResult.errors());
        }
        ArchitectureIndexDocument document = objectMapper.convertValue(payload, ArchitectureIndexDocument.class);
        semanticValidator.validate(document);
        return persistSnapshot(workspace, repository, run, document, payload);
    }

    protected SnapshotImportResponse persistSnapshot(WorkspaceEntity workspace, RepositoryRegistrationEntity repository, IndexRunEntity run, ArchitectureIndexDocument document, JsonNode payload) {
        Instant importedAt = Instant.now();
        String snapshotId = UUID.randomUUID().toString();
        String snapshotKey = buildSnapshotKey(document, importedAt);
        CompletenessStatus completenessStatus = CompletenessStatus.valueOf(document.completeness().status());
        SnapshotStatus snapshotStatus = completenessStatus == CompletenessStatus.FAILED ? SnapshotStatus.FAILED : SnapshotStatus.READY;
        RunOutcome derivedRunOutcome = deriveOutcome(document, completenessStatus);
        List<String> warnings = collectWarnings(document, completenessStatus);

        SnapshotEntity snapshot = new SnapshotEntity();
        snapshot.id = snapshotId;
        snapshot.workspaceId = workspace.id;
        snapshot.repositoryRegistrationId = repository.id;
        snapshot.runId = run != null ? run.id : null;
        snapshot.snapshotKey = snapshotKey;
        snapshot.status = snapshotStatus;
        snapshot.completenessStatus = completenessStatus;
        snapshot.schemaVersion = document.schemaVersion();
        snapshot.indexerVersion = document.indexerVersion();
        snapshot.sourceRepositoryId = document.source().repositoryId();
        snapshot.sourceRevision = document.source().revision();
        snapshot.sourceBranch = document.source().branch();
        snapshot.importedAt = importedAt;
        snapshot.scopeCount = document.scopes().size();
        snapshot.entityCount = document.entities().size();
        snapshot.relationshipCount = document.relationships().size();
        snapshot.diagnosticCount = document.diagnostics().size();
        snapshot.indexedFileCount = document.completeness().indexedFileCount();
        snapshot.totalFileCount = document.completeness().totalFileCount();
        snapshot.degradedFileCount = document.completeness().degradedFileCount();
        snapshot.rawPayloadJson = jsonSupport.write(payload);
        snapshot.metadataJson = jsonSupport.write(document.metadata());
        snapshot.persist();

        document.scopes().forEach(scope -> persistFact(snapshotId, FactType.SCOPE, scope.id(), scope.kind(), scope.name(), scope.displayName(), scope.parentScopeId(), null, null, null, scope));
        document.entities().forEach(entity -> persistFact(snapshotId, FactType.ENTITY, entity.id(), entity.kind(), entity.name(), entity.displayName(), entity.scopeId(), null, null, null, entity));
        document.relationships().forEach(relationship -> persistFact(snapshotId, FactType.RELATIONSHIP, relationship.id(), relationship.kind(), relationship.id(), relationship.label(), null, relationship.fromEntityId(), relationship.toEntityId(), relationship.label(), relationship));
        document.diagnostics().forEach(diagnostic -> persistFact(snapshotId, FactType.DIAGNOSTIC, diagnostic.id(), diagnostic.code(), diagnostic.code(), diagnostic.message(), diagnostic.scopeId(), null, diagnostic.entityId(), diagnostic.message(), diagnostic));

        auditService.recordSnapshotEvent(
            workspace.id,
            repository.id,
            run != null ? run.id : null,
            snapshot.id,
            "snapshot.imported",
            jsonSupport.write(Map.of(
                "snapshotKey", snapshot.snapshotKey,
                "status", snapshot.status.name(),
                "completenessStatus", snapshot.completenessStatus.name(),
                "derivedRunOutcome", derivedRunOutcome.name(),
                "counts", Map.of(
                    "scopes", snapshot.scopeCount,
                    "entities", snapshot.entityCount,
                    "relationships", snapshot.relationshipCount,
                    "diagnostics", snapshot.diagnosticCount
                )
            ))
        );

        return new SnapshotImportResponse(
            snapshot.id,
            snapshot.workspaceId,
            snapshot.repositoryRegistrationId,
            snapshot.runId,
            snapshot.snapshotKey,
            snapshot.status,
            snapshot.completenessStatus,
            derivedRunOutcome,
            snapshot.schemaVersion,
            snapshot.indexerVersion,
            snapshot.importedAt,
            snapshot.scopeCount,
            snapshot.entityCount,
            snapshot.relationshipCount,
            snapshot.diagnosticCount,
            snapshot.indexedFileCount,
            snapshot.totalFileCount,
            snapshot.degradedFileCount,
            warnings
        );
    }

    private void persistFact(String snapshotId, FactType factType, String externalId, String factKind, String name, String displayName, String scopeExternalId, String fromExternalId, String toExternalId, String summary, Object payload) {
        ImportedFactEntity fact = new ImportedFactEntity();
        fact.id = factType.name().toLowerCase(Locale.ROOT) + "-" + UUID.randomUUID();
        fact.snapshotId = snapshotId;
        fact.factType = factType;
        fact.externalId = externalId;
        fact.factKind = factKind;
        fact.name = name;
        fact.displayName = displayName;
        fact.scopeExternalId = scopeExternalId;
        fact.fromExternalId = fromExternalId;
        fact.toExternalId = toExternalId;
        fact.summary = summary;
        fact.payloadJson = jsonSupport.write(payload);
        fact.persist();
    }

    private String buildSnapshotKey(ArchitectureIndexDocument document, Instant importedAt) {
        String revision = document.source().revision();
        if (revision != null && !revision.isBlank()) {
            return revision.trim() + "-" + importedAt.toEpochMilli();
        }
        String completedAt = document.runMetadata() != null ? document.runMetadata().completedAt() : null;
        if (completedAt != null && !completedAt.isBlank()) {
            return completedAt.replace(':', '-');
        }
        return "import-" + importedAt.toEpochMilli();
    }

    private RunOutcome deriveOutcome(ArchitectureIndexDocument document, CompletenessStatus completenessStatus) {
        String runOutcome = document.runMetadata() != null ? document.runMetadata().outcome() : null;
        if (runOutcome != null && !runOutcome.isBlank()) {
            return RunOutcome.valueOf(runOutcome.trim().toUpperCase(Locale.ROOT));
        }
        return switch (completenessStatus) {
            case COMPLETE -> RunOutcome.SUCCESS;
            case PARTIAL -> RunOutcome.PARTIAL;
            case FAILED -> RunOutcome.FAILED;
        };
    }

    private List<String> collectWarnings(ArchitectureIndexDocument document, CompletenessStatus completenessStatus) {
        List<String> warnings = new ArrayList<>();
        if (completenessStatus == CompletenessStatus.PARTIAL) {
            warnings.add("Partial import accepted: browse data is available, but omitted/degraded files were reported by the indexer.");
        }
        if (document.completeness().notes() != null) {
            warnings.addAll(document.completeness().notes());
        }
        return List.copyOf(warnings);
    }

    private String buildRunMetadataJson(JsonNode payload) {
        return jsonSupport.write(payload.path("runMetadata"));
    }

    private String extractSchemaVersion(JsonNode payload) {
        JsonNode schemaVersion = payload.get("schemaVersion");
        return schemaVersion != null && !schemaVersion.isNull() ? schemaVersion.asText() : null;
    }

    private String extractIndexerVersion(JsonNode payload) {
        JsonNode indexerVersion = payload.get("indexerVersion");
        return indexerVersion != null && !indexerVersion.isNull() ? indexerVersion.asText() : null;
    }

    private String safeWrite(JsonNode payload) {
        try {
            return jsonSupport.write(payload);
        } catch (RuntimeException ex) {
            return null;
        }
    }

    private String summarize(RuntimeException ex) {
        return ex.getMessage() != null ? ex.getMessage() : ex.getClass().getSimpleName();
    }
}
