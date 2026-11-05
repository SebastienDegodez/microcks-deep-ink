import type { CiHeader, TestRunner, TestTarget } from '@/domain/testing';

export interface HeaderRow extends CiHeader {
  id: number;
}

export interface Draft {
  serviceId: string;
  endpoint: string;
  runner: TestRunner;
  timeout: string;
  secret: string;
  ops: string[] | null;
  oauth: boolean;
  tokenUri: string;
  clientId: string;
  clientSecret: string;
  scopes: string;
  headers: HeaderRow[];
  nextId: number;
}

export type UpdateDraft = (patch: Partial<Draft>) => void;

export function recommendedRunner(target: TestTarget): TestRunner {
  return (target.runners.find((r) => r.recommended) ?? target.runners[0])?.id ?? 'OPEN_API_SCHEMA';
}

export function initialDraft(target: TestTarget): Draft {
  return {
    serviceId: target.serviceId,
    endpoint: target.endpoint,
    runner: recommendedRunner(target),
    timeout: '10000',
    secret: '',
    ops: target.type === 'EVENT' ? [target.operations[0]?.id ?? ''] : null,
    oauth: false,
    tokenUri: 'https://auth.staging.acme.io/realms/bakery/protocol/openid-connect/token',
    clientId: 'pastry-tests',
    clientSecret: '',
    scopes: 'pastry:read pastry:write',
    headers: [],
    nextId: 1,
  };
}
