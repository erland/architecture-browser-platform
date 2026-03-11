package info.isaksson.erland.architecturebrowser.platform.service.snapshots;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import info.isaksson.erland.architecturebrowser.platform.api.dto.CustomizationDtos;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotDtos.SnapshotSummaryResponse;
import info.isaksson.erland.architecturebrowser.platform.domain.OverlayEntity;
import info.isaksson.erland.architecturebrowser.platform.domain.SavedViewEntity;
import info.isaksson.erland.architecturebrowser.platform.domain.SnapshotEntity;
import info.isaksson.erland.architecturebrowser.platform.service.management.AuditService;
import info.isaksson.erland.architecturebrowser.platform.service.management.NotFoundException;
import info.isaksson.erland.architecturebrowser.platform.service.management.ValidationException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@ApplicationScoped
public class SnapshotCustomizationService {
    @Inject
    SnapshotCatalogService snapshotCatalogService;

    @Inject
    AuditService auditService;

    @Inject
    ObjectMapper objectMapper;

    public CustomizationDtos.CustomizationOverviewResponse overview(String workspaceId, String snapshotId) {
        SnapshotSummaryResponse snapshot = snapshotCatalogService.getSummary(workspaceId, snapshotId);
        requireSnapshotOwnership(workspaceId, snapshotId);
        List<CustomizationDtos.OverlayResponse> overlays = OverlayEntity.<OverlayEntity>list("workspaceId = ?1 and snapshotId = ?2", workspaceId, snapshotId).stream()
            .map(this::toOverlayResponse)
            .toList();
        List<CustomizationDtos.SavedViewResponse> savedViews = SavedViewEntity.<SavedViewEntity>list("workspaceId = ?1 and snapshotId = ?2", workspaceId, snapshotId).stream()
            .map(this::toSavedViewResponse)
            .toList();
        return new CustomizationDtos.CustomizationOverviewResponse(snapshot, overlays, savedViews);
    }

    @Transactional
    public CustomizationDtos.OverlayResponse createOverlay(String workspaceId, String snapshotId, CustomizationDtos.CreateOverlayRequest request) {
        requireSnapshotOwnership(workspaceId, snapshotId);
        validateOverlay(request.name(), request.kind());
        OverlayEntity overlay = new OverlayEntity();
        overlay.id = UUID.randomUUID().toString();
        overlay.workspaceId = workspaceId;
        overlay.snapshotId = snapshotId;
        overlay.kind = request.kind();
        overlay.name = request.name().trim();
        overlay.definitionJson = overlayDefinitionJson(request.targetEntityIds(), request.targetScopeIds(), request.note(), request.attributes());
        overlay.createdAt = Instant.now();
        overlay.updatedAt = overlay.createdAt;
        overlay.persist();
        auditService.recordSnapshotEvent(workspaceId, snapshotRepositoryId(snapshotId), null, snapshotId, "overlay.created", auditJson(Map.of("overlayId", overlay.id, "name", overlay.name, "kind", overlay.kind.name())));
        return toOverlayResponse(overlay);
    }

    @Transactional
    public CustomizationDtos.OverlayResponse updateOverlay(String workspaceId, String snapshotId, String overlayId, CustomizationDtos.UpdateOverlayRequest request) {
        requireSnapshotOwnership(workspaceId, snapshotId);
        validateOverlay(request.name(), request.kind());
        OverlayEntity overlay = requireOverlay(workspaceId, snapshotId, overlayId);
        overlay.name = request.name().trim();
        overlay.kind = request.kind();
        overlay.definitionJson = overlayDefinitionJson(request.targetEntityIds(), request.targetScopeIds(), request.note(), request.attributes());
        overlay.updatedAt = Instant.now();
        auditService.recordSnapshotEvent(workspaceId, snapshotRepositoryId(snapshotId), null, snapshotId, "overlay.updated", auditJson(Map.of("overlayId", overlay.id, "name", overlay.name, "kind", overlay.kind.name())));
        return toOverlayResponse(overlay);
    }

