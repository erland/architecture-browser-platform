package info.isaksson.erland.architecturebrowser.platform.service.sourceview;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.io.IOException;
import java.net.http.HttpResponse;

@ApplicationScoped
public class RemoteIndexerSourceViewResponseMapper {
    @Inject
    ObjectMapper objectMapper;

    public SourceViewReadResponse map(HttpResponse<String> response) throws IOException {
        JsonNode root = objectMapper.readTree(response.body());
        String sourceHandle = requireText(root, "sourceHandle");
        String path = requireText(root, "path");
        String sourceText = requireText(root, "sourceText");
        return new SourceViewReadResponse(
            sourceHandle,
            path,
            nullableText(root, "language"),
            nullableInt(root, "totalLineCount"),
            nullableLong(root, "fileSizeBytes"),
            nullableInt(root, "requestedStartLine"),
            nullableInt(root, "requestedEndLine"),
            sourceText
        );
    }

    private static String requireText(JsonNode root, String fieldName) {
        JsonNode value = root.get(fieldName);
        if (value == null || value.isNull() || value.asText().isBlank()) {
            throw new IllegalStateException("Indexer source response did not contain required field '%s'.".formatted(fieldName));
        }
        return value.asText();
    }

    private static String nullableText(JsonNode root, String fieldName) {
        JsonNode value = root.get(fieldName);
        if (value == null || value.isNull()) {
            return null;
        }
        String text = value.asText();
        return text.isBlank() ? null : text;
    }

    private static Integer nullableInt(JsonNode root, String fieldName) {
        JsonNode value = root.get(fieldName);
        if (value == null || value.isNull()) {
            return null;
        }
        return value.asInt();
    }

    private static Long nullableLong(JsonNode root, String fieldName) {
        JsonNode value = root.get(fieldName);
        if (value == null || value.isNull()) {
            return null;
        }
        return value.asLong();
    }
}
