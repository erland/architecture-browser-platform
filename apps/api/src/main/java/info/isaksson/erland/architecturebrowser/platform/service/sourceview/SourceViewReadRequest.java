package info.isaksson.erland.architecturebrowser.platform.service.sourceview;

public record SourceViewReadRequest(
    String sourceHandle,
    String path,
    Integer startLine,
    Integer endLine
) {
}
