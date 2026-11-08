import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { render } from 'svelte/server';
import * as api from '../src/lib/index.js';
import type { LiveIndicatorProps, MethodTagProps, StatusBadgeProps, SummaryStripProps, SummaryStripSepProps } from '../src/lib/index.js';

it('exposes the native family and every implemented upstream component', () => {
  expect(Object.keys(api).sort()).toEqual([
    'AiGhostRow', 'ApiBadge', 'AppShell', 'BarChart', 'Button', 'ButtonLink', 'Callout', 'Checkbox',
    'Chip', 'CiPanel', 'CodeBlock', 'CommandBar', 'ConformanceBand', 'ConformanceMatrix', 'CopyButton', 'DataTable',
    'DescriptionList', 'Dialog', 'Disclosure', 'DropZone', 'EmptyState', 'Exchange', 'ExchangeCard', 'FactRow',
    'Facts', 'Field', 'FilterBar', 'FilterReset', 'FilterRow', 'FilterSearch', 'ICON_NAMES', 'Icon',
    'Input', 'Kbd', 'Link', 'LiveIndicator', 'Menu', 'Meter', 'MethodTag', 'MockUrl',
    'OUTCOME_WORD', 'OpPickList', 'OperationList', 'OperationRow', 'PROTOCOL_ATTR', 'Panel', 'PluginSlot', 'Progress',
    'ProjectionPill', 'Radio', 'RadioGroup', 'ResultBox', 'RunMeta', 'RunOrigin', 'RunProgress', 'RunTarget',
    'RunnerLog', 'SectionLabel', 'Segmented', 'Select', 'Skeleton', 'SkillList', 'SplitPane', 'SplitPaneMain',
    'SplitPaneSide', 'StatCard', 'StatGrid', 'StatusBadge', 'StepChecks', 'StepStatus', 'Stepper', 'SummaryStrip',
    'SummaryStripSep', 'Switch', 'TASK_STATES', 'TASK_TERMINAL', 'THEME_EVENT', 'THEME_STORAGE_KEY', 'TabPanel', 'Tabs',
    'TaskLanes', 'TaskStateTag', 'TaskTimeline', 'Textarea', 'ThemeToggle', 'Tile', 'TileGrid', 'WorkflowLoom',
    'cellKey', 'conformanceLabel', 'filesReadyMessage', 'getPluginHost', 'getTheme', 'iconSize', 'isTerminalState', 'requireName',
    'restoreTheme', 'setTheme', 'snippetFor', 'sortRows',
  ].sort());
});

it.each([
  ['deep-ink.css', 'styles.css'],
  ['deep-ink.no-fonts.css', 'styles.no-fonts.css'],
])('ships the exact layered shared CSS %s', (source, built) => {
  const registry = readFileSync(new URL(`../node_modules/@microcks-deep-ink/registry/dist/${source}`, import.meta.url), 'utf8');
  const packaged = readFileSync(new URL(`../dist/${built}`, import.meta.url), 'utf8');
  expect(packaged).toBe(registry);
  expect(packaged).toContain('@layer deep-ink.base, deep-ink.components');
  expect(packaged).toMatch(/prefers-reduced-motion/);
});

it('retains default shared HTML attributes without adding component wrappers', () => {
  const { body: method } = render(api.MethodTag, { props: { method: 'GET' } });
  expect(method).toMatch(/<span[^>]*class="method"[^>]*data-method="GET"[^>]*data-protocol="rest"/);
  const { body: live } = render(api.LiveIndicator);
  expect(live).toMatch(/<span[^>]*class="live"[^>]*data-size="md"[^>]*data-variant="pill"/);
  expect(live).toContain('class="live-dot" aria-hidden="true"');
  const { body: separator } = render(api.SummaryStripSep);
  expect(separator).toContain('class="summary-strip-sep" aria-hidden="true"');
});

// These assertions prevent React compatibility props from creeping into public declarations.
const nativeMethod: MethodTagProps = { method: 'GET', class: ['custom'], onclick: (event) => { event.currentTarget.title = 'Clicked'; } };
const nativeStatus: StatusBadgeProps = { status: 'running', class: { custom: true } };
const nativeLive: LiveIndicatorProps = { size: 'compact', pulse: false, onclickcapture: () => {} };
const nativeSummary: SummaryStripProps = { lineHeight: 'inherit', role: 'note', 'aria-label': 'Facts' };
const nativeSeparator: SummaryStripSepProps = { title: 'Divider' };
// @ts-expect-error Native Svelte uses onclick, never onClick.
const incompatibleHandler: MethodTagProps = { method: 'GET', onClick: () => {} };
// @ts-expect-error Native Svelte uses class, never className.
const incompatibleClass: StatusBadgeProps = { status: 'never', className: 'custom' };
// @ts-expect-error StatusBadge rich labels are snippets, never React element objects.
const incompatibleLabel: StatusBadgeProps = { status: 'running', label: { type: 'strong' } };
// @ts-expect-error The separator is always decorative.
const accessibleSeparator: SummaryStripSepProps = { 'aria-hidden': false };
void [nativeMethod, nativeStatus, nativeLive, nativeSummary, nativeSeparator, incompatibleHandler, incompatibleClass, incompatibleLabel, accessibleSeparator];
