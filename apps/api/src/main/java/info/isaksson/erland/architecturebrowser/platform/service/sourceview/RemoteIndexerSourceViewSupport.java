package info.isaksson.erland.architecturebrowser.platform.service.sourceview;

final class RemoteIndexerSourceViewSupport {
    private RemoteIndexerSourceViewSupport() {
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
}
