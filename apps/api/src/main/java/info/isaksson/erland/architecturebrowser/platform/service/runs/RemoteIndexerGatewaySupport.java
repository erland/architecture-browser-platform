package info.isaksson.erland.architecturebrowser.platform.service.runs;

final class RemoteIndexerGatewaySupport {
    private RemoteIndexerGatewaySupport() {
    }

    static String trimTrailingSlash(String value) {
        if (value == null) {
            return "";
        }
        String trimmed = value.trim();
        while (trimmed.endsWith("/")) {
            trimmed = trimmed.substring(0, trimmed.length() - 1);
        }
        return trimmed;
    }

    static String normalizeNullable(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    static String abbreviate(String value, int maxLength) {
        if (value == null) {
            return null;
        }
        if (value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, Math.max(0, maxLength - 3)) + "...";
    }

    static String rootCauseDetails(Throwable throwable) {
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

    static String summarize(RuntimeException ex) {
        String message = ex.getMessage();
        if (message == null || message.isBlank()) {
            return ex.getClass().getSimpleName();
        }
        return abbreviate(message, 1000);
    }
}
