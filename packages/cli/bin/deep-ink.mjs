#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { add, diff, init, list, status, view } from '../src/commands.mjs';
import { log } from '../src/log.mjs';

const HELP = `deep-ink: copy Deep Ink components into your app (shadcn-style).

Usage
  deep-ink init   [--framework react|angular|html] [--out DIR] [--css-out DIR] [--no-fonts] [--cwd DIR]
  deep-ink add    <item...> | --all [--tier natural,microcks,element] [--framework ...] [--out DIR] [--css-out DIR]
                  [--overwrite | --merge] [--prune] [--markup-only] [--dry-run] [--cwd DIR] [--registry FILE]
  deep-ink list   [--framework ...] [--tier ...] [--json]
  deep-ink status [item...] [--exit-code] [--json] [--cwd DIR]
  deep-ink diff   <item> [--exit-code] [--cwd DIR]
  deep-ink view   <item> [--framework ...]

add flags
  --overwrite    replace files you modified with the registry version
  --merge        three-way merge when you and the registry both changed a file (git merge-file if available,
                 otherwise conflict markers); needs the base copy in .deep-ink/base
  --prune        delete files that an item no longer ships (only when you did not modify them); orphans are always
                 reported and dropped from deep-ink.json, never deleted without --prune
  --markup-only  copy markup only (recipes, components, element bundles) and no CSS, for plugins: the host owns the CSS

status reports up to date, upstream changed, locally modified or both (conflict) for each item.
diff shows your edits (base -> your file) and the upstream changes (base -> registry) separately.
--exit-code (status, diff): exit 1 when something differs.

Exit codes: 0 ok, 1 error (or differences with --exit-code), 2 some files were skipped or have conflicts.
`;

const COMMANDS = { init, add, list, diff, status, view };

const options = {
  framework: { type: 'string' },
  out: { type: 'string' },
  'css-out': { type: 'string' },
  'no-fonts': { type: 'boolean' },
  cwd: { type: 'string' },
  all: { type: 'boolean' },
  tier: { type: 'string' },
  overwrite: { type: 'boolean' },
  merge: { type: 'boolean' },
  prune: { type: 'boolean' },
  'markup-only': { type: 'boolean' },
  'exit-code': { type: 'boolean' },
  'dry-run': { type: 'boolean' },
  registry: { type: 'string' },
  json: { type: 'boolean' },
  help: { type: 'boolean', short: 'h' },
};

function main(argv) {
  let parsed;
  try {
    parsed = parseArgs({ args: argv, options, allowPositionals: true, strict: true });
  } catch (e) {
    log.error(e.message);
    log.line(HELP);
    return 1;
  }
  const [command, ...positionals] = parsed.positionals;
  if (parsed.values.help || !command || command === 'help') {
    log.line(HELP);
    return command || parsed.values.help ? 0 : 1;
  }
  const run = COMMANDS[command];
  if (!run) {
    log.error(`Unknown command "${command}".`);
    log.line(HELP);
    return 1;
  }
  try {
    return run({ values: parsed.values, positionals });
  } catch (e) {
    log.error(e.message);
    return e.exitCode ?? 1;
  }
}

process.exitCode = main(process.argv.slice(2));
