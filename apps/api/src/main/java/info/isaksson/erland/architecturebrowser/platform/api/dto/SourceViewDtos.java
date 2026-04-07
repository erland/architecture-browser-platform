package info.isaksson.erland.architecturebrowser.platform.api.dto;

public final class SourceViewDtos {
    private SourceViewDtos() {
    }

    public record ReadSourceRequest(
        Integer startLine,
        Integer endLine,
        String snapshotId,
        String selectedObjectType,
        String selectedObjectId,
        Integer sourceRefIndex
    ) {
    }

    public record ReadSourceResponse(
        String path,
        String language,
        Integer totalLineCount,
        Long fileSizeBytes,
        Integer requestedStartLine,
        Integer requestedEndLine,
        String sourceText
    ) {
    }

    public record ReadSnapshotSourceFileRequest(
        String snapshotId,
        String path,
        Integer startLine,
        Integer endLine
    ) {
    }
}
