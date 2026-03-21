package info.isaksson.erland.architecturebrowser.platform.service.snapshots;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import info.isaksson.erland.architecturebrowser.platform.domain.ImportedFactEntity;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

final class SnapshotSearchIndexBuilder {
    private final ObjectMapper objectMapper;

    SnapshotSearchIndexBuilder(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    SnapshotSearchIndex buildIndex(List<ImportedFactEntity> facts) {
        Map<String, SnapshotSearchIndex.ScopeNode> scopeById = new LinkedHashMap<>();
        Map<String, List<SnapshotSearchIndex.ScopeNode>> childScopes = new LinkedHashMap<>();
        Map<String, SnapshotSearchIndex.EntityNode> entityById = new LinkedHashMap<>();
        List<SnapshotSearchIndex.RelationshipNode> relationships = new ArrayList<>();
        for (ImportedFactEntity fact : facts) {
            switch (fact.factType) {
                case SCOPE -> scopeById.put(fact.externalId, new SnapshotSearchIndex.ScopeNode(
                    fact.externalId,
                    blankToNull(fact.scopeExternalId),
                    fact.factKind,
                    fact.name,
                    blankToNull(fact.displayName)
                ));
                case ENTITY -> entityById.put(fact.externalId, buildEntityNode(fact));
                case RELATIONSHIP -> relationships.add(new SnapshotSearchIndex.RelationshipNode(
                    fact.externalId,
                    fact.factKind,
                    blankToNull(fact.fromExternalId),
                    blankToNull(fact.toExternalId),
                    firstNonBlank(fact.displayName, fact.name, fact.externalId),
                    blankToNull(fact.summary)
                ));
                default -> {
                }
            }
        }
        scopeById.values().forEach(scope -> {
            if (scope.parentScopeId() != null) {
                childScopes.computeIfAbsent(scope.parentScopeId(), ignored -> new ArrayList<>()).add(scope);
            }
        });
        List<SnapshotSearchIndex.RelationshipNode> resolvedRelationships = relationships.stream()
            .filter(relationship -> relationship.fromEntityId() != null && relationship.toEntityId() != null)
            .filter(relationship -> entityById.containsKey(relationship.fromEntityId()) && entityById.containsKey(relationship.toEntityId()))
            .toList();
        Map<String, List<SnapshotSearchIndex.RelationshipNode>> relationshipsBySource = new LinkedHashMap<>();
        Map<String, List<SnapshotSearchIndex.RelationshipNode>> relationshipsByTarget = new LinkedHashMap<>();
        for (SnapshotSearchIndex.RelationshipNode relationship : resolvedRelationships) {
            relationshipsBySource.computeIfAbsent(relationship.fromEntityId(), ignored -> new ArrayList<>()).add(relationship);
            relationshipsByTarget.computeIfAbsent(relationship.toEntityId(), ignored -> new ArrayList<>()).add(relationship);
        }
        return new SnapshotSearchIndex(scopeById, childScopes, entityById, resolvedRelationships, relationshipsBySource, relationshipsByTarget);
    }

    private SnapshotSearchIndex.EntityNode buildEntityNode(ImportedFactEntity fact) {
        JsonNode payload = readPayload(fact.payloadJson);
        List<SnapshotSearchIndex.SourceRef> sourceRefs = new ArrayList<>();
        if (payload.path("sourceRefs").isArray()) {
            for (JsonNode sourceRef : payload.path("sourceRefs")) {
                sourceRefs.add(new SnapshotSearchIndex.SourceRef(
                    textOrNull(sourceRef, "path"),
                    sourceRef.hasNonNull("startLine") ? sourceRef.get("startLine").asInt() : null,
                    sourceRef.hasNonNull("endLine") ? sourceRef.get("endLine").asInt() : null,
                    textOrNull(sourceRef, "snippet"),
                    sourceRef.path("metadata")
                ));
            }
        }
        return new SnapshotSearchIndex.EntityNode(
            fact.externalId,
            blankToNull(fact.scopeExternalId),
            fact.factKind,
            fact.name,
            blankToNull(fact.displayName),
            textOrNull(payload, "origin"),
            blankToNull(fact.summary),
            payload.path("metadata"),
            sourceRefs
        );
    }

    private JsonNode readPayload(String payloadJson) {
        if (payloadJson == null || payloadJson.isBlank()) {
            return objectMapper.createObjectNode();
        }
        try {
            return objectMapper.readTree(payloadJson);
        } catch (Exception ignored) {
            return objectMapper.createObjectNode();
        }
    }

    private String textOrNull(JsonNode node, String field) {
        JsonNode value = node.path(field);
        return value.isMissingNode() || value.isNull() || value.asText().isBlank() ? null : value.asText();
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return "";
    }
}
