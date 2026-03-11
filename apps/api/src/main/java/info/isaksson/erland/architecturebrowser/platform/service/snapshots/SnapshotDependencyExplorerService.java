package info.isaksson.erland.architecturebrowser.platform.service.snapshots;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import info.isaksson.erland.architecturebrowser.platform.api.dto.DependencyDtos.DependencyDirection;
import info.isaksson.erland.architecturebrowser.platform.api.dto.DependencyDtos.DependencyEntityResponse;
import info.isaksson.erland.architecturebrowser.platform.api.dto.DependencyDtos.DependencyFocusResponse;
import info.isaksson.erland.architecturebrowser.platform.api.dto.DependencyDtos.DependencyRelationshipResponse;
import info.isaksson.erland.architecturebrowser.platform.api.dto.DependencyDtos.DependencySummary;
import info.isaksson.erland.architecturebrowser.platform.api.dto.DependencyDtos.DependencyViewResponse;
import info.isaksson.erland.architecturebrowser.platform.api.dto.DependencyDtos.ScopeReference;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotDtos.KindCount;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotDtos.SnapshotSummaryResponse;
import info.isaksson.erland.architecturebrowser.platform.domain.FactType;
import info.isaksson.erland.architecturebrowser.platform.domain.ImportedFactEntity;
import info.isaksson.erland.architecturebrowser.platform.service.management.NotFoundException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Deque;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@ApplicationScoped
public class SnapshotDependencyExplorerService {
    @Inject
    SnapshotCatalogService snapshotCatalogService;

    @Inject
    ObjectMapper objectMapper;

    public DependencyViewResponse getView(String workspaceId,
                                          String snapshotId,
                                          String scopeId,
                                          DependencyDirection direction,
                                          String focusEntityId) {
        SnapshotSummaryResponse snapshot = snapshotCatalogService.getSummary(workspaceId, snapshotId);
        List<ImportedFactEntity> facts = ImportedFactEntity.list("snapshotId", snapshotId);
        DependencyIndex index = buildIndex(facts);

        ScopeNode selectedScope = selectScope(scopeId, index);
        ScopeReference scopeReference = selectedScope != null
            ? new ScopeReference(selectedScope.externalId, selectedScope.kind, selectedScope.name, selectedScope.displayName, buildScopePath(selectedScope, index), false)
            : new ScopeReference(null, "SNAPSHOT", "All scopes", "All scopes", "All scopes", true);

        Set<String> scopedScopeIds = selectedScope != null ? collectScopeIds(selectedScope.externalId, index) : new LinkedHashSet<>(index.scopeById.keySet());
        Set<String> scopedEntityIds = index.entityById.values().stream()
            .filter(entity -> entity.scopeId != null && scopedScopeIds.contains(entity.scopeId))
            .map(entity -> entity.externalId)
            .collect(Collectors.toCollection(LinkedHashSet::new));

        List<RelationshipNode> candidateRelationships = index.relationships.stream()
            .filter(relationship -> includeRelationship(relationship, scopedEntityIds, direction))
            .sorted(Comparator
                .comparing((RelationshipNode relationship) -> relationship.kind)
                .thenComparing(relationship -> resolveEntityLabel(relationship.fromEntityId, index))
                .thenComparing(relationship -> resolveEntityLabel(relationship.toEntityId, index)))
            .toList();

        List<RelationshipNode> visibleRelationships = focusEntityId != null && !focusEntityId.isBlank()
            ? candidateRelationships.stream()
                .filter(relationship -> focusEntityId.equals(relationship.fromEntityId) || focusEntityId.equals(relationship.toEntityId))
                .toList()
            : candidateRelationships;

        Set<String> visibleEntityIds = new LinkedHashSet<>(scopedEntityIds);
        visibleRelationships.forEach(relationship -> {
            visibleEntityIds.add(relationship.fromEntityId);
            visibleEntityIds.add(relationship.toEntityId);
        });

        Map<String, Integer> inboundCounts = new LinkedHashMap<>();
        Map<String, Integer> outboundCounts = new LinkedHashMap<>();
        for (RelationshipNode relationship : visibleRelationships) {
            outboundCounts.merge(relationship.fromEntityId, 1, Integer::sum);
            inboundCounts.merge(relationship.toEntityId, 1, Integer::sum);
        }

        List<DependencyEntityResponse> entities = visibleEntityIds.stream()
            .map(index.entityById::get)
            .filter(Objects::nonNull)
            .sorted(Comparator.comparing((EntityNode entity) -> !scopedEntityIds.contains(entity.externalId))
                .thenComparing(entity -> resolveEntityLabel(entity.externalId, index)))
            .map(entity -> toEntityResponse(entity, index, scopedEntityIds.contains(entity.externalId), inboundCounts.getOrDefault(entity.externalId, 0), outboundCounts.getOrDefault(entity.externalId, 0)))
            .toList();

        List<DependencyRelationshipResponse> relationships = visibleRelationships.stream()
            .map(relationship -> toRelationshipResponse(relationship, index, scopedEntityIds))
            .toList();

        DependencyFocusResponse focus = resolveFocus(focusEntityId, index, scopedEntityIds, visibleRelationships, inboundCounts, outboundCounts);

        return new DependencyViewResponse(
            snapshot,
            scopeReference,
            direction,
            summarizeKinds(visibleRelationships.stream().map(relationship -> relationship.kind).toList()),
            buildSummary(scopedEntityIds, visibleRelationships),
            entities,
            relationships,
            focus
        );
    }

