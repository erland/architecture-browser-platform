package info.isaksson.erland.architecturebrowser.platform.api.dto;

import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotDtos.KindCount;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotDtos.SnapshotSummaryResponse;

import java.util.List;

public final class DependencyDtos {
    private DependencyDtos() {
    }

    public enum DependencyDirection {
        ALL,
        INBOUND,
        OUTBOUND
    }

    public record DependencyViewResponse(
        SnapshotSummaryResponse snapshot,
        ScopeReference scope,
        DependencyDirection direction,
        List<KindCount> relationshipKinds,
        DependencySummary summary,
        List<DependencyEntityResponse> entities,
        List<DependencyRelationshipResponse> relationships,
        DependencyFocusResponse focus
    ) {
    }

    public record ScopeReference(
        String externalId,
        String kind,
        String name,
        String displayName,
        String path,
        boolean repositoryWide
    ) {
    }

    public record DependencySummary(
        int scopeEntityCount,
        int visibleEntityCount,
        int visibleRelationshipCount,
        int internalRelationshipCount,
        int inboundRelationshipCount,
        int outboundRelationshipCount
    ) {
    }

    public record DependencyEntityResponse(
        String externalId,
        String kind,
        String name,
        String displayName,
        String origin,
        String scopeId,
        String scopePath,
        boolean inScope,
        int sourceRefCount,
        String summary,
        int inboundCount,
        int outboundCount
    ) {
    }

    public record DependencyRelationshipResponse(
        String externalId,
        String kind,
        String label,
        String summary,
        String fromEntityId,
        String fromDisplayName,
        String fromKind,
        String fromScopePath,
        boolean fromInScope,
        String toEntityId,
        String toDisplayName,
        String toKind,
        String toScopePath,
        boolean toInScope,
        String directionCategory,
        boolean crossesScopeBoundary
    ) {
    }

    public record DependencyFocusResponse(
        DependencyEntityResponse entity,
        int inboundRelationshipCount,
        int outboundRelationshipCount,
        List<DependencyRelationshipResponse> inboundRelationships,
        List<DependencyRelationshipResponse> outboundRelationships
    ) {
    }
}
