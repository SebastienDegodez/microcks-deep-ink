import type { Example } from '../shared/index.js';
import type {
  Behavior,
  BehaviorDispatcher,
  SimulationRequest,
  SimulationResult,
  SimulationStep,
  SimulationTrace,
  StepKind,
} from './types.js';

/** The operation a behavior belongs to: the dispatcher only sees calls that match its method and path template. */
export interface DispatchOperation {
  method: string;
  /** Path template, `/pastries/{name}`. */
  path: string;
}

const STATUS_TEXT: Record<number, string> = {
  200: 'OK',
  201: 'Created',
  204: 'No Content',
  400: 'Bad Request',
  401: 'Unauthorized',
  404: 'Not Found',
  500: 'Internal Server Error',
};

export const statusLabel = (status: number): string => `${status} ${STATUS_TEXT[status] ?? ''}`.trim();

function decode(text: string): string {
  try {
    return decodeURIComponent(text.replace(/\+/g, ' '));
  } catch {
    return text;
  }
}

export interface ParsedCall {
  path: string;
  query: Record<string, string>;
  /** The raw query string, without `?`. */
  rawQuery: string;
}

/**
 * Reads what a person types in the simulator: a path, a path with a query, a full mock URL.
 * The host and the `/rest/<service>/<version>` prefix are dropped.
 */
export function parseCall(raw: string): ParsedCall {
  let text = raw.trim().replace(/^https?:\/\/[^/]+/, '').replace(/^\/(rest|dynarest)\/[^/]+\/[^/]+(?=\/|$)/, '');
  if (!text.startsWith('/')) text = `/${text}`;
  const at = text.indexOf('?');
  const path = at < 0 ? text : text.slice(0, at);
  const rawQuery = at < 0 ? '' : text.slice(at + 1);
  const query: Record<string, string> = {};
  for (const pair of rawQuery.split('&').filter(Boolean)) {
    const eq = pair.indexOf('=');
    query[decode(eq < 0 ? pair : pair.slice(0, eq))] = eq < 0 ? '' : decode(pair.slice(eq + 1));
  }
  return { path, query, rawQuery };
}

/** Matches `/pastries/Eclair%20Cafe` against `/pastries/{name}`; returns the decoded path parameters or null. */
export function matchPathTemplate(template: string, path: string): Record<string, string> | null {
  const t = template.split('/').filter(Boolean);
  const p = path.split('/').filter(Boolean);
  if (t.length !== p.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < t.length; i += 1) {
    const seg = t[i] as string;
    const value = p[i] as string;
    const named = /^\{(.+)\}$/.exec(seg);
    if (named) params[named[1] as string] = decode(value);
    else if (decode(seg) !== decode(value)) return null;
  }
  return params;
}

/** Parameter names of a `name && other` rule. */
export function ruleNames(rule: string): string[] {
  return rule
    .split('&&')
    .map((x) => x.trim())
    .filter(Boolean);
}

export interface JsonBodyRule {
  exp: string;
  operator: string;
  cases: Record<string, string>;
}

/** Parses and validates the JSON_BODY rule. Returns an error message when it is unusable. */
export function parseJsonBodyRule(text: string): { rule: JsonBodyRule } | { error: string } {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (error) {
    return { error: `Invalid JSON: ${(error as Error).message}` };
  }
  const rule = raw as Partial<JsonBodyRule> | null;
  if (!rule || typeof rule !== 'object' || !rule.cases || typeof rule.cases !== 'object') {
    return { error: 'The rule needs "exp", "operator" and "cases".' };
  }
  if (!('default' in rule.cases)) return { error: 'A "default" case is required.' };
  return { rule: { exp: String(rule.exp ?? ''), operator: String(rule.operator ?? 'equals'), cases: rule.cases } };
}

function readPointer(body: unknown, pointer: string): unknown {
  let current: unknown = body;
  for (const part of pointer.split('/').filter(Boolean)) {
    if (current === null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part.replace(/~1/g, '/').replace(/~0/g, '~')];
  }
  return current;
}

function safeRegExp(pattern: string): RegExp | null {
  try {
    return new RegExp(`^(?:${pattern})$`);
  } catch {
    return null;
  }
}

/** True when the pattern is a valid regular expression (Behavior constraints table). */
export function isValidRegExp(pattern: string): boolean {
  return safeRegExp(pattern) !== null;
}

interface Resolved {
  criteria: string;
  criteriaKind: StepKind;
  example?: Example;
  /** Matched through the fallback case rather than the dispatch criteria. */
  viaFallback?: boolean;
  storeKey?: string;
  script?: string;
}

