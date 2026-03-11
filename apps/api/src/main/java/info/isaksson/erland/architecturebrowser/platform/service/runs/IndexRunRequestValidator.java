package info.isaksson.erland.architecturebrowser.platform.service.runs;

import info.isaksson.erland.architecturebrowser.platform.api.dto.RunDtos.RequestRunRequest;
import info.isaksson.erland.architecturebrowser.platform.domain.RepositoryRegistrationEntity;
import info.isaksson.erland.architecturebrowser.platform.domain.RepositoryStatus;
import info.isaksson.erland.architecturebrowser.platform.domain.WorkspaceEntity;
import info.isaksson.erland.architecturebrowser.platform.domain.WorkspaceStatus;
import info.isaksson.erland.architecturebrowser.platform.service.management.ValidationException;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.ArrayList;
import java.util.List;

@ApplicationScoped
public class IndexRunRequestValidator {
    public void validate(WorkspaceEntity workspace, RepositoryRegistrationEntity repository, RequestRunRequest request) {
        List<String> errors = new ArrayList<>();
        if (request == null) {
            errors.add("Request body is required.");
            throw new ValidationException(errors);
        }
        if (workspace.status != WorkspaceStatus.ACTIVE) {
            errors.add("Workspace must be ACTIVE to request index runs.");
        }
        if (repository.status != RepositoryStatus.ACTIVE) {
            errors.add("Repository must be ACTIVE to request index runs.");
        }
        if (request.triggerType() == null) {
            errors.add("triggerType is required.");
        }
        if (request.requestedResult() == null) {
            errors.add("requestedResult is required for the Step 4 stub adapter.");
        }
        validateLength(request.requestedSchemaVersion(), "requestedSchemaVersion", 64, errors);
        validateLength(request.requestedIndexerVersion(), "requestedIndexerVersion", 64, errors);
        validateLength(request.metadataJson(), "metadataJson", 4000, errors);
        if (!errors.isEmpty()) {
            throw new ValidationException(errors);
        }
    }

    private void validateLength(String value, String fieldName, int maxLength, List<String> errors) {
        if (value != null && value.length() > maxLength) {
            errors.add(fieldName + " must be at most " + maxLength + " characters.");
        }
    }
}
