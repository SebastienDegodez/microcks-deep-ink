import { describe, expect, it } from 'vitest';
import {
  CARD_SECTIONS,
  agentRunPassed,
  cardLines,
  diffCards,
  isTerminalTaskState,
  missingCardFields,
  planChecks,
  sectionRanges,
  serveCardFromMock,
  setupSummary,
  totalsOf,
  transportSample,
  validateSetup,
  type AgentTestSetup,
} from '@microcks/demo-core/domain/agents';
import { conciergeProfile } from '@microcks/demo-core/infrastructure/in-memory/agents/seed/concierge';

const setup: AgentTestSetup = {
  serviceId: 'concierge', cardUrl: 'https://concierge.staging.acme.io/.well-known/agent-card.json', transports: ['jsonrpc', 'http'],
  conversations: ['a', 'b', 'c'], secret: '', timeoutMs: 15000, textMode: 'contains', dataSchema: false,
};

describe('agent task states', () => {
  it('knows the four terminal states of the spec', () => {
    expect(['completed', 'failed', 'rejected', 'canceled'].every((s) => isTerminalTaskState(s as 'failed'))).toBe(true);
    expect(isTerminalTaskState('input-required')).toBe(false);
    expect(isTerminalTaskState('working')).toBe(false);
  });
});

describe('Agent Card', () => {
  const profile = conciergeProfile();

  it('serves a copy that only rewrites the interfaces, in the same order', () => {
    const mock = serveCardFromMock(profile);
    expect(mock.supportedInterfaces.map((i) => i.protocolBinding)).toEqual(['JSONRPC', 'HTTP+JSON', 'GRPC']);
    expect(mock.supportedInterfaces[0]?.url).toBe('http://microcks.local:8080/a2a/Pastry+concierge/1.0/jsonrpc');
    expect({ ...mock, supportedInterfaces: [] }).toEqual({ ...profile.card, supportedInterfaces: [] });
  });

  it('diffs three changed lines as three removals and three additions', () => {
    const diff = diffCards(cardLines(profile.card), cardLines(serveCardFromMock(profile)));
    expect(diff.filter((l) => l.mark === '-')).toHaveLength(3);
    expect(diff.filter((l) => l.mark === '+')).toHaveLength(3);
  });

  it('finds the line range of each outline section', () => {
    const lines = cardLines(profile.card);
    const ranges = sectionRanges(lines);
    expect(Object.keys(ranges)).toEqual(CARD_SECTIONS.map((s) => s.key));
    const skills = ranges.skills;
    expect(skills?.[0]).toBeGreaterThan(ranges.securitySchemes?.[1] ?? 0);
    expect(skills?.[1]).toBe(lines.length - 1);
  });

  it('reports the required fields that are missing', () => {
    expect(missingCardFields(profile.card)).toEqual([]);
    expect(missingCardFields({ ...profile.card, skills: undefined } as never)).toEqual(['skills']);
  });
});

describe('mock calls', () => {
  const [jsonrpc, http, grpc] = conciergeProfile().transports;
  it('writes one sample per binding with the A2A-Version header', () => {
    expect(transportSample(jsonrpc!, 'unary')).toContain('"method": "SendMessage"');
    expect(transportSample(http!, 'stream')).toContain('/message:stream');
    expect(transportSample(http!, 'stream')).toContain("-H 'A2A-Version: 1.0'");
    expect(transportSample(grpc!, 'stream')).toContain('a2a.v1.A2AService/SendStreamingMessage');
  });
});

describe('agent test setup', () => {
  it('plans the card checks, then conversations by transport', () => {
    const plan = planChecks(setup);
    expect(plan.slice(0, 6).map((p) => `${p.row}|${p.transport}`)).toEqual(['schema|*', 'iface|jsonrpc', 'iface|http', 'caps|jsonrpc', 'caps|http', 'sig|*']);
    expect(plan).toHaveLength(6 + 2 * 3);
  });

  it('explains what blocks the run, in order', () => {
    expect(validateSetup({ ...setup, cardUrl: 'nope' })).toMatch(/URL of the Agent Card/);
    expect(validateSetup({ ...setup, transports: [] })).toMatch(/transport/);
    expect(validateSetup({ ...setup, conversations: [] })).toMatch(/conversation/);
    expect(validateSetup({ ...setup, timeoutMs: 0 })).toMatch(/timeout/);
    expect(validateSetup(setup)).toBeUndefined();
    expect(setupSummary(setup)).toBe('2 × 3 = 6 conversation checks, plus 4 Agent Card checks.');
  });

  it('counts conversation checks apart from card checks, and warnings do not fail a run', () => {
    const checks = [
      { row: 'schema', transport: '*' as const, result: 'pass' as const, ms: 1 },
      { row: 'sig', transport: '*' as const, result: 'warn' as const, ms: 1 },
      { row: 'a', transport: 'http' as const, result: 'pass' as const, ms: 1 },
      { row: 'b', transport: 'http' as const, result: 'fail' as const, ms: 1 },
    ];
    expect(totalsOf(checks)).toMatchObject({ conversationPassed: 1, conversationTotal: 2, conversationFailed: 1, warn: 1 });
    expect(agentRunPassed(checks)).toBe(false);
    expect(agentRunPassed(checks.slice(0, 3))).toBe(true);
  });
});

describe('v1.0 wire names', () => {
  it('prefixes the states and keeps the interrupted ones non-terminal', async () => {
    const { taskStateWire, INTERRUPTED_TASK_STATES, SSE_SAMPLE } = await import('@microcks/demo-core/domain/agents');
    expect(taskStateWire('input-required')).toBe('TASK_STATE_INPUT_REQUIRED');
    expect(taskStateWire('working')).toBe('TASK_STATE_WORKING');
    expect(INTERRUPTED_TASK_STATES.every((s) => !isTerminalTaskState(s))).toBe(true);
    expect(SSE_SAMPLE).toContain('TASK_STATE_COMPLETED');
  });
});
