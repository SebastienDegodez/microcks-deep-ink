import type { AdminUser, Role } from '../../domain/govern/index.js';

type ChipTone = 'neutral' | 'info';
type ChipVariant = 'outline' | 'solid';

/** Order of the prototype's select. */
export const ROLES: { id: Role; label: string }[] = [
  { id: 'user', label: 'User' },
  { id: 'manager', label: 'Manager' },
  { id: 'admin', label: 'Admin' },
];
/** Microcks client roles are cumulative: an admin also holds manager and user. */
export const ROLE_CHIPS: Record<Role, Role[]> = { admin: ['user', 'manager', 'admin'], manager: ['user', 'manager'], user: ['user'] };
/** Text of the Manager groups cell of a user without a group. */
export const NO_GROUP: Record<Role, string> = { admin: 'all Services', manager: 'no group yet', user: 'n/a' };

/** Users whose name, username or email contains the trimmed query, ignoring case. */
export function filterUsers(all: AdminUser[], query: string): AdminUser[] {
  const q = query.trim().toLowerCase();
  return all.filter((u) => !q || `${u.name} ${u.id} ${u.email}`.toLowerCase().includes(q));
}

/** Number of users holding a role. */
export const roleCount = (all: AdminUser[], r: Role) => all.filter((u) => u.role === r).length;

/** Tone of a role chip: `user` neutral, the others info. */
export const roleChipTone = (r: Role): ChipTone => (r === 'user' ? 'neutral' : 'info');

/** Variant of a role chip: `manager` outlined, the others solid. */
export const roleChipVariant = (r: Role): ChipVariant => (r === 'manager' ? 'outline' : 'solid');

/** Status message after a role change: "Léa Martin is now a manager in realm microcks." */
export const roleChangedMessage = (u: AdminUser, role: Role) => `${u.name} is now ${role === 'admin' ? 'an admin' : `a ${role}`} in realm microcks.`;

/** Tooltip of the role select of a user. */
export const roleSelectTitle = (u: AdminUser) => (u.self ? 'You cannot change your own role' : `Change the Microcks role of ${u.name}`);

/** Text of the users table when the filter matches nobody. */
export const noUserText = (query: string) => `No user matches “${query.trim()}”.`;
