package info.isaksson.erland.architecturebrowser.platform.service.snapshots;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SearchDtos;
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
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@ApplicationScoped
public class SnapshotSearchService {
    @Inject
    SnapshotCatalogService snapshotCatalogService;

    @Inject
    ObjectMapper objectMapper;

    public SearchDtos.EntitySearchResponse search(String workspaceId, String snapshotId, String query, String scopeId, int limit) {
        SnapshotSummaryResponse snapshot = snapshotCatalogService.getSummary(workspaceId, snapshotId);
        SearchIndex index = buildIndex(ImportedFactEntity.list("snapshotId", snapshotId));
        ScopeNode selectedScope = selectScope(scopeId, index);
        SearchDtos.ScopeReference scopeReference = selectedScope != null
            ? new SearchDtos.ScopeReference(selectedScope.externalId, selectedScope.kind, selectedScope.name, selectedScope.displayName, buildScopePath(selectedScope, index), false)
            : new SearchDtos.ScopeReference(null, "SNAPSHOT", "All scopes", "All scopes", "All scopes", true);
        Set<String> scopedScopeIds = selectedScope != null ? collectScopeIds(selectedScope.externalId, index) : new LinkedHashSet<>(index.scopeById.keySet());
        List<EntityNode> searchable = index.entityById.values().stream()
            .filter(entity -> entity.scopeId != null && scopedScopeIds.contains(entity.scopeId))
            .toList();

        String normalized = normalizeQuery(query);
        List<SearchMatch> matches = normalized.isBlank()
            ? List.of()
            : searchable.stream()
                .map(entity -> match(entity, normalized, index))
                .filter(Objects::nonNull)
                .sorted(Comparator.comparingInt(SearchMatch::score).reversed()
                    .thenComparing(match -> displayLabel(match.entity(), index))
                    .thenComparing(match -> match.entity().externalId))
                .toList();

        int safeLimit = Math.max(1, Math.min(limit, 100));
        List<SearchDtos.EntitySearchResultResponse> results = matches.stream()
            .limit(safeLimit)
            .map(match -> toSearchResult(match, index))
            .toList();

        return new SearchDtos.EntitySearchResponse(
            snapshot,
            query == null ? "" : query,
            scopeReference,
            new SearchDtos.SearchSummary(searchable.size(), results.size(), matches.size(), safeLimit, normalized.isBlank()),
            summarizeKinds(results.stream().map(SearchDtos.EntitySearchResultResponse::kind).toList()),
            results
        );
    }

