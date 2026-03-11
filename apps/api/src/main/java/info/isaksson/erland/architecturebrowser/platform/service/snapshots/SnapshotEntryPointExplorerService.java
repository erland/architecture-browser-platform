package info.isaksson.erland.architecturebrowser.platform.service.snapshots;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import info.isaksson.erland.architecturebrowser.platform.api.dto.EntryPointDtos.EntryCategory;
import info.isaksson.erland.architecturebrowser.platform.api.dto.EntryPointDtos.EntryPointFocusResponse;
import info.isaksson.erland.architecturebrowser.platform.api.dto.EntryPointDtos.EntryPointItemResponse;
import info.isaksson.erland.architecturebrowser.platform.api.dto.EntryPointDtos.EntryPointRelationshipResponse;
import info.isaksson.erland.architecturebrowser.platform.api.dto.EntryPointDtos.EntryPointSummary;
import info.isaksson.erland.architecturebrowser.platform.api.dto.EntryPointDtos.EntryPointViewResponse;
import info.isaksson.erland.architecturebrowser.platform.api.dto.EntryPointDtos.ScopeReference;
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
public class SnapshotEntryPointExplorerService {
    @Inject
    SnapshotCatalogService snapshotCatalogService;

    @Inject
    ObjectMapper objectMapper;

    public EntryPointViewResponse getView(String workspaceId,
                                          String snapshotId,
                                          String scopeId,
                                          EntryCategory category,
                                          String focusEntityId) {
        SnapshotSummaryResponse snapshot = snapshotCatalogService.getSummary(workspaceId, snapshotId);
        List<ImportedFactEntity> facts = ImportedFactEntity.list("snapshotId", snapshotId);
        EntryIndex index = buildIndex(facts);

        ScopeNode selectedScope = selectScope(scopeId, index);
        ScopeReference scopeReference = selectedScope != null
            ? new ScopeReference(selectedScope.externalId, selectedScope.kind, selectedScope.name, selectedScope.displayName, buildScopePath(selectedScope, index), false)
            : new ScopeReference(null, "SNAPSHOT", "All scopes", "All scopes", "All scopes", true);

        Set<String> scopedScopeIds = selectedScope != null ? collectScopeIds(selectedScope.externalId, index) : new LinkedHashSet<>(index.scopeById.keySet());
        Set<String> scopedEntityIds = index.entityById.values().stream()
            .filter(entity -> entity.scopeId != null && scopedScopeIds.contains(entity.scopeId))
            .map(entity -> entity.externalId)
            .collect(Collectors.toCollection(LinkedHashSet::new));

        List<EntityNode> relevantItems = index.entityById.values().stream()
            .filter(this::isRelevantKind)
            .filter(entity -> category == EntryCategory.ALL || categoryForKind(entity.kind) == category)
            .filter(entity -> selectedScope == null || scopedEntityIds.contains(entity.externalId))
            .sorted(Comparator.comparing((EntityNode entity) -> normalizeName(entity.displayName, entity.name, entity.externalId)))
            .toList();

        Map<String, List<RelationshipNode>> inboundByItem = new LinkedHashMap<>();
        Map<String, List<RelationshipNode>> outboundByItem = new LinkedHashMap<>();
        for (RelationshipNode relationship : index.relationships) {
            if (index.entityById.containsKey(relationship.toEntityId)) {
                inboundByItem.computeIfAbsent(relationship.toEntityId, ignored -> new ArrayList<>()).add(relationship);
            }
            if (index.entityById.containsKey(relationship.fromEntityId)) {
                outboundByItem.computeIfAbsent(relationship.fromEntityId, ignored -> new ArrayList<>()).add(relationship);
            }
        }

        List<EntryPointItemResponse> items = relevantItems.stream()
            .map(item -> toItemResponse(item, index, scopedEntityIds.contains(item.externalId), inboundByItem.getOrDefault(item.externalId, List.of()), outboundByItem.getOrDefault(item.externalId, List.of())))
            .toList();

        EntryPointFocusResponse focus = resolveFocus(focusEntityId, index, scopedEntityIds, inboundByItem, outboundByItem);

        return new EntryPointViewResponse(
            snapshot,
            scopeReference,
            category,
            new EntryPointSummary(
                (int) index.entityById.values().stream().filter(this::isRelevantKind).count(),
                items.size(),
                countByCategory(items, EntryCategory.ENTRY_POINT),
                countByCategory(items, EntryCategory.DATA),
                countByCategory(items, EntryCategory.INTEGRATION),
                items.stream().mapToInt(item -> item.inboundRelationshipCount() + item.outboundRelationshipCount()).sum()
            ),
            summarizeKinds(items.stream().map(EntryPointItemResponse::kind).toList()),
            items,
            focus
        );
    }

