import { membershipKey, type AdminGroup } from '../../domain/govern/index.js';

/** Sections of the Administration page, in the order of its tabs. */
export const TABS = ['users', 'groups', 'secrets', 'snapshots', 'configuration'] as const;
/** One section of the Administration page. */
export type Tab = (typeof TABS)[number];
/** The prototype's toast hides itself after 4 s. */
export const TOAST_MS = 4000;

/** Tab of the `:tab?` route parameter: `users` when it names no section. */
export const tabOf = (tabParam: string | undefined): Tab => ((TABS as readonly string[]).includes(tabParam ?? '') ? (tabParam as Tab) : 'users');

/** Saved memberships of the groups, as `groupId|userId` keys. */
export const savedMemberships = (groups: AdminGroup[]): string[] => groups.flatMap((g) => g.members.map((m) => membershipKey(g.id, m)));

/** Words read after the pending count of the Groups tab. */
export const alertLabel = (pending: number) => (pending === 1 ? 'pending change' : 'pending changes');
