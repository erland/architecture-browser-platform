package info.isaksson.erland.architecturebrowser.platform.service.snapshots;

import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotPayloadDtos.FullEntity;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotSharedDtos.SourceInfo;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

class SnapshotCatalogDocumentMapperTest {
    private final SnapshotCatalogDocumentMapper mapper = new SnapshotCatalogDocumentMapper();

    @Test
    void mapsCanonicalDocumentToBrowserDtos() {
        SnapshotCatalogCanonicalDocument canonical = new SnapshotCatalogCanonicalDocument(
            new SnapshotCatalogCanonicalDocument.SourceData("repo-1", "git", "/tmp/repo", "https://example.test/repo.git", "main", "abc123", "2026-04-02T10:00:00Z"),
            new SnapshotCatalogCanonicalDocument.RunData("2026-04-02T10:00:00Z", "2026-04-02T10:01:00Z", "SUCCESS", List.of("java", "react")),
            new SnapshotCatalogCanonicalDocument.CompletenessData("COMPLETE", 10, 10, 0, List.of(), List.of()),
            List.of(),
            List.of(new SnapshotCatalogCanonicalDocument.EntityData("entity:1", "component", "declared", "BrowserView", "Browser View", "scope:ui", List.of(), Map.of("role", "ui"))),
            List.of(),
            List.of(),
            List.of(),
            Map.of("schemaVersion", "1.0")
        );

        SourceInfo sourceInfo = mapper.toSourceInfo(canonical);
        FullEntity entity = mapper.mapEntities(canonical).getFirst();

        assertEquals("repo-1", sourceInfo.repositoryId());
        assertEquals("BrowserView", entity.name());
        assertEquals("ui", entity.metadata().get("role"));
    }
}
