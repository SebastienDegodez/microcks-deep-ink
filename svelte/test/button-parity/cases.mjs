export function cases(names) {
  const result = [];
  function add(kind, props, interactions = ['default']) {
    result.push({ id: `case-${result.length}`, kind, props, interactions });
  }
  for (const kind of ['button', 'link']) {
    for (const variant of ['primary', 'secondary', 'outline', 'ghost', 'link', 'dashed', 'danger']) {
      for (const size of ['xs', 'sm', 'compact', 'tile', 'md', 'lg']) {
        add(kind, { variant, size, icon: 'plus' }, ['default', 'hover', 'focus']);
      }
      for (const size of ['xs', 'lg']) {
        for (const state of [
          { disabled: true }, { loading: true }, { 'aria-pressed': true },
          { iconOnly: true, 'aria-label': 'Add API' }, { confirm: true },
        ]) add(kind, { variant, size, icon: 'never-tested', ...state });
      }
    }
    add(kind, { variant: 'outline', tone: 'link', size: 'xs', icon: 'undo' }, ['default', 'hover', 'focus']);
    for (const variant of ['ghost', 'link']) add(kind, { variant, tone: 'danger', icon: 'trash' }, ['default', 'hover', 'focus']);
  }
  for (const icon of names) add('button', { icon });
  return result;
}
