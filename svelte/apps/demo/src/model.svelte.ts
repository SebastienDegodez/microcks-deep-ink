import { services } from './data';

export const demo = $state({
  services: [...services],
  workflowTarget: 'implementations',
  workflowSourcesLinked: false,
  behaviors: {} as Record<
    string,
    { dispatcher: string; delay: string; rule: string }
  >,
  descriptions: {} as Record<string, string>,
  configuration: { name: 'microcks.local', url: 'http://microcks.local:8080' },
  sources: [
    {
      id: 'pastry',
      name: 'pastry-openapi.yaml',
      type: 'Git',
      status: 'Synced',
      services: 'API Pastry 2.0',
      at: '2 h ago',
    },
    {
      id: 'orders',
      name: 'pastry-orders.yaml',
      type: 'Upload',
      status: 'Imported',
      services: 'Pastry orders API',
      at: 'yesterday',
    },
    {
      id: 'arazzo',
      name: 'pastry-arazzo.yaml',
      type: 'URL',
      status: 'Needs attention',
      services: '3 workflows',
      at: '3 h ago',
    },
  ],
  examples: [
    { id: 'millefeuille', name: 'Millefeuille', price: 3.9, size: 'M' },
    { id: 'eclair', name: 'Eclair', price: 2.5, size: 'M' },
    { id: 'baba', name: 'Baba', price: 4.2, size: 'L' },
  ],
  tests: [
    {
      id: '119',
      serviceId: 'pastry2',
      service: 'API Pastry 2.0',
      runner: 'OPEN_API_SCHEMA',
      result: 'Failed',
      passed: 3,
      total: 4,
      at: '2 min ago',
    },
    {
      id: '118',
      serviceId: 'orders',
      service: 'Pastry orders API',
      runner: 'ASYNC_API_SCHEMA',
      result: 'Conformant',
      passed: 2,
      total: 2,
      at: '1 h ago',
    },
    {
      id: '117',
      serviceId: 'pastry2',
      service: 'API Pastry 2.0',
      runner: 'OPEN_API_SCHEMA',
      result: 'Conformant',
      passed: 4,
      total: 4,
      at: 'yesterday',
    },
  ],
  installed: [] as string[],
  secrets: [
    { id: 'staging', name: 'staging-api', kind: 'Token', summary: '••••••••' },
  ],
  users: [
    {
      id: 'ma',
      name: 'Morgan Avery',
      email: 'morgan@example.test',
      role: 'admin',
      group: 'platform',
    },
    {
      id: 'sam',
      name: 'Sam Lee',
      email: 'sam@example.test',
      role: 'user',
      group: 'pastry',
    },
  ],
  snapshots: [
    {
      id: 'snapshot-1',
      name: 'Before staging test',
      at: 'yesterday',
      size: '9 services',
    },
  ],
});
