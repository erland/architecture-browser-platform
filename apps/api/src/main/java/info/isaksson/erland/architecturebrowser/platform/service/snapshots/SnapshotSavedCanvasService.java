package info.isaksson.erland.architecturebrowser.platform.service.snapshots;

import info.isaksson.erland.architecturebrowser.platform.api.dto.SavedCanvasDtos;
import info.isaksson.erland.architecturebrowser.platform.domain.SavedCanvasEntity;
import info.isaksson.erland.architecturebrowser.platform.domain.SnapshotEntity;
import info.isaksson.erland.architecturebrowser.platform.service.management.AuditService;
import info.isaksson.erland.architecturebrowser.platform.service.management.ConflictException;
import info.isaksson.erland.architecturebrowser.platform.service.management.NotFoundException;
import info.isaksson.erland.architecturebrowser.platform.service.management.ValidationException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@ApplicationScoped
public class SnapshotSavedCanvasService {
    @Inject
    AuditService auditService;

    @Inject
    SavedCanvasDocumentSerializer documentSerializer;

    @Inject
    SavedCanvasResponseAssembler responseAssembler;

    public List<SavedCanvasDtos.SavedCanvasResponse> listSavedCanvases(String workspaceId, String snapshotId) {
        requireSnapshotOwnership(workspaceId, snapshotId);
        return responseAssembler.toResponses(SavedCanvasEntity.list("workspaceId = ?1 and snapshotId = ?2 order by updatedAt desc", workspaceId, snapshotId));
    }

    public SavedCanvasDtos.SavedCanvasResponse getSavedCanvas(String workspaceId, String snapshotId, String savedCanvasId) {
        requireSnapshotOwnership(workspaceId, snapshotId);
        return responseAssembler.toResponse(requireSavedCanvas(workspaceId, snapshotId, savedCanvasId));
    }

    @Transactional
    public SavedCanvasDtos.SavedCanvasResponse createSavedCanvas(String workspaceId, String snapshotId, SavedCanvasDtos.CreateSavedCanvasRequest request) {
        requireSnapshotOwnership(workspaceId, snapshotId);
        validateSavedCanvas(request.name(), request.document());
        SavedCanvasEntity savedCanvas = new SavedCanvasEntity();
        savedCanvas.id = UUID.randomUUID().toString();
        savedCanvas.workspaceId = workspaceId;
        savedCanvas.snapshotId = snapshotId;
        savedCanvas.name = request.name().trim();
        savedCanvas.documentJson = documentSerializer.jsonOrNull(request.document());
        savedCanvas.documentVersion = 1L;
        savedCanvas.createdAt = Instant.now();
        savedCanvas.updatedAt = savedCanvas.createdAt;
        savedCanvas.persist();
        auditService.recordSnapshotEvent(workspaceId, snapshotRepositoryId(snapshotId), null, snapshotId, "saved-canvas.created", documentSerializer.jsonOrNull(Map.of("savedCanvasId", savedCanvas.id, "name", savedCanvas.name, "documentVersion", savedCanvas.documentVersion)));
        return responseAssembler.toResponse(savedCanvas);
    }

    @Transactional
    public SavedCanvasDtos.SavedCanvasResponse updateSavedCanvas(String workspaceId, String snapshotId, String savedCanvasId, SavedCanvasDtos.UpdateSavedCanvasRequest request) {
        requireSnapshotOwnership(workspaceId, snapshotId);
        validateSavedCanvas(request.name(), request.document());
        SavedCanvasEntity savedCanvas = requireSavedCanvas(workspaceId, snapshotId, savedCanvasId);
        requireSavedCanvasBackendVersion(savedCanvas, request.expectedBackendVersion());
        savedCanvas.name = request.name().trim();
        savedCanvas.documentJson = documentSerializer.jsonOrNull(request.document());
        savedCanvas.documentVersion = savedCanvas.documentVersion + 1;
        savedCanvas.updatedAt = Instant.now();
        auditService.recordSnapshotEvent(workspaceId, snapshotRepositoryId(snapshotId), null, snapshotId, "saved-canvas.updated", documentSerializer.jsonOrNull(Map.of("savedCanvasId", savedCanvas.id, "name", savedCanvas.name, "documentVersion", savedCanvas.documentVersion)));
        return responseAssembler.toResponse(savedCanvas);
    }

