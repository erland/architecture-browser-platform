package info.isaksson.erland.architecturebrowser.platform.service.snapshots;

import info.isaksson.erland.architecturebrowser.platform.api.dto.SavedCanvasDtos;
import info.isaksson.erland.architecturebrowser.platform.domain.SavedCanvasEntity;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertEquals;

class SavedCanvasResponseAssemblerTest {
    private final SavedCanvasResponseAssembler assembler = new SavedCanvasResponseAssembler();

    @Test
    void mapsSavedCanvasEntityToBrowserResponse() {
        SavedCanvasEntity entity = new SavedCanvasEntity();
        entity.id = "canvas-1";
        entity.workspaceId = "workspace-1";
        entity.snapshotId = "snapshot-1";
        entity.name = "My canvas";
        entity.documentJson = "{}";
        entity.documentVersion = 3L;
        entity.createdAt = Instant.parse("2026-04-02T10:00:00Z");
        entity.updatedAt = Instant.parse("2026-04-02T10:01:00Z");

        SavedCanvasDtos.SavedCanvasResponse response = assembler.toResponse(entity);

        assertEquals("canvas-1", response.id());
        assertEquals("3", response.backendVersion());
        assertEquals("{}", response.documentJson());
    }
}
