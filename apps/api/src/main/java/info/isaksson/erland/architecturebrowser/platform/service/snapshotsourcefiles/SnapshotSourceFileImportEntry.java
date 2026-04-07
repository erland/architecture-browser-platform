package info.isaksson.erland.architecturebrowser.platform.service.snapshotsourcefiles;

public record SnapshotSourceFileImportEntry(
    String relativePath,
    String language,
    String contentType,
    Long sizeBytes,
    Integer totalLineCount,
    String textContent
) {
}
