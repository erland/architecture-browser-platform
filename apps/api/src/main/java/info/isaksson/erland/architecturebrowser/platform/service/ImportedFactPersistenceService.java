package info.isaksson.erland.architecturebrowser.platform.service;

import info.isaksson.erland.architecturebrowser.platform.contract.ArchitectureIndexDocument;
import info.isaksson.erland.architecturebrowser.platform.domain.FactType;
import info.isaksson.erland.architecturebrowser.platform.domain.ImportedFactEntity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.Locale;
import java.util.UUID;

@ApplicationScoped
public class ImportedFactPersistenceService {
    @Inject
    JsonSupport jsonSupport;

    public void persistFacts(String snapshotId, ArchitectureIndexDocument document) {
        document.scopes().forEach(scope -> persistFact(snapshotId, FactType.SCOPE, scope.id(), scope.kind(), scope.name(), scope.displayName(), scope.parentScopeId(), null, null, null, scope));
        document.entities().forEach(entity -> persistFact(snapshotId, FactType.ENTITY, entity.id(), entity.kind(), entity.name(), entity.displayName(), entity.scopeId(), null, null, null, entity));
        document.relationships().forEach(relationship -> persistFact(snapshotId, FactType.RELATIONSHIP, relationship.id(), relationship.kind(), relationship.id(), relationship.label(), null, relationship.fromEntityId(), relationship.toEntityId(), relationship.label(), relationship));
        document.diagnostics().forEach(diagnostic -> persistFact(snapshotId, FactType.DIAGNOSTIC, diagnostic.id(), diagnostic.code(), diagnostic.code(), diagnostic.message(), diagnostic.scopeId(), null, diagnostic.entityId(), diagnostic.message(), diagnostic));
    }

    private void persistFact(String snapshotId, FactType factType, String externalId, String factKind, String name, String displayName, String scopeExternalId, String fromExternalId, String toExternalId, String summary, Object payload) {
        ImportedFactEntity fact = new ImportedFactEntity();
        fact.id = factType.name().toLowerCase(Locale.ROOT) + "-" + UUID.randomUUID();
        fact.snapshotId = snapshotId;
        fact.factType = factType;
        fact.externalId = externalId;
        fact.factKind = factKind;
        fact.name = name;
        fact.displayName = displayName;
        fact.scopeExternalId = scopeExternalId;
        fact.fromExternalId = fromExternalId;
        fact.toExternalId = toExternalId;
        fact.summary = summary;
        fact.payloadJson = jsonSupport.write(payload);
        fact.persist();
    }
}
