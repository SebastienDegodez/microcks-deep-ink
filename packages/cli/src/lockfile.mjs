import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
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

export function newLock({ framework, out, cssOut, registryVersion, noFonts, markupOnly }) {
  return {
    framework,
    out,
    cssOut,
    registryVersion,
    ...(noFonts ? { noFonts: true } : {}),
    ...(markupOnly ? { markupOnly: true } : {}),
    items: {},
  };
}

/** Base copies: the registry version of each file as it was copied, the common ancestor for diff and merge. */
export const BASE_DIR = '.deep-ink/base';

const baseFile = (cwd, rel) => join(cwd, BASE_DIR, ...rel.split('/'));

export function readBase(cwd, rel) {
  const file = baseFile(cwd, rel);
  return existsSync(file) ? readFileSync(file, 'utf8') : undefined;
}

export function writeBase(cwd, rel, content) {
  const file = baseFile(cwd, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
}

export function removeBase(cwd, rel) {
  rmSync(baseFile(cwd, rel), { force: true });
}
