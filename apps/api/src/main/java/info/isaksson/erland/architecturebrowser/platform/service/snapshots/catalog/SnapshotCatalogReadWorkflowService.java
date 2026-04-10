package info.isaksson.erland.architecturebrowser.platform.service.snapshots;

import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotPayloadDtos.FullSnapshotPayloadResponse;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotResponseDtos.SnapshotDetailResponse;
import info.isaksson.erland.architecturebrowser.platform.api.dto.SnapshotResponseDtos.SnapshotOverviewResponse;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class SnapshotCatalogReadWorkflowService {
    @Inject
    SnapshotCatalogPayloadLoader payloadLoader;

    @Inject
    SnapshotCatalogResponseAssembler responseAssembler;

    public SnapshotDetailResponse loadDetail(SnapshotCatalogRequestContext context) {
        return responseAssembler.toDetail(payloadLoader.load(context.snapshot(), context.summary()));
    }

    public FullSnapshotPayloadResponse loadFullPayload(SnapshotCatalogRequestContext context) {
        return responseAssembler.toFullPayload(payloadLoader.load(context.snapshot(), context.summary()));
    }

    public SnapshotOverviewResponse loadOverview(SnapshotCatalogRequestContext context) {
        return responseAssembler.toOverview(payloadLoader.load(context.snapshot(), context.summary()));
    }
}
