import type { Protocol } from '../shared/index.js';
import type { ArtifactRole, HubApi, HubPackage, InstallMode } from './types.js';

export interface PreviewRow {
  tag: 'NEW' | 'UPDATE' | 'MERGE' | 'SKIPPED' | 'IN CATALOGUE';
  protocol: Protocol;
  name: string;
  version: string;
  samples: number;
  /** 92 when this API has a recent test, null otherwise. */
  conformance: number | null;
  mcp: boolean;
}

export interface CreatedLine {
  sign: '+' | '~' | '→' | '·' | '↑' | '✓';
  text: string;
  sub: string;
}

export interface InstallPreview {
  rows: PreviewRow[];
  created: CreatedLine[];
  heading: string;
  title: string;
  subtitle: string;
  installLabel: string;
  /** Why the install button is disabled. */
  blocked?: string;
}

export type InstallStatus = '' | 'installing' | 'installed';

const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;
const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

export function versionOf(api: HubApi, picked: Record<string, string>): string {
  return picked[api.name] ?? api.versions[0] ?? '';
}

export function packageTotals(pkg: HubPackage, picked: Record<string, string> = {}): { operations: number; examples: number } {
  const apis = pkg.apis ?? [];
  return {
    operations: sum(apis.map((a) => a.operations[versionOf(a, picked)] ?? 0)),
    examples: sum(apis.map((a) => a.examples[versionOf(a, picked)] ?? 0)),
  };
}

/** What installing a package will do, from the chosen versions, mode and artifact role. Pure. */
export function previewInstall(
  pkg: HubPackage,
  picked: Record<string, string>,
  mode: InstallMode,
  role: ArtifactRole,
  status: InstallStatus,
  mockBase = 'http://microcks.local:8080',
): InstallPreview {
  const apis = pkg.apis ?? [];
  const entries = apis.map((api) => {
    const version = versionOf(api, picked);
    return { api, version, exists: api.inCatalogue.includes(version) };
  });
  const existing = entries.filter((e) => e.exists);
  const fresh = entries.filter((e) => !e.exists);
  const artifacts = sum(apis.map((a) => (a.postman ? 2 : 1)));

  const rows: PreviewRow[] = entries.map(({ api, version, exists }) => {
    const tested = status === 'installed' && exists && api.name === 'API Pastry' && version === '2.0';
    let tag: PreviewRow['tag'];
    if (status === 'installed') tag = 'IN CATALOGUE';
    else if (role === 'secondary') tag = exists ? 'MERGE' : 'SKIPPED';
    else tag = exists ? 'UPDATE' : 'NEW';
    return {
      tag,
      protocol: api.protocol,
      name: api.name,
      version,
      samples: api.examples[version] ?? 0,
      conformance: tested ? 92 : null,
      mcp: api.protocol !== 'EVENT' && api.protocol !== 'SOAP',
    };
  });

  const created: CreatedLine[] = [];
  let heading = 'What will be created';
  let title = 'Catalogue preview';
  let subtitle = 'Badges your catalogue will show after install';
  let installLabel = 'Install';
  let blocked: string | undefined;

  if (status === 'installed') {
    title = 'In your catalogue';
    subtitle = 'Badges as they appear in APIs & Services';
    heading = 'Installed';
    created.push({
      sign: '✓',
      text: `${plural(apis.length, 'Service')} available in APIs & Services`,
      sub: entries.map((e) => `${e.api.name} ${e.version}`).join(' · '),
    });
    created.push({
      sign: '✓',
      text: mode === 'sync' ? `${plural(artifacts, 'importer')} kept in sync in Sources` : `${plural(artifacts, 'artifact')} imported once`,
      sub: mode === 'sync' ? 'Rescanned every hour with the global schedule' : 'Package updates are not applied automatically',
    });
  } else {
    if (status === 'installing') heading = 'Being created';
    if (role === 'main') {
      if (fresh.length) {
        created.push({
          sign: '+',
          text: `${plural(fresh.length, 'Service')} with ${plural(sum(fresh.map((e) => e.api.operations[e.version] ?? 0)), 'operation')} and ${plural(sum(fresh.map((e) => e.api.examples[e.version] ?? 0)), 'example')}`,
          sub: fresh.map((e) => `${e.api.name} ${e.version}`).join(' · '),
        });
      }
      if (existing.length) {
        created.push({
          sign: '~',
          text: `${existing.length} existing ${existing.length === 1 ? 'Service' : 'Services'} updated`,
          sub: existing.map((e) => `${e.api.name} ${e.version}`).join(' · '),
        });
      }
      created.push(
        mode === 'sync'
          ? {
              sign: '+',
              text: `${plural(artifacts, 'importer')} in Sources, one per artifact`,
              sub: apis.some((a) => a.postman) ? 'Primary: contracts · Secondary: Postman collections' : 'Primary: contracts',
            }
          : { sign: '↑', text: `${plural(artifacts, 'artifact')} uploaded once, no importer created`, sub: '' },
      );
      const first = entries.find((e) => e.api.protocol === 'REST') ?? entries.find((e) => e.api.protocol === 'GRAPHQL');
      if (first) {
        created.push({
          sign: '→',
          text: 'Mocks served right after import',
          sub: `${mockBase}${first.api.protocol === 'REST' ? '/rest/' : '/graphql/'}${encodeURIComponent(first.api.name).replace(/%20/g, '+')}/${first.version}`,
        });
      }
      installLabel = mode === 'sync' ? 'Install and keep in sync' : 'Install once';
    } else {
      if (existing.length) {
        created.push({
          sign: '~',
          text: `Examples merged into ${existing.length} existing ${existing.length === 1 ? 'Service' : 'Services'}`,
          sub: existing.map((e) => `${e.api.name} ${e.version} · +${e.api.examples[e.version] ?? 0} examples`).join(' · '),
        });
      }
      if (fresh.length) {
        created.push({
          sign: '·',
          text: `${fresh.length} ${fresh.length === 1 ? 'API' : 'APIs'} skipped: no matching Service here`,
          sub: fresh.map((e) => `${e.api.name} ${e.version}`).join(' · '),
        });
      }
      if (!existing.length) {
        blocked =
          'None of these APIs exists in your catalogue yet, so a secondary import would create nothing. Choose Main artifact to create the Services.';
      }
      installLabel = 'Merge examples';
    }
  }
  return { rows, created, heading, title, subtitle, installLabel, blocked };
}
