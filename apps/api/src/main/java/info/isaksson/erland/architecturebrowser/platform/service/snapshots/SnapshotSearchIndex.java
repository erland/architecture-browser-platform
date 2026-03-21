package info.isaksson.erland.architecturebrowser.platform.service.snapshots;

import com.fasterxml.jackson.databind.JsonNode;

import java.util.List;
import java.util.Map;

record SnapshotSearchIndex(
    Map<String, ScopeNode> scopeById,
    Map<String, List<ScopeNode>> childScopes,
    Map<String, EntityNode> entityById,
    List<RelationshipNode> relationships,
    Map<String, List<RelationshipNode>> relationshipsBySource,
    Map<String, List<RelationshipNode>> relationshipsByTarget
) {
    record ScopeNode(String externalId, String parentScopeId, String kind, String name, String displayName) {}

    record EntityNode(String externalId,
                      String scopeId,
                      String kind,
                      String name,
                      String displayName,
                      String origin,
                      String summary,
                      JsonNode metadata,
                      List<SourceRef> sourceRefs) {}

    record SourceRef(String path, Integer startLine, Integer endLine, String snippet, JsonNode metadata) {}

    record RelationshipNode(String externalId, String kind, String fromEntityId, String toEntityId, String label, String summary) {}
}
