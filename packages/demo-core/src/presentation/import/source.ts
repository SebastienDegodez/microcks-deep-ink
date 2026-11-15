import type { DirectApiInput } from '../../domain/importing/index.js';

/** Where the Add a source flow stands: choosing a source, analyzing it, previewing it, importing it, done. */
export type ImportStep = 'idle' | 'analyzing' | 'detected' | 'importing' | 'done';

/** The four ways to add a source, one tab each. */
export type SourceTab = 'file' | 'url' | 'git' | 'direct';

/** The placeholders double as defaults: an empty field takes the value it shows, as on the prototype. */
export const SAMPLE_URL = 'https://raw.githubusercontent.com/microcks/microcks/master/samples/APIPastry-openapi.yaml';
/** Placeholders of the Git form. */
export const GIT_DEFAULTS = { name: 'API Pastry — main', url: 'https://raw.githubusercontent.com/acme/contracts/main/pastry/openapi.yaml' };
/** Placeholders of the Direct API form. */
export const DIRECT_DEFAULTS = { name: 'Order API', version: '1.0', resource: 'order', payload: '{ "id": "ord-1042", "customer": "Laurent", "status": "CREATED" }' };
/** The Direct API form as it opens: a REST API, every field empty. */
export const EMPTY_DIRECT = { type: 'REST' as DirectApiInput['type'], name: '', version: '', resource: '', payload: '' };
/** The trimmed value, or the fallback when it is blank. */
export const or = (value: string, fallback: string) => value.trim() || fallback;

/** The sample artifacts offered under the drop zone, analyzed as one-off uploads. */
export const SAMPLES = [
  { label: 'Sample: API Pastry', file: { name: 'apipastry-openapi.yaml', sizeBytes: 5120 } },
  { label: 'Example: Pastry workflows (Arazzo)', file: { name: 'pastry-workflows.arazzo.yaml', sizeBytes: 9216 } },
  { label: 'Example: Pastry concierge (A2A Agent Card)', file: { name: 'agent-card.json', sizeBytes: 3277 } },
];

/** The tabs of the source types: the hint says whether Microcks keeps the source in sync. */
export const SOURCE_TABS: { id: SourceTab; label: string; icon: 'document' | 'link' | 'git-branch' | 'zap'; hint?: string }[] = [
  { id: 'file', label: 'Upload a file', icon: 'document', hint: 'one-off' },
  { id: 'url', label: 'URL', icon: 'link' },
  { id: 'git', label: 'Git repository', icon: 'git-branch', hint: 'scheduled' },
  { id: 'direct', label: 'Direct API', icon: 'zap' },
];

/** The Git form as analyzed: an empty field takes its placeholder. */
export const resolveGit = (git: { name: string; url: string }) => ({ name: or(git.name, GIT_DEFAULTS.name), url: or(git.url, GIT_DEFAULTS.url) });

/** The Direct API form as created: an empty field takes its placeholder, and only an event API defaults its payload. */
export const resolveDirect = (direct: typeof EMPTY_DIRECT): DirectApiInput => ({
  type: direct.type,
  name: or(direct.name, DIRECT_DEFAULTS.name),
  version: or(direct.version, DIRECT_DEFAULTS.version),
  resource: or(direct.resource, DIRECT_DEFAULTS.resource),
  payload: direct.type === 'GENERIC_EVENT' ? or(direct.payload, DIRECT_DEFAULTS.payload) : direct.payload.trim() || undefined,
});

/** Index of the current step of the stepper: the preview stays current while it is being imported. */
export const importStepIndex = (step: ImportStep, hasPreview: boolean) =>
  step === 'idle' || step === 'analyzing' ? 0 : step === 'detected' || (step === 'importing' && hasPreview) ? 1 : 2;

/** Labels of the stepper: a Direct API has no contract to preview. */
export const importSteps = (directDone: boolean) => ['Source', directDone ? 'Preview (no contract)' : 'Preview', 'Live mock'];
