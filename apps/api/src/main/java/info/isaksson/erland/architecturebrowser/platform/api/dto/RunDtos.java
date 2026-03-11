package info.isaksson.erland.architecturebrowser.platform.api.dto;

import info.isaksson.erland.architecturebrowser.platform.domain.RunOutcome;
import info.isaksson.erland.architecturebrowser.platform.domain.RunStatus;
import info.isaksson.erland.architecturebrowser.platform.domain.TriggerType;

import java.time.Instant;

public final class RunDtos {
    private RunDtos() {
    }

    public enum StubRunResult {
        SUCCESS,
        FAILURE
    }

    public record RequestRunRequest(
        TriggerType triggerType,
        String requestedSchemaVersion,
        String requestedIndexerVersion,
        String metadataJson,
        StubRunResult requestedResult
    ) {
    }

    public record RunResponse(
        String id,
        String workspaceId,
        String repositoryRegistrationId,
        String repositoryKey,
        String repositoryName,
        TriggerType triggerType,
        RunStatus status,
        RunOutcome outcome,
        Instant requestedAt,
        Instant startedAt,
        Instant completedAt,
        String schemaVersion,
        String indexerVersion,
        String errorSummary,
        String metadataJson
    ) {
    }
}
