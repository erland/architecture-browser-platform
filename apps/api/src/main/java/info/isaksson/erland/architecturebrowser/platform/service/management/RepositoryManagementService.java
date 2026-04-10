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

    @Inject
    RepositoryResponseMapper repositoryResponseMapper;

    @Inject
    ManagementStringSupport managementStringSupport;

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
        entity.localPath = managementStringSupport.normalizeNullable(request.localPath());
        entity.remoteUrl = managementStringSupport.normalizeNullable(request.remoteUrl());
        entity.defaultBranch = managementStringSupport.normalizeNullable(request.defaultBranch());
        entity.status = RepositoryStatus.ACTIVE;
        entity.metadataJson = managementStringSupport.normalizeNullable(request.metadataJson());
        entity.createdAt = now;
        entity.updatedAt = now;
        entity.persist();

        auditService.recordRepositoryEvent(entity.workspaceId, entity.id, "repository.created",
            "{\"repositoryKey\":\"" + managementStringSupport.escapeJson(entity.repositoryKey) + "\"}");
        return repositoryResponseMapper.toResponse(entity);
    }

    public List<RepositoryResponse> listByWorkspace(String workspaceId) {
        workspaceManagementService.requireWorkspace(workspaceId);
        return RepositoryRegistrationEntity.<RepositoryRegistrationEntity>list("workspaceId", workspaceId).stream()
            .sorted((left, right) -> left.createdAt.compareTo(right.createdAt))
            .map(repositoryResponseMapper::toResponse)
            .toList();
    }

    public RepositoryResponse get(String workspaceId, String repositoryId) {
        return repositoryResponseMapper.toResponse(requireRepository(workspaceId, repositoryId));
    }

    @Transactional
    public RepositoryResponse update(String workspaceId, String repositoryId, UpdateRepositoryRequest request) {
        RepositoryRegistrationEntity entity = requireRepository(workspaceId, repositoryId);
        validator.validateForUpdate(request, entity.sourceType);
        entity.name = request.name().trim();
        entity.localPath = managementStringSupport.normalizeNullable(request.localPath());
        entity.remoteUrl = managementStringSupport.normalizeNullable(request.remoteUrl());
        entity.defaultBranch = managementStringSupport.normalizeNullable(request.defaultBranch());
        entity.metadataJson = managementStringSupport.normalizeNullable(request.metadataJson());
        entity.updatedAt = Instant.now();
        auditService.recordRepositoryEvent(entity.workspaceId, entity.id, "repository.updated",
            "{\"name\":\"" + managementStringSupport.escapeJson(entity.name) + "\"}");
        return repositoryResponseMapper.toResponse(entity);
    }

    @Transactional
    public RepositoryResponse archive(String workspaceId, String repositoryId) {
        RepositoryRegistrationEntity entity = requireRepository(workspaceId, repositoryId);
        entity.status = RepositoryStatus.ARCHIVED;
        entity.updatedAt = Instant.now();
        auditService.recordRepositoryEvent(entity.workspaceId, entity.id, "repository.archived", "{}");
        return repositoryResponseMapper.toResponse(entity);
    }

    public RepositoryRegistrationEntity requireRepository(String workspaceId, String repositoryId) {
        workspaceManagementService.requireWorkspace(workspaceId);
        RepositoryRegistrationEntity entity = RepositoryRegistrationEntity.findById(repositoryId);
        if (entity == null || !workspaceId.equals(entity.workspaceId)) {
            throw new NotFoundException("Repository not found: " + repositoryId);
        }
        return entity;
    }

}
