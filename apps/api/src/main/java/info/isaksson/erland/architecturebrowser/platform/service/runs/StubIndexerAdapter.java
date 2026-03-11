package info.isaksson.erland.architecturebrowser.platform.service.runs;

import info.isaksson.erland.architecturebrowser.platform.api.dto.RunDtos.RequestRunRequest;
import info.isaksson.erland.architecturebrowser.platform.api.dto.RunDtos.StubRunResult;
import info.isaksson.erland.architecturebrowser.platform.domain.IndexRunEntity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class StubIndexerAdapter {
    @Inject
    IndexRunLifecycleService lifecycleService;

    public IndexRunEntity execute(IndexRunEntity requestedRun, RequestRunRequest request) {
        lifecycleService.markRunning(requestedRun.id);
        if (request.requestedResult() == StubRunResult.FAILURE) {
            return lifecycleService.markFailed(
                requestedRun.id,
                request.requestedSchemaVersion(),
                request.requestedIndexerVersion(),
                request.metadataJson(),
                "Stub indexer adapter simulated a failure while invoking the indexer/import boundary."
            );
        }
        return lifecycleService.markCompleted(
            requestedRun.id,
            request.requestedSchemaVersion(),
            request.requestedIndexerVersion(),
            request.metadataJson()
        );
    }
}
