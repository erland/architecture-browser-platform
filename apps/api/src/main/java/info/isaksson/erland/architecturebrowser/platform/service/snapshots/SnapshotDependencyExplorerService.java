package info.isaksson.erland.architecturebrowser.platform.service.snapshots;

import com.fasterxml.jackson.databind.ObjectMapper;
import info.isaksson.erland.architecturebrowser.platform.api.dto.DependencyDtos.DependencyDirection;
import info.isaksson.erland.architecturebrowser.platform.api.dto.DependencyDtos.DependencyEntityResponse;
import info.isaksson.erland.architecturebrowser.platform.api.dto.DependencyDtos.DependencyFocusResponse;
import info.isaksson.erland.architecturebrowser.platform.api.dto.DependencyDtos.DependencyRelationshipResponse;
import info.isaksson.erland.architecturebrowser.platform.api.dto.DependencyDtos.DependencyViewResponse;
import info.isaksson.erland.architecturebrowser.platform.api.dto.DependencyDtos.ScopeReference;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotDtos.SnapshotSummaryResponse;
import info.isaksson.erland.architecturebrowser.platform.domain.ImportedFactEntity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.Comparator;
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

    @Inject
    SnapshotDependencyIndexBuilder snapshotDependencyIndexBuilder;

    @Inject
    SnapshotDependencyQuerySupport snapshotDependencyQuerySupport;

    @Inject
    SnapshotDependencyResponseMapper snapshotDependencyResponseMapper;

    public DependencyViewResponse getView(String workspaceId,
                                          String snapshotId,
                                          String scopeId,
                                          DependencyDirection direction,
                                          String focusEntityId) {
        SnapshotSummaryResponse snapshot = snapshotCatalogService.getSummary(workspaceId, snapshotId);
        SnapshotDependencyIndex index = buildIndex(snapshotId);

        SnapshotDependencyIndex.ScopeNode selectedScope = snapshotDependencyQuerySupport.selectScope(scopeId, index);
        ScopeReference scopeReference = selectedScope != null
            ? new ScopeReference(
                selectedScope.externalId(),
                selectedScope.kind(),
                selectedScope.name(),
                selectedScope.displayName(),
                snapshotDependencyQuerySupport.buildScopePath(selectedScope, index),
                false
            )
            : new ScopeReference(null, "SNAPSHOT", "All scopes", "All scopes", "All scopes", true);

        Set<String> scopedScopeIds = selectedScope != null
            ? snapshotDependencyQuerySupport.collectScopeIds(selectedScope.externalId(), index)
            : new LinkedHashSet<>(index.scopeById().keySet());
        Set<String> scopedEntityIds = index.entityById().values().stream()
            .filter(entity -> entity.scopeId() != null && scopedScopeIds.contains(entity.scopeId()))
            .map(SnapshotDependencyIndex.EntityNode::externalId)
            .collect(Collectors.toCollection(LinkedHashSet::new));

        List<SnapshotDependencyIndex.RelationshipNode> candidateRelationships = index.relationships().stream()
            .filter(relationship -> snapshotDependencyQuerySupport.includeRelationship(relationship, scopedEntityIds, direction))
            .sorted(Comparator
                .comparing(SnapshotDependencyIndex.RelationshipNode::kind)
                .thenComparing(relationship -> snapshotDependencyQuerySupport.resolveEntityLabel(relationship.fromEntityId(), index))
                .thenComparing(relationship -> snapshotDependencyQuerySupport.resolveEntityLabel(relationship.toEntityId(), index)))
            .toList();

        List<SnapshotDependencyIndex.RelationshipNode> visibleRelationships = focusEntityId != null && !focusEntityId.isBlank()
            ? candidateRelationships.stream()
                .filter(relationship -> focusEntityId.equals(relationship.fromEntityId()) || focusEntityId.equals(relationship.toEntityId()))
                .toList()
            : candidateRelationships;

        Set<String> visibleEntityIds = new LinkedHashSet<>(scopedEntityIds);
        visibleRelationships.forEach(relationship -> {
            visibleEntityIds.add(relationship.fromEntityId());
            visibleEntityIds.add(relationship.toEntityId());
        });

        Map<String, Integer> inboundCounts = new LinkedHashMap<>();
        Map<String, Integer> outboundCounts = new LinkedHashMap<>();
        for (SnapshotDependencyIndex.RelationshipNode relationship : visibleRelationships) {
            outboundCounts.merge(relationship.fromEntityId(), 1, Integer::sum);
            inboundCounts.merge(relationship.toEntityId(), 1, Integer::sum);
        }

        List<DependencyEntityResponse> entities = visibleEntityIds.stream()
            .map(index.entityById()::get)
            .filter(Objects::nonNull)
            .sorted(Comparator.comparing((SnapshotDependencyIndex.EntityNode entity) -> !scopedEntityIds.contains(entity.externalId()))
                .thenComparing(entity -> snapshotDependencyQuerySupport.resolveEntityLabel(entity.externalId(), index)))
            .map(entity -> snapshotDependencyResponseMapper.toEntityResponse(
                entity,
                index,
                scopedEntityIds.contains(entity.externalId()),
                inboundCounts.getOrDefault(entity.externalId(), 0),
                outboundCounts.getOrDefault(entity.externalId(), 0)
            ))
            .toList();

        List<DependencyRelationshipResponse> relationships = visibleRelationships.stream()
            .map(relationship -> snapshotDependencyResponseMapper.toRelationshipResponse(relationship, index, scopedEntityIds))
            .toList();

        DependencyFocusResponse focus = snapshotDependencyResponseMapper.resolveFocus(
            focusEntityId,
            index,
            scopedEntityIds,
            visibleRelationships,
            inboundCounts,
            outboundCounts
        );

        return new DependencyViewResponse(
            snapshot,
            scopeReference,
            direction,
            snapshotDependencyQuerySupport.summarizeKinds(visibleRelationships.stream().map(SnapshotDependencyIndex.RelationshipNode::kind).toList()),
            snapshotDependencyQuerySupport.buildSummary(scopedEntityIds, visibleRelationships),
            entities,
            relationships,
            focus
        );
    }

    private SnapshotDependencyIndex buildIndex(String snapshotId) {
        return snapshotDependencyIndexBuilder.buildIndex(ImportedFactEntity.list("snapshotId", snapshotId));
    }
}
