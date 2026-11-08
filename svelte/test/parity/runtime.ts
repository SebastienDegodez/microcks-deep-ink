import { toId, storyNameFromExport, isExportStory } from 'storybook/internal/csf';
import { setTheme } from '@microcks/deep-ink';

export function locate(module: any, id: string) {
  const meta = module.default;
  for (const [key, story] of Object.entries(module)) {
    if (!isExportStory(key, meta)) continue;
    if (toId(meta.id ?? meta.title, storyNameFromExport(key)) === id) {
      const value: any = story;
      return { meta, story: value, args: { ...meta.args, ...value.args }, context: {
        component: meta.component, id, name: value.name ?? storyNameFromExport(key), title: meta.title,
        args: { ...meta.args, ...value.args }, argTypes: { ...meta.argTypes, ...value.argTypes },
        parameters: { ...meta.parameters, ...value.parameters }, globals: { theme: new URLSearchParams(location.search).get('theme') ?? 'dark' },
        hooks: {}, viewMode: 'story', loaded: {},
      } };
    }
  }
  throw Error(`Missing story ${id}`);
}

export async function prepare(modules: Record<string, () => Promise<any>>) {
  const query = new URLSearchParams(location.search);
  const id = query.get('id')!;
  const module = await modules[query.get('file')!]();
  const result = locate(module, id);
  const theme = result.context.globals.theme as 'dark' | 'light';
  setTheme(theme, false);
  const frame = document.getElementById('app')!;
  Object.assign(frame.style, { background: 'var(--bg)', color: 'var(--text)', padding: result.context.parameters.layout === 'fullscreen' ? '0' : '24px', minHeight: '100%' });
  return { ...result, frame };
}

export async function ready() {
  await document.fonts.ready;
  (window as any).__parityReady = true;
}
