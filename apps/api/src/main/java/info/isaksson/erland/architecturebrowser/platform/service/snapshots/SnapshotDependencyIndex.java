package info.isaksson.erland.architecturebrowser.platform.service.snapshots;

import java.util.List;
import java.util.Map;

public record SnapshotDependencyIndex(
    Map<String, ScopeNode> scopeById,
    Map<String, List<ScopeNode>> childScopes,
    Map<String, EntityNode> entityById,
    List<RelationshipNode> relationships
) {
    public record ScopeNode(String externalId, String parentScopeId, String kind, String name, String displayName) {}
    public record EntityNode(String externalId, String scopeId, String kind, String name, String displayName, String origin, int sourceRefCount, String summary) {}
    public record RelationshipNode(String externalId, String kind, String fromEntityId, String toEntityId, String label, String summary) {}
}
