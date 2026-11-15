/** Framework-neutral Storybook index discovery; docs are opt-in to preserve existing audits. */
export function storybookJobs(entries, relative, includeDocs = false) {
  return Object.values(entries).filter((entry) => entry.type === 'story' || (includeDocs && entry.type === 'docs')).map((entry) => ({
    url: relative(`iframe.html?id=${encodeURIComponent(entry.id)}&viewMode=${entry.type}`),
    label: entry.id,
    kind: 'story',
  }));
}
