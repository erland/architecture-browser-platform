package info.isaksson.erland.architecturebrowser.platform.service.snapshots;

import jakarta.enterprise.context.ApplicationScoped;
import info.isaksson.erland.architecturebrowser.platform.api.dto.DependencyDtos.DependencyEntityResponse;
import info.isaksson.erland.architecturebrowser.platform.api.dto.DependencyDtos.DependencyFocusResponse;
import info.isaksson.erland.architecturebrowser.platform.api.dto.DependencyDtos.DependencyRelationshipResponse;
import info.isaksson.erland.architecturebrowser.platform.service.management.NotFoundException;

import java.util.List;
import java.util.Map;
import java.util.Set;

@ApplicationScoped
public class SnapshotDependencyResponseMapper {
    private final SnapshotDependencyQuerySupport querySupport;

    public SnapshotDependencyResponseMapper(SnapshotDependencyQuerySupport querySupport) {
        this.querySupport = querySupport;
    }

    public DependencyEntityResponse toEntityResponse(SnapshotDependencyIndex.EntityNode entity,
                                                     SnapshotDependencyIndex index,
                                                     boolean inScope,
                                                     int inboundCount,
                                                     int outboundCount) {
        SnapshotDependencyIndex.ScopeNode scope = entity.scopeId() != null ? index.scopeById().get(entity.scopeId()) : null;
        return new DependencyEntityResponse(
            entity.externalId(),
            entity.kind(),
            entity.name(),
            entity.displayName(),
            entity.origin(),
            entity.scopeId(),
            scope != null ? querySupport.buildScopePath(scope, index) : "—",
            inScope,
            entity.sourceRefCount(),
            entity.summary(),
            inboundCount,
            outboundCount
        );
    }

    public DependencyRelationshipResponse toRelationshipResponse(SnapshotDependencyIndex.RelationshipNode relationship,
                                                                 SnapshotDependencyIndex index,
                                                                 Set<String> scopedEntityIds) {
        SnapshotDependencyIndex.EntityNode from = index.entityById().get(relationship.fromEntityId());
        SnapshotDependencyIndex.EntityNode to = index.entityById().get(relationship.toEntityId());
        boolean fromInScope = scopedEntityIds.contains(relationship.fromEntityId());
        boolean toInScope = scopedEntityIds.contains(relationship.toEntityId());
        return new DependencyRelationshipResponse(
            relationship.externalId(),
            relationship.kind(),
            relationship.label(),
            relationship.summary(),
            relationship.fromEntityId(),
            from != null ? querySupport.normalizeName(from.displayName(), from.name(), from.externalId()) : relationship.fromEntityId(),
            from != null ? from.kind() : "UNKNOWN",
            from != null ? querySupport.resolveScopePath(from.scopeId(), index) : "—",
            fromInScope,
            relationship.toEntityId(),
            to != null ? querySupport.normalizeName(to.displayName(), to.name(), to.externalId()) : relationship.toEntityId(),
            to != null ? to.kind() : "UNKNOWN",
            to != null ? querySupport.resolveScopePath(to.scopeId(), index) : "—",
            toInScope,
            querySupport.describeDirection(fromInScope, toInScope),
            fromInScope != toInScope
        );
    }

    public DependencyFocusResponse resolveFocus(String focusEntityId,
                                                SnapshotDependencyIndex index,
                                                Set<String> scopedEntityIds,
                                                List<SnapshotDependencyIndex.RelationshipNode> visibleRelationships,
                                                Map<String, Integer> inboundCounts,
                                                Map<String, Integer> outboundCounts) {
        if (focusEntityId == null || focusEntityId.isBlank()) {
            return null;
        }
        SnapshotDependencyIndex.EntityNode entity = index.entityById().get(focusEntityId);
        if (entity == null) {
            throw new NotFoundException("Entity not found for dependency focus: " + focusEntityId);
        }
        List<DependencyRelationshipResponse> inbound = visibleRelationships.stream()
            .filter(relationship -> focusEntityId.equals(relationship.toEntityId()))
            .map(relationship -> toRelationshipResponse(relationship, index, scopedEntityIds))
            .toList();
        List<DependencyRelationshipResponse> outbound = visibleRelationships.stream()
            .filter(relationship -> focusEntityId.equals(relationship.fromEntityId()))
            .map(relationship -> toRelationshipResponse(relationship, index, scopedEntityIds))
            .toList();
        return new DependencyFocusResponse(
            toEntityResponse(entity, index, scopedEntityIds.contains(entity.externalId()), inboundCounts.getOrDefault(entity.externalId(), 0), outboundCounts.getOrDefault(entity.externalId(), 0)),
            inbound.size(),
            outbound.size(),
            inbound,
            outbound
        );
    }
}