    private DependencyFocusResponse resolveFocus(String focusEntityId,
                                                 DependencyIndex index,
                                                 Set<String> scopedEntityIds,
                                                 List<RelationshipNode> visibleRelationships,
                                                 Map<String, Integer> inboundCounts,
                                                 Map<String, Integer> outboundCounts) {
        if (focusEntityId == null || focusEntityId.isBlank()) {
            return null;
        }
        EntityNode entity = index.entityById.get(focusEntityId);
        if (entity == null) {
            throw new NotFoundException("Entity not found for dependency focus: " + focusEntityId);
        }
        List<DependencyRelationshipResponse> inbound = visibleRelationships.stream()
            .filter(relationship -> focusEntityId.equals(relationship.toEntityId))
            .map(relationship -> toRelationshipResponse(relationship, index, scopedEntityIds))
            .toList();
        List<DependencyRelationshipResponse> outbound = visibleRelationships.stream()
            .filter(relationship -> focusEntityId.equals(relationship.fromEntityId))
            .map(relationship -> toRelationshipResponse(relationship, index, scopedEntityIds))
            .toList();
        return new DependencyFocusResponse(
            toEntityResponse(entity, index, scopedEntityIds.contains(entity.externalId), inboundCounts.getOrDefault(entity.externalId, 0), outboundCounts.getOrDefault(entity.externalId, 0)),
            inbound.size(),
            outbound.size(),
            inbound,
            outbound
        );
    }

    private DependencySummary buildSummary(Set<String> scopedEntityIds, List<RelationshipNode> relationships) {
        int internal = 0;
        int inbound = 0;
        int outbound = 0;
        for (RelationshipNode relationship : relationships) {
            boolean fromInScope = scopedEntityIds.contains(relationship.fromEntityId);
            boolean toInScope = scopedEntityIds.contains(relationship.toEntityId);
            if (fromInScope && toInScope) {
                internal++;
            } else if (!fromInScope && toInScope) {
                inbound++;
            } else if (fromInScope) {
                outbound++;
            }
        }
        Set<String> visibleEntities = new LinkedHashSet<>(scopedEntityIds);
        relationships.forEach(relationship -> {
            visibleEntities.add(relationship.fromEntityId);
            visibleEntities.add(relationship.toEntityId);
        });
        return new DependencySummary(scopedEntityIds.size(), visibleEntities.size(), relationships.size(), internal, inbound, outbound);
    }