    @Transactional
    public void deleteOverlay(String workspaceId, String snapshotId, String overlayId) {
        requireSnapshotOwnership(workspaceId, snapshotId);
        OverlayEntity overlay = requireOverlay(workspaceId, snapshotId, overlayId);
        overlay.delete();
        auditService.recordSnapshotEvent(workspaceId, snapshotRepositoryId(snapshotId), null, snapshotId, "overlay.deleted", auditJson(Map.of("overlayId", overlay.id, "name", overlay.name)));
    }

    @Transactional
    public CustomizationDtos.SavedViewResponse createSavedView(String workspaceId, String snapshotId, CustomizationDtos.CreateSavedViewRequest request) {
        requireSnapshotOwnership(workspaceId, snapshotId);
        validateSavedView(request.name(), request.viewType());
        SavedViewEntity savedView = new SavedViewEntity();
        savedView.id = UUID.randomUUID().toString();
        savedView.workspaceId = workspaceId;
        savedView.snapshotId = snapshotId;
        savedView.name = request.name().trim();
        savedView.viewType = request.viewType().trim();
        savedView.queryJson = jsonOrNull(request.queryState());
        savedView.layoutJson = jsonOrNull(request.layoutState());
        savedView.createdAt = Instant.now();
        savedView.updatedAt = savedView.createdAt;
        savedView.persist();
        auditService.recordSnapshotEvent(workspaceId, snapshotRepositoryId(snapshotId), null, snapshotId, "saved-view.created", auditJson(Map.of("savedViewId", savedView.id, "name", savedView.name, "viewType", savedView.viewType)));
        return toSavedViewResponse(savedView);
    }

    @Transactional
    public CustomizationDtos.SavedViewResponse updateSavedView(String workspaceId, String snapshotId, String savedViewId, CustomizationDtos.UpdateSavedViewRequest request) {
        requireSnapshotOwnership(workspaceId, snapshotId);
        validateSavedView(request.name(), request.viewType());
        SavedViewEntity savedView = requireSavedView(workspaceId, snapshotId, savedViewId);
        savedView.name = request.name().trim();
        savedView.viewType = request.viewType().trim();
        savedView.queryJson = jsonOrNull(request.queryState());
        savedView.layoutJson = jsonOrNull(request.layoutState());
        savedView.updatedAt = Instant.now();
        auditService.recordSnapshotEvent(workspaceId, snapshotRepositoryId(snapshotId), null, snapshotId, "saved-view.updated", auditJson(Map.of("savedViewId", savedView.id, "name", savedView.name, "viewType", savedView.viewType)));
        return toSavedViewResponse(savedView);
    }

    @Transactional
    public CustomizationDtos.SavedViewResponse duplicateSavedView(String workspaceId, String snapshotId, String savedViewId) {
        requireSnapshotOwnership(workspaceId, snapshotId);
        SavedViewEntity existing = requireSavedView(workspaceId, snapshotId, savedViewId);
        SavedViewEntity duplicate = new SavedViewEntity();
        duplicate.id = UUID.randomUUID().toString();
        duplicate.workspaceId = existing.workspaceId;
        duplicate.snapshotId = existing.snapshotId;
        duplicate.name = existing.name + " copy";
        duplicate.viewType = existing.viewType;
        duplicate.queryJson = existing.queryJson;
        duplicate.layoutJson = existing.layoutJson;
        duplicate.createdAt = Instant.now();
        duplicate.updatedAt = duplicate.createdAt;
        duplicate.persist();
        auditService.recordSnapshotEvent(workspaceId, snapshotRepositoryId(snapshotId), null, snapshotId, "saved-view.duplicated", auditJson(Map.of("savedViewId", duplicate.id, "sourceSavedViewId", existing.id, "name", duplicate.name)));
        return toSavedViewResponse(duplicate);
    }

