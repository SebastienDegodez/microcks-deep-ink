import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const FRAMEWORKS = ['react', 'angular', 'html'];

export const DEFAULT_DIRS = {
  react: { out: 'src/components/ui', cssOut: 'src/styles/deep-ink' },
  angular: { out: 'src/app/ui', cssOut: 'src/styles/deep-ink' },
  html: { out: 'deep-ink', cssOut: 'deep-ink/css' },
};

/** `@angular/core` means angular, `react` means react, anything else html. */
export function detectFramework(cwd) {
  const file = join(cwd, 'package.json');
  if (!existsSync(file)) return 'html';
  try {
    const pkg = JSON.parse(readFileSync(file, 'utf8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies, ...pkg.peerDependencies };
    if (deps['@angular/core']) return 'angular';
    if (deps.react) return 'react';
  } catch {
    /* unreadable package.json: fall through to html */
  }
  return 'html';
}
