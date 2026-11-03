// `a11yDoc(name)`: markdown documenting the keyboard model, ARIA and RGAA/WCAG references of a registry item.
// Used as `parameters.docs.description.component` in every story meta of both Storybooks.
// Reads the light index (no file contents), so it is safe to import from a story.
import registry from '@microcks-deep-ink/registry/dist/registry.json';

interface A11yItem {
  name: string;
  title: string;
  a11y: { pattern: string; keyboard: string[][]; aria: string[]; rgaa: string[]; wcag: string[]; notes?: string };
}

const items = (registry as unknown as { items: A11yItem[] }).items;

/** Wraps HTML-looking fragments like <button> in code spans so markdown does not render them. */
function safe(text: string): string {
  return text.replace(/<\/?[a-zA-Z][^<>]*>/g, (m) => `\`${m}\``).replace(/\|/g, '\\|');
}

export function a11yDoc(name: string): string {
  const item = items.find((i) => i.name === name);
  if (!item) return `_No accessibility entry in the registry for "${name}"._`;
  const { pattern, keyboard, aria, rgaa, wcag, notes } = item.a11y;
  const lines: string[] = [];
  lines.push(`### Accessibility`, '', `**Pattern.** ${safe(pattern)}`, '');
  lines.push('**Keyboard**', '');
  if (keyboard.length) {
    lines.push('| Key | Action |', '| --- | --- |');
    for (const [key, action] of keyboard) lines.push(`| ${safe(key)} | ${safe(action ?? '')} |`);
  } else {
    lines.push('No keyboard interaction: the component is not focusable.');
  }
  lines.push('', '**ARIA and semantics**', '');
  for (const a of aria) lines.push(`- ${safe(a)}`);
  lines.push('', `**References.** RGAA 4.1.2: ${rgaa.length ? rgaa.join(', ') : 'none'}. WCAG 2.1: ${wcag.length ? wcag.join(', ') : 'none'}.`);
  if (notes) lines.push('', safe(notes));
  lines.push('', '_Automated checks (axe, a11ylint) do not replace a human audit: this component is not audited._');
  return lines.join('\n');
}

/** Short one-line summary of an item, for story descriptions. */
export function itemTitle(name: string): string {
  return items.find((i) => i.name === name)?.title ?? name;
}
