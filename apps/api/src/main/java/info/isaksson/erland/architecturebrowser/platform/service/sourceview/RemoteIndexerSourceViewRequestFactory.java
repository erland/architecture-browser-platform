package info.isaksson.erland.architecturebrowser.platform.service.sourceview;

import info.isaksson.erland.architecturebrowser.platform.service.JsonSupport;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.LinkedHashMap;
import java.util.Map;

@ApplicationScoped
public class RemoteIndexerSourceViewRequestFactory {
    @Inject
    JsonSupport jsonSupport;

    public String buildRequestBody(SourceViewReadRequest request) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("sourceHandle", normalizeRequired(request.sourceHandle(), "sourceHandle"));
        payload.put("path", normalizeRequired(request.path(), "path"));
        if (request.startLine() != null) {
            payload.put("startLine", request.startLine());
        }
        if (request.endLine() != null) {
            payload.put("endLine", request.endLine());
        }
        return jsonSupport.write(payload);
    }

    private static String normalizeRequired(String value, String fieldName) {
        String normalized = value == null ? null : value.trim();
        if (normalized == null || normalized.isEmpty()) {
            throw new IllegalArgumentException("Source view request field '%s' is required.".formatted(fieldName));
        }
        return normalized;
    }
}