/** Example whose request parameters carry every `name=value` pair. */
function byParams(examples: readonly Example[], pairs: Record<string, string | undefined>): Example | undefined {
  const names = Object.keys(pairs);
  if (names.length === 0) return undefined;
  return examples.find((e) => names.every((n) => pairs[n] !== undefined && e.request.params[n] === pairs[n]));
}

function resolveBase(
  kind: 'URI_PARTS' | 'URI_PARAMS',
  rule: string,
  pathParams: Record<string, string>,
  query: Record<string, string>,
  examples: readonly Example[],
): Resolved {
  const names = ruleNames(rule);
  if (names.length === 0) return { criteria: '(empty rule: no criteria)', criteriaKind: 'warn' };
  if (kind === 'URI_PARTS') {
    const pairs = Object.fromEntries(names.map((n) => [n, pathParams[n]]));
    const example = byParams(examples, pairs);
    return { criteria: names.map((n) => `/${n}=${pathParams[n] ?? ''}`).join(''), criteriaKind: example ? 'ok' : 'warn', example };
  }
  const pairs = Object.fromEntries(names.map((n) => [n, query[n]]));
  const example = byParams(examples, pairs);
  return { criteria: `?${names.map((n) => `${n}=${query[n] ?? ''}`).join('&')}`, criteriaKind: example ? 'ok' : 'warn', example };
}

function resolve(
  behavior: Behavior,
  request: SimulationRequest,
  pathParams: Record<string, string>,
  query: Record<string, string>,
  examples: readonly Example[],
): Resolved {
  const d: BehaviorDispatcher = behavior.dispatcher;
  switch (d) {
    case 'URI_PARTS':
    case 'URI_ELEMENTS':
      return resolveBase('URI_PARTS', behavior.rule, pathParams, query, examples);
    case 'URI_PARAMS':
    case 'QUERY_ARGS':
      return resolveBase('URI_PARAMS', behavior.rule, pathParams, query, examples);
    case 'JSON_BODY': {
      const parsed = parseJsonBodyRule(behavior.rule);
      if ('error' in parsed) return { criteria: 'invalid rules', criteriaKind: 'fail' };
      const { rule } = parsed;
      let body: unknown;
      try {
        body = request.body ? JSON.parse(request.body) : undefined;
      } catch {
        body = undefined;
      }
      const value = body === undefined ? undefined : readPointer(body, rule.exp);
      if (value === undefined) {
        const example = examples.find((e) => e.name === rule.cases.default);
        return { criteria: `${rule.exp || '?'} on empty body → default case`, criteriaKind: 'warn', example, viaFallback: true };
      }
      const key = String(value);
      const name = rule.cases[key] ?? rule.cases.default;
      return { criteria: `${rule.exp} = ${key}`, criteriaKind: 'ok', example: examples.find((e) => e.name === name), viaFallback: !(key in rule.cases) };
    }
    case 'SCRIPT': {
      // Scripts are not executed. The two samples of the screen are reproduced: the stateful one serves the
      // example named after the last path segment, the plain one maps it case-insensitively (first example by default).
      const last = Object.values(pathParams).pop() ?? '';
      const returned = behavior.stateful
        ? last
        : (examples.find((e) => e.name.toLowerCase() === last.toLowerCase())?.name ?? examples[0]?.name ?? '');
      const lang = behavior.scriptLanguage ?? 'GROOVY';
      return {
        criteria: `script returned "${returned}"`,
        criteriaKind: 'ok',
        example: examples.find((e) => e.name === returned),
        storeKey: behavior.stateful && last ? `${last}-views` : undefined,
        script: lang,
      };
    }
    case 'FALLBACK':
    case 'PROXY_FALLBACK': {
      const base = resolveBase(behavior.baseDispatcher ?? 'URI_PARTS', behavior.rule, pathParams, query, examples);
      if (base.example) return base;
      if (d === 'FALLBACK') {
        const example = examples.find((e) => e.name === behavior.fallback);
        return { ...base, example, viaFallback: true, criteriaKind: 'warn' };
      }
      return base;
    }
  }
}

function trace(partial: Omit<SimulationTrace, 'mediaType' | 'headers' | 'body'> & Partial<SimulationTrace>): SimulationTrace {
  return { mediaType: 'text/plain', headers: ['Content-Type: text/plain'], body: '(empty body)', ...partial };
}

function failure(reason: string, t: SimulationTrace): SimulationResult {
  return { matched: false, reason, ...t };
}

/**
 * Pure simulation of a call against a behavior and the examples of the operation: constraints are checked
 * first (400), then the dispatcher picks an example (200), the fallback, the proxy (forward) or nothing (404).
 * `request.store` carries the counters of stateful mocks; the result names the key it would increment.
 */