    private EntryPointFocusResponse resolveFocus(String focusEntityId,
                                                 EntryIndex index,
                                                 Set<String> scopedEntityIds,
                                                 Map<String, List<RelationshipNode>> inboundByItem,
                                                 Map<String, List<RelationshipNode>> outboundByItem) {
        if (focusEntityId == null || focusEntityId.isBlank()) {
            return null;
        }
        EntityNode entity = index.entityById.get(focusEntityId);
        if (entity == null || !isRelevantKind(entity)) {
            throw new NotFoundException("Entity not found for entry/data/integration focus: " + focusEntityId);
        }
        List<RelationshipNode> inbound = inboundByItem.getOrDefault(focusEntityId, List.of());
        List<RelationshipNode> outbound = outboundByItem.getOrDefault(focusEntityId, List.of());
        return new EntryPointFocusResponse(
            toItemResponse(entity, index, scopedEntityIds.contains(entity.externalId), inbound, outbound),
            inbound.stream().sorted(Comparator.comparing((RelationshipNode relationship) -> relationship.kind).thenComparing(relationship -> resolveEntityLabel(relationship.fromEntityId, index))).map(relationship -> toFocusRelationshipResponse(relationship, index, false)).toList(),
            outbound.stream().sorted(Comparator.comparing((RelationshipNode relationship) -> relationship.kind).thenComparing(relationship -> resolveEntityLabel(relationship.toEntityId, index))).map(relationship -> toFocusRelationshipResponse(relationship, index, true)).toList()
        );
    }

    private EntryPointItemResponse toItemResponse(EntityNode item,
                                                  EntryIndex index,
                                                  boolean inScope,
                                                  List<RelationshipNode> inbound,
                                                  List<RelationshipNode> outbound) {
        ScopeNode scope = item.scopeId != null ? index.scopeById.get(item.scopeId) : null;
        Set<String> relatedKinds = new LinkedHashSet<>();
        inbound.forEach(relationship -> {
            EntityNode source = index.entityById.get(relationship.fromEntityId);
            if (source != null) relatedKinds.add(source.kind);
        });
        outbound.forEach(relationship -> {
            EntityNode target = index.entityById.get(relationship.toEntityId);
            if (target != null) relatedKinds.add(target.kind);
        });
        return new EntryPointItemResponse(
            item.externalId,
            item.kind,
            item.name,
            item.displayName,
            item.origin,
            item.scopeId,
            scope != null ? buildScopePath(scope, index) : "—",
            inScope,
            item.sourceRefCount,
            item.sourcePath,
            item.sourceSnippet,
            item.summary,
            inbound.size(),
            outbound.size(),
            summarizeKinds(new ArrayList<>(relatedKinds))
        );
    }

    private EntryPointRelationshipResponse toFocusRelationshipResponse(RelationshipNode relationship, EntryIndex index, boolean outbound) {
        String otherEntityId = outbound ? relationship.toEntityId : relationship.fromEntityId;
        EntityNode other = index.entityById.get(otherEntityId);
        return new EntryPointRelationshipResponse(
            relationship.externalId,
            relationship.kind,
            relationship.label,
            relationship.summary,
            outbound ? "OUTBOUND" : "INBOUND",
            otherEntityId,
            other != null ? normalizeName(other.displayName, other.name, other.externalId) : otherEntityId,
            other != null ? other.kind : "UNKNOWN",
            other != null ? resolveScopePath(other.scopeId, index) : "—"
        );
    }

    private int countByCategory(List<EntryPointItemResponse> items, EntryCategory category) {
        return (int) items.stream().filter(item -> categoryForKind(item.kind()) == category).count();
    }

    private boolean isRelevantKind(EntityNode entity) {
        return isRelevantKind(entity.kind);
    }

    private boolean isRelevantKind(String kind) {
        return switch (kind) {
            case "ENDPOINT", "STARTUP_POINT", "DATASTORE", "PERSISTENCE_ADAPTER", "EXTERNAL_SYSTEM", "SERVICE", "CONFIG_ARTIFACT" -> true;
            default -> false;
        };
    }

