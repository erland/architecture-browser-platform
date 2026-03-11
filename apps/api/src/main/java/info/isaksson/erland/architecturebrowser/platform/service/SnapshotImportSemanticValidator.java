package info.isaksson.erland.architecturebrowser.platform.service;

import info.isaksson.erland.architecturebrowser.platform.contract.ArchitectureIndexDocument;
import info.isaksson.erland.architecturebrowser.platform.service.management.ValidationException;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;

@ApplicationScoped
public class SnapshotImportSemanticValidator {
    public void validate(ArchitectureIndexDocument document) {
        List<String> errors = new ArrayList<>();

        Set<String> scopeIds = new HashSet<>();
        Set<String> entityIds = new HashSet<>();
        Set<String> relationshipIds = new HashSet<>();
        Set<String> diagnosticIds = new HashSet<>();

        document.scopes().forEach(scope -> {
            registerId(errors, scopeIds, scope.id(), "scope");
            if (isBlank(scope.kind())) {
                errors.add("Scope kind is required for scope " + safeId(scope.id()));
            }
            if (isBlank(scope.name())) {
                errors.add("Scope name is required for scope " + safeId(scope.id()));
            }
        });

        document.scopes().forEach(scope -> {
            if (!isBlank(scope.parentScopeId()) && !scopeIds.contains(scope.parentScopeId())) {
                errors.add("Scope " + safeId(scope.id()) + " references missing parent scope " + scope.parentScopeId());
            }
        });

        document.entities().forEach(entity -> {
            registerId(errors, entityIds, entity.id(), "entity");
            if (isBlank(entity.kind())) {
                errors.add("Entity kind is required for entity " + safeId(entity.id()));
            }
            if (isBlank(entity.name())) {
                errors.add("Entity name is required for entity " + safeId(entity.id()));
            }
            if (isBlank(entity.scopeId())) {
                errors.add("Entity " + safeId(entity.id()) + " must reference a scopeId.");
            } else if (!scopeIds.contains(entity.scopeId())) {
                errors.add("Entity " + safeId(entity.id()) + " references missing scope " + entity.scopeId());
            }
        });

        document.relationships().forEach(relationship -> {
            registerId(errors, relationshipIds, relationship.id(), "relationship");
            if (isBlank(relationship.kind())) {
                errors.add("Relationship kind is required for relationship " + safeId(relationship.id()));
            }
            if (isBlank(relationship.fromEntityId()) || !entityIds.contains(relationship.fromEntityId())) {
                errors.add("Relationship " + safeId(relationship.id()) + " references missing fromEntityId " + relationship.fromEntityId());
            }
            if (isBlank(relationship.toEntityId()) || !entityIds.contains(relationship.toEntityId())) {
                errors.add("Relationship " + safeId(relationship.id()) + " references missing toEntityId " + relationship.toEntityId());
            }
        });

        document.diagnostics().forEach(diagnostic -> {
            registerId(errors, diagnosticIds, diagnostic.id(), "diagnostic");
            if (!isBlank(diagnostic.scopeId()) && !scopeIds.contains(diagnostic.scopeId())) {
                errors.add("Diagnostic " + safeId(diagnostic.id()) + " references missing scope " + diagnostic.scopeId());
            }
            if (!isBlank(diagnostic.entityId()) && !entityIds.contains(diagnostic.entityId())) {
                errors.add("Diagnostic " + safeId(diagnostic.id()) + " references missing entity " + diagnostic.entityId());
            }
        });

        if (!errors.isEmpty()) {
            throw new ValidationException(errors);
        }
    }

    private void registerId(List<String> errors, Set<String> seen, String id, String label) {
        if (isBlank(id)) {
            errors.add(capitalize(label) + " id is required.");
            return;
        }
        if (!seen.add(id)) {
            errors.add("Duplicate " + label + " id: " + id);
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private String safeId(String value) {
        return Objects.requireNonNullElse(value, "<missing>");
    }

    private String capitalize(String value) {
        return value.substring(0, 1).toUpperCase() + value.substring(1);
    }
}
