package info.isaksson.erland.architecturebrowser.platform.service.operations;

import info.isaksson.erland.architecturebrowser.platform.service.management.ValidationException;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;

@ApplicationScoped
public class OperationsRetentionPolicyResolver {
    OperationsRetentionPolicy resolve(Integer requestedKeepSnapshots, Integer requestedKeepRuns) {
        return new OperationsRetentionPolicy(
            normalizeKeepCount(requestedKeepSnapshots, OperationsAdminService.DEFAULT_KEEP_SNAPSHOTS, "keepSnapshotsPerRepository"),
            normalizeKeepCount(requestedKeepRuns, OperationsAdminService.DEFAULT_KEEP_RUNS, "keepRunsPerRepository")
        );
    }

    int normalizeKeepCount(Integer requested, int defaultValue, String fieldName) {
        int value = requested == null ? defaultValue : requested;
        if (value < 1) {
            throw new ValidationException(List.of(fieldName + " must be at least 1."));
        }
        return value;
    }
}
