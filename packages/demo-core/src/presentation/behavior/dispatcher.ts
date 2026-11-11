import { parseJsonBodyRule, ruleNames, scriptSample, type Behavior, type BehaviorDispatcher, type Reachability } from '../../domain/catalog/index.js';
import type { Example } from '../../domain/shared/index.js';

/** Cards of the dispatcher picker, in display order. */
export const DISPATCHER_CARDS: readonly { id: BehaviorDispatcher; desc: string; tag?: string; disabled?: boolean }[] = [
  { id: 'URI_PARTS', desc: 'Matches path segments, here {name}.', tag: 'inferred from contract' },
  { id: 'URI_PARAMS', desc: 'Matches query parameter values.' },
  { id: 'QUERY_ARGS', desc: 'Matches GraphQL or gRPC arguments.', tag: 'GraphQL & gRPC only', disabled: true },
  { id: 'JSON_BODY', desc: 'Evaluates a JSON Pointer in the request body.' },
  { id: 'SCRIPT', desc: 'Groovy or JavaScript returns the example name.' },
  { id: 'FALLBACK', desc: 'A dispatcher, plus a default example when nothing matches.' },
  { id: 'PROXY_FALLBACK', desc: 'A dispatcher, else forwards to the real backend.' },
];

/** Hint beside the Rules title, by dispatcher. */
export const RULE_HINTS: Partial<Record<BehaviorDispatcher, string>> = {
  URI_PARTS: 'Criteria built from path parameters. Example names map to /name=<value>.',
  URI_PARAMS: 'Criteria built from query parameters, joined with &&.',
  QUERY_ARGS: 'Not applicable to a REST operation.',
  JSON_BODY: 'A JSON Pointer is evaluated on the body; cases map values to example names.',
  SCRIPT: 'Code evaluated on each request; it returns the example name to serve.',
  FALLBACK: 'Apply a dispatcher first, then serve a default example when nothing matches.',
  PROXY_FALLBACK: 'Apply a dispatcher first, then forward unmatched calls to the real backend.',
};

/** Default query rule offered when URI_PARAMS is picked. */
const QUERY_RULE_SAMPLE = 'size';
const JSON_RULE_SAMPLE = JSON.stringify({ exp: '/name', operator: 'equals', cases: { 'Eclair Cafe': 'Eclair Cafe', default: 'Millefeuille' } }, null, 2);
const PROXY_URL_SAMPLE = 'https://pastry.staging.acme.io/v2';

/** Objects a dispatcher script has in scope. */
export const SCRIPT_SCOPE: readonly string[] = ['mockRequest', 'requestContext', 'store', 'log'];

/** Changes to the behavior when another dispatcher is picked: a rule, a script, a fallback or a proxy URL that fits it. */
export function dispatcherPatch(id: BehaviorDispatcher, draft: Behavior, examples: readonly Example[], pathParams: readonly string[]): Partial<Behavior> {
  const names = ruleNames(draft.rule);
  const patch: Partial<Behavior> = { dispatcher: id };
  const pathRule = names.length > 0 && names.every((n) => pathParams.includes(n));
  if (id === 'JSON_BODY' && 'error' in parseJsonBodyRule(draft.rule)) patch.rule = JSON_RULE_SAMPLE;
  if (id === 'URI_PARAMS') patch.rule = QUERY_RULE_SAMPLE;
  if ((id === 'URI_PARTS' || id === 'FALLBACK' || id === 'PROXY_FALLBACK') && !pathRule) patch.rule = pathParams[0] ?? '';
  if (id === 'SCRIPT' && !draft.script) {
    patch.scriptLanguage = draft.scriptLanguage ?? 'GROOVY';
    patch.script = scriptSample(patch.scriptLanguage, draft.stateful);
  }
  if (id !== 'SCRIPT' && draft.stateful) patch.stateful = false;
  if (id === 'FALLBACK' && !draft.fallback) patch.fallback = examples[0]?.name;
  if (id === 'PROXY_FALLBACK' && !draft.proxyUrl) patch.proxyUrl = PROXY_URL_SAMPLE;
  return patch;
}

/** URI_PARTS rule with the path parameter `param` toggled: removed when it is a criterion, else added. */
export const toggleRuleParam = (names: readonly string[], param: string) => (names.includes(param) ? names.filter((n) => n !== param) : [...names, param]).join(' && ');

/** Count of the reachability list, with where unknown names go for FALLBACK and PROXY_FALLBACK. */
export function reachSummary(draft: Behavior, reach: readonly Reachability[]): string {
  const reachable = reach.filter((r) => r.reachable).length;
  let label = `${reachable} of ${reach.length} examples reachable`;
  if (draft.dispatcher === 'FALLBACK' && draft.fallback) label += ` · unknown names → ${draft.fallback}`;
  if (draft.dispatcher === 'PROXY_FALLBACK') label += ' · unknown names → proxyUrl';
  return label;
}
