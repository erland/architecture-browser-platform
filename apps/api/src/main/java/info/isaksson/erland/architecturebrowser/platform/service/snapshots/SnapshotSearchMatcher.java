package info.isaksson.erland.architecturebrowser.platform.service.snapshots;

import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotDtos.KindCount;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

final class SnapshotSearchMatcher {
    private final SnapshotSearchQuerySupport querySupport;

    SnapshotSearchMatcher(SnapshotSearchQuerySupport querySupport) {
        this.querySupport = querySupport;
    }

    SearchMatch match(SnapshotSearchIndex.EntityNode entity, String normalizedQuery, SnapshotSearchIndex index) {
        int score = 0;
        LinkedHashSet<String> reasons = new LinkedHashSet<>();
        String label = querySupport.displayLabel(entity, index).toLowerCase(java.util.Locale.ROOT);
        String kind = querySupport.safeLower(entity.kind());
        String summary = querySupport.safeLower(entity.summary());
        String scopePath = querySupport.safeLower(querySupport.resolveScopePath(entity.scopeId(), index));
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
        for (SnapshotSearchIndex.SourceRef sourceRef : entity.sourceRefs()) {
            if (querySupport.safeLower(sourceRef.path()).contains(normalizedQuery)) {
                score += 15;
                reasons.add("source path");
                break;
            }
            if (querySupport.safeLower(sourceRef.snippet()).contains(normalizedQuery)) {
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

    List<KindCount> summarizeKinds(List<String> values) {
        return values.stream()
            .filter(Objects::nonNull)
            .collect(Collectors.groupingBy(value -> value, LinkedHashMap::new, Collectors.counting()))
            .entrySet().stream()
            .sorted(Map.Entry.<String, Long>comparingByValue().reversed().thenComparing(Map.Entry.comparingByKey()))
            .map(entry -> new KindCount(entry.getKey(), entry.getValue()))
            .toList();
    }

    record SearchMatch(SnapshotSearchIndex.EntityNode entity, int score, List<String> reasons) {}
}
