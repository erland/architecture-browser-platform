package info.isaksson.erland.architecturebrowser.platform.service.snapshots;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SearchDtos;

import java.util.List;

final class SnapshotSearchResponseMapper {
    private final ObjectMapper objectMapper;
    private final SnapshotSearchQuerySupport querySupport;

    SnapshotSearchResponseMapper(ObjectMapper objectMapper, SnapshotSearchQuerySupport querySupport) {
        this.objectMapper = objectMapper;
        this.querySupport = querySupport;
    }

    SearchDtos.EntitySearchResultResponse toSearchResult(SnapshotSearchMatcher.SearchMatch match, SnapshotSearchIndex index) {
        SnapshotSearchIndex.EntityNode entity = match.entity();
        List<SnapshotSearchIndex.RelationshipNode> inbound = index.relationshipsByTarget().getOrDefault(entity.externalId(), List.of());
        List<SnapshotSearchIndex.RelationshipNode> outbound = index.relationshipsBySource().getOrDefault(entity.externalId(), List.of());
        SnapshotSearchIndex.SourceRef firstSourceRef = entity.sourceRefs().isEmpty() ? null : entity.sourceRefs().get(0);
        return new SearchDtos.EntitySearchResultResponse(
            entity.externalId(),
            entity.kind(),
            entity.name(),
            entity.displayName(),
            entity.origin(),
            entity.scopeId(),
            querySupport.resolveScopePath(entity.scopeId(), index),
            firstSourceRef != null ? firstSourceRef.path() : null,
            firstSourceRef != null ? firstSourceRef.snippet() : null,
            entity.sourceRefs().size(),
            entity.summary(),
            inbound.size(),
            outbound.size(),
            match.reasons()
        );
    }

    SearchDtos.SourceRefResponse toSourceRefResponse(SnapshotSearchIndex.SourceRef sourceRef) {
        return new SearchDtos.SourceRefResponse(
            sourceRef.path(),
            sourceRef.startLine(),
            sourceRef.endLine(),
            sourceRef.snippet(),
            jsonText(sourceRef.metadata())
        );
    }

    SearchDtos.EntityRelationshipResponse toRelationshipResponse(SnapshotSearchIndex.RelationshipNode relationship, SnapshotSearchIndex index, boolean outbound) {
        String otherEntityId = outbound ? relationship.toEntityId() : relationship.fromEntityId();
        SnapshotSearchIndex.EntityNode other = index.entityById().get(otherEntityId);
        return new SearchDtos.EntityRelationshipResponse(
            relationship.externalId(),
            relationship.kind(),
            relationship.label(),
            relationship.summary(),
            outbound ? "OUTBOUND" : "INBOUND",
            otherEntityId,
            querySupport.simpleDisplayLabel(other),
            other != null ? other.kind() : "UNKNOWN",
            other != null ? querySupport.resolveScopePath(other.scopeId(), index) : "—"
        );
    }

    String jsonText(JsonNode node) {
        if (node == null || node.isMissingNode() || node.isNull() || (node.isObject() && node.isEmpty()) || (node.isArray() && node.isEmpty())) {
            return null;
        }
        try {
            return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(node);
        } catch (Exception ignored) {
            return node.toString();
        }
    }
}