export function dispatch(
  request: SimulationRequest,
  behavior: Behavior,
  examples: readonly Example[],
  operation: DispatchOperation,
): SimulationResult {
  const call = parseCall(request.path);
  const steps: SimulationStep[] = [];
  const requestLine = `${operation.method} ${call.path}${call.rawQuery ? `?${call.rawQuery}` : ''}`;
  const pathParams = matchPathTemplate(operation.path, call.path);

  if (!pathParams) {
    steps.push({ label: 'Operation', value: `No operation matches ${operation.method} ${call.path}`, kind: 'fail' });
    return failure(`No operation matches ${operation.method} ${call.path}.`, trace({
      outcome: 'no-operation', requestLine, status: 404, statusLabel: statusLabel(404), steps, chain: `${requestLine} → no operation → 404`,
    }));
  }
  const first = Object.entries(pathParams)
    .map(([k, v]) => `${k} = ${v}`)
    .join(', ');
  steps.push({ label: 'Operation', value: `${operation.method} ${operation.path}${first ? ` · ${first}` : ''}`, kind: 'ok' });

  // Constraints: required / regexp / recopy.
  const headers = Object.fromEntries(Object.entries(request.headers ?? {}).map(([k, v]) => [k.toLowerCase(), v]));
  const active = behavior.constraints.filter((c) => c.name.trim());
  const recopied: string[] = [];
  let violation = '';
  for (const c of active) {
    if (violation) break;
    const key = c.name.trim();
    const value = c.in === 'header' ? headers[key.toLowerCase()] : c.in === 'query' ? call.query[key] : pathParams[key];
    if (c.required && (value === undefined || value === '')) {
      violation = `Parameter ${key} is required. Check parameter constraints.`;
    } else if (c.mustMatchRegexp && value !== undefined) {
      const re = safeRegExp(c.mustMatchRegexp);
      if (re && !re.test(value)) violation = `Parameter ${key} should match ${c.mustMatchRegexp}. Check parameter constraints.`;
    }
    if (!violation && c.recopy && value !== undefined) recopied.push(`${key}: ${value}`);
  }
  if (violation) {
    steps.push({ label: 'Constraints', value: violation, kind: 'fail' }, { label: 'Dispatch', value: 'skipped', kind: 'skip' });
    return failure(violation, trace({
      outcome: 'constraint', requestLine, status: 400, statusLabel: statusLabel(400), steps, chain: 'constraint violated → 400', body: violation,
    }));
  }
  steps.push({
    label: 'Constraints',
    value: active.length ? `${active.length} checked · passed` : 'none defined',
    kind: active.length ? 'ok' : 'skip',
  });

  const resolved = resolve(behavior, request, pathParams, call.query, examples);
  const label = behavior.dispatcher === 'SCRIPT' ? (behavior.scriptLanguage ?? 'GROOVY') : behavior.dispatcher;
  steps.push({ label: `Dispatch criteria · ${label}`, value: resolved.criteria, kind: resolved.criteriaKind });

  const forwardTo =
    !resolved.example && behavior.dispatcher === 'PROXY_FALLBACK' && behavior.proxyUrl
      ? `${behavior.proxyUrl.replace(/\/+$/, '')}${call.path}${call.rawQuery ? `?${call.rawQuery}` : ''}`
      : undefined;

  if (resolved.example) {
    const via =
      behavior.dispatcher === 'FALLBACK' && resolved.viaFallback ? ' (fallback)' : behavior.dispatcher === 'JSON_BODY' && resolved.viaFallback ? ' (default case)' : '';
    steps.push({ label: 'Matched example', value: `${resolved.example.name}${via}`, kind: via ? 'warn' : 'ok' });
  } else if (forwardTo) {
    steps.push({ label: 'Matched example', value: `none → forwarded to ${forwardTo}`, kind: 'info' });
  } else {
    steps.push({ label: 'Matched example', value: 'none · no example has this criteria', kind: 'fail' });
  }

  const delay =
    behavior.delayMs > 0
      ? (behavior.delayStrategy ?? 'fixed') === 'fixed'
        ? `waits ${behavior.delayMs} ms`
        : `random delay · base ${behavior.delayMs} ms`
      : 'none';
  steps.push({ label: 'Delay', value: delay, kind: behavior.delayMs > 0 ? 'info' : 'skip' });

  if (resolved.storeKey) {
    const n = request.store?.[resolved.storeKey] ?? 0;
    steps.push({
      label: 'State',
      value: n ? `store ${resolved.storeKey} = ${n} · requestContext.views = ${n}` : `store ${resolved.storeKey} written on next Simulate`,
      kind: 'info',
    });
  }

  if (resolved.example) {
    const { example } = resolved;
    return {
      matched: true,
      exampleId: example.id,
      example,
      ...trace({
        outcome: 'matched',
        requestLine,
        status: example.response.status,
        statusLabel: statusLabel(example.response.status),
        steps,
        chain: `${resolved.criteria} → ${example.name} → ${example.response.status}`,
        mediaType: 'application/json',
        headers: ['Content-Type: application/json', ...recopied],
        body: example.response.body,
        storeKey: resolved.storeKey,
      }),
    };
  }
  if (forwardTo) {
    return failure('Forwarded to the real backend.', trace({
      outcome: 'forwarded',
      requestLine,
      status: null,
      statusLabel: 'Forwarded',
      steps,
      chain: `${resolved.criteria} → no example → proxyUrl`,
      mediaType: 'from backend',
      headers: ['Content-Type: from backend', ...recopied],
      body: `GET ${forwardTo}\n\nThe real backend answers. Its status and body are returned as is.`,
      forwardedTo: forwardTo,
    }));
  }
  return failure('No example matches this request.', trace({
    outcome: 'no-match',
    requestLine,
    status: 404,
    statusLabel: statusLabel(404),
    steps,
    chain: `${resolved.criteria} → no example → 404`,
    headers: ['Content-Type: text/plain', ...recopied],
    storeKey: resolved.storeKey,
  }));
}

