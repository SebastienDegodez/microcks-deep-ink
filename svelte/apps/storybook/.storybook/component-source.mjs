/** Source for stories rendered directly from the package, updated with Controls. */
export function componentSource(component, args, snippets = {}) {
  const attributes = [];
  const blocks = [];
  let children = '';
  for (const [name, value] of Object.entries(args ?? {})) {
    if (value === undefined) continue;
    if (name === 'children' && typeof value === 'string') {
      children = value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('{', '&#123;');
    } else if (name in snippets) {
      if (name === 'children') children = snippets[name];
      else blocks.push(`  {#snippet ${name}()}${snippets[name]}{/snippet}`);
    } else if (typeof value === 'function') {
      attributes.push(`${name}={(...event) => console.log(event)}`);
    } else if (value === true) {
      attributes.push(name);
    } else if (typeof value === 'string') {
      const text = value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('{', '&#123;');
      attributes.push(`${name}="${text}"`);
    } else {
      attributes.push(`${name}={${JSON.stringify(value)}}`);
    }
  }
  const props = attributes.length ? ` ${attributes.join(' ')}` : '';
  const content = blocks.length ? `\n${blocks.join('\n')}\n  ${children}\n` : children;
  return `<script>\n  import { ${component} } from '@microcks/deep-ink';\n</script>\n\n<${component}${props}${content ? `>${content}</${component}>` : ' />'}`;
}