    @Transactional
    public void deleteSavedView(String workspaceId, String snapshotId, String savedViewId) {
        requireSnapshotOwnership(workspaceId, snapshotId);
        SavedViewEntity savedView = requireSavedView(workspaceId, snapshotId, savedViewId);
        savedView.delete();
        auditService.recordSnapshotEvent(workspaceId, snapshotRepositoryId(snapshotId), null, snapshotId, "saved-view.deleted", auditJson(Map.of("savedViewId", savedView.id, "name", savedView.name)));
    }

    private OverlayEntity requireOverlay(String workspaceId, String snapshotId, String overlayId) {
        OverlayEntity overlay = OverlayEntity.findById(overlayId);
        if (overlay == null || !workspaceId.equals(overlay.workspaceId) || !snapshotId.equals(overlay.snapshotId)) {
            throw new NotFoundException("Overlay not found: " + overlayId);
        }
        return overlay;
    }

    private SavedViewEntity requireSavedView(String workspaceId, String snapshotId, String savedViewId) {
        SavedViewEntity savedView = SavedViewEntity.findById(savedViewId);
        if (savedView == null || !workspaceId.equals(savedView.workspaceId) || !snapshotId.equals(savedView.snapshotId)) {
            throw new NotFoundException("Saved view not found: " + savedViewId);
        }
        return savedView;
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

    private void validateOverlay(String name, Object kind) {
        if (name == null || name.isBlank()) {
            throw new ValidationException(List.of("overlay name is required"));
        }
        if (kind == null) {
            throw new ValidationException(List.of("overlay kind is required"));
        }
    }

    private void validateSavedView(String name, String viewType) {
        if (name == null || name.isBlank()) {
            throw new ValidationException(List.of("saved view name is required"));
        }
        if (viewType == null || viewType.isBlank()) {
            throw new ValidationException(List.of("saved view type is required"));
        }
    }

    private String overlayDefinitionJson(List<String> targetEntityIds, List<String> targetScopeIds, String note, Map<String, Object> attributes) {
        Map<String, Object> definition = new LinkedHashMap<>();
        definition.put("targetEntityIds", targetEntityIds == null ? List.of() : targetEntityIds.stream().filter(item -> item != null && !item.isBlank()).toList());
        definition.put("targetScopeIds", targetScopeIds == null ? List.of() : targetScopeIds.stream().filter(item -> item != null && !item.isBlank()).toList());
        definition.put("note", note == null ? "" : note);
        definition.put("attributes", attributes == null ? Map.of() : attributes);
        return jsonOrNull(definition);
    }

    private String jsonOrNull(Object value) {
        if (value == null) {
            return null;
        }
        try {
            return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(value);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Could not serialize customization payload", exception);
        }
    }

    private String auditJson(Map<String, Object> payload) {
        return jsonOrNull(payload);
    }

    private CustomizationDtos.OverlayResponse toOverlayResponse(OverlayEntity overlay) {
        Map<String, Object> definition = readJsonMap(overlay.definitionJson);
        List<?> entityIds = (List<?>) definition.getOrDefault("targetEntityIds", List.of());
        List<?> scopeIds = (List<?>) definition.getOrDefault("targetScopeIds", List.of());
        Object note = definition.get("note");
        return new CustomizationDtos.OverlayResponse(
            overlay.id,
            overlay.workspaceId,
            overlay.snapshotId,
            overlay.name,
            overlay.kind,
            entityIds.size(),
            scopeIds.size(),
            note instanceof String string ? string : null,
            overlay.definitionJson,
            overlay.createdAt,
            overlay.updatedAt
        );
    }

    private CustomizationDtos.SavedViewResponse toSavedViewResponse(SavedViewEntity savedView) {
        return new CustomizationDtos.SavedViewResponse(
            savedView.id,
            savedView.workspaceId,
            savedView.snapshotId,
            savedView.name,
            savedView.viewType,
            savedView.queryJson,
            savedView.layoutJson,
            savedView.createdAt,
            savedView.updatedAt
        );
    }

    private Map<String, Object> readJsonMap(String json) {
        if (json == null || json.isBlank()) {
            return Map.of();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (JsonProcessingException exception) {
            return Map.of();
        }
    }
}
