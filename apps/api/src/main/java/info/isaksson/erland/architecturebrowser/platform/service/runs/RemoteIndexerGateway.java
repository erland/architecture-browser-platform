package info.isaksson.erland.architecturebrowser.platform.service.runs;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import info.isaksson.erland.architecturebrowser.platform.api.dto.RunDtos.RequestRunRequest;
import info.isaksson.erland.architecturebrowser.platform.domain.IndexRunEntity;
import info.isaksson.erland.architecturebrowser.platform.domain.RepositoryRegistrationEntity;
import info.isaksson.erland.architecturebrowser.platform.domain.RepositorySourceType;
import info.isaksson.erland.architecturebrowser.platform.domain.WorkspaceEntity;
import info.isaksson.erland.architecturebrowser.platform.service.JsonSupport;
import info.isaksson.erland.architecturebrowser.platform.service.SnapshotImportService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;

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
    ObjectMapper objectMapper;

    @Inject
    JsonSupport jsonSupport;

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
                normalizeNullable(request.requestedSchemaVersion()),
                normalizeNullable(request.requestedIndexerVersion()),
                request.metadataJson(),
                summarize(ex)
            );
        }
    }

    private JsonNode invokeIndexer(RepositoryRegistrationEntity repository, String runId) {
        HttpClient client = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(connectTimeoutSeconds))
            .build();
        String requestJson = buildRequestBody(repository, runId);
        String endpoint = trimTrailingSlash(baseUrl) + "/api/index-jobs/run";
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(endpoint))
            .timeout(Duration.ofSeconds(readTimeoutSeconds))
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(requestJson))
            .build();
        LOG.infov("Invoking indexer worker endpoint={0}, runId={1}, repositoryKey={2}, sourceType={3}, connectTimeoutSeconds={4}, readTimeoutSeconds={5}",
            endpoint, runId, repository.repositoryKey, repository.sourceType, connectTimeoutSeconds, readTimeoutSeconds);
        LOG.debugv("Indexer worker request body for run {0}: {1}", runId, requestJson);
        try {
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            LOG.infov("Indexer worker response for run {0}: HTTP {1}", runId, response.statusCode());
            LOG.debugv("Indexer worker response body for run {0}: {1}", runId, abbreviate(response.body(), 4000));
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException("Indexer worker returned HTTP " + response.statusCode() + ": " + abbreviate(response.body(), 1000));
            }
            JsonNode root = objectMapper.readTree(response.body());
            JsonNode document = root.path("document");
            if (document.isMissingNode() || document.isNull()) {
                throw new IllegalStateException("Indexer worker response did not contain a document payload.");
            }
            return enrichDocument(document, root);
        } catch (IOException e) {
            String details = rootCauseDetails(e);
            throw new IllegalStateException("Failed to communicate with the indexer worker at " + endpoint + ". " + details, e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            String details = rootCauseDetails(e);
            throw new IllegalStateException("Interrupted while waiting for the indexer worker response from " + endpoint + ". " + details, e);
        }
    }

    private String buildRequestBody(RepositoryRegistrationEntity repository, String runId) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("jobId", runId);
        payload.put("repositoryId", repository.repositoryKey != null ? repository.repositoryKey : repository.id);
        if (repository.sourceType == RepositorySourceType.LOCAL_PATH) {
            payload.put("sourcePath", normalizeNullable(repository.localPath));
        } else {
            payload.put("gitUrl", normalizeNullable(repository.remoteUrl));
            payload.put("gitRef", normalizeNullable(repository.defaultBranch));
        }
        return jsonSupport.write(payload);
    }

    private JsonNode enrichDocument(JsonNode document, JsonNode responseRoot) {
        if (!(document instanceof ObjectNode objectNode)) {
            return document;
        }
        ObjectNode runMetadata = objectNode.with("runMetadata");
        ObjectNode metadata = runMetadata.with("metadata");
        metadata.put("indexerGateway", "remote-http");
        if (responseRoot.hasNonNull("jobId")) {
            metadata.put("indexerJobId", responseRoot.get("jobId").asText());
        }
        if (responseRoot.hasNonNull("status")) {
            metadata.put("workerStatus", responseRoot.get("status").asText());
        }
        if (responseRoot.hasNonNull("outputPath")) {
            metadata.put("outputPath", responseRoot.get("outputPath").asText());
        }
        if (responseRoot.has("summary") && responseRoot.get("summary").isObject()) {
            metadata.set("workerSummary", responseRoot.get("summary"));
        }
        if (responseRoot.has("manifest") && responseRoot.get("manifest").isObject()) {
            metadata.set("workerManifest", responseRoot.get("manifest"));
        }
        return objectNode;
    }


    private static long elapsedMillis(long startedAtNanos) {
        return Duration.ofNanos(System.nanoTime() - startedAtNanos).toMillis();
    }

    private static String rootCauseDetails(Throwable throwable) {
        Throwable root = throwable;
        while (root.getCause() != null && root.getCause() != root) {
            root = root.getCause();
        }
        String type = root.getClass().getName();
        String message = root.getMessage();
        if (message == null || message.isBlank()) {
            return "Root cause: " + type;
        }
        return "Root cause: " + type + ": " + abbreviate(message, 500);
    }

    private static String trimTrailingSlash(String value) {
        if (value == null) {
            return "";
        }
        String trimmed = value.trim();
        while (trimmed.endsWith("/")) {
            trimmed = trimmed.substring(0, trimmed.length() - 1);
        }
        return trimmed;
    }

    private static String normalizeNullable(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private static String summarize(RuntimeException ex) {
        String message = ex.getMessage();
        if (message == null || message.isBlank()) {
            return ex.getClass().getSimpleName();
        }
        return abbreviate(message, 1000);
    }

    private static String abbreviate(String value, int maxLength) {
        if (value == null) {
            return null;
        }
        if (value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, Math.max(0, maxLength - 3)) + "...";
    }
}
