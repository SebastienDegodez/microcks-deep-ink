import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, posix, relative, resolve, sep } from 'node:path';
import { sha256 } from './lockfile.mjs';

/** Posix path relative to cwd, used as the lockfile key and in messages. */
export const relPath = (cwd, abs) => relative(cwd, abs).split(sep).join(posix.sep);

/**
 * Overwrite policy (D9):
 *   identical file                      -> same (skipped)
 *   unchanged since the last copy       -> updated silently
 *   modified locally                    -> skipped and reported (exit 2), unless overwrite
 */
export function planFile({ cwd, rel, content, lockedHash, overwrite }) {
  const abs = join(cwd, rel);
  if (!existsSync(abs)) return { rel, abs, action: 'added', content };
  const current = readFileSync(abs, 'utf8');
  if (sha256(current) === sha256(content)) return { rel, abs, action: 'same', content };
  if (lockedHash && sha256(current) === lockedHash) return { rel, abs, action: 'updated', content };
  if (overwrite) return { rel, abs, action: 'updated', content, overwritten: true };
  return { rel, abs, action: 'skipped', content };
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
