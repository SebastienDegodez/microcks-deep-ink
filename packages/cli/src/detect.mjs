import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Frameworks the CLI copies. React is not one of them: it uses the @microcks/deep-ink package. */
export const FRAMEWORKS = ['angular', 'html'];

/** What a React project installs instead of copying. */
export const REACT_PACKAGE = '@microcks/deep-ink';

export const DEFAULT_DIRS = {
  angular: { out: 'src/app/ui', cssOut: 'src/styles/deep-ink' },
  html: { out: 'deep-ink', cssOut: 'deep-ink/css' },
};

/** `@angular/core` means angular, `react` means react (the package, nothing to copy), anything else html. */
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