    public SearchDtos.EntityDetailResponse getEntityDetail(String workspaceId, String snapshotId, String entityId) {
        SnapshotSummaryResponse snapshot = snapshotCatalogService.getSummary(workspaceId, snapshotId);
        SearchIndex index = buildIndex(ImportedFactEntity.list("snapshotId", snapshotId));
        EntityNode entity = index.entityById.get(entityId);
        if (entity == null) {
            throw new NotFoundException("Entity not found in snapshot: " + entityId);
        }
        List<RelationshipNode> inbound = index.relationshipsByTarget.getOrDefault(entityId, List.of()).stream()
            .sorted(Comparator.comparing((RelationshipNode relationship) -> relationship.kind).thenComparing(relationship -> displayLabel(index.entityById.get(relationship.fromEntityId), index)))
            .toList();
        List<RelationshipNode> outbound = index.relationshipsBySource.getOrDefault(entityId, List.of()).stream()
            .sorted(Comparator.comparing((RelationshipNode relationship) -> relationship.kind).thenComparing(relationship -> displayLabel(index.entityById.get(relationship.toEntityId), index)))
            .toList();
        ScopeNode scope = entity.scopeId != null ? index.scopeById.get(entity.scopeId) : null;
        SearchDtos.ScopeReference scopeReference = new SearchDtos.ScopeReference(
            scope != null ? scope.externalId : null,
            scope != null ? scope.kind : "UNKNOWN",
            scope != null ? scope.name : "Unknown scope",
            scope != null ? scope.displayName : "Unknown scope",
            scope != null ? buildScopePath(scope, index) : "—",
            false
        );
        Set<String> relatedKinds = new LinkedHashSet<>();
        inbound.forEach(relationship -> {
            EntityNode other = index.entityById.get(relationship.fromEntityId);
            if (other != null) relatedKinds.add(other.kind);
        });
        outbound.forEach(relationship -> {
            EntityNode other = index.entityById.get(relationship.toEntityId);
            if (other != null) relatedKinds.add(other.kind);
        });
        return new SearchDtos.EntityDetailResponse(
            snapshot,
            new SearchDtos.EntityDetailEntityResponse(
                entity.externalId,
                entity.kind,
                entity.name,
                entity.displayName,
                entity.origin,
                entity.scopeId,
                resolveScopePath(entity.scopeId, index),
                entity.sourceRefs.size(),
                entity.summary,
                inbound.size(),
                outbound.size()
            ),
            scopeReference,
            summarizeKinds(new ArrayList<>(relatedKinds)),
            entity.sourceRefs.stream().map(this::toSourceRefResponse).toList(),
            inbound.stream().map(relationship -> toRelationshipResponse(relationship, index, false)).toList(),
            outbound.stream().map(relationship -> toRelationshipResponse(relationship, index, true)).toList(),
            jsonText(entity.metadata)
        );
    }

    private SearchMatch match(EntityNode entity, String normalizedQuery, SearchIndex index) {
        int score = 0;
        LinkedHashSet<String> reasons = new LinkedHashSet<>();
        String label = displayLabel(entity, index).toLowerCase(Locale.ROOT);
        String kind = safeLower(entity.kind);
        String summary = safeLower(entity.summary);
        String scopePath = safeLower(resolveScopePath(entity.scopeId, index));
        if (label.equals(normalizedQuery)) {
            score += 120;
            reasons.add("exact name");
        } else if (label.startsWith(normalizedQuery)) {
            score += 90;
            reasons.add("name prefix");
        } else if (label.contains(normalizedQuery)) {
            score += 60;
            reasons.add("name match");
        }
        if (kind.equals(normalizedQuery)) {
            score += 50;
            reasons.add("kind");
        } else if (kind.contains(normalizedQuery)) {
            score += 25;
            reasons.add("kind match");
        }
        if (scopePath.contains(normalizedQuery)) {
            score += 12;
            reasons.add("scope path");
        }
        if (!summary.isBlank() && summary.contains(normalizedQuery)) {
            score += 10;
            reasons.add("summary");
        }
        for (SourceRef sourceRef : entity.sourceRefs) {
            if (safeLower(sourceRef.path).contains(normalizedQuery)) {
                score += 15;
                reasons.add("source path");
                break;
            }
            if (safeLower(sourceRef.snippet).contains(normalizedQuery)) {
                score += 8;
                reasons.add("source snippet");
                break;
            }
        }
        if (score <= 0) {
            return null;
        }
        return new SearchMatch(entity, score, new ArrayList<>(reasons));
    }

    private SearchDtos.EntitySearchResultResponse toSearchResult(SearchMatch match, SearchIndex index) {
        EntityNode entity = match.entity();
        List<RelationshipNode> inbound = index.relationshipsByTarget.getOrDefault(entity.externalId, List.of());
        List<RelationshipNode> outbound = index.relationshipsBySource.getOrDefault(entity.externalId, List.of());
        SourceRef firstSourceRef = entity.sourceRefs.isEmpty() ? null : entity.sourceRefs.get(0);
        return new SearchDtos.EntitySearchResultResponse(
            entity.externalId,
            entity.kind,
            entity.name,
            entity.displayName,
            entity.origin,
            entity.scopeId,
            resolveScopePath(entity.scopeId, index),
            firstSourceRef != null ? firstSourceRef.path : null,
            firstSourceRef != null ? firstSourceRef.snippet : null,
            entity.sourceRefs.size(),
            entity.summary,
            inbound.size(),
            outbound.size(),
            match.reasons()
        );
    }

