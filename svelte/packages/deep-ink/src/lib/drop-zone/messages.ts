export function filesReadyMessage(count: number): string {
  return `${count} ${count === 1 ? 'file' : 'files'} ready`;
}
