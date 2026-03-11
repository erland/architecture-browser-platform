package info.isaksson.erland.architecturebrowser.platform.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import info.isaksson.erland.architecturebrowser.platform.contract.ArchitectureIndexDocument;
import info.isaksson.erland.architecturebrowser.platform.domain.*;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.time.Instant;
import java.util.Locale;
import java.util.UUID;

@ApplicationScoped
public class StubImportService {
    @Inject
    ObjectMapper objectMapper;

    @Inject
    JsonSupport jsonSupport;

    @Inject
    DomainSeedService domainSeedService;

    @Transactional
    public StubImportResult importPayload(JsonNode payload) {
        ArchitectureIndexDocument document = objectMapper.convertValue(payload, ArchitectureIndexDocument.class);

        String workspaceId = deterministicId("ws", document.source().repositoryId());
        String repositoryRegistrationId = deterministicId("repo", document.source().repositoryId());
        String snapshotId = "snap-" + UUID.randomUUID();

        domainSeedService.ensureWorkspaceAndRepository(
            workspaceId,
            slug(document.source().repositoryId()),
            repositoryRegistrationId,
            slug(document.source().repositoryId()),
            document.source().repositoryId(),
            document.source().path(),
            document.source().remoteUrl(),
            document.source().branch()
        );

        SnapshotEntity snapshot = new SnapshotEntity();
        snapshot.id = snapshotId;
        snapshot.workspaceId = workspaceId;
        snapshot.repositoryRegistrationId = repositoryRegistrationId;
        snapshot.runId = null;
        snapshot.snapshotKey = document.source().repositoryId() + "-" + Instant.now().toEpochMilli();
        snapshot.status = SnapshotStatus.READY;
        snapshot.completenessStatus = CompletenessStatus.valueOf(document.completeness().status());
        snapshot.schemaVersion = document.schemaVersion();
        snapshot.indexerVersion = document.indexerVersion();
        snapshot.sourceRepositoryId = document.source().repositoryId();
        snapshot.sourceRevision = document.source().revision();
        snapshot.sourceBranch = document.source().branch();
        snapshot.importedAt = Instant.now();
        snapshot.scopeCount = document.scopes().size();
        snapshot.entityCount = document.entities().size();
        snapshot.relationshipCount = document.relationships().size();
        snapshot.diagnosticCount = document.diagnostics().size();
        snapshot.indexedFileCount = document.completeness().indexedFileCount();
        snapshot.totalFileCount = document.completeness().totalFileCount();
        snapshot.degradedFileCount = document.completeness().degradedFileCount();
        snapshot.rawPayloadJson = jsonSupport.write(payload);
        snapshot.metadataJson = jsonSupport.write(document.metadata());
        snapshot.persist();

        for (ArchitectureIndexDocument.LogicalScope scope : document.scopes()) {
            persistFact(snapshotId, FactType.SCOPE, scope.id(), scope.kind(), scope.name(), scope.displayName(), scope.parentScopeId(), null, null, null, scope);
        }
        for (ArchitectureIndexDocument.ArchitectureEntity entity : document.entities()) {
            persistFact(snapshotId, FactType.ENTITY, entity.id(), entity.kind(), entity.name(), entity.displayName(), entity.scopeId(), null, null, null, entity);
        }
        for (ArchitectureIndexDocument.ArchitectureRelationship relationship : document.relationships()) {
            persistFact(snapshotId, FactType.RELATIONSHIP, relationship.id(), relationship.kind(), relationship.id(), relationship.label(), null, relationship.fromEntityId(), relationship.toEntityId(), relationship.label(), relationship);
        }
        for (ArchitectureIndexDocument.Diagnostic diagnostic : document.diagnostics()) {
            persistFact(snapshotId, FactType.DIAGNOSTIC, diagnostic.id(), diagnostic.code(), diagnostic.code(), diagnostic.message(), diagnostic.scopeId(), null, diagnostic.entityId(), diagnostic.message(), diagnostic);
        }

        AuditEventEntity auditEvent = new AuditEventEntity();
        auditEvent.id = "audit-" + UUID.randomUUID();
        auditEvent.workspaceId = workspaceId;
        auditEvent.repositoryRegistrationId = repositoryRegistrationId;
        auditEvent.runId = null;
        auditEvent.snapshotId = snapshotId;
        auditEvent.eventType = "SNAPSHOT_IMPORTED_STUB";
        auditEvent.actorType = AuditActorType.SYSTEM;
        auditEvent.actorId = "step2-import-contract";
        auditEvent.happenedAt = Instant.now();
        auditEvent.detailsJson = jsonSupport.write(payload);
        auditEvent.persist();

        return new StubImportResult(workspaceId, repositoryRegistrationId, snapshotId, snapshot.scopeCount, snapshot.entityCount, snapshot.relationshipCount, snapshot.diagnosticCount);
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

    private static String deterministicId(String prefix, String value) {
        return prefix + "-" + slug(value);
    }

    private static String slug(String value) {
        return value.toLowerCase(Locale.ROOT)
            .replaceAll("[^a-z0-9]+", "-")
            .replaceAll("(^-|-$)", "");
    }
}
