import { runBrowserAutoLayout } from '../../browser-auto-layout';
import {
  DISCONNECTED_MODULE_GROUPS_FIXTURE,
  HUB_AND_SPOKE_FIXTURE,
  PERSISTENCE_VIEWPOINT_FIXTURE,
  REQUEST_FLOW_MAP_FIXTURE,
  REPOSITORY_SERVICE_CLUSTER_FIXTURE,
} from './fixtures/browserAutoLayoutRegressionFixtures';

function mapNodesById(nodes: Array<{ id: string; x: number; y: number }>) {
  return Object.fromEntries(nodes.map((node) => [node.id, node]));
}

function getSpan(values: number[]) {
  return Math.max(...values) - Math.min(...values);
}

describe('browser auto-layout regression fixtures', () => {
  it('keeps repository/service clusters compact instead of falling back to a blind grid', () => {
    const result = runBrowserAutoLayout({
      mode: REPOSITORY_SERVICE_CLUSTER_FIXTURE.mode,
      nodes: REPOSITORY_SERVICE_CLUSTER_FIXTURE.nodes,
      edges: REPOSITORY_SERVICE_CLUSTER_FIXTURE.edges,
      config: { cleanupIntensity: 'basic' },
    });

    const byId = mapNodesById(result.nodes);
    expect(result.mode).toBe('structure');

    expect(byId['catalog-api'].x).toBeLessThan(byId['catalog-service'].x);
    expect(byId['catalog-service'].x).toBeLessThan(byId['catalog-repository'].x);
    expect(byId['billing-api'].x).toBeLessThan(byId['billing-service'].x);
    expect(byId['billing-service'].x).toBeLessThan(byId['billing-repository'].x);
    expect(byId['shared-events'].x).toBeGreaterThan(byId['catalog-service'].x);
    expect(byId['shared-events'].x).toBeGreaterThan(byId['billing-service'].x);

    const catalogBand = [byId['catalog-api'].y, byId['catalog-service'].y, byId['catalog-repository'].y];
    const billingBand = [byId['billing-api'].y, byId['billing-service'].y, byId['billing-repository'].y];
    expect(getSpan(catalogBand)).toBeLessThanOrEqual(360);
    expect(getSpan(billingBand)).toBeLessThanOrEqual(360);
  });

  it('keeps persistence viewpoint chains top-to-bottom with sibling repositories grouped under the domain service', () => {
    const result = runBrowserAutoLayout({
      mode: PERSISTENCE_VIEWPOINT_FIXTURE.mode,
      nodes: PERSISTENCE_VIEWPOINT_FIXTURE.nodes,
      edges: PERSISTENCE_VIEWPOINT_FIXTURE.edges,
      config: { cleanupIntensity: 'basic' },
    });

    const byId = mapNodesById(result.nodes);
    expect(result.mode).toBe('hierarchy');
    expect(byId['order-domain-service'].y).toBeLessThan(byId['order-repository'].y);
    expect(byId['order-domain-service'].y).toBeLessThan(byId['payment-repository'].y);
    expect(byId['order-repository'].y).toBeLessThan(byId['order-entity'].y);
    expect(byId['order-entity'].y).toBeLessThan(byId['order-line-entity'].y);
    expect(byId['payment-repository'].y).toBeLessThan(byId['payment-entity'].y);
    expect(Math.abs(byId['order-repository'].y - byId['payment-repository'].y)).toBeLessThanOrEqual(180);
  });

  it('keeps request flow maps predominantly left-to-right while preserving branch readability', () => {
    const result = runBrowserAutoLayout({
      mode: REQUEST_FLOW_MAP_FIXTURE.mode,
      nodes: REQUEST_FLOW_MAP_FIXTURE.nodes,
      edges: REQUEST_FLOW_MAP_FIXTURE.edges,
      config: { cleanupIntensity: 'basic' },
    });

    const byId = mapNodesById(result.nodes);
    expect(result.mode).toBe('flow');
    expect(byId['ingress-gateway'].x).toBeLessThan(byId['rest-controller'].x);
    expect(byId['rest-controller'].x).toBeLessThan(byId['application-service'].x);
    expect(byId['application-service'].x).toBeLessThan(byId['domain-service'].x);
    expect(byId['domain-service'].x).toBeLessThan(byId['repository-adapter'].x);
    expect(byId['repository-adapter'].x).toBeLessThan(byId['postgres'].x);
    expect(byId['event-publisher'].x).toBeGreaterThan(byId['application-service'].x);
    expect(Math.abs(byId['event-publisher'].y - byId['domain-service'].y)).toBeLessThanOrEqual(320);
  });

  it('keeps disconnected module groups separated vertically so groups stay readable', () => {
    const result = runBrowserAutoLayout({
      mode: DISCONNECTED_MODULE_GROUPS_FIXTURE.mode,
      nodes: DISCONNECTED_MODULE_GROUPS_FIXTURE.nodes,
      edges: DISCONNECTED_MODULE_GROUPS_FIXTURE.edges,
      config: { cleanupIntensity: 'basic' },
    });

    const byId = mapNodesById(result.nodes);
    const uiGroupCenterY = (byId['ui-shell'].y + byId['ui-navigation'].y + byId['ui-details'].y) / 3;
    const batchGroupCenterY = (byId['batch-loader'].y + byId['batch-parser'].y + byId['batch-exporter'].y) / 3;

    expect(Math.abs(uiGroupCenterY - batchGroupCenterY)).toBeGreaterThanOrEqual(220);
    expect(byId['ops-console'].x).toBeGreaterThanOrEqual(Math.min(byId['ui-shell'].x, byId['batch-loader'].x));
    expect(Number.isFinite(byId['ops-console'].y)).toBe(true);
  });

  it('keeps hub-and-spoke graphs compact around the hub instead of scattering spokes into distant rows', () => {
    const result = runBrowserAutoLayout({
      mode: HUB_AND_SPOKE_FIXTURE.mode,
      nodes: HUB_AND_SPOKE_FIXTURE.nodes,
      edges: HUB_AND_SPOKE_FIXTURE.edges,
      config: { cleanupIntensity: 'basic' },
    });

    const byId = mapNodesById(result.nodes);
    const spokeYs = [
      byId['sales-adapter'].y,
      byId['inventory-adapter'].y,
      byId['shipping-adapter'].y,
      byId['pricing-adapter'].y,
      byId['notifications-adapter'].y,
    ];

    expect(result.mode).toBe('structure');
    expect(spokeYs.every((y) => Math.abs(y - byId['integration-hub'].y) <= 360)).toBe(true);
    expect([ 
      byId['sales-adapter'].x,
      byId['inventory-adapter'].x,
      byId['shipping-adapter'].x,
      byId['pricing-adapter'].x,
      byId['notifications-adapter'].x,
    ].every((x) => x > byId['integration-hub'].x)).toBe(true);
  });
});
