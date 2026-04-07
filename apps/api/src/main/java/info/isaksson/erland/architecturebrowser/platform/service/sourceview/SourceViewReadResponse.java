package info.isaksson.erland.architecturebrowser.platform.service.sourceview;

public record SourceViewReadResponse(
    String path,
    String language,
    Integer totalLineCount,
    Long fileSizeBytes,
    Integer requestedStartLine,
    Integer requestedEndLine,
    String sourceText
) {
}
