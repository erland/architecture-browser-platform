package info.isaksson.erland.architecturebrowser.platform.service.runs;

import com.fasterxml.jackson.databind.JsonNode;
import info.isaksson.erland.architecturebrowser.platform.api.dto.RunDtos.RequestRunRequest;
import info.isaksson.erland.architecturebrowser.platform.domain.IndexRunEntity;
import info.isaksson.erland.architecturebrowser.platform.domain.RepositoryRegistrationEntity;
import info.isaksson.erland.architecturebrowser.platform.domain.WorkspaceEntity;
import info.isaksson.erland.architecturebrowser.platform.service.SnapshotImportService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.io.IOException;
import java.net.http.HttpResponse;
import java.time.Duration;

@ApplicationScoped
public class RemoteIndexerGateway {
    private static final Logger LOG = Logger.getLogger(RemoteIndexerGateway.class);

    @ConfigProperty(name = "platform.indexer.base-url")
    String baseUrl;

    @ConfigProperty(name = "platform.indexer.connect-timeout-seconds", defaultValue = "10")
    long connectTimeoutSeconds;

    @ConfigProperty(name = "platform.indexer.read-timeout-seconds", defaultValue = "300")
    long readTimeoutSeconds;

    @Inject
    IndexRunLifecycleService lifecycleService;

    @Inject
    SnapshotImportService snapshotImportService;

    @Inject
    RemoteIndexerRequestFactory requestFactory;

    @Inject
    RemoteIndexerTransport transport;

    @Inject
    RemoteIndexerResponseMapper responseMapper;

    @Inject
    RemoteIndexerErrorMapper errorMapper;

    public IndexRunEntity execute(WorkspaceEntity workspace,
                                  RepositoryRegistrationEntity repository,
                                  IndexRunEntity requestedRun,
                                  RequestRunRequest request) {
        lifecycleService.markRunning(requestedRun.id);
        long startedAtNanos = System.nanoTime();
        LOG.infov("Starting remote indexer run {0} for workspace={1}, repositoryId={2}, repositoryKey={3}, sourceType={4}",
            requestedRun.id, workspace.id, repository.id, repository.repositoryKey, repository.sourceType);
        try {
            JsonNode payload = invokeIndexer(repository, requestedRun.id);
            snapshotImportService.importForRun(workspace.id, repository.id, requestedRun.id, payload);
            long elapsedMillis = elapsedMillis(startedAtNanos);
            LOG.infov("Completed remote indexer run {0} in {1} ms", requestedRun.id, elapsedMillis);
            return lifecycleService.requireRun(requestedRun.id);
        } catch (RuntimeException ex) {
            long elapsedMillis = elapsedMillis(startedAtNanos);
            LOG.errorv(ex, "Remote indexer run {0} failed after {1} ms for workspace={2}, repositoryId={3}, repositoryKey={4}",
                requestedRun.id, elapsedMillis, workspace.id, repository.id, repository.repositoryKey);
            return lifecycleService.markFailed(
                requestedRun.id,
                RemoteIndexerGatewaySupport.normalizeNullable(request.requestedSchemaVersion()),
                RemoteIndexerGatewaySupport.normalizeNullable(request.requestedIndexerVersion()),
                request.metadataJson(),
                RemoteIndexerGatewaySupport.summarize(ex)
            );
        }
    }

    private JsonNode invokeIndexer(RepositoryRegistrationEntity repository, String runId) {
        String requestJson = requestFactory.buildRequestBody(repository, runId);
        String endpoint = RemoteIndexerGatewaySupport.trimTrailingSlash(baseUrl) + "/api/index-jobs/run";
        LOG.infov("Invoking indexer worker endpoint={0}, runId={1}, repositoryKey={2}, sourceType={3}, connectTimeoutSeconds={4}, readTimeoutSeconds={5}",
            endpoint, runId, repository.repositoryKey, repository.sourceType, connectTimeoutSeconds, readTimeoutSeconds);
        LOG.debugv("Indexer worker request body for run {0}: {1}", runId, requestJson);
        try {
            HttpResponse<String> response = transport.postJson(endpoint, requestJson, connectTimeoutSeconds, readTimeoutSeconds);
            LOG.infov("Indexer worker response for run {0}: HTTP {1}", runId, response.statusCode());
            LOG.debugv("Indexer worker response body for run {0}: {1}", runId,
                RemoteIndexerGatewaySupport.abbreviate(response.body(), 4000));
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw errorMapper.mapHttpFailure(response.statusCode(), response.body());
            }
            return responseMapper.requireDocument(response);
        } catch (IOException e) {
            throw errorMapper.mapIoFailure(endpoint, e);
        } catch (InterruptedException e) {
            throw errorMapper.mapInterruptedFailure(endpoint, e);
        }
    }

    private static long elapsedMillis(long startedAtNanos) {
        return Duration.ofNanos(System.nanoTime() - startedAtNanos).toMillis();
    }
}
