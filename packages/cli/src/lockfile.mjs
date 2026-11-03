import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CliError } from './registry.mjs';

export const LOCK_NAME = 'deep-ink.json';

export const sha256 = (text) => createHash('sha256').update(text).digest('hex');

export function readLock(cwd) {
  const file = join(cwd, LOCK_NAME);
  if (!existsSync(file)) return undefined;
  try {
    const lock = JSON.parse(readFileSync(file, 'utf8'));
    lock.items ??= {};
    return lock;
  } catch (e) {
    throw new CliError(`${LOCK_NAME} is not valid JSON (${e.message}). Fix or delete it.`);
  }
}

export function writeLock(cwd, lock) {
  writeFileSync(join(cwd, LOCK_NAME), JSON.stringify(lock, null, 2) + '\n');
}

export function newLock({ framework, out, cssOut, registryVersion, noFonts }) {
  return { framework, out, cssOut, registryVersion, ...(noFonts ? { noFonts: true } : {}), items: {} };
}
