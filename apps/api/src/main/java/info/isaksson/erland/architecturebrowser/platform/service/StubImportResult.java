package info.isaksson.erland.architecturebrowser.platform.service;

public record StubImportResult(
    String workspaceId,
    String repositoryRegistrationId,
    String snapshotId,
    int scopeCount,
    int entityCount,
    int relationshipCount,
    int diagnosticCount
) {}