    private boolean includeRelationship(RelationshipNode relationship, Set<String> scopedEntityIds, DependencyDirection direction) {
        boolean fromInScope = scopedEntityIds.contains(relationship.fromEntityId);
        boolean toInScope = scopedEntityIds.contains(relationship.toEntityId);
        return switch (direction) {
            case ALL -> fromInScope || toInScope;
            case INBOUND -> !fromInScope && toInScope;
            case OUTBOUND -> fromInScope && !toInScope;
        };
    }

    private ScopeNode selectScope(String scopeId, DependencyIndex index) {
        if (scopeId == null || scopeId.isBlank()) {
            return null;
        }
        ScopeNode scope = index.scopeById.get(scopeId);
        if (scope == null) {
            throw new NotFoundException("Scope not found for dependency view: " + scopeId);
        }
        return scope;
    }

    private Set<String> collectScopeIds(String rootScopeId, DependencyIndex index) {
        Set<String> result = new LinkedHashSet<>();
        Deque<String> queue = new ArrayDeque<>();
        queue.add(rootScopeId);
        while (!queue.isEmpty()) {
            String current = queue.removeFirst();
            if (!result.add(current)) {
                continue;
            }
            index.childScopes.getOrDefault(current, List.of()).forEach(child -> queue.addLast(child.externalId));
        }
        return result;
    }

    private DependencyEntityResponse toEntityResponse(EntityNode entity, DependencyIndex index, boolean inScope, int inboundCount, int outboundCount) {
        ScopeNode scope = entity.scopeId != null ? index.scopeById.get(entity.scopeId) : null;
        return new DependencyEntityResponse(
            entity.externalId,
            entity.kind,
            entity.name,
            entity.displayName,
            entity.origin,
            entity.scopeId,
            scope != null ? buildScopePath(scope, index) : "—",
            inScope,
            entity.sourceRefCount,
            entity.summary,
            inboundCount,
            outboundCount
        );
    }

    private DependencyRelationshipResponse toRelationshipResponse(RelationshipNode relationship, DependencyIndex index, Set<String> scopedEntityIds) {
        EntityNode from = index.entityById.get(relationship.fromEntityId);
        EntityNode to = index.entityById.get(relationship.toEntityId);
        boolean fromInScope = scopedEntityIds.contains(relationship.fromEntityId);
        boolean toInScope = scopedEntityIds.contains(relationship.toEntityId);
        return new DependencyRelationshipResponse(
            relationship.externalId,
            relationship.kind,
            relationship.label,
            relationship.summary,
            relationship.fromEntityId,
            from != null ? normalizeName(from.displayName, from.name, from.externalId) : relationship.fromEntityId,
            from != null ? from.kind : "UNKNOWN",
            from != null ? resolveScopePath(from.scopeId, index) : "—",
            fromInScope,
            relationship.toEntityId,
            to != null ? normalizeName(to.displayName, to.name, to.externalId) : relationship.toEntityId,
            to != null ? to.kind : "UNKNOWN",
            to != null ? resolveScopePath(to.scopeId, index) : "—",
            toInScope,
            describeDirection(fromInScope, toInScope),
            fromInScope != toInScope
        );
    }

    private String describeDirection(boolean fromInScope, boolean toInScope) {
        if (fromInScope && toInScope) return "INTERNAL";
        if (!fromInScope && toInScope) return "INBOUND";
        if (fromInScope) return "OUTBOUND";
        return "EXTERNAL";
    }

    private String resolveEntityLabel(String entityId, DependencyIndex index) {
        EntityNode entity = index.entityById.get(entityId);
        return entity != null ? normalizeName(entity.displayName, entity.name, entity.externalId) : entityId;
    }

    private String resolveScopePath(String scopeId, DependencyIndex index) {
        if (scopeId == null) return "—";
        ScopeNode scope = index.scopeById.get(scopeId);
        return scope != null ? buildScopePath(scope, index) : scopeId;
    }

    private String buildScopePath(ScopeNode scope, DependencyIndex index) {
        List<String> parts = new ArrayList<>();
        ScopeNode current = scope;
        while (current != null) {
            parts.add(normalizeName(current.displayName, current.name, current.externalId));
            current = current.parentScopeId != null ? index.scopeById.get(current.parentScopeId) : null;
        }
        java.util.Collections.reverse(parts);
        return String.join(" / ", parts);
    }

