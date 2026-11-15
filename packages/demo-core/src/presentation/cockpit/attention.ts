import type { Importer } from '../../domain/importing/index.js';
import type { Protocol, ServiceSummary } from '../../domain/shared/index.js';
import { parseUrl } from '../../domain/shared/url.js';

export interface AttentionItem {
  id: string;
  kind: 'Failing test' | 'Failing agent test' | 'Failing workflow' | 'Importer error' | 'Never tested';
  tone: 'danger' | 'warning' | 'neutral';
  badge: Protocol | 'ARAZZO' | 'importer';
  subject: string;
  title: string;
  detail: string;
  cta: string;
  to: string;
}

/**
 * The "Needs attention" list: failing tests (API Pastry 2.0 fails with #119, the same price-as-string
 * bug as Arazzo run #14), the failing workflow, importers in error, and services never tested.
 */
export function buildAttention(services: readonly ServiceSummary[], importers: readonly Importer[]): AttentionItem[] {
  const items: AttentionItem[] = [];
  const pastry2 = services.find((s) => s.id === 'pastry2');
  if (pastry2?.testStatus === 'failed') {
    items.push({
      id: 'test-119', kind: 'Failing test', tone: 'danger', badge: 'REST', subject: `${pastry2.name} ${pastry2.version}`,
      title: 'PATCH /pastries/{name} fails conformance',
      detail: 'Test #119 · OPEN_API_SCHEMA · response body does not match schema: $.price expected number, got string. Test #118 passed 2 h earlier.',
      cta: 'Open test #119', to: '/tests/runner/119',
    });
  }
  const pastry1 = services.find((s) => s.id === 'pastry1');
  if (pastry1?.testStatus === 'failed') {
    items.push({
      id: 'test-86', kind: 'Failing test', tone: 'danger', badge: 'REST', subject: `${pastry1.name} ${pastry1.version}`,
      title: 'PATCH /pastries/{name} fails conformance',
      detail: 'Test #86 · OPEN_API_SCHEMA · response body does not match schema: $.price expected number, got string.',
      cta: 'Open test #86', to: '/tests/runner/86',
    });
  }
  items.push({
    id: 'run-14', kind: 'Failing workflow', tone: 'danger', badge: 'ARAZZO', subject: 'Pastry workflows 1.2.0',
    title: 'Workflow Restock a pastry failed on implementations · schema validation at patchPastry (3 attempts)',
    detail:
      'Run #14 · Implementations (https://pastry.staging.acme.io/v2) · success criteria held ($statusCode == 200) but the response does not conform to its schema: price is the string "3.9", the schema expects a number. Stops at patchPastry, verifyPastry not run. Same bug as test #119.',
    cta: 'Open run #14', to: '/workflows/runs/6729a1d27e4c0b5f93a8c214',
  });
  for (const importer of importers.filter((i) => i.health === 'failed')) {
    const host = hostOf(importer.url);
    const lastGood = importer.error?.servedSince?.split(' · ')[1];
    const secret = importer.secretName ? `Secret ${importer.secretName} was rejected${host ? ` by ${host}` : ''}` : (importer.error?.detail ?? '');
    items.push({
      id: `importer-${importer.id}`, kind: 'Importer error', tone: 'warning', badge: 'importer', subject: importer.name,
      title: `Scheduled import failed: ${importer.error?.message.split(' — ')[0] ?? 'error'}`,
      detail: `${secret}${importer.error?.since ? ` · ${importer.error.since}` : ''}.${lastGood ? ` Last successful scan today at ${lastGood};` : ''} mocks still serve that version.`,
      cta: 'Fix in Sources', to: `/sources/${importer.id}`,
    });
  }
  const concierge = services.find((s) => s.protocol === 'A2A' && s.testStatus === 'failed');
  if (concierge) {
    items.push({
      id: 'agent-test-3', kind: 'Failing agent test', tone: 'danger', badge: 'A2A', subject: `${concierge.name} ${concierge.version}`,
      title: 'Agent Pastry concierge · HTTP+JSON resumes input-required on a new task',
      detail: 'Run #3 · A2A_CONFORMANCE · order-pastry: after input-required the agent answered with a new taskId instead of resuming the same task. 13 of 15 checks passed.',
      cta: `Open run #${concierge.lastTest?.runId ?? '3'}`, to: `/tests/agent/${concierge.lastTest?.runId ?? '3'}`,
    });
  }
  const never = services.filter((s) => s.conformance === null);
  const first = never[0];
  if (first) {
    const others = never.slice(1).map((s) => `${s.name} ${s.version}`);
    items.push({
      id: 'never', kind: 'Never tested', tone: 'neutral', badge: first.protocol, subject: `${first.name} ${first.version}`,
      title: `${first.operationCount} ${first.protocol === 'A2A' ? 'skills' : 'operations'} without a conformance proof`,
      detail: `Its mock served ${first.calls24h} requests today.${others.length ? ` ${others.join(' and ')} neither.` : ''}`,
      cta: 'Run a first test', to: `/tests/create?service=${first.id}`,
    });
  }
  return items;
}

function hostOf(url: string): string | undefined {
  try {
    return parseUrl(url).host;
  } catch {
    return undefined;
  }
}
