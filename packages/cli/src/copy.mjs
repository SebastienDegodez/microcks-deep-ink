import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, posix, relative, resolve, sep } from 'node:path';
import { sha256 } from './lockfile.mjs';
import { threeWayMerge } from './merge.mjs';

/** Posix path relative to cwd, used as the lockfile key and in messages. */
export const relPath = (cwd, abs) => relative(cwd, abs).split(sep).join(posix.sep);

/**
 * Overwrite policy (D9), with a base copy (the registry version you copied) when there is one:
 *   file does not exist                 -> added
 *   identical to the registry           -> same
 *   unchanged since the last copy       -> updated silently
 *   modified locally, --overwrite       -> updated (overwritten)
 *   modified locally, --merge           -> three-way merge: merged, conflict (markers), kept (registry unchanged)
 *                                          or skipped when the base is unknown
 *   modified locally                    -> skipped and reported (exit 2)
 *
 * `base` is the text of the base copy (undefined when unknown), `lockedHash` the hash from deep-ink.json.
 * For merged and conflict plans, `content` is what goes to disk and `upstream` becomes the new base.
 */
export function planFile({ cwd, rel, content, lockedHash, base, overwrite, merge }) {
  const abs = join(cwd, rel);
  if (!existsSync(abs)) return { rel, abs, action: 'added', content };
  const current = readFileSync(abs, 'utf8');
  if (sha256(current) === sha256(content)) return { rel, abs, action: 'same', content };
  const baseHash = base !== undefined ? sha256(base) : lockedHash;
  if (baseHash && sha256(current) === baseHash) return { rel, abs, action: 'updated', content };
  if (overwrite) return { rel, abs, action: 'updated', content, overwritten: true };
  if (merge) {
    if (base === undefined) return { rel, abs, action: 'skipped', content, reason: 'base-unknown' };
    if (baseHash === sha256(content)) return { rel, abs, action: 'kept', content };
    const m = threeWayMerge(current, base, content);
    return { rel, abs, action: m.conflicts > 0 ? 'conflict' : 'merged', content: m.content, upstream: content, conflicts: m.conflicts, tool: m.tool };
  }
  return { rel, abs, action: 'skipped', content, reason: 'modified' };
}

export function writeFilePlan(plan) {
  mkdirSync(dirname(plan.abs), { recursive: true });
  writeFileSync(plan.abs, plan.content);
}

export function assertInside(cwd, rel) {
  const abs = resolve(cwd, rel);
  const root = resolve(cwd);
  return abs === root || abs.startsWith(root + sep);
}
