package info.isaksson.erland.architecturebrowser.platform.service.snapshots;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import info.isaksson.erland.architecturebrowser.platform.domain.FactType;
import info.isaksson.erland.architecturebrowser.platform.domain.ImportedFactEntity;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class SnapshotDependencyIndexBuilder {
    private final ObjectMapper objectMapper;

    public SnapshotDependencyIndexBuilder(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public SnapshotDependencyIndex buildIndex(List<ImportedFactEntity> facts) {
        Map<String, SnapshotDependencyIndex.ScopeNode> scopeById = new LinkedHashMap<>();
        Map<String, List<SnapshotDependencyIndex.ScopeNode>> childScopes = new LinkedHashMap<>();
        Map<String, SnapshotDependencyIndex.EntityNode> entityById = new LinkedHashMap<>();
        List<SnapshotDependencyIndex.RelationshipNode> relationships = new ArrayList<>();
        for (ImportedFactEntity fact : facts) {
            switch (fact.factType) {
                case SCOPE -> scopeById.put(fact.externalId, new SnapshotDependencyIndex.ScopeNode(
                    fact.externalId,
                    blankToNull(fact.scopeExternalId),
                    fact.factKind,
                    fact.name,
                    blankToNull(fact.displayName)
                ));
                case ENTITY -> {
                    JsonNode payload = readPayload(fact.payloadJson);
                    entityById.put(fact.externalId, new SnapshotDependencyIndex.EntityNode(
                        fact.externalId,
                        blankToNull(fact.scopeExternalId),
                        fact.factKind,
                        fact.name,
                        blankToNull(fact.displayName),
                        textOrNull(payload, "origin"),
                        payload.path("sourceRefs").isArray() ? payload.path("sourceRefs").size() : 0,
                        blankToNull(fact.summary)
                    ));
                }
                case RELATIONSHIP -> relationships.add(new SnapshotDependencyIndex.RelationshipNode(
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
        List<SnapshotDependencyIndex.RelationshipNode> resolvedRelationships = relationships.stream()
            .filter(relationship -> relationship.fromEntityId() != null && relationship.toEntityId() != null)
            .filter(relationship -> entityById.containsKey(relationship.fromEntityId()) && entityById.containsKey(relationship.toEntityId()))
            .toList();
        return new SnapshotDependencyIndex(scopeById, childScopes, entityById, resolvedRelationships);
    }

    private JsonNode readPayload(String payloadJson) {
        if (payloadJson == null || payloadJson.isBlank()) {
            return objectMapper.createObjectNode();
        }
        try {
            return objectMapper.readTree(payloadJson);
        } catch (Exception ex) {
            return objectMapper.createObjectNode();
        }
    }

    private String textOrNull(JsonNode node, String fieldName) {
        JsonNode value = node.path(fieldName);
        if (value.isMissingNode() || value.isNull()) {
            return null;
        }
        String text = value.asText(null);
        return text == null || text.isBlank() ? null : text;
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return "—";
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }
}
