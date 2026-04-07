package info.isaksson.erland.architecturebrowser.platform.service.sourceview;

import com.fasterxml.jackson.databind.ObjectMapper;
import info.isaksson.erland.architecturebrowser.platform.contract.ArchitectureIndexDocument;
import info.isaksson.erland.architecturebrowser.platform.domain.SnapshotEntity;
import info.isaksson.erland.architecturebrowser.platform.service.JsonSupport;
import info.isaksson.erland.architecturebrowser.platform.service.snapshots.SnapshotCatalogQueryService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

@ApplicationScoped
public class SourceViewSelectionResolverService {
    @Inject
    SnapshotCatalogQueryService snapshotCatalogQueryService;

    @Inject
    JsonSupport jsonSupport;

    @Inject
    ObjectMapper objectMapper;

    public SourceViewReadRequest resolve(String workspaceId, SourceViewSelectionRequest request) {
        validateRequest(request);
        SnapshotEntity snapshot = snapshotCatalogQueryService.requireSnapshot(workspaceId, request.snapshotId().trim());
        ArchitectureIndexDocument document = parseDocument(snapshot.rawPayloadJson);
        ArchitectureIndexDocument.SourceReference sourceRef = selectSourceRef(document, request);
        return new SourceViewReadRequest(
            null,
            sourceRef.path(),
            request.requestedStartLine() != null ? request.requestedStartLine() : sourceRef.startLine(),
            request.requestedEndLine() != null ? request.requestedEndLine() : sourceRef.endLine()
        );
    }

    private void validateRequest(SourceViewSelectionRequest request) {
        List<String> errors = new ArrayList<>();
        if (isBlank(request.snapshotId())) {
            errors.add("Source view request field 'snapshotId' is required when resolving selected objects.");
        }
        if (isBlank(request.selectedObjectType())) {
            errors.add("Source view request field 'selectedObjectType' is required when resolving selected objects.");
        }
        if (isBlank(request.selectedObjectId())) {
            errors.add("Source view request field 'selectedObjectId' is required when resolving selected objects.");
        }
        if (!errors.isEmpty()) {
            throw new IllegalArgumentException(String.join(" ", errors));
        }
    }

    private ArchitectureIndexDocument parseDocument(String rawPayloadJson) {
        try {
            return objectMapper.convertValue(jsonSupport.readTree(rawPayloadJson), ArchitectureIndexDocument.class);
        } catch (RuntimeException ex) {
            throw new IllegalStateException("Stored snapshot payload could not be parsed for source view resolution.", ex);
        }
    }

    private ArchitectureIndexDocument.SourceReference selectSourceRef(ArchitectureIndexDocument document, SourceViewSelectionRequest request) {
        String objectType = request.selectedObjectType().trim().toUpperCase(Locale.ROOT);
        String objectId = request.selectedObjectId().trim();
        List<ArchitectureIndexDocument.SourceReference> sourceRefs = switch (objectType) {
            case "SCOPE" -> Optional.ofNullable(document.scopes()).orElse(List.of()).stream()
                .filter(scope -> objectId.equals(scope.id()))
                .findFirst()
                .map(ArchitectureIndexDocument.LogicalScope::sourceRefs)
                .orElseThrow(() -> new IllegalArgumentException("Selected scope was not found in snapshot: " + objectId));
            case "ENTITY" -> Optional.ofNullable(document.entities()).orElse(List.of()).stream()
                .filter(entity -> objectId.equals(entity.id()))
                .findFirst()
                .map(ArchitectureIndexDocument.ArchitectureEntity::sourceRefs)
                .orElseThrow(() -> new IllegalArgumentException("Selected entity was not found in snapshot: " + objectId));
            case "RELATIONSHIP" -> Optional.ofNullable(document.relationships()).orElse(List.of()).stream()
                .filter(relationship -> objectId.equals(relationship.id()))
                .findFirst()
                .map(ArchitectureIndexDocument.ArchitectureRelationship::sourceRefs)
                .orElseThrow(() -> new IllegalArgumentException("Selected relationship was not found in snapshot: " + objectId));
            case "DIAGNOSTIC" -> Optional.ofNullable(document.diagnostics()).orElse(List.of()).stream()
                .filter(diagnostic -> objectId.equals(diagnostic.id()))
                .findFirst()
                .map(diagnostic -> {
                    if (diagnostic.sourceRefs() != null && !diagnostic.sourceRefs().isEmpty()) {
                        return diagnostic.sourceRefs();
                    }
                    if (!isBlank(diagnostic.filePath())) {
                        return List.of(new ArchitectureIndexDocument.SourceReference(diagnostic.filePath(), null, null, null, java.util.Map.of()));
                    }
                    return List.<ArchitectureIndexDocument.SourceReference>of();
                })
                .orElseThrow(() -> new IllegalArgumentException("Selected diagnostic was not found in snapshot: " + objectId));
            default -> throw new IllegalArgumentException("Unsupported selectedObjectType for source view: " + request.selectedObjectType());
        };
        List<ArchitectureIndexDocument.SourceReference> usableRefs = Optional.ofNullable(sourceRefs).orElse(List.of()).stream()
            .filter(ref -> ref != null && !isBlank(ref.path()))
            .toList();
        if (usableRefs.isEmpty()) {
            throw new IllegalArgumentException("Selected object does not contain a readable source reference.");
        }
        if (request.sourceRefIndex() != null) {
            int index = request.sourceRefIndex();
            if (index < 0 || index >= usableRefs.size()) {
                throw new IllegalArgumentException("Requested sourceRefIndex is out of range for the selected object.");
            }
            return usableRefs.get(index);
        }
        return usableRefs.getFirst();
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
