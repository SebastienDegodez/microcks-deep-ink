import type { AdminGroup, AdminUser, MembershipChange } from '../../domain/govern/index.js';
import { plural } from './notify.js';

/** State of a cell of the groups × managers matrix. */
export type CellState = 'add' | 'remove' | 'member' | 'empty';

/** State of a membership cell, from the saved membership and the draft. */
export const cellState = (was: boolean, now: boolean): CellState => (now && !was ? 'add' : was && !now ? 'remove' : now ? 'member' : 'empty');

/** Accessible name of a membership cell: "Clara Nguyen in /microcks/manager/beer, member, to be added". */
export const cellLabel = (m: AdminUser, g: AdminGroup, now: boolean, state: CellState) =>
  `${m.name} in ${g.name}, ${now ? 'member' : 'not a member'}${state === 'add' ? ', to be added' : state === 'remove' ? ', to be removed' : ''}`;

/** Tooltip of a membership cell. */
export const cellTitle = (state: CellState, now: boolean) => (state === 'add' ? 'To be added' : state === 'remove' ? 'To be removed' : now ? 'Member' : 'Not a member');

/** Pending changes on one line: "+ clara → /microcks/manager/beer", a removal with "−" and "✕". */
export function changesLine(changes: MembershipChange[], all: AdminGroup[]): string {
  const pathOf = (groupId: string) => all.find((g) => g.id === groupId)?.name ?? groupId;
  return changes.map((c) => (c.kind === 'add' ? `+ ${c.userId} → ${pathOf(c.groupId)}` : `− ${c.userId} ✕ ${pathOf(c.groupId)}`)).join('   ');
}

/** Minimum width of the matrix: the group column, one column per manager and the coverage column. */
export const matrixMinWidth = (managers: number) => `${230 + managers * 92 + 152}px`;

/** Width of the group column of the matrix. */
export const groupColumnWidth = (managers: number) => `${(1.6 / (1.6 + managers)) * 87 + 1.4}%`;

/** Draft after a cell toggle: null when it matches the saved memberships again. */
export function toggledDraft(current: string[], saved: string[], key: string): string[] | null {
  const next = current.includes(key) ? current.filter((k) => k !== key) : [...current, key];
  const same = next.length === saved.length && next.every((k) => saved.includes(k));
  return same ? null : next;
}

/** Members of a group in the draft, from its `groupId|userId` keys. */
export const draftMembers = (current: string[], groupId: string) => current.filter((k) => k.startsWith(`${groupId}|`)).map((k) => k.split('|')[1] ?? '');

/** Status message after Apply. */
export const appliedMessage = (changes: number) => `${plural(changes, 'membership change')} applied in Keycloak realm microcks.`;
