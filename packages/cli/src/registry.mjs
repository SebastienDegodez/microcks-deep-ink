import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

export class CliError extends Error {
  constructor(message, code = 1) {
    super(message);
    this.exitCode = code;
  }
}

export function defaultRegistryPath() {
  return resolve(HERE, '..', '..', 'registry', 'dist', 'registry.full.json');
}

/** Loads registry.full.json (the one with file contents). */
export function loadRegistry(file) {
  const path = file ? resolve(file) : defaultRegistryPath();
  if (!existsSync(path)) {
    throw new CliError(`Registry not found at ${path}.\nRun \`pnpm build\` in the Deep Ink repo first.`);
  }
  let registry;
  try {
    registry = JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    throw new CliError(`Registry at ${path} is not valid JSON (${e.message}). Run \`pnpm build\` in the Deep Ink repo first.`);
  }
  if (!Array.isArray(registry.items)) throw new CliError(`Registry at ${path} has no items. Run \`pnpm build\` in the Deep Ink repo first.`);
  return registry;
}

export function findItem(registry, name) {
  const item = registry.items.find((i) => i.name === name);
  if (!item) {
    const names = registry.items.map((i) => i.name).join(', ');
    throw new CliError(`Unknown item "${name}". Available: ${names}`);
  }
  return item;
}
