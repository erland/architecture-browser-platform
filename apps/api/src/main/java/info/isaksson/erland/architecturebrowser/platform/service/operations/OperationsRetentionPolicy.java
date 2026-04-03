package info.isaksson.erland.architecturebrowser.platform.service.operations;

record OperationsRetentionPolicy(
    int keepSnapshotsPerRepository,
    int keepRunsPerRepository
) {
}
