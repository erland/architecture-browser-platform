package info.isaksson.erland.architecturebrowser.platform.api.dto;

import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotDtos.KindCount;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotDtos.SnapshotSummaryResponse;

import java.util.List;

public final class LayoutDtos {
    private LayoutDtos() {
    }

    public record LayoutTreeResponse(
        SnapshotSummaryResponse snapshot,
        List<LayoutNodeResponse> roots,
        LayoutSummaryResponse summary
    ) {
    }

    public record LayoutSummaryResponse(
        int scopeCount,
        int entityCount,
        int relationshipCount,
        int maxDepth,
        List<KindCount> scopeKinds,
        List<KindCount> entityKinds
    ) {
    }

    public record LayoutNodeResponse(
        String externalId,
        String parentScopeId,
        String kind,
        String name,
        String displayName,
        String path,
        int depth,
        int directChildScopeCount,
        int directEntityCount,
        int descendantScopeCount,
        int descendantEntityCount,
        List<KindCount> directEntityKinds,
        List<LayoutNodeResponse> children
    ) {
    }

    public record LayoutScopeDetailResponse(
        SnapshotSummaryResponse snapshot,
        ScopeDetailResponse scope,
        List<BreadcrumbItem> breadcrumb,
        List<LayoutNodeResponse> childScopes,
        List<LayoutEntityResponse> entities,
        List<KindCount> entityKinds
    ) {
    }

    public record ScopeDetailResponse(
        String externalId,
        String parentScopeId,
        String kind,
        String name,
        String displayName,
        String path,
        int depth,
        int directChildScopeCount,
        int directEntityCount,
        int descendantScopeCount,
        int descendantEntityCount,
        List<KindCount> directEntityKinds
    ) {
    }

    public record BreadcrumbItem(
        String externalId,
        String kind,
        String name,
        String displayName,
        String path
    ) {
    }

    public record LayoutEntityResponse(
        String externalId,
        String kind,
        String name,
        String displayName,
        String origin,
        String scopeId,
        int sourceRefCount,
        String summary
    ) {
    }
}
