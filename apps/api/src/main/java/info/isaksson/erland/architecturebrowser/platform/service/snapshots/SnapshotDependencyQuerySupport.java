package info.isaksson.erland.architecturebrowser.platform.service.snapshots;

import jakarta.enterprise.context.ApplicationScoped;
import info.isaksson.erland.architecturebrowser.platform.api.dto.DependencyDtos.DependencyDirection;
import info.isaksson.erland.architecturebrowser.platform.api.dto.DependencyDtos.DependencySummary;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotDtos.KindCount;
import info.isaksson.erland.architecturebrowser.platform.service.management.NotFoundException;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@ApplicationScoped
public class SnapshotDependencyQuerySupport {
    public SnapshotDependencyIndex.ScopeNode selectScope(String scopeId, SnapshotDependencyIndex index) {
        if (scopeId == null || scopeId.isBlank()) {
            return null;
        }
        SnapshotDependencyIndex.ScopeNode scope = index.scopeById().get(scopeId);
        if (scope == null) {
            throw new NotFoundException("Scope not found for dependency view: " + scopeId);
        }
        return scope;
    }

    public Set<String> collectScopeIds(String rootScopeId, SnapshotDependencyIndex index) {
        Set<String> result = new LinkedHashSet<>();
        Deque<String> queue = new ArrayDeque<>();
        queue.add(rootScopeId);
        while (!queue.isEmpty()) {
            String current = queue.removeFirst();
            if (!result.add(current)) {
                continue;
            }
            index.childScopes().getOrDefault(current, List.of()).forEach(child -> queue.addLast(child.externalId()));
        }
        return result;
    }

    public boolean includeRelationship(SnapshotDependencyIndex.RelationshipNode relationship,
                                       Set<String> scopedEntityIds,
                                       DependencyDirection direction) {
        boolean fromInScope = scopedEntityIds.contains(relationship.fromEntityId());
        boolean toInScope = scopedEntityIds.contains(relationship.toEntityId());
        return switch (direction) {
            case ALL -> fromInScope || toInScope;
            case INBOUND -> !fromInScope && toInScope;
            case OUTBOUND -> fromInScope && !toInScope;
        };
    }

    public DependencySummary buildSummary(Set<String> scopedEntityIds, List<SnapshotDependencyIndex.RelationshipNode> relationships) {
        int internal = 0;
        int inbound = 0;
        int outbound = 0;
        for (SnapshotDependencyIndex.RelationshipNode relationship : relationships) {
            boolean fromInScope = scopedEntityIds.contains(relationship.fromEntityId());
            boolean toInScope = scopedEntityIds.contains(relationship.toEntityId());
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
            visibleEntities.add(relationship.fromEntityId());
            visibleEntities.add(relationship.toEntityId());
        });
        return new DependencySummary(scopedEntityIds.size(), visibleEntities.size(), relationships.size(), internal, inbound, outbound);
    }

    public List<KindCount> summarizeKinds(List<String> values) {
        Map<String, Long> counts = values.stream()
            .filter(Objects::nonNull)
            .collect(Collectors.groupingBy(value -> value, LinkedHashMap::new, Collectors.counting()));
        return counts.entrySet().stream()
            .sorted(Map.Entry.<String, Long>comparingByValue().reversed().thenComparing(Map.Entry.comparingByKey()))
            .map(entry -> new KindCount(entry.getKey(), entry.getValue()))
            .toList();
    }

    public String resolveEntityLabel(String entityId, SnapshotDependencyIndex index) {
        SnapshotDependencyIndex.EntityNode entity = index.entityById().get(entityId);
        return entity != null ? normalizeName(entity.displayName(), entity.name(), entity.externalId()) : entityId;
    }

    public String resolveScopePath(String scopeId, SnapshotDependencyIndex index) {
        if (scopeId == null) {
            return "—";
        }
        SnapshotDependencyIndex.ScopeNode scope = index.scopeById().get(scopeId);
        return scope != null ? buildScopePath(scope, index) : scopeId;
    }

    public String buildScopePath(SnapshotDependencyIndex.ScopeNode scope, SnapshotDependencyIndex index) {
        List<String> parts = new ArrayList<>();
        SnapshotDependencyIndex.ScopeNode current = scope;
        while (current != null) {
            parts.add(normalizeName(current.displayName(), current.name(), current.externalId()));
            current = current.parentScopeId() != null ? index.scopeById().get(current.parentScopeId()) : null;
        }
        java.util.Collections.reverse(parts);
        return String.join(" / ", parts);
    }

    public String describeDirection(boolean fromInScope, boolean toInScope) {
        if (fromInScope && toInScope) return "INTERNAL";
        if (!fromInScope && toInScope) return "INBOUND";
        if (fromInScope) return "OUTBOUND";
        return "EXTERNAL";
    }

    public String normalizeName(String displayName, String name, String fallback) {
        return firstNonBlank(displayName, name, fallback);
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return "—";
    }
}
