package info.isaksson.erland.architecturebrowser.platform.service.snapshots;

import info.isaksson.erland.architecturebrowser.platform.api.dto.SavedCanvasDtos;
import info.isaksson.erland.architecturebrowser.platform.domain.SavedCanvasEntity;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;

@ApplicationScoped
class SavedCanvasResponseAssembler {
    List<SavedCanvasDtos.SavedCanvasResponse> toResponses(List<SavedCanvasEntity> savedCanvases) {
        return savedCanvases.stream().map(this::toResponse).toList();
    }

    SavedCanvasDtos.SavedCanvasResponse toResponse(SavedCanvasEntity savedCanvas) {
        return new SavedCanvasDtos.SavedCanvasResponse(
            savedCanvas.id,
            savedCanvas.workspaceId,
            savedCanvas.snapshotId,
            savedCanvas.name,
            savedCanvas.documentJson,
            savedCanvas.documentVersion,
            Long.toString(savedCanvas.documentVersion),
            savedCanvas.createdAt,
            savedCanvas.updatedAt
        );
    }
}