export interface Reachability {
  name: string;
  criteria: string;
  reachable: boolean;
}

/** "Examples and their dispatch criteria": which example can be returned with the current dispatcher. */
export function reachability(behavior: Behavior, examples: readonly Example[]): Reachability[] {
  const d = behavior.dispatcher;
  const withBase = (kind: 'URI_PARTS' | 'URI_PARAMS'): Reachability[] => {
    const names = ruleNames(behavior.rule);
    return examples.map((e) => {
      const ok = names.length > 0 && names.every((n) => e.request.params[n] !== undefined);
      const text = names.map((n) => (kind === 'URI_PARTS' ? `/${n}=${e.request.params[n] ?? ''}` : `${n}=${e.request.params[n] ?? ''}`)).join(kind === 'URI_PARTS' ? '' : ' && ');
      const missing = kind === 'URI_PARAMS' ? 'no query criteria' : 'no matching criteria';
      return { name: e.name, criteria: ok ? (kind === 'URI_PARTS' ? text : `?${text}`) : names.length ? missing : '(none)', reachable: ok };
    });
  };
  if (d === 'URI_PARTS' || d === 'URI_ELEMENTS') return withBase('URI_PARTS');
  if (d === 'URI_PARAMS' || d === 'QUERY_ARGS') return withBase('URI_PARAMS');
  if (d === 'FALLBACK' || d === 'PROXY_FALLBACK') {
    const rows = withBase(behavior.baseDispatcher ?? 'URI_PARTS');
    return d === 'FALLBACK'
      ? rows.map((r) => (r.name === behavior.fallback && !r.reachable ? { ...r, criteria: 'fallback example', reachable: true } : r))
      : rows;
  }
  if (d === 'JSON_BODY') {
    const parsed = parseJsonBodyRule(behavior.rule);
    const cases = 'rule' in parsed ? Object.entries(parsed.rule.cases) : [];
    return examples.map((e) => {
      const hit = cases.find(([, v]) => v === e.name);
      return { name: e.name, criteria: hit ? `case ${hit[0]}` : 'no case', reachable: Boolean(hit) };
    });
  }
  // SCRIPT: any example can be returned by name.
  return examples.map((e) => ({
    name: e.name,
    criteria: behavior.stateful ? `returned when name = ${e.name}` : `returned for "${e.name.toLowerCase()}"`,
    reachable: true,
  }));
}

/** Name stored as `dispatcher`: the script language for SCRIPT, else the dispatcher itself. */
function storedDispatcher(behavior: Behavior): string {
  return behavior.dispatcher === 'SCRIPT' ? (behavior.scriptLanguage ?? 'GROOVY') : behavior.dispatcher;
}

/**
 * One-line form of `storedAs`, for the Saved strip: `URI_PARTS · rule: name`, `GROOVY · <script, 10 lines>`,
 * `JSON_BODY · /name, 2 cases`, `FALLBACK · URI_PARTS name → Millefeuille`, `PROXY_FALLBACK · URI_PARTS name → proxyUrl`.
 */
