package info.isaksson.erland.architecturebrowser.platform.api.dto;

public final class SourceViewDtos {
    private SourceViewDtos() {
    }

    public record ReadSourceRequest(
        String sourceHandle,
        String path,
        Integer startLine,
        Integer endLine,
        String snapshotId,
        String selectedObjectType,
        String selectedObjectId,
        Integer sourceRefIndex
    ) {
    }

    public record ReadSourceResponse(
        String sourceHandle,
        String path,
        String language,
        Integer totalLineCount,
        Long fileSizeBytes,
        Integer requestedStartLine,
        Integer requestedEndLine,
        String sourceText
    ) {
    }
}
