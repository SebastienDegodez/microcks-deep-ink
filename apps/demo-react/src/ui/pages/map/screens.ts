/** Phases of the Parcours screen map (`Parcours.dc.html`), with a working link per screen. */
export interface MapScreen {
  n: string;
  title: string;
  /** Route pattern shown to the reader. */
  route: string;
  /** Where the link goes (a concrete hash route). */
  href: string;
  what: string;
  wow: string;
  /** Delivery wave 1..6 (Mock, Test, Enrich, Observe, Govern, Orchestrate). */
  wave: number;
}

export interface MapPhase {
  step: number;
  name: string;
  verb: string;
  screens: MapScreen[];
}

export const WAVES = ['Mock', 'Test', 'Enrich', 'Observe', 'Govern', 'Orchestrate'] as const;

/** Run #14 of restock-pastry: the hero run of the demo. */
const RUN_14 = '6729a1d27e4c0b5f93a8c214';

export const PHASES: MapPhase[] = [
  { step: 1, name: 'Import', verb: 'The contract comes in', screens: [
    { n: '01', title: 'Import', route: '/import', href: '/import', what: 'Drop a file, a URL or a Git repository; Direct API wizard.', wow: 'Detected services and operations previewed before import.', wave: 1 },
    { n: '02', title: 'Sources', route: '/importers', href: '/importers', what: 'Scheduled importers, primary/secondary artifacts, secrets.', wow: 'Sync timeline, diff between two contract versions.', wave: 3 },
  ] },
  { step: 2, name: 'Explore', verb: 'See the landscape', screens: [
    { n: '03', title: 'Cockpit', route: '/', href: '/', what: 'Services, mock traffic, recent tests, conformance.', wow: 'Live wall of API badges, filterable by protocol.', wave: 4 },
    { n: '04', title: 'APIs & Services', route: '/services', href: '/services', what: 'Dense list, filters by label / protocol / test status.', wow: 'Table ⇄ badge wall, unified ⌘K search.', wave: 1 },
  ] },
  { step: 3, name: 'Enrich', verb: 'Make the mock alive', screens: [
    { n: '05', title: 'Service', route: '/services/:id', href: '/services/pastry2', what: 'Operations, mock URL, examples, properties, MCP, webhooks.', wow: '“Agent-ready” panel: MCP tools as an agent sees them.', wave: 1 },
    { n: '06', title: 'Behavior', route: '/services/:id/operations/:name', href: '/services/pastry2/operations/get-name', what: 'Dispatcher, rules, delays, parameter constraints, stateful.', wow: 'Visual dispatcher builder with a request simulator.', wave: 3 },
    { n: '07', title: 'AI Copilot', route: '/services/:id/copilot', href: '/services/pastry2/copilot', what: 'Generate examples when the contract has none.', wow: 'Inline ghost rows: accept, edit, reject.', wave: 3 },
  ] },
  { step: 4, name: 'Orchestrate', verb: 'Weave APIs into workflows', screens: [
    { n: '15', title: 'Workflows', route: '/workflows', href: '/workflows', what: 'Arazzo documents, their workflows and the services they depend on.', wow: 'Loom thumbnail per workflow; unresolved sources flagged.', wave: 6 },
    { n: '16', title: 'Workflow', route: '/workflows/:doc/:id', href: '/workflows/pastry/restock-pastry', what: 'Steps, actions, Mock URL, verification sessions, examples.', wow: 'The Loom: one lane per source, data threads between steps.', wave: 6 },
    { n: '17', title: 'Workflow run', route: '/workflows/runs/:runId', href: `/workflows/runs/${RUN_14}`, what: 'Run on the mocks, the implementations or a mix (proposed).', wow: 'Success criteria + schema validation per step; missing mock examples named.', wave: 6 },
  ] },
  { step: 5, name: 'Test', verb: 'Prove conformance', screens: [
    { n: '08', title: 'Run a test', route: '/tests/create', href: '/tests/create?service=pastry2', what: 'Endpoint, runner, timeout, secret, headers.', wow: 'CI snippet (GitHub Actions, CLI) generated live.', wave: 2 },
    { n: '09', title: 'Live test', route: '/tests/runner/:id', href: '/tests/runner/119', what: 'Execution and per-operation results.', wow: 'Contract ⇄ actual response diff, line by line.', wave: 2 },
    { n: '10', title: 'History', route: '/tests/service/:id', href: '/tests/service/pastry2', what: 'All runs for a service, trends.', wow: 'Conformance timeline.', wave: 2 },
  ] },
  { step: 6, name: 'Observe', verb: 'Understand usage', screens: [
    { n: '11', title: 'Usage & score', route: '/metrics/…', href: '/metrics/pastry2', what: 'Daily/hourly invocations, conformance score.', wow: 'Calendar heatmap + treemap by domain.', wave: 4 },
    { n: '12', title: 'Live traces', route: '/traces', href: '/traces', what: 'Real-time graph of mock calls.', wow: 'Replay a call, jump to the example that answered.', wave: 4 },
  ] },
  { step: 7, name: 'Govern', verb: 'Share & administer', screens: [
    { n: '13', title: 'Hub', route: '/hub', href: '/hub', what: 'Public API packages to install.', wow: 'Badge preview + one-click install.', wave: 5 },
    { n: '14', title: 'Admin', route: '/admin', href: '/admin', what: 'Users, groups, secrets, snapshots.', wow: 'Roles × groups matrix at a glance.', wave: 5 },
  ] },
];
