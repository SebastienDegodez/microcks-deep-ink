/** Shows a message in the page's status row (it hides itself after a few seconds). */
export type Notify = (message: string) => void;

/** "1 importer", "2 importers". */
export function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}
