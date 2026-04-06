package info.isaksson.erland.architecturebrowser.platform.service.sourceview;

public record SourceViewSelectionRequest(
    String snapshotId,
    String selectedObjectType,
    String selectedObjectId,
    Integer sourceRefIndex,
    Integer requestedStartLine,
    Integer requestedEndLine
) {
}
