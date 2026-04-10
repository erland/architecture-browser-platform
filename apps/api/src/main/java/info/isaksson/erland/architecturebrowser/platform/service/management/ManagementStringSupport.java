package info.isaksson.erland.architecturebrowser.platform.service.management;

import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class ManagementStringSupport {
    public String normalizeNullable(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    public String escapeJson(String value) {
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
