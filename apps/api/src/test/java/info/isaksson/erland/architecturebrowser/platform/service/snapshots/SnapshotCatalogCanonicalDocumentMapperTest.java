package info.isaksson.erland.architecturebrowser.platform.service.snapshots;

import info.isaksson.erland.architecturebrowser.platform.contract.ArchitectureIndexDocument;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class SnapshotCatalogCanonicalDocumentMapperTest {
    private final SnapshotCatalogMetadataSanitizer metadataSanitizer = new SnapshotCatalogMetadataSanitizer();
    private final SnapshotCatalogCanonicalCoreMapper coreMapper = new SnapshotCatalogCanonicalCoreMapper();
    private final SnapshotCatalogCanonicalStructureMapper structureMapper = new SnapshotCatalogCanonicalStructureMapper();
    private final SnapshotCatalogCanonicalInsightMapper insightMapper = new SnapshotCatalogCanonicalInsightMapper();
    private final SnapshotCatalogCanonicalDocumentMapper mapper = new SnapshotCatalogCanonicalDocumentMapper();

    SnapshotCatalogCanonicalDocumentMapperTest() {
        structureMapper.metadataSanitizer = metadataSanitizer;
        insightMapper.metadataSanitizer = metadataSanitizer;
        insightMapper.structureMapper = structureMapper;
        mapper.coreMapper = coreMapper;
        mapper.structureMapper = structureMapper;
        mapper.insightMapper = insightMapper;
        mapper.metadataSanitizer = metadataSanitizer;
    }

    @Test
    void mapsDocumentIntoCanonicalSections() {
        ArchitectureIndexDocument document = new ArchitectureIndexDocument(
            "1.0",
            "indexer-1",
            new ArchitectureIndexDocument.RunMetadata("2026-04-02T10:00:00Z", "2026-04-02T10:01:00Z", "SUCCESS", List.of("java", "react"), Map.of("runner", "ci")),
            new ArchitectureIndexDocument.RepositorySource("repo-1", "git", "/tmp/repo", "https://example.test/repo.git", "main", "abc123", "2026-04-02T10:00:00Z", Map.of("provider", "github")),
            List.of(new ArchitectureIndexDocument.LogicalScope("scope:ui", "module", "ui", "UI", null, List.of(sourceRef("src/App.tsx")), Map.of("tier", "web"))),
            List.of(new ArchitectureIndexDocument.ArchitectureEntity("entity:browser", "component", "declared", "BrowserView", "Browser View", "scope:ui", List.of(sourceRef("src/views/BrowserView.tsx")), Map.of("role", "ui"))),
            List.of(new ArchitectureIndexDocument.ArchitectureRelationship("rel:1", "uses", "entity:browser", "entity:search", "uses", List.of(sourceRef("src/views/useBrowserViewSearchController.ts")), Map.of("strength", "strong"))),
            List.of(new ArchitectureIndexDocument.ArchitectureViewpoint("request-handling", "Request handling", "Entry flow", "AVAILABLE", 0.9d, List.of("entity:browser"), List.of("ui"), List.of("calls"), List.of("moduleDependencies"), List.of("analysis"))),
            List.of(new ArchitectureIndexDocument.Diagnostic("diag:1", "WARN", "parse", "PARTIAL_PARSE", "Partial parse", false, "src/App.tsx", "scope:ui", "entity:browser", List.of(sourceRef("src/App.tsx")), Map.of("category", "parser"))),
            new ArchitectureIndexDocument.CompletenessMetadata("COMPLETE", 10, 12, 1, List.of("node_modules"), List.of("partial parse")),
            Map.of("schemaVersion", "1.0")
        );

        SnapshotCatalogCanonicalDocument canonical = mapper.toCanonicalDocument(document);

        assertEquals("repo-1", canonical.source().repositoryId());
        assertEquals("SUCCESS", canonical.run().outcome());
        assertEquals(10, canonical.completeness().indexedFileCount());
        assertEquals("scope:ui", canonical.scopes().getFirst().id());
        assertEquals("BrowserView", canonical.entities().getFirst().name());
        assertEquals("entity:browser", canonical.relationships().getFirst().fromEntityId());
        assertEquals("request-handling", canonical.viewpoints().getFirst().id());
        assertEquals("diag:1", canonical.diagnostics().getFirst().id());
        assertEquals("1.0", canonical.metadata().get("schemaVersion"));
    }

    @Test
    void defaultsMissingCollectionsAndMetadata() {
        ArchitectureIndexDocument document = new ArchitectureIndexDocument(
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            List.of(new ArchitectureIndexDocument.ArchitectureViewpoint("v1", "Title", "Description", "AVAILABLE", null, null, null, null, null, null)),
            List.of(new ArchitectureIndexDocument.Diagnostic("d1", "INFO", "phase", "CODE", "Message", false, null, null, null, null, null)),
            null,
            null
        );

        SnapshotCatalogCanonicalDocument canonical = mapper.toCanonicalDocument(document);

        assertNotNull(canonical.source());
        assertEquals(List.of(), canonical.scopes());
        assertEquals(List.of(), canonical.entities());
        assertEquals(List.of(), canonical.relationships());
        assertEquals(0.0d, canonical.viewpoints().getFirst().confidence());
        assertEquals(List.of(), canonical.viewpoints().getFirst().seedEntityIds());
        assertEquals(List.of(), canonical.diagnostics().getFirst().sourceRefs());
        assertEquals(Map.of(), canonical.metadata());
    }

    private static ArchitectureIndexDocument.SourceReference sourceRef(String path) {
        return new ArchitectureIndexDocument.SourceReference(path, 1, 2, "snippet", Map.of("lang", "ts"));
    }
}
