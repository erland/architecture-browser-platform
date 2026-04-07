package info.isaksson.erland.architecturebrowser.platform.service.snapshotsourcefiles;

import java.util.List;
import java.util.Map;

public record SnapshotSourceFileImportArtifact(
    String contractType,
    List<SnapshotSourceFileImportEntry> files,
    Map<String, Object> metadata
) {
    public SnapshotSourceFileImportArtifact {
        contractType = contractType == null ? "" : contractType.trim();
        files = files == null ? List.of() : files.stream().filter(java.util.Objects::nonNull).toList();
        metadata = metadata == null ? Map.of() : Map.copyOf(metadata);
    }
}