    private EntryCategory categoryForKind(String kind) {
        return switch (kind) {
            case "ENDPOINT", "STARTUP_POINT" -> EntryCategory.ENTRY_POINT;
            case "DATASTORE", "PERSISTENCE_ADAPTER", "CONFIG_ARTIFACT" -> EntryCategory.DATA;
            default -> EntryCategory.INTEGRATION;
        };
    }

    private ScopeNode selectScope(String scopeId, EntryIndex index) {
        if (scopeId == null || scopeId.isBlank()) return null;
        ScopeNode scope = index.scopeById.get(scopeId);
        if (scope == null) throw new NotFoundException("Scope not found for entry/data/integration view: " + scopeId);
        return scope;
    }

    private Set<String> collectScopeIds(String rootScopeId, EntryIndex index) {
        Set<String> result = new LinkedHashSet<>();
        Deque<String> queue = new ArrayDeque<>();
        queue.add(rootScopeId);
        while (!queue.isEmpty()) {
            String current = queue.removeFirst();
            if (!result.add(current)) continue;
            index.childScopes.getOrDefault(current, List.of()).forEach(child -> queue.addLast(child.externalId));
        }
        return result;
    }

    private String resolveEntityLabel(String entityId, EntryIndex index) {
        EntityNode entity = index.entityById.get(entityId);
        return entity != null ? normalizeName(entity.displayName, entity.name, entity.externalId) : entityId;
    }

    private String resolveScopePath(String scopeId, EntryIndex index) {
        if (scopeId == null) return "—";
        ScopeNode scope = index.scopeById.get(scopeId);
        return scope != null ? buildScopePath(scope, index) : scopeId;
    }

    private String buildScopePath(ScopeNode scope, EntryIndex index) {
        List<String> parts = new ArrayList<>();
        ScopeNode current = scope;
        while (current != null) {
            parts.add(normalizeName(current.displayName, current.name, current.externalId));
            current = current.parentScopeId != null ? index.scopeById.get(current.parentScopeId) : null;
        }
        java.util.Collections.reverse(parts);
        return String.join(" / ", parts);
    }

    private EntryIndex buildIndex(List<ImportedFactEntity> facts) {
        Map<String, ScopeNode> scopeById = new LinkedHashMap<>();
        Map<String, List<ScopeNode>> childScopes = new LinkedHashMap<>();
        Map<String, EntityNode> entityById = new LinkedHashMap<>();
        List<RelationshipNode> relationships = new ArrayList<>();
        for (ImportedFactEntity fact : facts) {
            switch (fact.factType) {
                case SCOPE -> scopeById.put(fact.externalId, new ScopeNode(fact.externalId, blankToNull(fact.scopeExternalId), fact.factKind, fact.name, blankToNull(fact.displayName)));
                case ENTITY -> {
                    JsonNode payload = readPayload(fact.payloadJson);
                    JsonNode firstSourceRef = payload.path("sourceRefs").isArray() && payload.path("sourceRefs").size() > 0 ? payload.path("sourceRefs").get(0) : objectMapper.createObjectNode();
                    entityById.put(fact.externalId, new EntityNode(fact.externalId, blankToNull(fact.scopeExternalId), fact.factKind, fact.name, blankToNull(fact.displayName), textOrNull(payload, "origin"), payload.path("sourceRefs").isArray() ? payload.path("sourceRefs").size() : 0, textOrNull(firstSourceRef, "path"), textOrNull(firstSourceRef, "snippet"), blankToNull(fact.summary)));
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
        return new EntryIndex(scopeById, childScopes, entityById, resolvedRelationships);
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

    private record EntryIndex(Map<String, ScopeNode> scopeById, Map<String, List<ScopeNode>> childScopes, Map<String, EntityNode> entityById, List<RelationshipNode> relationships) {}
    private record ScopeNode(String externalId, String parentScopeId, String kind, String name, String displayName) {}
    private record EntityNode(String externalId, String scopeId, String kind, String name, String displayName, String origin, int sourceRefCount, String sourcePath, String sourceSnippet, String summary) {}
    private record RelationshipNode(String externalId, String kind, String fromEntityId, String toEntityId, String label, String summary) {}
}
