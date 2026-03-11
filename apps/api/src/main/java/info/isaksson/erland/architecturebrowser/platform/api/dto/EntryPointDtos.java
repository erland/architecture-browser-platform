package info.isaksson.erland.architecturebrowser.platform.api.dto;

import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotDtos.KindCount;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotDtos.SnapshotSummaryResponse;

import java.util.List;

public final class EntryPointDtos {
    private EntryPointDtos() {
    }

    public enum EntryCategory {
        ALL,
        ENTRY_POINT,
        DATA,
        INTEGRATION
    }

    public record EntryPointViewResponse(
        SnapshotSummaryResponse snapshot,
        ScopeReference scope,
        EntryCategory category,
        EntryPointSummary summary,
        List<KindCount> visibleKinds,
        List<EntryPointItemResponse> items,
        EntryPointFocusResponse focus
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

    public record EntryPointSummary(
        int totalRelevantItemCount,
        int visibleItemCount,
        int entryPointCount,
        int dataCount,
        int integrationCount,
        int relationshipCount
    ) {
    }

    public record EntryPointItemResponse(
        String externalId,
        String kind,
        String name,
        String displayName,
        String origin,
        String scopeId,
        String scopePath,
        boolean inScope,
        int sourceRefCount,
        String sourcePath,
        String sourceSnippet,
        String summary,
        int inboundRelationshipCount,
        int outboundRelationshipCount,
        List<KindCount> relatedKinds
    ) {
    }

    public record EntryPointRelationshipResponse(
        String externalId,
        String kind,
        String label,
        String summary,
        String direction,
        String otherEntityId,
        String otherDisplayName,
        String otherKind,
        String otherScopePath
    ) {
    }

    public record EntryPointFocusResponse(
        EntryPointItemResponse item,
        List<EntryPointRelationshipResponse> inboundRelationships,
        List<EntryPointRelationshipResponse> outboundRelationships
    ) {
    }
}
