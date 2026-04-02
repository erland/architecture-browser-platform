package info.isaksson.erland.architecturebrowser.platform.service.runs;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.io.IOException;
import java.net.http.HttpResponse;

@ApplicationScoped
public class RemoteIndexerResponseMapper {
    @Inject
    ObjectMapper objectMapper;

    public JsonNode requireDocument(HttpResponse<String> response) throws IOException {
        JsonNode root = objectMapper.readTree(response.body());
        JsonNode document = root.path("document");
        if (document.isMissingNode() || document.isNull()) {
            throw new IllegalStateException("Indexer worker response did not contain a document payload.");
        }
        return enrichDocument(document, root);
    }

    JsonNode enrichDocument(JsonNode document, JsonNode responseRoot) {
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
}
