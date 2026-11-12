import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const workspace = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const demo = join(workspace, 'apps/demo');
const requireDemo = createRequire(join(demo, 'package.json'));
const requireStorybook = createRequire(join(workspace, 'apps/storybook/package.json'));
const { createServer } = await import(requireDemo.resolve('vite'));
const { chromium } = requireStorybook('playwright');
let server;
let cacheDir;
let browser;

try {
  let url = process.argv[2];
  if (!url) {
    // A second dev server must not replace the live preview's optimized dependencies.
    cacheDir = await mkdtemp(join(demo, 'node_modules/.demo-smoke-'));
    server = await createServer({
      root: demo,
      configFile: join(demo, 'vite.config.ts'),
      cacheDir,
      server: { host: '127.0.0.1', port: 0, strictPort: true },
      logLevel: 'error',
    });
    await server.listen();
    url = server.resolvedUrls.local[0];
  }
  const base = new URL(url);
  base.hash = '';
  browser = await chromium.launch({ headless: true });
  const errors = [];
  async function newPage() {
    const page = await browser.newPage();
    await page.addInitScript(() => localStorage.setItem('deep-ink-demo-fast', '1'));
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('requestfailed', (request) => errors.push(`${request.url()}: ${request.failure()?.errorText}`));
    page.on('response', (response) => {
      if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
    });
    return page;
  }
  let page = await newPage();
  await page.goto(base.href);
  await page.getByRole('heading', { name: 'Cockpit', exact: true }).waitFor();
  await page.waitForLoadState('networkidle');
  const routes = await page.evaluate(async () => {
    const { ROUTES } = await import('/src/ui/app/routes.ts');
    return ROUTES.map(({ id, example, load }) => ({
      id, example, pending: load.toString().includes('PendingPage.svelte'),
    }));
  });

  // Exercise the real preview while the usual validation tools also run.
  const result = await promisify(execFile)(process.execPath, [
    join(demo, 'node_modules/vitest/vitest.mjs'), 'run', 'src/app.routes.test.ts', '--no-fsModuleCache',
  ], { cwd: demo, timeout: 120_000, maxBuffer: 2 * 1024 * 1024 });
  console.log(result.stdout.trim());

  async function checkPage(label) {
    await page.waitForLoadState('networkidle');
    await page.locator('main [aria-busy="true"]').first().waitFor({ state: 'hidden' });
    const heading = page.locator('main h1');
    await heading.waitFor();
    assert.equal(await heading.count(), 1, `${label}: expected one h1`);
    const text = await heading.innerText();
    assert(text.trim(), `${label}: empty heading`);
    assert.notEqual(text, 'Something went wrong', `${label}: ${await page.locator('main').innerText()}`);
    assert((await page.title()).endsWith(' · Microcks'), `${label}: missing document title`);
    assert.deepEqual(errors, [], `${label}: browser errors`);
  }

  const menu = await page.getByRole('navigation', { name: 'Main', exact: true }).getByRole('link').allTextContents();
  for (const name of menu) {
    await page.getByRole('navigation', { name: 'Main', exact: true }).getByRole('link', { name, exact: true }).click();
    await checkPage(name);
  }
  console.log(`Menu: ${menu.length}/${menu.length} entries load after Vitest, without reloading the browser.`);

  await page.close();
  page = await newPage();
  for (const route of routes) {
    await page.goto(`${base.href}#${route.example}`);
    await checkPage(route.id);
    if (route.id !== 'not-found') {
      assert.notEqual(await page.locator('main h1').innerText(), 'Page not found', route.id);
    }
    console.log(`${route.pending ? 'PLACEHOLDER' : 'OK'} ${route.id}: ${route.example}`);
  }
  const pending = routes.filter((route) => route.pending);
  console.log(`Routes: ${routes.length - pending.length} implemented, ${pending.length} placeholders (${pending.map((route) => route.id).join(', ')}).`);

  await page.goto(`${base.href}#/admin`);
  await checkPage('admin');
  await page.getByRole('tab').first().waitFor();
  const tabs = await page.getByRole('tab').all();
  assert(tabs.length > 0, 'Administration: missing tabs');
  for (const tab of tabs) {
    const name = await tab.innerText();
    await tab.click();
    await checkPage(`admin: ${name}`);
    assert.equal(await tab.getAttribute('aria-selected'), 'true', name);
    await page.getByRole('tabpanel').waitFor();
  }
  console.log(`Administration: ${tabs.length}/${tabs.length} tabs load.`);
} catch (error) {
  if (error.stdout) console.error(String(error.stdout));
  if (error.stderr) console.error(String(error.stderr));
  throw error;
} finally {
  await browser?.close();
  await server?.close();
  if (cacheDir) await rm(cacheDir, { recursive: true, force: true });
}
