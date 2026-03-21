package info.isaksson.erland.architecturebrowser.platform.service.snapshots;

import com.fasterxml.jackson.databind.ObjectMapper;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SearchDtos;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotDtos.SnapshotSummaryResponse;
import info.isaksson.erland.architecturebrowser.platform.domain.ImportedFactEntity;
import info.isaksson.erland.architecturebrowser.platform.service.management.NotFoundException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;

@ApplicationScoped
public class SnapshotSearchService {
    @Inject
    SnapshotCatalogService snapshotCatalogService;

    @Inject
    ObjectMapper objectMapper;

    public SearchDtos.EntitySearchResponse search(String workspaceId, String snapshotId, String query, String scopeId, int limit) {
        SnapshotSummaryResponse snapshot = snapshotCatalogService.getSummary(workspaceId, snapshotId);
        SnapshotSearchIndex index = buildIndex(snapshotId);
        SnapshotSearchQuerySupport querySupport = new SnapshotSearchQuerySupport();
        SnapshotSearchMatcher matcher = new SnapshotSearchMatcher(querySupport);
        SnapshotSearchResponseMapper responseMapper = new SnapshotSearchResponseMapper(objectMapper, querySupport);

        SnapshotSearchIndex.ScopeNode selectedScope = querySupport.selectScope(scopeId, index);
        SearchDtos.ScopeReference scopeReference = selectedScope != null
            ? new SearchDtos.ScopeReference(
            selectedScope.externalId(),
            selectedScope.kind(),
            selectedScope.name(),
            selectedScope.displayName(),
            querySupport.buildScopePath(selectedScope, index),
            false
        )
            : new SearchDtos.ScopeReference(null, "SNAPSHOT", "All scopes", "All scopes", "All scopes", true);
        Set<String> scopedScopeIds = selectedScope != null
            ? querySupport.collectScopeIds(selectedScope.externalId(), index)
            : new LinkedHashSet<>(index.scopeById().keySet());
        List<SnapshotSearchIndex.EntityNode> searchable = index.entityById().values().stream()
            .filter(entity -> entity.scopeId() != null && scopedScopeIds.contains(entity.scopeId()))
            .toList();

        String normalized = querySupport.normalizeQuery(query);
        List<SnapshotSearchMatcher.SearchMatch> matches = normalized.isBlank()
            ? List.of()
            : searchable.stream()
                .map(entity -> matcher.match(entity, normalized, index))
                .filter(Objects::nonNull)
                .sorted(Comparator.comparingInt(SnapshotSearchMatcher.SearchMatch::score).reversed()
                    .thenComparing(match -> querySupport.displayLabel(match.entity(), index))
                    .thenComparing(match -> match.entity().externalId()))
                .toList();

        int safeLimit = Math.max(1, Math.min(limit, 100));
        List<SearchDtos.EntitySearchResultResponse> results = matches.stream()
            .limit(safeLimit)
            .map(match -> responseMapper.toSearchResult(match, index))
            .toList();

        return new SearchDtos.EntitySearchResponse(
            snapshot,
            query == null ? "" : query,
            scopeReference,
            new SearchDtos.SearchSummary(searchable.size(), results.size(), matches.size(), safeLimit, normalized.isBlank()),
            matcher.summarizeKinds(results.stream().map(SearchDtos.EntitySearchResultResponse::kind).toList()),
            results
        );
    }

    public SearchDtos.EntityDetailResponse getEntityDetail(String workspaceId, String snapshotId, String entityId) {
        SnapshotSummaryResponse snapshot = snapshotCatalogService.getSummary(workspaceId, snapshotId);
        SnapshotSearchIndex index = buildIndex(snapshotId);
        SnapshotSearchQuerySupport querySupport = new SnapshotSearchQuerySupport();
        SnapshotSearchMatcher matcher = new SnapshotSearchMatcher(querySupport);
        SnapshotSearchResponseMapper responseMapper = new SnapshotSearchResponseMapper(objectMapper, querySupport);

        SnapshotSearchIndex.EntityNode entity = index.entityById().get(entityId);
        if (entity == null) {
            throw new NotFoundException("Entity not found in snapshot: " + entityId);
        }
        List<SnapshotSearchIndex.RelationshipNode> inbound = index.relationshipsByTarget().getOrDefault(entityId, List.of()).stream()
            .sorted(Comparator.comparing(SnapshotSearchIndex.RelationshipNode::kind)
                .thenComparing(relationship -> querySupport.displayLabel(index.entityById().get(relationship.fromEntityId()), index)))
            .toList();
        List<SnapshotSearchIndex.RelationshipNode> outbound = index.relationshipsBySource().getOrDefault(entityId, List.of()).stream()
            .sorted(Comparator.comparing(SnapshotSearchIndex.RelationshipNode::kind)
                .thenComparing(relationship -> querySupport.displayLabel(index.entityById().get(relationship.toEntityId()), index)))
            .toList();
        SnapshotSearchIndex.ScopeNode scope = entity.scopeId() != null ? index.scopeById().get(entity.scopeId()) : null;
        SearchDtos.ScopeReference scopeReference = new SearchDtos.ScopeReference(
            scope != null ? scope.externalId() : null,
            scope != null ? scope.kind() : "UNKNOWN",
            scope != null ? scope.name() : "Unknown scope",
            scope != null ? scope.displayName() : "Unknown scope",
            scope != null ? querySupport.buildScopePath(scope, index) : "—",
            false
        );
        Set<String> relatedKinds = new LinkedHashSet<>();
        inbound.forEach(relationship -> {
            SnapshotSearchIndex.EntityNode other = index.entityById().get(relationship.fromEntityId());
            if (other != null) {
                relatedKinds.add(other.kind());
            }
        });
        outbound.forEach(relationship -> {
            SnapshotSearchIndex.EntityNode other = index.entityById().get(relationship.toEntityId());
            if (other != null) {
                relatedKinds.add(other.kind());
            }
        });
        return new SearchDtos.EntityDetailResponse(
            snapshot,
            new SearchDtos.EntityDetailEntityResponse(
                entity.externalId(),
                entity.kind(),
                entity.name(),
                entity.displayName(),
                entity.origin(),
                entity.scopeId(),
                querySupport.resolveScopePath(entity.scopeId(), index),
                entity.sourceRefs().size(),
                entity.summary(),
                inbound.size(),
                outbound.size()
            ),
            scopeReference,
            matcher.summarizeKinds(List.copyOf(relatedKinds)),
            entity.sourceRefs().stream().map(responseMapper::toSourceRefResponse).toList(),
            inbound.stream().map(relationship -> responseMapper.toRelationshipResponse(relationship, index, false)).toList(),
            outbound.stream().map(relationship -> responseMapper.toRelationshipResponse(relationship, index, true)).toList(),
            responseMapper.jsonText(entity.metadata())
        );
    }

    private SnapshotSearchIndex buildIndex(String snapshotId) {
        return new SnapshotSearchIndexBuilder(objectMapper).buildIndex(ImportedFactEntity.list("snapshotId", snapshotId));
    }
}
