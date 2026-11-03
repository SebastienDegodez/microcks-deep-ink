import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const withNewline = (text) => (text === '' || text.endsWith('\n') ? text : text + '\n');

/** `git merge-file`, or undefined when git is not available or fails. */
function mergeWithGit(local, base, upstream) {
  const dir = mkdtempSync(join(tmpdir(), 'deep-ink-merge-'));
  try {
    const files = { local, base, upstream };
    for (const [name, text] of Object.entries(files)) writeFileSync(join(dir, name), text);
    const r = spawnSync(
      'git',
      ['merge-file', '-p', '-L', 'yours', '-L', 'base', '-L', 'registry', join(dir, 'local'), join(dir, 'base'), join(dir, 'upstream')],
      { encoding: 'utf8' },
    );
    // Exit code: number of conflicts (at most 127), 128 and above for an error. No status: git is missing.
    if (r.error || r.status === null || r.status >= 128) return undefined;
    return { content: r.stdout, conflicts: r.status, tool: 'git' };
  } catch {
    return undefined;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** Without git: take the side that changed, or write the whole file as one conflict. */
function mergeWithoutGit(local, base, upstream) {
  if (local === base) return { content: upstream, conflicts: 0, tool: 'builtin' };
  if (upstream === base || upstream === local) return { content: local, conflicts: 0, tool: 'builtin' };
  const content = `<<<<<<< yours\n${withNewline(local)}=======\n${withNewline(upstream)}>>>>>>> registry\n`;
  return { content, conflicts: 1, tool: 'builtin' };
}

/**
 * Three-way merge of your file (local), the registry version you copied (base) and the current one (upstream).
 * Returns { content, conflicts, tool }. Conflicts are written as <<<<<<< / ======= / >>>>>>> markers.
 */
export function threeWayMerge(local, base, upstream) {
  return mergeWithGit(local, base, upstream) ?? mergeWithoutGit(local, base, upstream);
}
