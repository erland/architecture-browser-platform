package info.isaksson.erland.architecturebrowser.platform.service.management;

import info.isaksson.erland.architecturebrowser.platform.api.dto.WorkspaceDtos.CreateWorkspaceRequest;
import info.isaksson.erland.architecturebrowser.platform.api.dto.WorkspaceDtos.UpdateWorkspaceRequest;
import info.isaksson.erland.architecturebrowser.platform.api.dto.WorkspaceDtos.WorkspaceResponse;
import info.isaksson.erland.architecturebrowser.platform.domain.WorkspaceEntity;
import info.isaksson.erland.architecturebrowser.platform.domain.WorkspaceStatus;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class WorkspaceManagementService {
    @Inject
    WorkspaceManagementValidator validator;

    @Inject
    AuditService auditService;

    @Inject
    WorkspaceResponseMapper workspaceResponseMapper;

    @Inject
    ManagementStringSupport managementStringSupport;

    @Transactional
    public WorkspaceResponse create(CreateWorkspaceRequest request) {
        validator.validateForCreate(request);
        String normalizedKey = request.workspaceKey().trim();
        if (WorkspaceEntity.find("workspaceKey", normalizedKey).firstResult() != null) {
            throw new ConflictException("Workspace key already exists: " + normalizedKey);
        }
        Instant now = Instant.now();
        WorkspaceEntity entity = new WorkspaceEntity();
        entity.id = UUID.randomUUID().toString();
        entity.workspaceKey = normalizedKey;
        entity.name = request.name().trim();
        entity.description = managementStringSupport.normalizeNullable(request.description());
        entity.status = WorkspaceStatus.ACTIVE;
        entity.createdAt = now;
        entity.updatedAt = now;
        entity.persist();

        auditService.recordWorkspaceEvent(entity.id, "workspace.created",
            "{\"workspaceKey\":\"" + managementStringSupport.escapeJson(entity.workspaceKey) + "\"}");
        return workspaceResponseMapper.toResponse(entity);
    }

    public List<WorkspaceResponse> list() {
        return WorkspaceEntity.<WorkspaceEntity>listAll().stream()
            .sorted((left, right) -> left.createdAt.compareTo(right.createdAt))
            .map(workspaceResponseMapper::toResponse)
            .toList();
    }

    public WorkspaceResponse get(String workspaceId) {
        return workspaceResponseMapper.toResponse(requireWorkspace(workspaceId));
    }

    @Transactional
    public WorkspaceResponse update(String workspaceId, UpdateWorkspaceRequest request) {
        validator.validateForUpdate(request);
        WorkspaceEntity entity = requireWorkspace(workspaceId);
        entity.name = request.name().trim();
        entity.description = managementStringSupport.normalizeNullable(request.description());
        entity.updatedAt = Instant.now();
        auditService.recordWorkspaceEvent(entity.id, "workspace.updated",
            "{\"name\":\"" + managementStringSupport.escapeJson(entity.name) + "\"}");
        return workspaceResponseMapper.toResponse(entity);
    }

    @Transactional
    public WorkspaceResponse archive(String workspaceId) {
        WorkspaceEntity entity = requireWorkspace(workspaceId);
        entity.status = WorkspaceStatus.ARCHIVED;
        entity.updatedAt = Instant.now();
        auditService.recordWorkspaceEvent(entity.id, "workspace.archived", "{}");
        return workspaceResponseMapper.toResponse(entity);
    }

    public WorkspaceEntity requireWorkspace(String workspaceId) {
        WorkspaceEntity entity = WorkspaceEntity.findById(workspaceId);
        if (entity == null) {
            throw new NotFoundException("Workspace not found: " + workspaceId);
        }
        return entity;
    }

}
