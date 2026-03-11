package info.isaksson.erland.architecturebrowser.platform.service.snapshots;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import info.isaksson.erland.architecturebrowser.platform.api.dto.LayoutDtos.BreadcrumbItem;
import info.isaksson.erland.architecturebrowser.platform.api.dto.LayoutDtos.LayoutEntityResponse;
import info.isaksson.erland.architecturebrowser.platform.api.dto.LayoutDtos.LayoutNodeResponse;
import info.isaksson.erland.architecturebrowser.platform.api.dto.LayoutDtos.LayoutScopeDetailResponse;
import info.isaksson.erland.architecturebrowser.platform.api.dto.LayoutDtos.LayoutSummaryResponse;
import info.isaksson.erland.architecturebrowser.platform.api.dto.LayoutDtos.LayoutTreeResponse;
import info.isaksson.erland.architecturebrowser.platform.api.dto.LayoutDtos.ScopeDetailResponse;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotDtos.KindCount;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotDtos.SnapshotSummaryResponse;
import info.isaksson.erland.architecturebrowser.platform.domain.FactType;
import info.isaksson.erland.architecturebrowser.platform.domain.ImportedFactEntity;
import info.isaksson.erland.architecturebrowser.platform.domain.SnapshotEntity;
import info.isaksson.erland.architecturebrowser.platform.service.JsonSupport;
import info.isaksson.erland.architecturebrowser.platform.service.management.NotFoundException;
import info.isaksson.erland.architecturebrowser.platform.service.management.WorkspaceManagementService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@ApplicationScoped
public class SnapshotLayoutExplorerService {
    @Inject
    WorkspaceManagementService workspaceManagementService;

    @Inject
    SnapshotCatalogService snapshotCatalogService;

    @Inject
    JsonSupport jsonSupport;

    @Inject
    ObjectMapper objectMapper;

    public LayoutTreeResponse getTree(String workspaceId, String snapshotId) {
        SnapshotEntity snapshot = requireSnapshot(workspaceId, snapshotId);
        LayoutIndex index = buildIndex(snapshotId);
        List<ScopeNode> roots = index.scopeMap.values().stream()
            .filter(scope -> scope.parentScopeId == null || !index.scopeMap.containsKey(scope.parentScopeId))
            .sorted(Comparator.comparing(scope -> normalizeName(scope.displayName, scope.name, scope.externalId)))
            .toList();
        List<LayoutNodeResponse> rootNodes = roots.stream()
            .map(scope -> toNode(scope, index, 0, null))
            .toList();
        int maxDepth = index.scopeMap.values().stream().mapToInt(scope -> computeDepth(scope, index)).max().orElse(0);
        return new LayoutTreeResponse(
            snapshotCatalogService.getSummary(workspaceId, snapshotId),
            rootNodes,
            new LayoutSummaryResponse(
                index.scopeMap.size(),
                index.entitiesByScope.values().stream().mapToInt(List::size).sum(),
                index.relationshipCount,
                maxDepth,
                summarizeKinds(index.scopeMap.values().stream().map(scope -> scope.kind).toList()),
                summarizeKinds(index.entitiesByScope.values().stream().flatMap(List::stream).map(entity -> entity.kind).toList())
            )
        );
    }

    public LayoutScopeDetailResponse getScopeDetail(String workspaceId, String snapshotId, String scopeId) {
        SnapshotEntity snapshot = requireSnapshot(workspaceId, snapshotId);
        LayoutIndex index = buildIndex(snapshotId);
        ScopeNode scope = index.scopeMap.get(scopeId);
        if (scope == null) {
            throw new NotFoundException("Scope not found in snapshot: " + scopeId);
        }
        int depth = computeDepth(scope, index);
        List<LayoutNodeResponse> childScopes = index.childrenByScope.getOrDefault(scope.externalId, List.of()).stream()
            .sorted(Comparator.comparing(child -> normalizeName(child.displayName, child.name, child.externalId)))
            .map(child -> toNode(child, index, depth + 1, buildPath(scope, index)))
            .toList();
        List<EntityNode> entities = index.entitiesByScope.getOrDefault(scope.externalId, List.of()).stream()
            .sorted(Comparator.comparing(entity -> normalizeName(entity.displayName, entity.name, entity.externalId)))
            .toList();
        return new LayoutScopeDetailResponse(
            snapshotCatalogService.getSummary(workspaceId, snapshotId),
            new ScopeDetailResponse(
                scope.externalId,
                scope.parentScopeId,
                scope.kind,
                scope.name,
                scope.displayName,
                buildPath(scope, index),
                depth,
                index.childrenByScope.getOrDefault(scope.externalId, List.of()).size(),
                entities.size(),
                countDescendantScopes(scope.externalId, index),
                countDescendantEntities(scope.externalId, index),
                summarizeKinds(entities.stream().map(entity -> entity.kind).toList())
            ),
            buildBreadcrumb(scope, index),
            childScopes,
            entities.stream().map(this::toEntityResponse).toList(),
            summarizeKinds(entities.stream().map(entity -> entity.kind).toList())
        );
    }

