import type { Protocol } from '@/domain/shared';

export type Period = 'day' | 'week' | 'month';

export interface InvocationPoint {
  /** ISO hour (day period) or ISO date (week, month). */
  at: string;
  calls: number;
}

export interface Invocations {
  serviceId: string;
  period: Period;
  points: InvocationPoint[];
  total: number;
}

export interface DomainConformance {
  domain: string;
  /** 0..100, null when nothing is tested. */
  score: number | null;
  services: number;
}

/** One mock call, as shown in Live traces and in the Cockpit ticker. */
export interface TraceCall {
  seq: number;
  callId: string;
  at: string;
  serviceId: string;
  serviceName: string;
  protocol: Protocol;
  method: string;
  path: string;
  status: number;
  ms: number;
  /** Example that answered the call. */
  exampleName?: string;
  operationId?: string;
  /** W3C baggage when the call belongs to an Arazzo run (see `baggage()`). */
  baggage?: string;
  request?: { headers: Record<string, string>; body?: string };
  response?: { headers: Record<string, string>; body?: string };
}

export interface TraceFilter {
  serviceId?: string;
  protocol?: Protocol;
  status?: 'ok' | 'error';
  arazzoOnly?: boolean;
  /** Arazzo run id (`?run=`). */
  runId?: string;
}
