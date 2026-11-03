import type { Protocol } from '@/domain/shared';
import type { HubApi, HubPackage } from '@/domain/govern';
import { SERVICES } from '../../shared';

const api = (
  protocol: Protocol,
  name: string,
  versions: string[],
  operations: Record<string, number>,
  examples: Record<string, number>,
  contracts: string,
  postman = false,
): Omit<HubApi, 'inCatalogue'> => ({ protocol, name, versions, operations, examples, contracts, postman });

type RawPackage = { id: string; name: string; category: string; updated: string; description: string; apis: Omit<HubApi, 'inCatalogue'>[] };

/** The packages of the Hub prototype. */
const RAW: RawPackage[] = [
  {
    id: 'banking', name: 'Banking APIs (sample)', category: 'Banking', updated: 'updated Oct 21, 2026',
    description: 'A fictional retail-bank sandbox: list accounts and balances, initiate transfers, subscribe to account movement events. All data is synthetic.',
    apis: [
      api('REST', 'Accounts API', ['1.2.0', '1.1.0'], { '1.2.0': 4, '1.1.0': 3 }, { '1.2.0': 9, '1.1.0': 7 }, 'OpenAPI 3.1 · Postman tests', true),
      api('REST', 'Transfers API', ['1.0.0'], { '1.0.0': 3 }, { '1.0.0': 6 }, 'OpenAPI 3.1 · Postman tests', true),
      api('EVENT', 'Account events', ['0.3.0', '0.2.0'], { '0.3.0': 2, '0.2.0': 1 }, { '0.3.0': 4, '0.2.0': 2 }, 'AsyncAPI 3.0 · Kafka'),
    ],
  },
  {
    id: 'payments', name: 'Payments sandbox', category: 'Payments', updated: 'updated Sep 30, 2026',
    description: 'Card-less payment initiation with status callbacks and refunds. Useful to test checkout flows without a payment provider account.',
    apis: [
      api('REST', 'Payment initiation API', ['2.1.0', '2.0.0'], { '2.1.0': 5, '2.0.0': 4 }, { '2.1.0': 12, '2.0.0': 10 }, 'OpenAPI 3.0 · Postman tests', true),
      api('REST', 'Refunds API', ['1.0.0'], { '1.0.0': 2 }, { '1.0.0': 4 }, 'OpenAPI 3.0'),
      api('EVENT', 'Payment status events', ['1.0.0'], { '1.0.0': 1 }, { '1.0.0': 3 }, 'AsyncAPI 2.6 · Kafka'),
    ],
  },
  {
    id: 'telco', name: 'Telco open APIs', category: 'Telco', updated: 'updated Oct 8, 2026',
    description: 'Network capability APIs in the style of operator open-gateway specs: device location check, SIM swap check and number verification.',
    apis: [
      api('REST', 'Device location', ['0.2.0'], { '0.2.0': 2 }, { '0.2.0': 5 }, 'OpenAPI 3.0'),
      api('REST', 'SIM swap', ['0.4.0', '0.3.0'], { '0.4.0': 2, '0.3.0': 2 }, { '0.4.0': 4, '0.3.0': 4 }, 'OpenAPI 3.0'),
      api('REST', 'Number verification', ['1.0.0'], { '1.0.0': 1 }, { '1.0.0': 3 }, 'OpenAPI 3.0'),
    ],
  },
  {
    id: 'kafka-events', name: 'Kafka event samples', category: 'Events', updated: 'updated Oct 27, 2026',
    description: 'Order, inventory and shipment events with Avro and JSON payloads, to mock topics and test producers against their AsyncAPI.',
    apis: [
      api('EVENT', 'Order lifecycle', ['1.0.0'], { '1.0.0': 3 }, { '1.0.0': 6 }, 'AsyncAPI 3.0 · Avro'),
      api('EVENT', 'Inventory updates', ['0.2.0'], { '0.2.0': 1 }, { '0.2.0': 3 }, 'AsyncAPI 3.0 · JSON Schema'),
      api('EVENT', 'Shipment tracking', ['0.5.0'], { '0.5.0': 2 }, { '0.5.0': 4 }, 'AsyncAPI 2.6 · Avro'),
    ],
  },
  {
    id: 'pastry', name: 'Pastry samples', category: 'Samples', updated: 'updated Oct 14, 2026',
    description: 'The bakery demo used throughout the Microcks tutorials: a REST API to list and update pastries, and the events emitted when an order is placed.',
    apis: [
      api('REST', 'API Pastry', ['2.0', '1.0'], { '2.0': 3, '1.0': 3 }, { '2.0': 7, '1.0': 5 }, 'OpenAPI 3.0 · Postman collection', true),
      api('EVENT', 'Pastry orders API', ['0.1.0'], { '0.1.0': 1 }, { '0.1.0': 2 }, 'AsyncAPI 2.6 · Kafka'),
    ],
  },
  {
    id: 'multi-samples', name: 'Multi-protocol samples', category: 'Samples', updated: 'updated Sep 9, 2026',
    description: 'One small API per protocol to discover how Microcks mocks gRPC, GraphQL, SOAP and events side by side.',
    apis: [
      api('gRPC', 'HelloService', ['v1'], { v1: 1 }, { v1: 2 }, 'Protobuf · metadata examples'),
      api('GRAPHQL', 'Movie Graph API', ['1.0'], { '1.0': 3 }, { '1.0': 4 }, 'GraphQL schema · Postman', true),
      api('SOAP', 'HelloService Mock', ['0.9'], { '0.9': 1 }, { '0.9': 2 }, 'SoapUI project'),
      api('EVENT', 'User signed-up API', ['0.1.1'], { '0.1.1': 1 }, { '0.1.1': 2 }, 'AsyncAPI 2.6'),
    ],
  },
  {
    id: 'weather', name: 'Weather forecast', category: 'Samples', updated: 'updated Aug 18, 2026',
    description: 'A single-operation REST API returning forecasts by region, with a Postman collection that doubles as contract tests.',
    apis: [api('REST', 'WeatherForecast API', ['1.1.0', '1.0.0'], { '1.1.0': 1, '1.0.0': 1 }, { '1.1.0': 5, '1.0.0': 4 }, 'OpenAPI 3.0 · Postman tests', true)],
  },
  {
    id: 'retail', name: 'Retail catalog samples', category: 'Retail', updated: 'updated Oct 2, 2026',
    description: 'The same product domain in three styles: a REST catalog, a GraphQL product graph and a gRPC stock service.',
    apis: [
      api('REST', 'Product catalog', ['1.0.0'], { '1.0.0': 4 }, { '1.0.0': 8 }, 'OpenAPI 3.1'),
      api('GRAPHQL', 'Product graph', ['0.3.0'], { '0.3.0': 2 }, { '0.3.0': 3 }, 'GraphQL schema · examples'),
      api('gRPC', 'StockService', ['v1'], { v1: 2 }, { v1: 4 }, 'Protobuf · metadata examples'),
    ],
  },
];

/** Packages with the "already in this catalogue" flag computed from the seeded services. */
export function seedPackages(): HubPackage[] {
  const inCatalogue = new Set(SERVICES.map((s) => `${s.name} ${s.version}`));
  return RAW.map((pkg) => {
    const apis: HubApi[] = pkg.apis.map((a) => ({ ...a, inCatalogue: a.versions.filter((v) => inCatalogue.has(`${a.name} ${v}`)) }));
    return {
      id: pkg.id,
      name: pkg.name,
      category: pkg.category,
      description: pkg.description,
      updated: pkg.updated,
      apis,
      apiCount: apis.length,
      versions: [...new Set(apis.flatMap((a) => a.versions))],
      // API Pastry is already installed in the demo instance.
      installed: pkg.id === 'pastry',
    };
  });
}

/** Category order of the prototype chips. */
export const CATEGORY_ORDER = ['Samples', 'Banking', 'Payments', 'Telco', 'Events', 'Retail'];