    private SnapshotEntity requireSnapshot(String workspaceId, String snapshotId) {
        workspaceManagementService.requireWorkspace(workspaceId);
        SnapshotEntity snapshot = SnapshotEntity.findById(snapshotId);
        if (snapshot == null || !workspaceId.equals(snapshot.workspaceId)) {
            throw new NotFoundException("Snapshot not found: " + snapshotId);
        }
        return snapshot;
    }

    private LayoutIndex buildIndex(String snapshotId) {
        @SuppressWarnings("unchecked")
        List<ImportedFactEntity> facts = ImportedFactEntity.list("snapshotId", snapshotId);
        Map<String, ScopeNode> scopeMap = new LinkedHashMap<>();
        Map<String, List<ScopeNode>> childrenByScope = new LinkedHashMap<>();
        Map<String, List<EntityNode>> entitiesByScope = new LinkedHashMap<>();
        int relationshipCount = 0;
        for (ImportedFactEntity fact : facts) {
            if (fact.factType == FactType.SCOPE) {
                ScopeNode scope = new ScopeNode(
                    fact.externalId,
                    blankToNull(fact.scopeExternalId),
                    fact.factKind,
                    fact.name,
                    blankToNull(fact.displayName)
                );
                scopeMap.put(scope.externalId, scope);
            } else if (fact.factType == FactType.ENTITY) {
                JsonNode payload = readPayload(fact.payloadJson);
                EntityNode entity = new EntityNode(
                    fact.externalId,
                    blankToNull(fact.scopeExternalId),
                    fact.factKind,
                    fact.name,
                    blankToNull(fact.displayName),
                    textOrNull(payload, "origin"),
                    payload.path("sourceRefs").isArray() ? payload.path("sourceRefs").size() : 0,
                    blankToNull(fact.summary)
                );
                entitiesByScope.computeIfAbsent(entity.scopeId, ignored -> new ArrayList<>()).add(entity);
            } else if (fact.factType == FactType.RELATIONSHIP) {
                relationshipCount++;
            }
        }
        for (ScopeNode scope : scopeMap.values()) {
            if (scope.parentScopeId != null) {
                childrenByScope.computeIfAbsent(scope.parentScopeId, ignored -> new ArrayList<>()).add(scope);
            }
        }
        return new LayoutIndex(scopeMap, childrenByScope, entitiesByScope, relationshipCount);
    }

    private LayoutNodeResponse toNode(ScopeNode scope, LayoutIndex index, int depth, String inheritedPath) {
        String path = inheritedPath != null ? inheritedPath + " / " + normalizeName(scope.displayName, scope.name, scope.externalId) : buildPath(scope, index);
        List<ScopeNode> children = index.childrenByScope.getOrDefault(scope.externalId, List.of()).stream()
            .sorted(Comparator.comparing(child -> normalizeName(child.displayName, child.name, child.externalId)))
            .toList();
        List<EntityNode> directEntities = index.entitiesByScope.getOrDefault(scope.externalId, List.of());
        return new LayoutNodeResponse(
            scope.externalId,
            scope.parentScopeId,
            scope.kind,
            scope.name,
            scope.displayName,
            path,
            depth,
            children.size(),
            directEntities.size(),
            countDescendantScopes(scope.externalId, index),
            countDescendantEntities(scope.externalId, index),
            summarizeKinds(directEntities.stream().map(entity -> entity.kind).toList()),
            children.stream().map(child -> toNode(child, index, depth + 1, path)).toList()
        );
    }

