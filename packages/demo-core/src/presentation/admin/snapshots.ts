import { plural } from './notify.js';

/** File of the "Use a sample snapshot" button. */
export const SAMPLE = 'microcks-repository-staging.json';
/** Preselected on the prototype. */
export const INITIAL = ['pastry2', 'orders'];
/** File name when a dropped file has none. */
export const DEFAULT_FILE = 'microcks-repository.json';

/** Selection after a service checkbox changes. */
export const toggledSelection = (selected: string[], id: string, checked: boolean) => (checked ? [...selected, id] : selected.filter((x) => x !== id));

/** Status message after an import. */
export const importedMessage = (fileName: string, r: { created: number; replaced: number }) =>
  `Snapshot ${fileName} imported: ${plural(r.created, 'Service')} created, ${r.replaced} replaced.`;
