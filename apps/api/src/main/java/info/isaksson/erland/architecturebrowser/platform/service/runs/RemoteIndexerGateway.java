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
        try {
            JsonNode payload = invokeIndexer(repository, requestedRun.id);
            snapshotImportService.importForRun(workspace.id, repository.id, requestedRun.id, payload);
            return lifecycleService.requireRun(requestedRun.id);
        } catch (RuntimeException ex) {
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
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(trimTrailingSlash(baseUrl) + "/api/index-jobs/run"))
            .timeout(Duration.ofSeconds(readTimeoutSeconds))
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(requestJson))
            .build();
        try {
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
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
            throw new IllegalStateException("Failed to communicate with the indexer worker.", e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Interrupted while waiting for the indexer worker response.", e);
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