    private DependencyIndex buildIndex(List<ImportedFactEntity> facts) {
        Map<String, ScopeNode> scopeById = new LinkedHashMap<>();
        Map<String, List<ScopeNode>> childScopes = new LinkedHashMap<>();
        Map<String, EntityNode> entityById = new LinkedHashMap<>();
        List<RelationshipNode> relationships = new ArrayList<>();
        for (ImportedFactEntity fact : facts) {
            switch (fact.factType) {
                case SCOPE -> scopeById.put(fact.externalId, new ScopeNode(fact.externalId, blankToNull(fact.scopeExternalId), fact.factKind, fact.name, blankToNull(fact.displayName)));
                case ENTITY -> {
                    JsonNode payload = readPayload(fact.payloadJson);
                    entityById.put(fact.externalId, new EntityNode(fact.externalId, blankToNull(fact.scopeExternalId), fact.factKind, fact.name, blankToNull(fact.displayName), textOrNull(payload, "origin"), payload.path("sourceRefs").isArray() ? payload.path("sourceRefs").size() : 0, blankToNull(fact.summary)));
                }
                case RELATIONSHIP -> relationships.add(new RelationshipNode(fact.externalId, fact.factKind, blankToNull(fact.fromExternalId), blankToNull(fact.toExternalId), firstNonBlank(fact.displayName, fact.name, fact.externalId), blankToNull(fact.summary)));
                default -> { }
            }
        }
        scopeById.values().forEach(scope -> {
            if (scope.parentScopeId != null) childScopes.computeIfAbsent(scope.parentScopeId, ignored -> new ArrayList<>()).add(scope);
        });
        List<RelationshipNode> resolvedRelationships = relationships.stream()
            .filter(relationship -> relationship.fromEntityId != null && relationship.toEntityId != null)
            .filter(relationship -> entityById.containsKey(relationship.fromEntityId) && entityById.containsKey(relationship.toEntityId))
            .toList();
        return new DependencyIndex(scopeById, childScopes, entityById, resolvedRelationships);
    }

    private List<KindCount> summarizeKinds(List<String> values) {
        Map<String, Long> counts = values.stream().filter(Objects::nonNull).collect(Collectors.groupingBy(value -> value, LinkedHashMap::new, Collectors.counting()));
        return counts.entrySet().stream().sorted(Map.Entry.<String, Long>comparingByValue().reversed().thenComparing(Map.Entry.comparingByKey())).map(entry -> new KindCount(entry.getKey(), entry.getValue())).toList();
    }

    private JsonNode readPayload(String payloadJson) {
        if (payloadJson == null || payloadJson.isBlank()) return objectMapper.createObjectNode();
        try { return objectMapper.readTree(payloadJson); } catch (Exception ex) { return objectMapper.createObjectNode(); }
    }
    private String textOrNull(JsonNode node, String fieldName) { JsonNode value = node.path(fieldName); if (value.isMissingNode() || value.isNull()) return null; String text = value.asText(null); return text == null || text.isBlank() ? null : text; }
    private String normalizeName(String displayName, String name, String fallback) { return firstNonBlank(displayName, name, fallback); }
    private String firstNonBlank(String... values) { for (String value : values) if (value != null && !value.isBlank()) return value; return "—"; }
    private String blankToNull(String value) { return value == null || value.isBlank() ? null : value; }

    private record DependencyIndex(Map<String, ScopeNode> scopeById, Map<String, List<ScopeNode>> childScopes, Map<String, EntityNode> entityById, List<RelationshipNode> relationships) {}
    private record ScopeNode(String externalId, String parentScopeId, String kind, String name, String displayName) {}
    private record EntityNode(String externalId, String scopeId, String kind, String name, String displayName, String origin, int sourceRefCount, String summary) {}
    private record RelationshipNode(String externalId, String kind, String fromEntityId, String toEntityId, String label, String summary) {}
}
