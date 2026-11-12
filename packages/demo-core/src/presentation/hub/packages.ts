import { versionOf, type CreatedLine, type HubPackage, type InstallStatus, type PreviewRow } from '../../domain/govern/index.js';
import { plural } from '../shared/format.js';

type SignTone = 'success' | 'warning' | 'link' | 'muted';

/** Address of the community Hub, in the page header. */
export const HUB_URL = 'https://hub.microcks.io/api';

/** API count of a package and its update date: "3 APIs · updated Oct 21, 2026". */
export const metaOf = (p: HubPackage) => `${plural(p.apiCount, 'API')}${p.updated ? ` · ${p.updated}` : ''}`;

/** Options of the "How to install" choice. */
export const MODE_OPTIONS = [
  { value: 'sync', label: 'Keep in sync', description: 'Creates one importer per artifact in Sources, rescanned every hour.' },
  { value: 'one-shot', label: 'Import once', description: 'Direct upload of the artifacts. Later package updates are not applied.' },
];

/** Options of the "Artifact role" choice. */
export const ROLE_OPTIONS = [
  { value: 'main', label: 'Main artifact', description: 'Creates Services, operations and examples from the contracts.' },
  { value: 'secondary', label: 'Secondary artifact', description: 'Only merges examples into Services that already exist here.' },
];

/** Tone of the sign of a line of the "What will be created" list. */
export const SIGN_TONE: Record<CreatedLine['sign'], SignTone> = { '+': 'success', '~': 'warning', '↑': 'link', '→': 'muted', '·': 'muted', '✓': 'success' };

/** `data-tag` of a preview tag: lower case, its first space turned into a dash ("in-catalogue"). */
export const tagKey = (tag: PreviewRow['tag']) => tag.toLowerCase().replace(' ', '-');

/** Value of the conformance badge of a preview row. */
export const conformanceValue = (row: PreviewRow) => (row.conformance === null ? 'not tested' : `${row.conformance}%`);

/** Status of the conformance badge of a preview row: neutral until the API is tested. */
export const conformanceStatus = (row: PreviewRow): 'neutral' | 'success' => (row.conformance === null ? 'neutral' : 'success');

/** Packages of the search in the chosen category; all of them when no category is chosen. */
export const shownPackages = (byQuery: readonly HubPackage[], category: string) => byQuery.filter((p) => !category || p.category === category);

/** Package of the detail: the one of the route when it is shown, the first shown otherwise. */
export const selectedPackage = (shown: readonly HubPackage[], packageId: string): HubPackage | undefined => shown.find((p) => p.id === packageId) ?? shown[0];

/** Count of a category chip: the packages of the search in that category. */
export const categoryCount = (byQuery: readonly HubPackage[], category: string) => byQuery.filter((p) => p.category === category).length;

/** APIs of the shown packages. */
export const apiTotalOf = (shown: readonly HubPackage[]) => shown.reduce((n, p) => n + p.apiCount, 0);

/** Packages and APIs shown, next to the search: "8 packages · 22 APIs". */
export const countLabel = (packages: number, apis: number) => `${plural(packages, 'package')} · ${plural(apis, 'API')}`;

/** Install status of a package: the status of an install started here, else its seeded state. */
export const installStatusOf = (p: HubPackage, statuses: Readonly<Record<string, InstallStatus>>): InstallStatus => statuses[p.id] ?? (p.installed ? 'installed' : '');

/** Version passed to the install: the one picked for the first API, else the first version of the package. */
export const installVersion = (pkg: HubPackage, picked: Record<string, string>) => {
  const first = pkg.apis?.[0];
  return first ? versionOf(first, picked) : (pkg.versions[0] ?? '');
};

/** Announcement when an install starts. */
export const installingMessage = (pkg: HubPackage) => `Installing ${pkg.name}.`;

/** Announcement when an install ends. */
export const installedMessage = (pkg: HubPackage) => `${pkg.name} installed.`;

/** Message of a failed install. */
export const installErrorMessage = (e: unknown) => (e instanceof Error ? e.message : 'The install failed.');