export function storedSummary(behavior: Behavior): string {
  const dispatcher = storedDispatcher(behavior);
  const base = `${behavior.baseDispatcher ?? 'URI_PARTS'} ${behavior.rule || '(none)'}`;
  switch (behavior.dispatcher) {
    case 'SCRIPT':
      return `${dispatcher} · <script, ${(behavior.script ?? '').split('\n').length} lines>`;
    case 'JSON_BODY': {
      const parsed = parseJsonBodyRule(behavior.rule);
      if ('error' in parsed) return `${dispatcher} · invalid rules`;
      const n = Object.keys(parsed.rule.cases).length;
      return `${dispatcher} · ${parsed.rule.exp || '?'}, ${n} ${n === 1 ? 'case' : 'cases'}`;
    }
    case 'FALLBACK':
      return `${dispatcher} · ${base} → ${behavior.fallback ?? 'no fallback'}`;
    case 'PROXY_FALLBACK':
      return `${dispatcher} · ${base} → proxyUrl`;
    default:
      return `${dispatcher} · rule: ${behavior.rule || '(none)'}`;
  }
}

/** "dispatcher: URI_PARTS / dispatcherRules: name", as stored in the contract. */
export function storedAs(behavior: Behavior): string {
  const dispatcher = storedDispatcher(behavior);
  let rules = behavior.rule;
  if (behavior.dispatcher === 'SCRIPT') {
    rules = `<script, ${(behavior.script ?? '').split('\n').length} lines>`;
  } else if (behavior.dispatcher === 'FALLBACK') {
    rules = JSON.stringify({ dispatcher: behavior.baseDispatcher ?? 'URI_PARTS', dispatcherRules: behavior.rule, fallback: behavior.fallback }, null, 2);
  } else if (behavior.dispatcher === 'PROXY_FALLBACK') {
    rules = JSON.stringify({ dispatcher: behavior.baseDispatcher ?? 'URI_PARTS', dispatcherRules: behavior.rule, proxyUrl: behavior.proxyUrl }, null, 2);
  }
  return `dispatcher:      ${dispatcher}\ndispatcherRules: ${rules.split('\n').join('\n                 ')}`;
}

export const SCRIPT_SAMPLES: Record<ScriptSampleKey, string> = {
  GROOVY: [
    '// Dispatch on the {name} path segment, case-insensitive.',
    'def uri = mockRequest.getRequest().getRequestURI()',
    "def name = java.net.URLDecoder.decode(uri.tokenize('/').last(), 'UTF-8')",
    'switch (name.toLowerCase()) {',
    "  case 'millefeuille':    return 'Millefeuille'",
    "  case 'eclair cafe':     return 'Eclair Cafe'",
    "  case 'eclair chocolat': return 'Eclair Chocolat'",
    '}',
    "log.info('Unknown pastry: ' + name)",
    "return 'Millefeuille'",
  ].join('\n'),
  GROOVY_STATEFUL: [
    '// Count views per pastry; state is kept 60 s in the API store.',
    'def uri = mockRequest.getRequest().getRequestURI()',
    "def name = java.net.URLDecoder.decode(uri.tokenize('/').last(), 'UTF-8')",
    "def views = (store.get(name + '-views') ?: '0') as int",
    "store.put(name + '-views', String.valueOf(views + 1), 60)",
    'requestContext.views = views + 1',
    'return name',
  ].join('\n'),
  JS: [
    '// Dispatch on the {name} path segment, case-insensitive.',
    'const uri = mockRequest.getRequest().getRequestURI();',
    "const name = decodeURIComponent(uri.split('/').pop());",
    'switch (name.toLowerCase()) {',
    "  case 'millefeuille':    return 'Millefeuille';",
    "  case 'eclair cafe':     return 'Eclair Cafe';",
    "  case 'eclair chocolat': return 'Eclair Chocolat';",
    '}',
    "log.info('Unknown pastry: ' + name);",
    "return 'Millefeuille';",
  ].join('\n'),
  JS_STATEFUL: [
    '// Count views per pastry; state is kept 60 s in the API store.',
    'const uri = mockRequest.getRequest().getRequestURI();',
    "const name = decodeURIComponent(uri.split('/').pop());",
    "const views = parseInt(store.get(name + '-views') || '0', 10);",
    "store.put(name + '-views', String(views + 1), 60);",
    'requestContext.views = views + 1;',
    'return name;',
  ].join('\n'),
};

export type ScriptSampleKey = 'GROOVY' | 'GROOVY_STATEFUL' | 'JS' | 'JS_STATEFUL';

export function scriptSample(language: 'GROOVY' | 'JS', stateful: boolean): string {
  return SCRIPT_SAMPLES[`${language}${stateful ? '_STATEFUL' : ''}` as ScriptSampleKey];
}
