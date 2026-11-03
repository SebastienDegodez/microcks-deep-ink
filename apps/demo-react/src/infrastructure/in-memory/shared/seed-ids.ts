/**
 * Stable ids and constants of the demo data. Every feature seeds from these, so that screens agree
 * with each other (the run #14 bug is the same bug as test run #119).
 */

export const CLOCK_NOW_ISO = '2026-11-03T09:10:04Z';

export const SERVICE_IDS = [
  'pastry2',
  'orders',
  'movie',
  'hellogrpc',
  'petstore',
  'pastry1',
  'rocks',
  'usersignedup',
  'hellosoap',
  'beer',
  'concierge',
] as const;
export type ServiceId = (typeof SERVICE_IDS)[number];

export const MOCK_BASE = 'http://microcks.local:8080/rest/API+Pastry/2.0';
export const STAGING_BASE = 'https://pastry.staging.acme.io/v2';
export const MICROCKS_BASE = 'http://microcks.local:8080';

export const PASTRY_OPERATION_IDS = ['get-list', 'get-name', 'patch-name'] as const;

export const ARAZZO_DOCUMENT_IDS = ['pastry', 'beer'] as const;
export const ARAZZO_DOC = {
  pastry: {
    id: 'pastry',
    apiId: '6728f1c2a4e1b93d5c0e7a14',
    file: 'pastry-workflows.arazzo.yaml',
    arazzoVersion: '1.1.0',
    version: '1.2.0',
    overlay: 'pastry-workflows.arazzo-sources.yaml',
  },
  beer: {
    id: 'beer',
    apiId: '6728f1c2a4e1b93d5c0e7a15',
    file: 'beer-checkout.arazzo.yaml',
    arazzoVersion: '1.0.1',
    version: '0.3.0',
  },
} as const;

export const WORKFLOW_IDS = ['restock-pastry', 'order-pastry', 'compare-prices', 'check-menu', 'checkout-beer'] as const;

/** Workflow run ids by run number. Run #14 is the hero of the demo. */
export const RUN_IDS = {
  14: '6729a1d27e4c0b5f93a8c214',
  13: '67299b3e1f0a4c7d82e5b106',
  12: '67290c5a9d3e41b7a6f8e215',
  11: '6728f8d47b2c4e09a1d3c524',
  15: '6729a3f08b1d6e2c45f7a930',
  16: '6729a4b15c9e7d3a28b0f6e1',
  /** check-menu run number 3 */
  checkMenu3: '6728e1a03c9b4f5d87e2a633',
} as const;

export const TEST_RUN_IDS = { failed: '119', passed: '118', failedBefore: '117' } as const;
export const SESSION_ID = 's-7f3a2c91';
export const SECRET_STAGING = 'pastry-staging-oauth';
