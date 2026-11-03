import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readBase, sha256 } from './lockfile.mjs';

/**
 * Compares one copied file with its base copy and with the current registry content.
 *
 * state:
 *   ok        your file equals the registry
 *   upstream  the registry changed, you did not
 *   local     you changed it, the registry did not (also: deleted, or changed and never tracked)
 *   both      you and the registry changed it
 *   missing   the file is not on disk
 *
 * `hasBase` is false for projects copied by an older deep-ink: the base is then known by hash only (from deep-ink.json).
 */
export function inspectFile({ cwd, rel, upstream, lockedHash }) {
  const abs = join(cwd, rel);
  const base = readBase(cwd, rel);
  const baseHash = base !== undefined ? sha256(base) : lockedHash;
  const info = { rel, upstream, base, hasBase: base !== undefined, tracked: Boolean(baseHash) };
  if (!existsSync(abs)) return { ...info, state: 'missing' };
  const working = readFileSync(abs, 'utf8');
  const workingHash = sha256(working);
  const upstreamHash = sha256(upstream);
  if (workingHash === upstreamHash) return { ...info, working, state: 'ok' };
  if (!baseHash) return { ...info, working, state: 'local' };
  const local = workingHash !== baseHash;
  const up = baseHash !== upstreamHash;
  return { ...info, working, state: local && up ? 'both' : local ? 'local' : 'upstream' };
}

export const BASE_UNKNOWN_HINT =
  'base unknown (copied by an older deep-ink): upstream and local changes are told apart by hash only, and --merge needs a base. ' +
  'Run `deep-ink add <item>` to record base copies of unmodified files; files you edited need --overwrite once.';
