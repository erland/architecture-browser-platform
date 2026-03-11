package info.isaksson.erland.architecturebrowser.platform.service.management;

import java.util.List;

public class ValidationException extends RuntimeException {
    private final List<String> errors;

    public ValidationException(List<String> errors) {
        super(errors.isEmpty() ? "Validation failed" : errors.get(0));
        this.errors = List.copyOf(errors);
    }

    public List<String> errors() {
        return errors;
    }
}
