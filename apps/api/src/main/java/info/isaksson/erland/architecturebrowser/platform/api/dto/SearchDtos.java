package info.isaksson.erland.architecturebrowser.platform.api.dto;

import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotDtos.KindCount;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotDtos.SnapshotSummaryResponse;

import java.util.List;

public final class SearchDtos {
    private SearchDtos() {
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

    public record SearchSummary(
        int searchableEntityCount,
        int visibleResultCount,
        int totalMatchCount,
        int limit,
        boolean queryBlank
    ) {
    }

    public record EntitySearchResponse(
        SnapshotSummaryResponse snapshot,
        String query,
        ScopeReference scope,
        SearchSummary summary,
        List<KindCount> visibleKinds,
        List<EntitySearchResultResponse> results
    ) {
    }

    public record EntitySearchResultResponse(
        String externalId,
        String kind,
        String name,
        String displayName,
        String origin,
        String scopeId,
        String scopePath,
        String sourcePath,
        String sourceSnippet,
        int sourceRefCount,
        String summary,
        int inboundRelationshipCount,
        int outboundRelationshipCount,
        List<String> matchReasons
    ) {
    }

    public record EntityDetailResponse(
        SnapshotSummaryResponse snapshot,
        EntityDetailEntityResponse entity,
        ScopeReference scope,
        List<KindCount> relatedKinds,
        List<SourceRefResponse> sourceRefs,
        List<EntityRelationshipResponse> inboundRelationships,
        List<EntityRelationshipResponse> outboundRelationships,
        String metadataJson
    ) {
    }

    public record EntityDetailEntityResponse(
        String externalId,
        String kind,
        String name,
        String displayName,
        String origin,
        String scopeId,
        String scopePath,
        int sourceRefCount,
        String summary,
        int inboundRelationshipCount,
        int outboundRelationshipCount
    ) {
    }

    public record SourceRefResponse(
        String path,
        Integer startLine,
        Integer endLine,
        String snippet,
        String metadataJson
    ) {
    }

    public record EntityRelationshipResponse(
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
}
