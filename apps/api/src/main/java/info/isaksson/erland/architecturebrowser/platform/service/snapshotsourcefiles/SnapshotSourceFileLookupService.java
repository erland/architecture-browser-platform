package info.isaksson.erland.architecturebrowser.platform.service.snapshotsourcefiles;

import info.isaksson.erland.architecturebrowser.platform.domain.SnapshotEntity;
import info.isaksson.erland.architecturebrowser.platform.domain.SnapshotSourceFileEntity;
import info.isaksson.erland.architecturebrowser.platform.service.management.NotFoundException;
import info.isaksson.erland.architecturebrowser.platform.service.snapshots.SnapshotCatalogQueryService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.nio.file.Path;

@ApplicationScoped
public class SnapshotSourceFileLookupService {
    @Inject
    SnapshotCatalogQueryService snapshotCatalogQueryService;

    public SnapshotSourceFileLookupResult requireFile(String workspaceId, String snapshotId, String relativePath) {
        if (isBlank(snapshotId)) {
            throw new IllegalArgumentException("Snapshot source file lookup requires snapshotId.");
        }
        String normalizedPath = normalizeRelativePath(relativePath);
        SnapshotEntity snapshot = snapshotCatalogQueryService.requireSnapshot(workspaceId, snapshotId.trim());
        SnapshotSourceFileEntity entity = findBySnapshotAndRelativePath(snapshot.id, normalizedPath);
        if (entity == null) {
            throw new NotFoundException("Snapshot source file not found for snapshot '%s': %s".formatted(snapshot.id, normalizedPath));
        }
        return map(entity);
    }

    protected SnapshotSourceFileEntity findBySnapshotAndRelativePath(String snapshotId, String relativePath) {
        return SnapshotSourceFileEntity.find("snapshotId = ?1 and relativePath = ?2", snapshotId, relativePath)
            .firstResult();
    }

    SnapshotSourceFileLookupResult map(SnapshotSourceFileEntity entity) {
        return new SnapshotSourceFileLookupResult(
            entity.snapshotId,
            entity.relativePath,
            entity.language,
            entity.contentType,
            entity.sizeBytes,
            entity.totalLineCount,
            entity.textContent == null ? "" : entity.textContent
        );
    }

    String normalizeRelativePath(String relativePath) {
        if (isBlank(relativePath)) {
            throw new IllegalArgumentException("Snapshot source file lookup requires relativePath.");
        }
        String normalized = relativePath.trim().replace('\\', '/');
        while (normalized.startsWith("./")) {
            normalized = normalized.substring(2);
        }
        if (normalized.isBlank()) {
            throw new IllegalArgumentException("Snapshot source file lookup requires relativePath.");
        }
        if (Path.of(normalized).isAbsolute()) {
            throw new IllegalArgumentException("Snapshot source file lookup requires a repository-relative path.");
        }
        for (String segment : normalized.split("/")) {
            if (segment.equals("..")) {
                throw new IllegalArgumentException("Snapshot source file lookup path must not escape the snapshot source root.");
            }
        }
        return normalized;
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