    private SearchDtos.SourceRefResponse toSourceRefResponse(SourceRef sourceRef) {
        return new SearchDtos.SourceRefResponse(sourceRef.path, sourceRef.startLine, sourceRef.endLine, sourceRef.snippet, jsonText(sourceRef.metadata));
    }

    private SearchDtos.EntityRelationshipResponse toRelationshipResponse(RelationshipNode relationship, SearchIndex index, boolean outbound) {
        String otherEntityId = outbound ? relationship.toEntityId : relationship.fromEntityId;
        EntityNode other = index.entityById.get(otherEntityId);
        return new SearchDtos.EntityRelationshipResponse(
            relationship.externalId,
            relationship.kind,
            relationship.label,
            relationship.summary,
            outbound ? "OUTBOUND" : "INBOUND",
            otherEntityId,
            simpleDisplayLabel(other),
            other != null ? other.kind : "UNKNOWN",
            other != null ? resolveScopePath(other.scopeId, index) : "—"
        );
    }

    private ScopeNode selectScope(String scopeId, SearchIndex index) {
        if (scopeId == null || scopeId.isBlank()) return null;
        ScopeNode scope = index.scopeById.get(scopeId);
        if (scope == null) throw new NotFoundException("Scope not found for search: " + scopeId);
        return scope;
    }

