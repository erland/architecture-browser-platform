package info.isaksson.erland.architecturebrowser.platform.service.snapshots;

import info.isaksson.erland.architecturebrowser.platform.service.management.NotFoundException;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

final class SnapshotSearchQuerySupport {
    SnapshotSearchIndex.ScopeNode selectScope(String scopeId, SnapshotSearchIndex index) {
        if (scopeId == null || scopeId.isBlank()) {
            return null;
        }
        SnapshotSearchIndex.ScopeNode scope = index.scopeById().get(scopeId);
        if (scope == null) {
            throw new NotFoundException("Scope not found for search: " + scopeId);
        }
        return scope;
    }

    Set<String> collectScopeIds(String rootScopeId, SnapshotSearchIndex index) {
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

    String resolveScopePath(String scopeId, SnapshotSearchIndex index) {
        if (scopeId == null) {
            return "—";
        }
        SnapshotSearchIndex.ScopeNode scope = index.scopeById().get(scopeId);
        return scope != null ? buildScopePath(scope, index) : scopeId;
    }

    String buildScopePath(SnapshotSearchIndex.ScopeNode scope, SnapshotSearchIndex index) {
        List<String> parts = new ArrayList<>();
        SnapshotSearchIndex.ScopeNode current = scope;
        while (current != null) {
            parts.add(firstNonBlank(current.displayName(), current.name(), current.externalId()));
            current = current.parentScopeId() != null ? index.scopeById().get(current.parentScopeId()) : null;
        }
        java.util.Collections.reverse(parts);
        return String.join(" / ", parts);
    }

    String displayLabel(SnapshotSearchIndex.EntityNode entity, SnapshotSearchIndex index) {
        if (entity == null) {
            return "Unknown entity";
        }
        return simpleDisplayLabel(entity) + " · " + resolveScopePath(entity.scopeId(), index);
    }

    String simpleDisplayLabel(SnapshotSearchIndex.EntityNode entity) {
        if (entity == null) {
            return "Unknown entity";
        }
        return firstNonBlank(entity.displayName(), entity.name(), entity.externalId());
    }

    String normalizeQuery(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    String safeLower(String value) {
        return value == null ? "" : value.toLowerCase(Locale.ROOT);
    }

    String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return "";
    }
}
