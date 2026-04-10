package info.isaksson.erland.architecturebrowser.platform.service.snapshots;

import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotSharedDtos.SourceRef;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;

@ApplicationScoped
class SnapshotCatalogSourceRefMapper {
    List<SourceRef> mapSourceRefs(List<SnapshotCatalogCanonicalDocument.SourceRefData> sourceRefs) {
        return sourceRefs.stream()
            .map(sourceRef -> new SourceRef(
                sourceRef.path(),
                sourceRef.startLine(),
                sourceRef.endLine(),
                sourceRef.snippet(),
                sourceRef.metadata()
            ))
            .toList();
    }
}