    @Transactional
    public SavedCanvasDtos.SavedCanvasResponse duplicateSavedCanvas(String workspaceId, String snapshotId, String savedCanvasId) {
        requireSnapshotOwnership(workspaceId, snapshotId);
        SavedCanvasEntity existing = requireSavedCanvas(workspaceId, snapshotId, savedCanvasId);
        SavedCanvasEntity duplicate = new SavedCanvasEntity();
        duplicate.id = UUID.randomUUID().toString();
        duplicate.workspaceId = existing.workspaceId;
        duplicate.snapshotId = existing.snapshotId;
        duplicate.name = existing.name + " copy";
        duplicate.documentJson = existing.documentJson;
        duplicate.documentVersion = 1L;
        duplicate.createdAt = Instant.now();
        duplicate.updatedAt = duplicate.createdAt;
        duplicate.persist();
        auditService.recordSnapshotEvent(workspaceId, snapshotRepositoryId(snapshotId), null, snapshotId, "saved-canvas.duplicated", documentSerializer.jsonOrNull(Map.of("savedCanvasId", duplicate.id, "sourceSavedCanvasId", existing.id, "name", duplicate.name, "documentVersion", duplicate.documentVersion)));
        return responseAssembler.toResponse(duplicate);
    }

    @Transactional
    public void deleteSavedCanvas(String workspaceId, String snapshotId, String savedCanvasId, String expectedBackendVersion) {
        requireSnapshotOwnership(workspaceId, snapshotId);
        SavedCanvasEntity savedCanvas = requireSavedCanvas(workspaceId, snapshotId, savedCanvasId);
        requireSavedCanvasBackendVersion(savedCanvas, expectedBackendVersion);
        savedCanvas.delete();
        auditService.recordSnapshotEvent(workspaceId, snapshotRepositoryId(snapshotId), null, snapshotId, "saved-canvas.deleted", documentSerializer.jsonOrNull(Map.of("savedCanvasId", savedCanvas.id, "name", savedCanvas.name)));
    }

    private void requireSavedCanvasBackendVersion(SavedCanvasEntity savedCanvas, String expectedBackendVersion) {
        if (expectedBackendVersion == null || expectedBackendVersion.isBlank()) {
            return;
        }
        String actualBackendVersion = Long.toString(savedCanvas.documentVersion);
        if (!expectedBackendVersion.trim().equals(actualBackendVersion)) {
            throw new ConflictException("Saved canvas version conflict. Expected backend version " + expectedBackendVersion.trim() + " but found " + actualBackendVersion + ".");
        }
    }

    private SavedCanvasEntity requireSavedCanvas(String workspaceId, String snapshotId, String savedCanvasId) {
        SavedCanvasEntity savedCanvas = SavedCanvasEntity.findById(savedCanvasId);
        if (savedCanvas == null || !workspaceId.equals(savedCanvas.workspaceId) || !snapshotId.equals(savedCanvas.snapshotId)) {
            throw new NotFoundException("Saved canvas not found: " + savedCanvasId);
        }
        return savedCanvas;
    }

    private void requireSnapshotOwnership(String workspaceId, String snapshotId) {
        SnapshotEntity snapshot = SnapshotEntity.findById(snapshotId);
        if (snapshot == null || !workspaceId.equals(snapshot.workspaceId)) {
            throw new NotFoundException("Snapshot not found: " + snapshotId);
        }
    }

    private String snapshotRepositoryId(String snapshotId) {
        SnapshotEntity snapshot = SnapshotEntity.findById(snapshotId);
        return snapshot != null ? snapshot.repositoryRegistrationId : null;
    }

    private void validateSavedCanvas(String name, Map<String, Object> document) {
        if (name == null || name.isBlank()) {
            throw new ValidationException(List.of("saved canvas name is required"));
        }
        if (document == null || document.isEmpty()) {
            throw new ValidationException(List.of("saved canvas document is required"));
        }
    }
}
