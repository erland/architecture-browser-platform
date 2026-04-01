package info.isaksson.erland.architecturebrowser.platform.service;

import com.fasterxml.jackson.databind.JsonNode;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotImportDtos.SnapshotImportResponse;
import info.isaksson.erland.architecturebrowser.platform.domain.IndexRunEntity;
import info.isaksson.erland.architecturebrowser.platform.domain.RunOutcome;
import info.isaksson.erland.architecturebrowser.platform.service.runs.IndexRunLifecycleService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.function.Supplier;

@ApplicationScoped
public class SnapshotImportRunLifecycleHandler {
    @Inject
    IndexRunLifecycleService runLifecycleService;

    @Inject
    JsonSupport jsonSupport;

    public SnapshotImportResponse execute(IndexRunEntity run, JsonNode payload, Supplier<SnapshotImportResponse> importAction) {
        runLifecycleService.markImporting(run.id);
        try {
            SnapshotImportResponse response = importAction.get();
            markSuccessfulImport(run.id, payload, response);
            return response;
        } catch (RuntimeException ex) {
            runLifecycleService.markFailed(run.id, extractSchemaVersion(payload), extractIndexerVersion(payload), safeWrite(payload), summarize(ex));
            throw ex;
        }
    }

    private void markSuccessfulImport(String runId, JsonNode payload, SnapshotImportResponse response) {
        if (response.derivedRunOutcome() == RunOutcome.PARTIAL) {
            runLifecycleService.markPartial(runId, response.schemaVersion(), response.indexerVersion(), buildRunMetadataJson(payload));
        } else if (response.derivedRunOutcome() == RunOutcome.FAILED) {
            runLifecycleService.markFailed(runId, response.schemaVersion(), response.indexerVersion(), buildRunMetadataJson(payload), "Indexer payload reported a FAILED outcome.");
        } else {
            runLifecycleService.markCompleted(runId, response.schemaVersion(), response.indexerVersion(), buildRunMetadataJson(payload));
        }
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
