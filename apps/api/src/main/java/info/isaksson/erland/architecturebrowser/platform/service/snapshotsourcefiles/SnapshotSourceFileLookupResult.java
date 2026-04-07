package info.isaksson.erland.architecturebrowser.platform.service.snapshotsourcefiles;

public record SnapshotSourceFileLookupResult(
    String snapshotId,
    String relativePath,
    String language,
    String contentType,
    long sizeBytes,
    int totalLineCount,
    String textContent
) {
}
