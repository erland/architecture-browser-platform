package info.isaksson.erland.architecturebrowser.platform.service.management;

import info.isaksson.erland.architecturebrowser.platform.api.dto.WorkspaceDtos.CreateWorkspaceRequest;
import info.isaksson.erland.architecturebrowser.platform.api.dto.WorkspaceDtos.UpdateWorkspaceRequest;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

@ApplicationScoped
public class WorkspaceManagementValidator {
    private static final Pattern KEY_PATTERN = Pattern.compile("^[a-z0-9]+(?:[-_][a-z0-9]+)*$");

    public void validateForCreate(CreateWorkspaceRequest request) {
        List<String> errors = new ArrayList<>();
        if (request == null) {
            errors.add("Request body is required.");
            throw new ValidationException(errors);
        }
        if (isBlank(request.workspaceKey())) {
            errors.add("workspaceKey is required.");
        } else if (!KEY_PATTERN.matcher(request.workspaceKey().trim()).matches()) {
            errors.add("workspaceKey must use lowercase letters, digits, '-' or '_' only.");
        }
        if (isBlank(request.name())) {
            errors.add("name is required.");
        }
        if (request.description() != null && request.description().length() > 2000) {
            errors.add("description must be 2000 characters or fewer.");
        }
        if (!errors.isEmpty()) {
            throw new ValidationException(errors);
        }
    }

    public void validateForUpdate(UpdateWorkspaceRequest request) {
        List<String> errors = new ArrayList<>();
        if (request == null) {
            errors.add("Request body is required.");
            throw new ValidationException(errors);
        }
        if (isBlank(request.name())) {
            errors.add("name is required.");
        }
        if (request.description() != null && request.description().length() > 2000) {
            errors.add("description must be 2000 characters or fewer.");
        }
        if (!errors.isEmpty()) {
            throw new ValidationException(errors);
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
