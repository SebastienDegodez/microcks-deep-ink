export type CiFormat = 'cli' | 'gha' | 'tekton';

export interface CiHeader {
  /** `globals` or an operation name. */
  scope: string;
  name: string;
  values: string;
}

export interface CiSnippetInput {
  /** `API Pastry:2.0`. */
  apiRef: string;
  /** Display name for the step title, `API Pastry`. */
  apiName: string;
  endpoint: string;
  runner: string;
  waitSec: number;
  secret: string;
  /** When `all`, no operation filter is written. */
  allOperations: boolean;
  selectedOperations: string[];
  headers: CiHeader[];
  isEvent: boolean;
}

export const MICROCKS_BASE_URL = 'http://microcks.local:8080';

const SECRET_REF = (name: string) => `$${'{{'} secrets.${name} ${'}}'}`;

export const CI_FORMATS: { id: CiFormat; label: string; ariaLabel: string }[] = [
  { id: 'cli', label: 'microcks CLI', ariaLabel: 'microcks CLI command' },
  { id: 'gha', label: 'GitHub Actions', ariaLabel: 'GitHub Actions step' },
  { id: 'tekton', label: 'Tekton', ariaLabel: 'Tekton pipeline task' },
];

export const CI_STEPS: Record<CiFormat, string[]> = {
  cli: [
    'Install the microcks CLI (Homebrew, binary or the quay.io/microcks/microcks-cli image).',
    'Export MICROCKS_SA_SECRET with the secret of a Keycloak service account.',
    'The command exits non-zero when the test fails, so the build fails with it.',
  ],
  gha: [
    'Store the service account as MICROCKS_SERVICE_ACCOUNT and MICROCKS_SERVICE_ACCOUNT_SECRET repository secrets.',
    `Add the step after your deployment step; ${MICROCKS_BASE_URL} must be reachable from the runner.`,
  ],
  tekton: [
    'Make sure the microcks-test Task is installed in the pipeline namespace.',
    'Keep the service account credentials in a Kubernetes Secret referenced by the Task.',
  ],
};

function headersJson(input: CiSnippetInput): string {
  if (input.isEvent) return '';
  const grouped: Record<string, { name: string; values: string }[]> = {};
  for (const h of input.headers) {
    if (!h.name.trim()) continue;
    (grouped[h.scope] ??= []).push({ name: h.name.trim(), values: h.values });
  }
  return Object.keys(grouped).length ? JSON.stringify(grouped) : '';
}

/** One line per array entry. The CI panel is synced with the form: every form choice changes a line. */
export function buildCiSnippet(input: CiSnippetInput, format: CiFormat): string[] {
  const ep = input.endpoint.trim() || '<test-endpoint>';
  const wait = `${input.waitSec}sec`;
  const filtered = input.allOperations ? '' : JSON.stringify(input.selectedOperations);
  const headers = headersJson(input);
  const lines: string[] = [];
  if (format === 'cli') {
    lines.push(`microcks test '${input.apiRef}' ${ep} ${input.runner} \\`);
    lines.push(`  --microcksURL=${MICROCKS_BASE_URL}/api/ \\`);
    lines.push('  --keycloakClientId=microcks-serviceaccount \\');
    lines.push('  --keycloakClientSecret="$MICROCKS_SA_SECRET" \\');
    if (input.secret) lines.push(`  --secretName=${input.secret} \\`);
    if (filtered) lines.push(`  --filteredOperations='${filtered}' \\`);
    if (headers) lines.push(`  --operationsHeaders='${headers}' \\`);
    lines.push(`  --waitFor=${wait}`);
  } else if (format === 'gha') {
    lines.push(`- name: Contract test ${input.apiName}`);
    lines.push('  uses: microcks/test-github-action@v1');
    lines.push('  with:');
    lines.push(`    apiNameAndVersion: '${input.apiRef}'`);
    lines.push(`    testEndpoint: '${ep}'`);
    lines.push(`    runner: ${input.runner}`);
    lines.push(`    microcksURL: '${MICROCKS_BASE_URL}/api/'`);
    lines.push(`    keycloakClientId: ${SECRET_REF('MICROCKS_SERVICE_ACCOUNT')}`);
    lines.push(`    keycloakClientSecret: ${SECRET_REF('MICROCKS_SERVICE_ACCOUNT_SECRET')}`);
    if (input.secret) lines.push(`    secretName: '${input.secret}'`);
    if (filtered) lines.push(`    filteredOperations: '${filtered}'`);
    if (headers) lines.push(`    operationsHeaders: '${headers}'`);
    lines.push(`    waitFor: '${wait}'`);
  } else {
    lines.push(`- name: contract-test-${input.apiName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`);
    lines.push('  taskRef:');
    lines.push('    name: microcks-test');
    lines.push('  params:');
    lines.push('    - name: apiNameAndVersion');
    lines.push(`      value: "${input.apiRef}"`);
    lines.push('    - name: testEndpoint');
    lines.push(`      value: ${ep}`);
    lines.push('    - name: runner');
    lines.push(`      value: ${input.runner}`);
    lines.push('    - name: microcksURL');
    lines.push(`      value: ${MICROCKS_BASE_URL}/api/`);
    if (input.secret) {
      lines.push('    - name: secretName');
      lines.push(`      value: ${input.secret}`);
    }
    if (headers) {
      lines.push('    - name: operationsHeaders');
      lines.push(`      value: '${headers}'`);
    }
    if (filtered) {
      lines.push('    - name: filteredOperations');
      lines.push(`      value: '${filtered}'`);
    }
    lines.push('    - name: waitFor');
    lines.push(`      value: ${input.waitSec}`);
  }
  return lines;
}

export interface CiLine {
  text: string;
  /** The line differs from the default configuration of the service. */
  changed: boolean;
}

/** Marks the lines that are not in the default snippet, so the form-to-code link is visible. */
export function diffCiLines(lines: string[], defaults: string[]): CiLine[] {
  return lines.map((text) => ({ text, changed: !defaults.includes(text) }));
}

export function ciDiffLegend(changed: number, serviceLabel: string): string {
  return changed === 0
    ? `Default configuration for ${serviceLabel}. Change the form: the lines you affect are marked.`
    : `${changed} ${changed === 1 ? 'line differs' : 'lines differ'} from the default configuration.`;
}

/** Command shown on a finished run ("Add to CI"). */
export function ciCommandForRun(apiRef: string, endpoint: string, runner: string, waitSec: number): string {
  return [
    `microcks-cli test '${apiRef}' ${endpoint} ${runner} \\`,
    `  --microcksURL=${MICROCKS_BASE_URL}/api/ \\`,
    '  --keycloakClientId=microcks-serviceaccount \\',
    '  --keycloakClientSecret="$MICROCKS_CLIENT_SECRET" \\',
    `  --waitFor=${waitSec}sec`,
  ].join('\n');
}
