package info.isaksson.erland.architecturebrowser.platform.service.management;

import info.isaksson.erland.architecturebrowser.platform.api.dto.RepositoryDtos.CreateRepositoryRequest;
import info.isaksson.erland.architecturebrowser.platform.api.dto.RepositoryDtos.RepositoryResponse;
import info.isaksson.erland.architecturebrowser.platform.api.dto.RepositoryDtos.UpdateRepositoryRequest;
import info.isaksson.erland.architecturebrowser.platform.domain.RepositoryRegistrationEntity;
import info.isaksson.erland.architecturebrowser.platform.domain.RepositoryStatus;
import info.isaksson.erland.architecturebrowser.platform.domain.WorkspaceEntity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class RepositoryManagementService {
    @Inject
    RepositoryManagementValidator validator;

    @Inject
    WorkspaceManagementService workspaceManagementService;

    @Inject
    AuditService auditService;

    @Transactional
    public RepositoryResponse create(String workspaceId, CreateRepositoryRequest request) {
        validator.validateForCreate(request);
        WorkspaceEntity workspace = workspaceManagementService.requireWorkspace(workspaceId);
        String normalizedKey = request.repositoryKey().trim();
        RepositoryRegistrationEntity existing = RepositoryRegistrationEntity.find(
            "workspaceId = ?1 and repositoryKey = ?2", workspace.id, normalizedKey).firstResult();
        if (existing != null) {
            throw new ConflictException("Repository key already exists in workspace: " + normalizedKey);
        }
        Instant now = Instant.now();
        RepositoryRegistrationEntity entity = new RepositoryRegistrationEntity();
        entity.id = UUID.randomUUID().toString();
        entity.workspaceId = workspace.id;
        entity.repositoryKey = normalizedKey;
        entity.name = request.name().trim();
        entity.sourceType = request.sourceType();
        entity.localPath = normalizeNullable(request.localPath());
        entity.remoteUrl = normalizeNullable(request.remoteUrl());
        entity.defaultBranch = normalizeNullable(request.defaultBranch());
        entity.status = RepositoryStatus.ACTIVE;
        entity.metadataJson = normalizeNullable(request.metadataJson());
        entity.createdAt = now;
        entity.updatedAt = now;
        entity.persist();

        auditService.recordRepositoryEvent(entity.workspaceId, entity.id, "repository.created",
            "{\"repositoryKey\":\"" + escapeJson(entity.repositoryKey) + "\"}");
        return toResponse(entity);
    }

    public List<RepositoryResponse> listByWorkspace(String workspaceId) {
        workspaceManagementService.requireWorkspace(workspaceId);
        return RepositoryRegistrationEntity.<RepositoryRegistrationEntity>list("workspaceId", workspaceId).stream()
            .sorted((left, right) -> left.createdAt.compareTo(right.createdAt))
            .map(this::toResponse)
            .toList();
    }

    public RepositoryResponse get(String workspaceId, String repositoryId) {
        return toResponse(requireRepository(workspaceId, repositoryId));
    }

    @Transactional
    public RepositoryResponse update(String workspaceId, String repositoryId, UpdateRepositoryRequest request) {
        RepositoryRegistrationEntity entity = requireRepository(workspaceId, repositoryId);
        validator.validateForUpdate(request, entity.sourceType);
        entity.name = request.name().trim();
        entity.localPath = normalizeNullable(request.localPath());
        entity.remoteUrl = normalizeNullable(request.remoteUrl());
        entity.defaultBranch = normalizeNullable(request.defaultBranch());
        entity.metadataJson = normalizeNullable(request.metadataJson());
        entity.updatedAt = Instant.now();
        auditService.recordRepositoryEvent(entity.workspaceId, entity.id, "repository.updated",
            "{\"name\":\"" + escapeJson(entity.name) + "\"}");
        return toResponse(entity);
    }

    @Transactional
    public RepositoryResponse archive(String workspaceId, String repositoryId) {
        RepositoryRegistrationEntity entity = requireRepository(workspaceId, repositoryId);
        entity.status = RepositoryStatus.ARCHIVED;
        entity.updatedAt = Instant.now();
        auditService.recordRepositoryEvent(entity.workspaceId, entity.id, "repository.archived", "{}");
        return toResponse(entity);
    }

    public RepositoryRegistrationEntity requireRepository(String workspaceId, String repositoryId) {
        workspaceManagementService.requireWorkspace(workspaceId);
        RepositoryRegistrationEntity entity = RepositoryRegistrationEntity.findById(repositoryId);
        if (entity == null || !workspaceId.equals(entity.workspaceId)) {
            throw new NotFoundException("Repository not found: " + repositoryId);
        }
        return entity;
    }

    public RepositoryResponse toResponse(RepositoryRegistrationEntity entity) {
        return new RepositoryResponse(
            entity.id,
            entity.workspaceId,
            entity.repositoryKey,
            entity.name,
            entity.sourceType,
            entity.localPath,
            entity.remoteUrl,
            entity.defaultBranch,
            entity.status,
            entity.metadataJson,
            entity.createdAt,
            entity.updatedAt
        );
    }

    private String normalizeNullable(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String escapeJson(String value) {
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
