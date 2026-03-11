package info.isaksson.erland.architecturebrowser.platform.api.dto;

import java.util.List;

public record ApiErrorResponse(String code, String message, List<String> details) {
    public static ApiErrorResponse validation(String message, List<String> details) {
        return new ApiErrorResponse("validation_error", message, List.copyOf(details));
    }

    public static ApiErrorResponse notFound(String message) {
        return new ApiErrorResponse("not_found", message, List.of());
    }

    public static ApiErrorResponse conflict(String message) {
        return new ApiErrorResponse("conflict", message, List.of());
    }
}