    private List<BreadcrumbItem> buildBreadcrumb(ScopeNode scope, LayoutIndex index) {
        List<ScopeNode> scopes = new ArrayList<>();
        ScopeNode current = scope;
        while (current != null) {
            scopes.add(current);
            current = current.parentScopeId != null ? index.scopeMap.get(current.parentScopeId) : null;
        }
        java.util.Collections.reverse(scopes);
        return scopes.stream()
            .map(item -> new BreadcrumbItem(item.externalId, item.kind, item.name, item.displayName, buildPath(item, index)))
            .toList();
    }

    private LayoutEntityResponse toEntityResponse(EntityNode entity) {
        return new LayoutEntityResponse(
            entity.externalId,
            entity.kind,
            entity.name,
            entity.displayName,
            entity.origin,
            entity.scopeId,
            entity.sourceRefCount,
            entity.summary
        );
    }

    private String buildPath(ScopeNode scope, LayoutIndex index) {
        List<String> parts = new ArrayList<>();
        ScopeNode current = scope;
        while (current != null) {
            parts.add(normalizeName(current.displayName, current.name, current.externalId));
            current = current.parentScopeId != null ? index.scopeMap.get(current.parentScopeId) : null;
        }
        java.util.Collections.reverse(parts);
        return String.join(" / ", parts);
    }

    private int computeDepth(ScopeNode scope, LayoutIndex index) {
        int depth = 0;
        ScopeNode current = scope;
        while (current.parentScopeId != null && index.scopeMap.containsKey(current.parentScopeId)) {
            depth++;
            current = index.scopeMap.get(current.parentScopeId);
        }
        return depth;
    }

    private int countDescendantScopes(String scopeId, LayoutIndex index) {
        List<ScopeNode> children = index.childrenByScope.getOrDefault(scopeId, List.of());
        int count = children.size();
        for (ScopeNode child : children) {
            count += countDescendantScopes(child.externalId, index);
        }
        return count;
    }

    private int countDescendantEntities(String scopeId, LayoutIndex index) {
        int count = index.entitiesByScope.getOrDefault(scopeId, List.of()).size();
        for (ScopeNode child : index.childrenByScope.getOrDefault(scopeId, List.of())) {
            count += countDescendantEntities(child.externalId, index);
        }
        return count;
    }

    private List<KindCount> summarizeKinds(List<String> values) {
        Map<String, Long> counts = values.stream()
            .filter(Objects::nonNull)
            .collect(Collectors.groupingBy(value -> value, LinkedHashMap::new, Collectors.counting()));
        return counts.entrySet().stream()
            .sorted(Map.Entry.<String, Long>comparingByValue().reversed().thenComparing(Map.Entry.comparingByKey()))
            .map(entry -> new KindCount(entry.getKey(), entry.getValue()))
            .toList();
    }

    private JsonNode readPayload(String payloadJson) {
        if (payloadJson == null || payloadJson.isBlank()) {
            return objectMapper.createObjectNode();
        }
        try {
            return jsonSupport.readTree(payloadJson);
        } catch (RuntimeException ex) {
            return objectMapper.createObjectNode();
        }
    }

    private String textOrNull(JsonNode node, String name) {
        JsonNode value = node.get(name);
        if (value == null || value.isNull()) {
            return null;
        }
        String text = value.asText();
        return text == null || text.isBlank() ? null : text;
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }

    private String normalizeName(String displayName, String name, String externalId) {
        return Optional.ofNullable(blankToNull(displayName))
            .or(() -> Optional.ofNullable(blankToNull(name)))
            .orElse(externalId);
    }

    private record LayoutIndex(
        Map<String, ScopeNode> scopeMap,
        Map<String, List<ScopeNode>> childrenByScope,
        Map<String, List<EntityNode>> entitiesByScope,
        int relationshipCount
    ) {
    }

    private record ScopeNode(
        String externalId,
        String parentScopeId,
        String kind,
        String name,
        String displayName
    ) {
    }

    private record EntityNode(
        String externalId,
        String scopeId,
        String kind,
        String name,
        String displayName,
        String origin,
        int sourceRefCount,
        String summary
    ) {
    }
}
