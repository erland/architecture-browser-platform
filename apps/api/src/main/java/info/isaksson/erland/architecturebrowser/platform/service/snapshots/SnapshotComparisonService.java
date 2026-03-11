package info.isaksson.erland.architecturebrowser.platform.service.snapshots;

import info.isaksson.erland.architecturebrowser.platform.api.dto.ComparisonDtos;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotDtos.SnapshotSummaryResponse;
import info.isaksson.erland.architecturebrowser.platform.domain.FactType;
import info.isaksson.erland.architecturebrowser.platform.domain.ImportedFactEntity;
import info.isaksson.erland.architecturebrowser.platform.service.management.NotFoundException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@ApplicationScoped
public class SnapshotComparisonService {
    private static final int PREVIEW_LIMIT = 12;

    @Inject
    SnapshotCatalogService snapshotCatalogService;

    public ComparisonDtos.SnapshotComparisonResponse compare(String workspaceId, String baseSnapshotId, String targetSnapshotId) {
        SnapshotSummaryResponse baseSnapshot = snapshotCatalogService.getSummary(workspaceId, baseSnapshotId);
        SnapshotSummaryResponse targetSnapshot = snapshotCatalogService.getSummary(workspaceId, targetSnapshotId);
        SnapshotIndex base = buildIndex(baseSnapshotId);
        SnapshotIndex target = buildIndex(targetSnapshotId);

        List<ScopeNode> addedScopesRaw = difference(target.scopeById.keySet(), base.scopeById.keySet()).stream().map(target.scopeById::get).filter(Objects::nonNull).sorted(Comparator.comparing(scope -> scope.path)).toList();
        List<ScopeNode> removedScopesRaw = difference(base.scopeById.keySet(), target.scopeById.keySet()).stream().map(base.scopeById::get).filter(Objects::nonNull).sorted(Comparator.comparing(scope -> scope.path)).toList();
        List<EntityNode> addedEntitiesRaw = difference(target.entityById.keySet(), base.entityById.keySet()).stream().map(target.entityById::get).filter(Objects::nonNull).sorted(Comparator.comparing(entity -> entity.displayLabel)).toList();
        List<EntityNode> removedEntitiesRaw = difference(base.entityById.keySet(), target.entityById.keySet()).stream().map(base.entityById::get).filter(Objects::nonNull).sorted(Comparator.comparing(entity -> entity.displayLabel)).toList();
        List<RelationshipNode> addedRelationshipsRaw = difference(target.relationshipByKey.keySet(), base.relationshipByKey.keySet()).stream().map(target.relationshipByKey::get).filter(Objects::nonNull).sorted(Comparator.comparing(RelationshipNode::kind).thenComparing(RelationshipNode::fromDisplayName).thenComparing(RelationshipNode::toDisplayName)).toList();
        List<RelationshipNode> removedRelationshipsRaw = difference(base.relationshipByKey.keySet(), target.relationshipByKey.keySet()).stream().map(base.relationshipByKey::get).filter(Objects::nonNull).sorted(Comparator.comparing(RelationshipNode::kind).thenComparing(RelationshipNode::fromDisplayName).thenComparing(RelationshipNode::toDisplayName)).toList();

        List<EntityNode> addedEntryPointsRaw = addedEntitiesRaw.stream().filter(entity -> isEntryPoint(entity.kind)).toList();
        List<EntityNode> removedEntryPointsRaw = removedEntitiesRaw.stream().filter(entity -> isEntryPoint(entity.kind)).toList();
        List<EntityNode> changedIntegrationRaw = new ArrayList<>();
        changedIntegrationRaw.addAll(addedEntitiesRaw.stream().filter(entity -> isIntegrationOrPersistence(entity.kind)).toList());
        changedIntegrationRaw.addAll(removedEntitiesRaw.stream().filter(entity -> isIntegrationOrPersistence(entity.kind)).toList());
        changedIntegrationRaw.sort(Comparator.comparing(entity -> entity.displayLabel));

        return new ComparisonDtos.SnapshotComparisonResponse(
            baseSnapshot,
            targetSnapshot,
            new ComparisonDtos.ComparisonSummary(
                addedScopesRaw.size(),
                removedScopesRaw.size(),
                addedEntitiesRaw.size(),
                removedEntitiesRaw.size(),
                addedRelationshipsRaw.size(),
                removedRelationshipsRaw.size(),
                addedEntryPointsRaw.size(),
                removedEntryPointsRaw.size(),
                changedIntegrationRaw.size()
            ),
            addedScopesRaw.stream().limit(PREVIEW_LIMIT).map(scope -> new ComparisonDtos.ScopeChange(scope.externalId, scope.kind, scope.name, scope.displayName, scope.path)).toList(),
            removedScopesRaw.stream().limit(PREVIEW_LIMIT).map(scope -> new ComparisonDtos.ScopeChange(scope.externalId, scope.kind, scope.name, scope.displayName, scope.path)).toList(),
            addedEntitiesRaw.stream().limit(PREVIEW_LIMIT).map(this::toEntityChange).toList(),
            removedEntitiesRaw.stream().limit(PREVIEW_LIMIT).map(this::toEntityChange).toList(),
            addedEntryPointsRaw.stream().limit(PREVIEW_LIMIT).map(this::toEntityChange).toList(),
            removedEntryPointsRaw.stream().limit(PREVIEW_LIMIT).map(this::toEntityChange).toList(),
            changedIntegrationRaw.stream().limit(PREVIEW_LIMIT).map(this::toEntityChange).toList(),
            addedRelationshipsRaw.stream().limit(PREVIEW_LIMIT).map(this::toRelationshipChange).toList(),
            removedRelationshipsRaw.stream().limit(PREVIEW_LIMIT).map(this::toRelationshipChange).toList()
        );
    }

