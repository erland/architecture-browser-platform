package info.isaksson.erland.architecturebrowser.platform.service.management;

import info.isaksson.erland.architecturebrowser.platform.api.dto.RepositoryDtos.CreateRepositoryRequest;
import info.isaksson.erland.architecturebrowser.platform.api.dto.RepositoryDtos.UpdateRepositoryRequest;
import info.isaksson.erland.architecturebrowser.platform.domain.RepositorySourceType;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

@ApplicationScoped
public class RepositoryManagementValidator {
    private static final Pattern KEY_PATTERN = Pattern.compile("^[a-z0-9]+(?:[-_][a-z0-9]+)*$");

    public void validateForCreate(CreateRepositoryRequest request) {
        List<String> errors = new ArrayList<>();
        if (request == null) {
            errors.add("Request body is required.");
            throw new ValidationException(errors);
        }
        if (isBlank(request.repositoryKey())) {
            errors.add("repositoryKey is required.");
        } else if (!KEY_PATTERN.matcher(request.repositoryKey().trim()).matches()) {
            errors.add("repositoryKey must use lowercase letters, digits, '-' or '_' only.");
        }
        if (isBlank(request.name())) {
            errors.add("name is required.");
        }
        if (request.sourceType() == null) {
            errors.add("sourceType is required.");
        } else if (request.sourceType() == RepositorySourceType.LOCAL_PATH) {
            if (isBlank(request.localPath())) {
                errors.add("localPath is required for LOCAL_PATH repositories.");
            }
            if (!isBlank(request.remoteUrl())) {
                errors.add("remoteUrl must be empty for LOCAL_PATH repositories.");
            }
        } else if (request.sourceType() == RepositorySourceType.GIT) {
            if (isBlank(request.remoteUrl())) {
                errors.add("remoteUrl is required for GIT repositories.");
            }
        }
        if (!errors.isEmpty()) {
            throw new ValidationException(errors);
        }
    }

    public void validateForUpdate(UpdateRepositoryRequest request, RepositorySourceType sourceType) {
        List<String> errors = new ArrayList<>();
        if (request == null) {
            errors.add("Request body is required.");
            throw new ValidationException(errors);
        }
        if (isBlank(request.name())) {
            errors.add("name is required.");
        }
        if (sourceType == RepositorySourceType.LOCAL_PATH) {
            if (isBlank(request.localPath())) {
                errors.add("localPath is required for LOCAL_PATH repositories.");
            }
            if (!isBlank(request.remoteUrl())) {
                errors.add("remoteUrl must be empty for LOCAL_PATH repositories.");
            }
        } else if (sourceType == RepositorySourceType.GIT) {
            if (isBlank(request.remoteUrl())) {
                errors.add("remoteUrl is required for GIT repositories.");
            }
        }
        if (!errors.isEmpty()) {
            throw new ValidationException(errors);
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
