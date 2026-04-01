package info.isaksson.erland.architecturebrowser.platform.api.dto;

import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotResponseDtos.SnapshotSummaryResponse;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotSharedDtos.CompletenessInfo;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotSharedDtos.MetadataEnvelope;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotSharedDtos.RunInfo;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotSharedDtos.SourceInfo;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotSharedDtos.SourceRef;

import java.util.List;

public final class SnapshotPayloadDtos {
    private SnapshotPayloadDtos() {
    }

    public record FullSnapshotPayloadResponse(
        SnapshotSummaryResponse snapshot,
        SourceInfo source,
        RunInfo run,
        CompletenessInfo completeness,
        List<FullScope> scopes,
        List<FullEntity> entities,
        List<FullRelationship> relationships,
        List<FullViewpoint> viewpoints,
        List<FullDiagnostic> diagnostics,
        MetadataEnvelope metadata,
        List<String> warnings
    ) {
    }

    public record FullScope(
        String externalId,
        String kind,
        String name,
        String displayName,
        String parentScopeId,
        List<SourceRef> sourceRefs,
        java.util.Map<String, Object> metadata
    ) {
    }

    public record FullEntity(
        String externalId,
        String kind,
        String origin,
        String name,
        String displayName,
        String scopeId,
        List<SourceRef> sourceRefs,
        java.util.Map<String, Object> metadata
    ) {
    }

    public record FullRelationship(
        String externalId,
        String kind,
        String fromEntityId,
        String toEntityId,
        String label,
        List<SourceRef> sourceRefs,
        java.util.Map<String, Object> metadata
    ) {
    }

    public record FullViewpoint(
        String id,
        String title,
        String description,
        String availability,
        double confidence,
        List<String> seedEntityIds,
        List<String> seedRoleIds,
        List<String> expandViaSemantics,
        List<String> preferredDependencyViews,
        List<String> evidenceSources
    ) {
    }

    public record FullDiagnostic(
        String externalId,
        String severity,
        String phase,
        String code,
        String message,
        boolean fatal,
        String filePath,
        String scopeId,
        String entityId,
        List<SourceRef> sourceRefs,
        java.util.Map<String, Object> metadata
    ) {
    }
}
