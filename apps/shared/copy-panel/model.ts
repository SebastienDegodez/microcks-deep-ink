// Framework-neutral model of the Copy panel: resolves registry items, their files and the CLI commands.
// No React and no Storybook import here, so both Storybooks (and tests) can share it.

export type CopyFramework = 'react' | 'angular' | 'html' | 'svelte';

export interface RegistryFile {
  target: string;
  kind: string;
  source?: string;
  content: string;
  generated?: boolean;
}

export interface RegistryItem {
  name: string;
  title: string;
  tier: 'natural' | 'microcks' | 'element';
  description: string;
  version: string;
  registryDependencies: string[];
  npmDependencies?: { react?: string[]; angular?: string[]; svelte?: string[] };
  elements?: string[];
  a11y: { pattern: string; keyboard: string[][]; aria: string[]; rgaa: string[]; wcag: string[]; notes?: string };
  stories?: string[];
  files: Partial<Record<CopyFramework, RegistryFile[]>>;
  css: RegistryFile[];
}

export interface Registry {
  name: string;
  version: string;
  items: RegistryItem[];
}

/** The story parameter read by the panel. The only contract between a story and the panel. */
export interface DeepInkParameter {
  /** Registry item names shown in the panel. Dependencies are resolved automatically. */
  items?: string[];
}

export interface PanelFile {
  /** Stable key, unique within an item. */
  id: string;
  /** Tab label, the file name. */
  label: string;
  /** What the file is: Component, Styles, Recipe, Element bundle... */
  role: string;
  /** Relative target path as the CLI writes it. */
  target: string;
  content: string;
}

export interface PanelItem {
  item: RegistryItem;
  /** `requested` by the story, or pulled in as a `dependency`. */
  relation: 'requested' | 'dependency';
  files: PanelFile[];
}

const ROLE: Record<string, string> = {
  component: 'Component',
  support: 'Support file',
  style: 'Styles',
  recipe: 'HTML recipe',
  element: 'Element bundle',
  types: 'Types',
};

/** Items requested by a story first, then their transitive dependencies in dependency order. */
export function resolveItems(registry: Registry, requested: readonly string[]): { items: RegistryItem[]; unknown: string[] } {
  const byName = new Map(registry.items.map((i) => [i.name, i]));
  const unknown: string[] = [];
  const asked = requested.filter((n, idx) => requested.indexOf(n) === idx);
  const deps: RegistryItem[] = [];
  const seen = new Set<string>(asked);
  const visit = (name: string) => {
    const item = byName.get(name);
    if (!item) return;
    for (const d of item.registryDependencies) {
      if (!seen.has(d)) {
        seen.add(d);
        visit(d);
        const dep = byName.get(d);
        if (dep) deps.push(dep);
      }
    }
  };
  const first: RegistryItem[] = [];
  for (const name of asked) {
    const item = byName.get(name);
    if (!item) unknown.push(name);
    else first.push(item);
  }
  for (const item of first) visit(item.name);
  return { items: [...first, ...deps], unknown };
}

/** Files the CLI would copy for one item and one framework: framework sources, then CSS. */
export function filesFor(item: RegistryItem, framework: CopyFramework): PanelFile[] {
  const out: PanelFile[] = [];
  const push = (f: RegistryFile, defaultRole: string) =>
    out.push({
      id: `${f.kind}:${f.target}`,
      label: f.target.split('/').pop() ?? f.target,
      role: ROLE[f.kind] ?? defaultRole,
      target: f.target,
      content: f.content,
    });
  for (const f of item.files[framework] ?? []) push(f, framework === 'html' ? 'HTML recipe' : 'Component');
  for (const f of item.css ?? []) push(f, 'Styles');
  return out;
}

export function buildPanelItems(registry: Registry, requested: readonly string[], framework: CopyFramework) {
  const { items, unknown } = resolveItems(registry, requested);
  const asked = new Set(requested);
  const panelItems: PanelItem[] = items.map((item) => ({
    item,
    relation: asked.has(item.name) ? 'requested' : 'dependency',
    files: filesFor(item, framework),
  }));
  return { panelItems, unknown };
}

/** Name of the CLI folder placeholder used in the `npx` command. */
export const REPO_PLACEHOLDER = '<path-to-repo>';

export function cliCommands(requested: readonly string[], framework: CopyFramework): { label: string; command: string }[] {
  const names = requested.join(' ');
  return [
    { label: 'From the Deep Ink repo root', command: `pnpm deep-ink add ${names} --framework ${framework}` },
    { label: 'From your own project', command: `npx ${REPO_PLACEHOLDER}/packages/cli add ${names} --framework ${framework}` },
  ];
}

/** True when a story framework value is one the panel knows. */
export function asFramework(value: unknown, fallback: CopyFramework): CopyFramework {
  return value === 'react' || value === 'angular' || value === 'html' || value === 'svelte' ? value : fallback;
}

export const FRAMEWORK_LABEL: Record<CopyFramework, string> = { react: 'React', angular: 'Angular', html: 'HTML', svelte: 'Svelte' };

/** Long files (compiled element bundles) are previewed, but always copied whole. */
export const PREVIEW_LIMIT = 6000;

/** Public package imports, derived from the built barrel rather than a hard-coded component list. */
export function importSnippet(items: readonly string[], exports: Record<string, string[]>): string {
  const names = items.flatMap((item) => {
    const values = exports[item] ?? [];
    const components = values.filter((name) => /^[A-Z]/.test(name));
    return components.length ? components : values;
  });
  const unique = [...new Set(names)];
  const list = unique.length > 4 ? `{\n  ${unique.join(',\n  ')},\n}` : `{ ${unique.join(', ')} }`;
  return `import '@microcks/deep-ink/styles.css'; // once, in your entry file\nimport ${list} from '@microcks/deep-ink';`;
}
