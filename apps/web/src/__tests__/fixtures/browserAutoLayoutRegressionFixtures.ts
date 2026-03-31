import type { BrowserCanvasEdge, BrowserCanvasNode } from '../../browserSessionStore.types';

export type BrowserAutoLayoutRegressionFixture = {
  name: string;
  mode: 'structure' | 'flow' | 'hierarchy';
  nodes: BrowserCanvasNode[];
  edges: BrowserCanvasEdge[];
};

function createScrambledEntityNodes(ids: string[]): BrowserCanvasNode[] {
  return ids.map((id, index) => ({
    kind: 'entity',
    id,
    x: 1600 - (index % 4) * 280 + Math.floor(index / 4) * 95,
    y: 1200 - Math.floor(index / 4) * 260 + (index % 3) * 70,
  }));
}

export const REPOSITORY_SERVICE_CLUSTER_FIXTURE: BrowserAutoLayoutRegressionFixture = {
  name: 'repository/service clusters',
  mode: 'structure',
  nodes: createScrambledEntityNodes([
    'catalog-api',
    'catalog-service',
    'catalog-repository',
    'billing-api',
    'billing-service',
    'billing-repository',
    'shared-events',
  ]),
  edges: [
    { relationshipId: 'rel-catalog-api-service', fromEntityId: 'catalog-api', toEntityId: 'catalog-service' },
    { relationshipId: 'rel-catalog-service-repository', fromEntityId: 'catalog-service', toEntityId: 'catalog-repository' },
    { relationshipId: 'rel-billing-api-service', fromEntityId: 'billing-api', toEntityId: 'billing-service' },
    { relationshipId: 'rel-billing-service-repository', fromEntityId: 'billing-service', toEntityId: 'billing-repository' },
    { relationshipId: 'rel-catalog-service-events', fromEntityId: 'catalog-service', toEntityId: 'shared-events' },
    { relationshipId: 'rel-billing-service-events', fromEntityId: 'billing-service', toEntityId: 'shared-events' },
  ],
};

export const PERSISTENCE_VIEWPOINT_FIXTURE: BrowserAutoLayoutRegressionFixture = {
  name: 'persistence viewpoint',
  mode: 'hierarchy',
  nodes: createScrambledEntityNodes([
    'order-domain-service',
    'order-repository',
    'order-entity',
    'order-line-entity',
    'payment-repository',
    'payment-entity',
  ]),
  edges: [
    { relationshipId: 'rel-service-order-repository', fromEntityId: 'order-domain-service', toEntityId: 'order-repository' },
    { relationshipId: 'rel-service-payment-repository', fromEntityId: 'order-domain-service', toEntityId: 'payment-repository' },
    { relationshipId: 'rel-order-repository-entity', fromEntityId: 'order-repository', toEntityId: 'order-entity' },
    { relationshipId: 'rel-order-entity-line', fromEntityId: 'order-entity', toEntityId: 'order-line-entity' },
    { relationshipId: 'rel-payment-repository-entity', fromEntityId: 'payment-repository', toEntityId: 'payment-entity' },
  ],
};

export const REQUEST_FLOW_MAP_FIXTURE: BrowserAutoLayoutRegressionFixture = {
  name: 'request flow map',
  mode: 'flow',
  nodes: createScrambledEntityNodes([
    'ingress-gateway',
    'rest-controller',
    'application-service',
    'domain-service',
    'repository-adapter',
    'postgres',
    'event-publisher',
  ]),
  edges: [
    { relationshipId: 'rel-gateway-controller', fromEntityId: 'ingress-gateway', toEntityId: 'rest-controller' },
    { relationshipId: 'rel-controller-app', fromEntityId: 'rest-controller', toEntityId: 'application-service' },
    { relationshipId: 'rel-app-domain', fromEntityId: 'application-service', toEntityId: 'domain-service' },
    { relationshipId: 'rel-domain-repository', fromEntityId: 'domain-service', toEntityId: 'repository-adapter' },
    { relationshipId: 'rel-repository-postgres', fromEntityId: 'repository-adapter', toEntityId: 'postgres' },
    { relationshipId: 'rel-app-publisher', fromEntityId: 'application-service', toEntityId: 'event-publisher' },
  ],
};

export const DISCONNECTED_MODULE_GROUPS_FIXTURE: BrowserAutoLayoutRegressionFixture = {
  name: 'disconnected module groups',
  mode: 'structure',
  nodes: createScrambledEntityNodes([
    'ui-shell',
    'ui-navigation',
    'ui-details',
    'batch-loader',
    'batch-parser',
    'batch-exporter',
    'ops-console',
  ]),
  edges: [
    { relationshipId: 'rel-ui-shell-nav', fromEntityId: 'ui-shell', toEntityId: 'ui-navigation' },
    { relationshipId: 'rel-ui-shell-details', fromEntityId: 'ui-shell', toEntityId: 'ui-details' },
    { relationshipId: 'rel-batch-loader-parser', fromEntityId: 'batch-loader', toEntityId: 'batch-parser' },
    { relationshipId: 'rel-batch-parser-exporter', fromEntityId: 'batch-parser', toEntityId: 'batch-exporter' },
  ],
};

export const HUB_AND_SPOKE_FIXTURE: BrowserAutoLayoutRegressionFixture = {
  name: 'hub and spoke dependencies',
  mode: 'structure',
  nodes: createScrambledEntityNodes([
    'integration-hub',
    'sales-adapter',
    'inventory-adapter',
    'shipping-adapter',
    'pricing-adapter',
    'notifications-adapter',
  ]),
  edges: [
    { relationshipId: 'rel-hub-sales', fromEntityId: 'integration-hub', toEntityId: 'sales-adapter' },
    { relationshipId: 'rel-hub-inventory', fromEntityId: 'integration-hub', toEntityId: 'inventory-adapter' },
    { relationshipId: 'rel-hub-shipping', fromEntityId: 'integration-hub', toEntityId: 'shipping-adapter' },
    { relationshipId: 'rel-hub-pricing', fromEntityId: 'integration-hub', toEntityId: 'pricing-adapter' },
    { relationshipId: 'rel-hub-notifications', fromEntityId: 'integration-hub', toEntityId: 'notifications-adapter' },
  ],
};

export const BROWSER_AUTO_LAYOUT_REGRESSION_FIXTURES: BrowserAutoLayoutRegressionFixture[] = [
  REPOSITORY_SERVICE_CLUSTER_FIXTURE,
  PERSISTENCE_VIEWPOINT_FIXTURE,
  REQUEST_FLOW_MAP_FIXTURE,
  DISCONNECTED_MODULE_GROUPS_FIXTURE,
  HUB_AND_SPOKE_FIXTURE,
];
