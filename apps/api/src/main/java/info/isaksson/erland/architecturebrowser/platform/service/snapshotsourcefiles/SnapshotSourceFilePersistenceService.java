package info.isaksson.erland.architecturebrowser.platform.service.snapshotsourcefiles;

import info.isaksson.erland.architecturebrowser.platform.domain.SnapshotEntity;
import info.isaksson.erland.architecturebrowser.platform.domain.SnapshotSourceFileEntity;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

@ApplicationScoped
public class SnapshotSourceFilePersistenceService {
    public List<SnapshotSourceFileEntity> persistForSnapshot(SnapshotEntity snapshot,
                                                             SnapshotSourceFileImportArtifact artifact) {
        if (snapshot == null || artifact == null || artifact.files().isEmpty()) {
            return List.of();
        }

        List<SnapshotSourceFileEntity> entities = buildEntities(snapshot, artifact);
        for (SnapshotSourceFileEntity entity : entities) {
            entity.persist();
        }
        return List.copyOf(entities);
    }

    List<SnapshotSourceFileEntity> buildEntities(SnapshotEntity snapshot,
                                                 SnapshotSourceFileImportArtifact artifact) {
        Map<String, SnapshotSourceFileEntity> byRelativePath = new LinkedHashMap<>();
        for (SnapshotSourceFileImportEntry entry : artifact.files()) {
            if (entry == null) {
                continue;
            }
            String relativePath = normalizeRelativePath(entry.relativePath());
            if (relativePath.isBlank() || byRelativePath.containsKey(relativePath)) {
                continue;
            }
            SnapshotSourceFileEntity entity = new SnapshotSourceFileEntity();
            entity.id = UUID.randomUUID().toString();
            entity.snapshotId = snapshot.id;
            entity.relativePath = relativePath;
            entity.language = normalizeOptional(entry.language());
            entity.contentType = normalizeOptional(entry.contentType());
            entity.sizeBytes = entry.sizeBytes() == null ? 0L : Math.max(0L, entry.sizeBytes());
            entity.totalLineCount = entry.totalLineCount() == null ? 0 : Math.max(0, entry.totalLineCount());
            entity.textContent = Objects.requireNonNullElse(entry.textContent(), "");
            byRelativePath.put(relativePath, entity);
        }
        return new ArrayList<>(byRelativePath.values());
    }

    private String normalizeRelativePath(String relativePath) {
        if (relativePath == null) {
            return "";
        }
        String normalized = relativePath.trim().replace('\\', '/');
        while (normalized.startsWith("./")) {
            normalized = normalized.substring(2);
        }
        return normalized;
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }
}