    private Set<String> collectScopeIds(String rootScopeId, SearchIndex index) {
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

    private SearchIndex buildIndex(List<ImportedFactEntity> facts) {
        Map<String, ScopeNode> scopeById = new LinkedHashMap<>();
        Map<String, List<ScopeNode>> childScopes = new LinkedHashMap<>();
        Map<String, EntityNode> entityById = new LinkedHashMap<>();
        List<RelationshipNode> relationships = new ArrayList<>();
        for (ImportedFactEntity fact : facts) {
            switch (fact.factType) {
                case SCOPE -> scopeById.put(fact.externalId, new ScopeNode(fact.externalId, blankToNull(fact.scopeExternalId), fact.factKind, fact.name, blankToNull(fact.displayName)));
                case ENTITY -> {
                    JsonNode payload = readPayload(fact.payloadJson);
                    List<SourceRef> sourceRefs = new ArrayList<>();
                    if (payload.path("sourceRefs").isArray()) {
                        for (JsonNode sourceRef : payload.path("sourceRefs")) {
                            sourceRefs.add(new SourceRef(
                                textOrNull(sourceRef, "path"),
                                sourceRef.hasNonNull("startLine") ? sourceRef.get("startLine").asInt() : null,
                                sourceRef.hasNonNull("endLine") ? sourceRef.get("endLine").asInt() : null,
                                textOrNull(sourceRef, "snippet"),
                                sourceRef.path("metadata")
                            ));
                        }
                    }
                    entityById.put(fact.externalId, new EntityNode(
                        fact.externalId,
                        blankToNull(fact.scopeExternalId),
                        fact.factKind,
                        fact.name,
                        blankToNull(fact.displayName),
                        textOrNull(payload, "origin"),
                        blankToNull(fact.summary),
                        payload.path("metadata"),
                        sourceRefs
                    ));
                }
                case RELATIONSHIP -> relationships.add(new RelationshipNode(fact.externalId, fact.factKind, blankToNull(fact.fromExternalId), blankToNull(fact.toExternalId), firstNonBlank(fact.displayName, fact.name, fact.externalId), blankToNull(fact.summary)));
                default -> {
                }
            }
        }
        scopeById.values().forEach(scope -> {
            if (scope.parentScopeId != null) childScopes.computeIfAbsent(scope.parentScopeId, ignored -> new ArrayList<>()).add(scope);
        });
        List<RelationshipNode> resolvedRelationships = relationships.stream()
            .filter(relationship -> relationship.fromEntityId != null && relationship.toEntityId != null)
            .filter(relationship -> entityById.containsKey(relationship.fromEntityId) && entityById.containsKey(relationship.toEntityId))
            .toList();
        Map<String, List<RelationshipNode>> relationshipsBySource = new LinkedHashMap<>();
        Map<String, List<RelationshipNode>> relationshipsByTarget = new LinkedHashMap<>();
        for (RelationshipNode relationship : resolvedRelationships) {
            relationshipsBySource.computeIfAbsent(relationship.fromEntityId, ignored -> new ArrayList<>()).add(relationship);
            relationshipsByTarget.computeIfAbsent(relationship.toEntityId, ignored -> new ArrayList<>()).add(relationship);
        }
        return new SearchIndex(scopeById, childScopes, entityById, resolvedRelationships, relationshipsBySource, relationshipsByTarget);
    }

    private List<KindCount> summarizeKinds(List<String> values) {
        return values.stream()
            .filter(Objects::nonNull)
            .collect(Collectors.groupingBy(value -> value, LinkedHashMap::new, Collectors.counting()))
            .entrySet().stream()
            .sorted(Map.Entry.<String, Long>comparingByValue().reversed().thenComparing(Map.Entry.comparingByKey()))
            .map(entry -> new KindCount(entry.getKey(), entry.getValue()))
            .toList();
    }

    private JsonNode readPayload(String payloadJson) {
        if (payloadJson == null || payloadJson.isBlank()) return objectMapper.createObjectNode();
        try {
            return objectMapper.readTree(payloadJson);
        } catch (Exception ignored) {
            return objectMapper.createObjectNode();
        }
    }

    private String jsonText(JsonNode node) {
        if (node == null || node.isMissingNode() || node.isNull() || (node.isObject() && node.isEmpty()) || (node.isArray() && node.isEmpty())) {
            return null;
        }
        try {
            return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(node);
        } catch (Exception ignored) {
            return node.toString();
        }
    }

    private String resolveScopePath(String scopeId, SearchIndex index) {
        if (scopeId == null) return "—";
        ScopeNode scope = index.scopeById.get(scopeId);
        return scope != null ? buildScopePath(scope, index) : scopeId;
    }

    private String buildScopePath(ScopeNode scope, SearchIndex index) {
        List<String> parts = new ArrayList<>();
        ScopeNode current = scope;
        while (current != null) {
            parts.add(firstNonBlank(current.displayName, current.name, current.externalId));
            current = current.parentScopeId != null ? index.scopeById.get(current.parentScopeId) : null;
        }
        java.util.Collections.reverse(parts);
        return String.join(" / ", parts);
    }

    private String displayLabel(EntityNode entity, SearchIndex index) {
        if (entity == null) return "Unknown entity";
        return simpleDisplayLabel(entity) + " · " + resolveScopePath(entity.scopeId, index);
    }

    private String simpleDisplayLabel(EntityNode entity) {
        if (entity == null) return "Unknown entity";
        return firstNonBlank(entity.displayName, entity.name, entity.externalId);
    }

    private String normalizeQuery(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private String safeLower(String value) {
        return value == null ? "" : value.toLowerCase(Locale.ROOT);
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
            if (value != null && !value.isBlank()) return value;
        }
        return "";
    }

    record SearchIndex(
        Map<String, ScopeNode> scopeById,
        Map<String, List<ScopeNode>> childScopes,
        Map<String, EntityNode> entityById,
        List<RelationshipNode> relationships,
        Map<String, List<RelationshipNode>> relationshipsBySource,
        Map<String, List<RelationshipNode>> relationshipsByTarget
    ) {}

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

    record SearchMatch(EntityNode entity, int score, List<String> reasons) {}
}
