type Paths = Record<string, readonly (string | { readonly d: string; readonly dash: string })[]>;
export function readPaths(source: string): Paths;
export function registryPaths(): Paths;