    private SnapshotIndex buildIndex(String snapshotId) {
        List<ImportedFactEntity> facts = ImportedFactEntity.list("snapshotId", snapshotId);
        Map<String, ScopeNode> scopes = new LinkedHashMap<>();
        Map<String, EntityNode> rawEntities = new LinkedHashMap<>();
        List<ImportedFactEntity> rawRelationships = new ArrayList<>();
        for (ImportedFactEntity fact : facts) {
            switch (fact.factType) {
                case SCOPE -> scopes.put(fact.externalId, new ScopeNode(fact.externalId, fact.factKind, fact.name, firstNonBlank(fact.displayName, fact.name, fact.externalId), fact.scopeExternalId, null));
                case ENTITY -> rawEntities.put(fact.externalId, new EntityNode(fact.externalId, fact.factKind, fact.name, firstNonBlank(fact.displayName, fact.name, fact.externalId), fact.scopeExternalId, null));
                case RELATIONSHIP -> rawRelationships.add(fact);
                default -> {
                }
            }
        }
        Map<String, ScopeNode> scoped = scopes.entrySet().stream().collect(Collectors.toMap(Map.Entry::getKey, entry -> {
            ScopeNode scope = entry.getValue();
            return new ScopeNode(scope.externalId, scope.kind, scope.name, scope.displayName, scope.parentScopeId, buildScopePath(scope.externalId, scopes));
        }, (a,b)->a, LinkedHashMap::new));
        Map<String, EntityNode> entities = rawEntities.entrySet().stream().collect(Collectors.toMap(Map.Entry::getKey, entry -> {
            EntityNode entity = entry.getValue();
            return new EntityNode(entity.externalId, entity.kind, entity.name, entity.displayLabel, entity.scopeId, entity.scopeId != null ? buildScopePath(entity.scopeId, scopes) : "—");
        }, (a,b)->a, LinkedHashMap::new));
        Map<String, RelationshipNode> relationships = new LinkedHashMap<>();
        for (ImportedFactEntity fact : rawRelationships) {
            EntityNode from = entities.get(fact.fromExternalId);
            EntityNode to = entities.get(fact.toExternalId);
            if (from == null || to == null) {
                continue;
            }
            RelationshipNode relationship = new RelationshipNode(
                fact.externalId,
                fact.factKind,
                firstNonBlank(fact.displayName, fact.name, fact.externalId),
                from.externalId,
                from.displayLabel,
                from.scopePath,
                to.externalId,
                to.displayLabel,
                to.scopePath,
                fact.factKind + "|" + from.externalId + "|" + to.externalId + "|" + firstNonBlank(fact.displayName, fact.name, fact.externalId)
            );
            relationships.put(relationship.key, relationship);
        }
        return new SnapshotIndex(scoped, entities, relationships);
    }

    private Set<String> difference(Set<String> left, Set<String> right) {
        return left.stream().filter(item -> !right.contains(item)).collect(Collectors.toCollection(java.util.LinkedHashSet::new));
    }

    private boolean isEntryPoint(String kind) {
        return "ENDPOINT".equals(kind) || "STARTUP_POINT".equals(kind);
    }

    private boolean isIntegrationOrPersistence(String kind) {
        return Set.of("DATASTORE", "PERSISTENCE_ADAPTER", "EXTERNAL_SYSTEM", "SERVICE", "CONFIG_ARTIFACT").contains(kind);
    }

    private ComparisonDtos.EntityChange toEntityChange(EntityNode entity) {
        return new ComparisonDtos.EntityChange(entity.externalId, entity.kind, entity.name, entity.displayLabel, entity.scopePath);
    }

    private ComparisonDtos.RelationshipChange toRelationshipChange(RelationshipNode relationship) {
        return new ComparisonDtos.RelationshipChange(
            relationship.externalId,
            relationship.kind,
            relationship.label,
            relationship.fromEntityId,
            relationship.fromDisplayName,
            relationship.fromScopePath,
            relationship.toEntityId,
            relationship.toDisplayName,
            relationship.toScopePath
        );
    }

    private String buildScopePath(String scopeId, Map<String, ScopeNode> scopes) {
        ScopeNode scope = scopes.get(scopeId);
        if (scope == null) {
            return scopeId;
        }
        List<String> parts = new ArrayList<>();
        ScopeNode current = scope;
        while (current != null) {
            parts.add(current.displayName);
            current = current.parentScopeId != null ? scopes.get(current.parentScopeId) : null;
        }
        java.util.Collections.reverse(parts);
        return String.join(" / ", parts);
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return "";
    }

    private record SnapshotIndex(Map<String, ScopeNode> scopeById, Map<String, EntityNode> entityById, Map<String, RelationshipNode> relationshipByKey) {}
    private record ScopeNode(String externalId, String kind, String name, String displayName, String parentScopeId, String path) {}
    private record EntityNode(String externalId, String kind, String name, String displayLabel, String scopeId, String scopePath) {}
    private record RelationshipNode(String externalId, String kind, String label, String fromEntityId, String fromDisplayName, String fromScopePath, String toEntityId, String toDisplayName, String toScopePath, String key) {}
}
