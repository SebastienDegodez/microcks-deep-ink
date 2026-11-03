#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { add, diff, init, list, view } from '../src/commands.mjs';
import { log } from '../src/log.mjs';

const HELP = `deep-ink: copy Deep Ink components into your app (shadcn-style).

Usage
  deep-ink init  [--framework react|angular|html] [--out DIR] [--css-out DIR] [--no-fonts] [--cwd DIR] [--yes]
  deep-ink add   <item...> | --all [--tier natural,microcks,element] [--framework ...] [--out DIR] [--css-out DIR]
                 [--overwrite] [--dry-run] [--cwd DIR] [--registry FILE]
  deep-ink list  [--framework ...] [--tier ...] [--json]
  deep-ink diff  <item> [--cwd DIR]
  deep-ink view  <item> [--framework ...]

Exit codes: 0 ok, 1 error, 2 some files were skipped because you modified them (use --overwrite).
`;

const COMMANDS = { init, add, list, diff, view };

const options = {
  framework: { type: 'string' },
  out: { type: 'string' },
  'css-out': { type: 'string' },
  'no-fonts': { type: 'boolean' },
  cwd: { type: 'string' },
  yes: { type: 'boolean', short: 'y' },
  all: { type: 'boolean' },
  tier: { type: 'string' },
  overwrite: { type: 'boolean' },
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
