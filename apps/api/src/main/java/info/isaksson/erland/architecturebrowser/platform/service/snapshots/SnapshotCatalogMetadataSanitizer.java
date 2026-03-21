package info.isaksson.erland.architecturebrowser.platform.service.snapshots;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
class SnapshotCatalogMetadataSanitizer {
    Map<String, Object> defaultMap(Map<String, Object> metadata) {
        if (metadata == null || metadata.isEmpty()) {
            return Map.of();
        }
        LinkedHashMap<String, Object> sanitized = new LinkedHashMap<>();
        metadata.forEach((key, value) -> {
            if (key != null) {
                sanitized.put(key, sanitizeMetadataValue(value));
            }
        });
        return Collections.unmodifiableMap(sanitized);
    }

    Object sanitizeMetadataValue(Object value) {
        if (value instanceof Map<?, ?> nestedMap) {
            LinkedHashMap<String, Object> sanitized = new LinkedHashMap<>();
            nestedMap.forEach((nestedKey, nestedValue) -> {
                if (nestedKey != null) {
                    sanitized.put(String.valueOf(nestedKey), sanitizeMetadataValue(nestedValue));
                }
            });
            return Collections.unmodifiableMap(sanitized);
        }
        if (value instanceof List<?> nestedList) {
            return nestedList.stream()
                .map(this::sanitizeMetadataValue)
                .toList();
        }
        return value;
    }
}
