// axe-core helper for jsdom specs. Color contrast needs real layout, so it is checked
// by the tokens contrast test and by the browser smoke run instead.
import axe from 'axe-core';

export async function axeViolations(root: Element): Promise<string[]> {
  const results = await axe.run(root, {
    rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
  });
  return results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`);
}
