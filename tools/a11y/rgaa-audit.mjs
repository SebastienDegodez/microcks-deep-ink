#!/usr/bin/env node
// RGAA audit runner: runs @a11ylint/core (RGAA numbering) and axe-core against URLs in headless Chromium and writes
// one stable report (JSON schema documented in README.md). Zero dependencies: it speaks the Chrome DevTools Protocol
// over Node's built-in WebSocket client. Node >= 22.
//
//   node tools/a11y/rgaa-audit.mjs --url <url|file> [--url ...] | --urls-from <index.json|routes.json>
//        [--format json,md] [--out DIR] [--theme dark,light] [--engines a11ylint,axe] ...
//
// Exit codes: 0 no blocking finding, 1 at least one blocking finding (non-compliant criterion), 2 usage error or the
// audit could not run completely (browser missing, page failed to load). See README.md.
import { spawn } from 'node:child_process';
import { storybookJobs } from './storybook-jobs.mjs';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const CATALOG = JSON.parse(readFileSync(join(HERE, 'rgaa-criteria.json'), 'utf8'));
const SCHEMA_VERSION = 1;
const IMPACT_ORDER = ['minor', 'moderate', 'serious', 'critical'];
const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'];
const STORY_AXE_DISABLED = ['region', 'landmark-one-main', 'page-has-heading-one', 'bypass', 'skip-link'];

const HELP = `rgaa-audit.mjs: RGAA 4.1.2 audit with a11ylint and axe-core (headless Chromium, CDP, no dependencies)

Inputs (at least one):
  --url <url|file>        Page to audit; repeatable. A path is turned into a file:// URL.
  --urls-from <file|url>  Storybook index.json (every "story" entry becomes iframe.html?id=...), a routes JSON
                          (array of strings/objects, or {"baseUrl","routes":[...]}), or a text file, one URL per line.
  --base-url <url>        Base for relative entries of --urls-from (and for a Storybook index read from disk).
Options:
  --include-docs         Also audit MDX/autodocs entries (including native Svelte embedded stories).
  --kind auto|page|story  "story" drops page-level checks (8.x, 9.x, 12.6, 12.7). auto = story when the URL
                          contains iframe.html. Default auto.
  --theme dark,light      Themes to audit (sets localStorage["microcks-theme"], &globals=theme:X for Storybook,
                          prefers-color-scheme). Default dark,light. Use --theme none to leave the page alone.
  --engines a11ylint,axe  Engines to run. Default both.
  --axe-min-impact LEVEL  Axe findings below this impact are advisory, not blocking. Default serious.
  --known-issues FILE     JSON array of waivers {engine, rule, urlPattern, reason, finding}; waived findings stay in
                          the report but do not block.
  --format json,md        Report formats. Default json,md.
  --out DIR               Output directory (rgaa-report.json / rgaa-report.md). Default ./a11y-report.
  --include-untested      Also list manual criteria in every page entry (summary always has all 106).
  --concurrency N         Parallel tabs. Default 4.
  --timeout MS            Per-page navigation timeout. Default 30000.
  --settle MS             Extra wait after load, default 800.
  --limit N               Audit only the first N URLs (debug).
  --browser PATH          Chromium/Chrome executable (else $CHROME_PATH, Playwright caches, system chrome).
  --upstream-raw          Diagnostics: run a11ylint with NO workaround (exactly the published behaviour), to reproduce
                          the problems of docs/a11ylint-findings.md. Not for gating.
  --quiet                 No progress on stderr.
  --help
Exit codes: 0 ok, 1 blocking findings, 2 usage error or incomplete audit.`;

// ---------------------------------------------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------------------------------------------
function parseArgs(argv) {
  const o = {
    urls: [], urlsFrom: null, baseUrl: null, kind: 'auto', themes: ['dark', 'light'], engines: ['a11ylint', 'axe'],
    axeMinImpact: 'serious', knownIssues: null, formats: ['json', 'md'], out: 'a11y-report', includeUntested: false,
    includeDocs: false, concurrency: 4, timeout: 30000, settle: 800, limit: 0, browser: null, quiet: false, raw: false,
  };
  const list = (v) => v.split(',').map((s) => s.trim()).filter(Boolean);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const val = () => {
      if (i + 1 >= argv.length) throw new Error(`${a} needs a value`);
      return argv[++i];
    };
    switch (a) {
      case '--url': o.urls.push(val()); break;
      case '--urls-from': o.urlsFrom = val(); break;
      case '--base-url': o.baseUrl = val(); break;
      case '--kind': o.kind = val(); break;
      case '--theme': { const t = val(); o.themes = t === 'none' ? [null] : list(t); break; }
      case '--engines': o.engines = list(val()); break;
      case '--axe-min-impact': o.axeMinImpact = val(); break;
      case '--known-issues': o.knownIssues = val(); break;
      case '--format': o.formats = list(val()); break;
      case '--out': o.out = val(); break;
      case '--include-docs': o.includeDocs = true; break;
      case '--include-untested': o.includeUntested = true; break;
      case '--concurrency': o.concurrency = Math.max(1, Number(val())); break;
      case '--timeout': o.timeout = Number(val()); break;
      case '--settle': o.settle = Number(val()); break;
      case '--limit': o.limit = Number(val()); break;
      case '--browser': o.browser = val(); break;
      case '--quiet': o.quiet = true; break;
      case '--upstream-raw': o.raw = true; break;
      case '--help': case '-h': console.log(HELP); process.exit(0); break;
      default: throw new Error(`Unknown option ${a}`);
    }
  }
  if (!['auto', 'page', 'story'].includes(o.kind)) throw new Error('--kind must be auto, page or story');
  if (!o.engines.length || o.engines.some((e) => !['a11ylint', 'axe'].includes(e))) throw new Error('--engines: a11ylint,axe');
  if (!IMPACT_ORDER.includes(o.axeMinImpact)) throw new Error(`--axe-min-impact: ${IMPACT_ORDER.join('|')}`);
  if (o.formats.some((f) => !['json', 'md'].includes(f))) throw new Error('--format: json,md');
  if (!o.urls.length && !o.urlsFrom) throw new Error('Give --url or --urls-from (see --help)');
  return o;
}

const toUrl = (s) => (/^[a-z][a-z0-9+.-]*:/i.test(s) ? s : pathToFileURL(resolve(s)).href);

async function readText(source) {
  if (/^https?:/i.test(source)) {
    const res = await fetch(source);
    if (!res.ok) throw new Error(`${source}: HTTP ${res.status}`);
    return res.text();
  }
  return readFileSync(source.replace(/^file:\/\//, ''), 'utf8');
}

async function resolveJobs(o) {
  const jobs = o.urls.map((u) => ({ url: toUrl(u), label: u }));
  if (o.urlsFrom) {
    const text = await readText(o.urlsFrom);
    let data = null;
    try { data = JSON.parse(text); } catch { /* plain text list */ }
    const fromUrl = /^https?:/i.test(o.urlsFrom);
    const base = o.baseUrl || (fromUrl ? o.urlsFrom.replace(/[^/]*$/, '') : null);
    const rel = (u) => (/^[a-z][a-z0-9+.-]*:/i.test(u) ? u : new URL(u, base || pathToFileURL(process.cwd() + '/').href).href);
    if (data && data.entries) {
      jobs.push(...storybookJobs(data.entries, rel, o.includeDocs));
    } else {
      const routes = Array.isArray(data) ? data : data?.routes ?? text.split('\n').map((s) => s.trim()).filter(Boolean);
      const routeBase = data?.baseUrl || base;
      for (const r of routes) {
        const item = typeof r === 'string' ? { url: r } : r;
        jobs.push({ url: new URL(item.url, routeBase || pathToFileURL(process.cwd() + '/').href).href, label: item.label || item.url, ...(item.kind ? { kind: item.kind } : {}) });
      }
    }
  }
  return o.limit ? jobs.slice(0, o.limit) : jobs;
}

// ---------------------------------------------------------------------------------------------------------------
// Chromium over CDP
// ---------------------------------------------------------------------------------------------------------------
function findBrowser(explicit) {
  const candidates = [explicit, process.env.CHROME_PATH].filter(Boolean);
  const roots = [process.env.PLAYWRIGHT_BROWSERS_PATH, join(homedir(), '.cache/ms-playwright'), '/opt/pw-browsers'].filter(Boolean);
  for (const root of roots) {
    if (!existsSync(root)) continue;
    for (const dir of readdirSync(root).sort().reverse()) {
      if (/^chromium-\d+/.test(dir)) {
        for (const sub of ['chrome-linux64/chrome', 'chrome-linux/chrome', 'chrome-mac/Chromium.app/Contents/MacOS/Chromium']) {
          candidates.push(join(root, dir, sub));
        }
      }
    }
  }
  candidates.push('/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
  const found = candidates.find((c) => c && existsSync(c));
  if (!found) throw new Error('No Chromium found. Pass --browser, set CHROME_PATH, or run `python -m playwright install chromium`.');
  return found;
}

async function launchBrowser(path) {
  const profile = mkdtempSync(join(tmpdir(), 'rgaa-audit-'));
  const child = spawn(path, [
    '--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-sandbox', '--disable-gpu',
    '--disable-dev-shm-usage', '--hide-scrollbars', '--mute-audio', '--no-first-run', '--no-default-browser-check',
    '--disable-extensions', '--disable-background-networking', 'about:blank',
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
  const wsUrl = await new Promise((res, rej) => {
    let buf = '';
    const timer = setTimeout(() => rej(new Error('Chromium did not start in 20 s')), 20000);
    child.stderr.on('data', (d) => {
      buf += d;
      const m = buf.match(/DevTools listening on (ws:\/\/\S+)/);
      if (m) { clearTimeout(timer); res(m[1]); }
    });
    child.on('exit', (code) => rej(new Error(`Chromium exited early (code ${code}): ${buf.slice(-300)}`)));
  });
  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error('CDP connection failed')); });
  let id = 0;
  const pending = new Map();
  const listeners = new Set();
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { res, rej } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) rej(new Error(`${msg.error.message}`)); else res(msg.result);
    } else if (msg.method) for (const l of listeners) l(msg);
  };
  const send = (method, params = {}, sessionId) => new Promise((res, rej) => {
    const myId = ++id;
    pending.set(myId, { res, rej });
    ws.send(JSON.stringify({ id: myId, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
  const waitFor = (sessionId, method, ms) => new Promise((res, rej) => {
    const timer = setTimeout(() => { listeners.delete(l); rej(new Error(`timeout waiting for ${method}`)); }, ms);
    const l = (m) => { if (m.method === method && m.sessionId === sessionId) { clearTimeout(timer); listeners.delete(l); res(m.params); } };
    listeners.add(l);
  });
  const close = async () => {
    try { await send('Browser.close'); } catch { /* already gone */ }
    // Wait (briefly) for the process to exit, so it no longer writes into the profile while we delete it.
    const exited = child.exitCode !== null || child.signalCode !== null
      ? Promise.resolve()
      : new Promise((res) => { child.once('exit', res); setTimeout(res, 2000); });
    child.kill('SIGKILL');
    await exited;
    // Cleanup must never stop the report from being written (ENOTEMPTY / EBUSY while Chrome lets go of files).
    try {
      rmSync(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
    } catch (e) {
      console.error(`rgaa-audit: could not remove the temporary browser profile ${profile} (${e.code || e.message}); ignored`);
    }
  };
  return { send, waitFor, close };
}

// ---------------------------------------------------------------------------------------------------------------
// In-page scripts
// ---------------------------------------------------------------------------------------------------------------
const SETTLE_SCRIPT = `(async () => {
  const deadline = Date.now() + 8000;
  const story = !!document.querySelector('#storybook-root, #storybook-docs') || /sb-/.test(document.body.className);
  while (Date.now() < deadline) {
    if (document.readyState === 'complete') {
      if (story) { if (/sb-show-(main|errordisplay)/.test(document.body.className)) break; }
      else if (document.getElementById('root')) { if (document.querySelector('main h1, main h2') && !document.querySelector('[aria-busy="true"]')) break; }
      else break;
    }
    await new Promise(r => setTimeout(r, 100));
  }
  return true; })()`;

const axeScript = (kind) => `(async () => {
  const cfg = { runOnly: { type: 'tag', values: ${JSON.stringify(AXE_TAGS)} }, resultTypes: ['violations', 'incomplete'],
    rules: ${JSON.stringify(kind === 'story' ? Object.fromEntries(STORY_AXE_DISABLED.map((r) => [r, { enabled: false }])) : {})} };
  // Storybook's addon-a11y may run its own axe pass in the same page: wait for it instead of failing.
  let r;
  for (let i = 0; ; i++) {
    try { r = await axe.run(document, cfg); break; }
    catch (e) { if (i < 50 && /already running/i.test(String(e && e.message || e))) { await new Promise(res => setTimeout(res, 200)); continue; } throw e; }
  }
  const slim = (list, nodes) => list.map(x => ({ id: x.id, impact: x.impact, help: x.help, helpUrl: x.helpUrl,
    nodes: nodes ? x.nodes.slice(0, 20).map(n => ({ html: n.html.slice(0, 300), target: n.target.join(' '), summary: n.failureSummary })) : [] }));
  return { violations: slim(r.violations, true), incomplete: slim(r.incomplete, false), passes: r.passes.map(x => x.id), inapplicable: r.inapplicable.map(x => x.id), version: axe.version };
})()`;

// ---------------------------------------------------------------------------------------------------------------
// Evaluation: page data -> RGAA criteria
// ---------------------------------------------------------------------------------------------------------------
const ruleKey = (id) => `RGAA - ${id}`;
const impactAtLeast = (impact, min) => IMPACT_ORDER.indexOf(impact) >= IMPACT_ORDER.indexOf(min);

function applicable(rule, counts, doc) {
  const w = CATALOG.a11ylintRules[rule].applicableWhen;
  switch (w) {
    case 'img': return counts.img > 0;
    case 'area': return counts.area > 0;
    case 'svgImg': return counts.svgImg > 0;
    case 'frame': return counts.frame > 0;
    case 'text': return counts.text > 0;
    case 'link': return counts.link > 0;
    case 'field': return counts.field > 0;
    case 'headings': return counts.headings > 0;
    case 'headings2': return counts.headings > 1;
    default: return !!doc;
  }
}

function evaluatePage(raw, o, kind, knownIssues, url) {
  const pageLevel = new Set(CATALOG.pageLevelOnlyForStories);
  const waived = (engine, rule) =>
    knownIssues.find((k) => k.engine === engine && k.rule === rule && new RegExp(k.urlPattern || '.*').test(url));
  const criteria = [];
  for (const c of CATALOG.criteria) {
    const tests = [];
    const findings = [];
    const storyNa = kind === 'story' && pageLevel.has(c.id);

    if (o.engines.includes('a11ylint') && raw.a11ylint) {
      for (const rule of c.a11ylintRules) {
        if (storyNa) { tests.push({ id: rule, engine: 'a11ylint', status: 'not-applicable' }); continue; }
        const list = raw.a11ylint.results[ruleKey(rule)] || [];
        if (list.length) {
          tests.push({ id: rule, engine: 'a11ylint', status: 'non-compliant' });
          const w = waived('a11ylint', rule);
          findings.push({
            engine: 'a11ylint', rule, message: list[0].message, fix: CATALOG.a11ylintRules[rule].hint, blocking: !w,
            ...(w ? { waived: { reason: w.reason, finding: w.finding } } : {}),
            elements: list.slice(0, 20).map((f) => ({ html: f.element })), count: list.length,
          });
        } else {
          tests.push({ id: rule, engine: 'a11ylint', status: applicable(rule, raw.a11ylint.counts, raw.a11ylint.document) ? 'compliant' : 'not-applicable' });
        }
      }
    }

    if (o.engines.includes('axe') && raw.axe) {
      const ax = raw.axe;
      for (const rule of c.axeRules) {
        const v = ax.violations.find((x) => x.id === rule);
        if (v) {
          tests.push({ id: rule, engine: 'axe', status: 'non-compliant', impact: v.impact });
          const w = waived('axe', rule);
          findings.push({
            engine: 'axe', rule, impact: v.impact, message: v.help, helpUrl: v.helpUrl,
            fix: (v.nodes[0] && v.nodes[0].summary ? v.nodes[0].summary.replace(/\s+/g, ' ') : v.help),
            blocking: impactAtLeast(v.impact, o.axeMinImpact) && !w,
            ...(w ? { waived: { reason: w.reason, finding: w.finding } } : {}),
            elements: v.nodes.map((n) => ({ html: n.html, target: n.target })), count: v.nodes.length,
          });
        } else if (kind === 'story' && STORY_AXE_DISABLED.includes(rule)) {
          tests.push({ id: rule, engine: 'axe', status: 'not-applicable' });
        } else if (ax.passes.includes(rule)) tests.push({ id: rule, engine: 'axe', status: 'compliant' });
        else if (ax.incomplete.some((x) => x.id === rule)) tests.push({ id: rule, engine: 'axe', status: 'not-tested-automatically', note: 'axe: needs manual review' });
        else if (ax.inapplicable.includes(rule)) tests.push({ id: rule, engine: 'axe', status: 'not-applicable' });
        else tests.push({ id: rule, engine: 'axe', status: 'not-tested-automatically' });
      }
    }

    let status = 'not-tested-automatically';
    if (tests.some((t) => t.status === 'non-compliant')) status = 'non-compliant';
    else if (tests.some((t) => t.status === 'compliant')) status = 'compliant';
    else if (tests.length && tests.every((t) => t.status === 'not-applicable')) status = 'not-applicable';
    criteria.push({
      id: c.id, theme: c.theme, title: c.title, automatedBy: c.automatedBy, coverage: c.coverage, status, tests, findings,
      ...(status === 'non-compliant' ? { blocking: findings.some((f) => f.blocking) } : {}),
    });
  }
  return criteria;
}

// ---------------------------------------------------------------------------------------------------------------
// Audit
// ---------------------------------------------------------------------------------------------------------------
function pageKind(o, job) {
  if (job.kind) return job.kind;
  if (o.kind !== 'auto') return o.kind;
  return /iframe\.html(\?|$)/.test(job.url) ? 'story' : 'page';
}

function themedUrl(url, theme, kind) {
  if (!theme || kind !== 'story') return url;
  return `${url}${url.includes('?') ? '&' : '?'}globals=theme:${theme}`;
}

async function auditOne(browser, o, job, theme, sources, knownIssues) {
  const kind = pageKind(o, job);
  const url = themedUrl(job.url, theme, kind);
  const entry = { url: job.url, label: job.label, kind, theme, title: null, loadError: null, criteria: [], workarounds: {}, counts: {}, axeUnmapped: [] };
  const { send, waitFor } = browser;
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const s = (m, p) => send(m, p, sessionId);
  try {
    await s('Page.enable');
    await s('Runtime.enable');
    await s('Network.enable');
    await s('Network.setBlockedURLs', { urls: ['*://fonts.googleapis.com/*', '*://fonts.gstatic.com/*'] });
    await s('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
    const features = [{ name: 'prefers-reduced-motion', value: 'reduce' }];
    if (theme) features.push({ name: 'prefers-color-scheme', value: theme });
    await s('Emulation.setEmulatedMedia', { features });
    if (theme) {
      await s('Page.addScriptToEvaluateOnNewDocument', { source: `try{localStorage.setItem('microcks-theme','${theme}')}catch(e){}` });
    }
    const loaded = waitFor(sessionId, 'Page.loadEventFired', o.timeout);
    loaded.catch(() => {});
    const nav = await s('Page.navigate', { url });
    if (nav.errorText) throw new Error(`navigation failed: ${nav.errorText}`);
    await loaded;
    await s('Runtime.evaluate', { expression: SETTLE_SCRIPT, awaitPromise: true });
    await new Promise((r) => setTimeout(r, o.settle));
    const evalIn = async (expression, awaitPromise = false) => {
      const r = await s('Runtime.evaluate', { expression, awaitPromise, returnByValue: true });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description?.split('\n')[0] || r.exceptionDetails.text);
      return r.result.value;
    };
    const raw = {};
    if (o.engines.includes('a11ylint')) {
      await evalIn(sources.a11ylint);
      await evalIn(sources.collect);
      raw.a11ylint = await evalIn(`window.__a11yCollect({ raw: ${o.raw} })`);
      entry.workarounds = raw.a11ylint.workarounds;
      entry.counts = raw.a11ylint.counts;
    }
    if (o.engines.includes('axe')) {
      await evalIn(sources.axe);
      raw.axe = await evalIn(axeScript(kind), true);
    }
    entry.title = await evalIn('document.title');
    entry.criteria = evaluatePage(raw, o, kind, knownIssues, job.url);
    if (raw.axe) {
      const mapped = new Set(CATALOG.criteria.flatMap((c) => c.axeRules));
      entry.axeUnmapped = raw.axe.violations.filter((v) => !mapped.has(v.id)).map((v) => ({
        rule: v.id, impact: v.impact, message: v.help, helpUrl: v.helpUrl,
        blocking: impactAtLeast(v.impact, o.axeMinImpact) && !knownIssues.some((k) => k.engine === 'axe' && k.rule === v.id && new RegExp(k.urlPattern || '.*').test(job.url)),
        elements: v.nodes.map((n) => ({ html: n.html, target: n.target })),
      }));
    }
  } catch (err) {
    entry.loadError = String(err.message || err);
  } finally {
    try { await send('Target.closeTarget', { targetId }); } catch { /* ignore */ }
  }
  if (!o.includeUntested) entry.criteria = entry.criteria.filter((c) => c.automatedBy !== 'manual');
  return entry;
}

function summarize(pages) {
  const statuses = ['compliant', 'non-compliant', 'not-applicable', 'not-tested-automatically'];
  const summary = {};
  for (const c of CATALOG.criteria) {
    summary[c.id] = {
      id: c.id, theme: c.theme, title: c.title, automatedBy: c.automatedBy, coverage: c.coverage,
      status: 'not-tested-automatically', pages: Object.fromEntries(statuses.map((s) => [s, 0])), blocking: false,
    };
  }
  for (const p of pages) {
    if (p.loadError) continue;
    for (const c of p.criteria) {
      const s = summary[c.id];
      s.pages[c.status]++;
      if (c.blocking) s.blocking = true;
    }
  }
  for (const s of Object.values(summary)) {
    const n = s.pages;
    s.status = n['non-compliant'] ? 'non-compliant' : n.compliant ? 'compliant' : n['not-applicable'] && !n['not-tested-automatically'] ? 'not-applicable' : 'not-tested-automatically';
    if (s.automatedBy === 'manual') s.status = 'not-tested-automatically';
  }
  const list = Object.values(summary);
  const totals = Object.fromEntries(statuses.map((st) => [st, list.filter((s) => s.status === st).length]));
  return { criteria: list, totals };
}

// ---------------------------------------------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------------------------------------------
function markdown(report) {
  const L = [];
  const t = report.summary.totals;
  L.push('# RGAA audit report', '');
  L.push(`RGAA ${report.rgaaVersion} · ${report.tool.a11ylint} · ${report.tool.axe} · ${report.generatedAt}`, '');
  L.push('> "compliant" means: no failure in the automated tests of that criterion. It is never a claim of conformance; the status of the product stays "non audité" until a human audit.', '');
  L.push(`Pages audited: **${report.summary.pages}** (${report.summary.loadErrors} failed to load) · themes: ${report.options.themes.join(', ') || 'default'}`, '');
  L.push('| Status | Criteria |', '| --- | --- |');
  for (const [k, v] of Object.entries(t)) L.push(`| ${k} | ${v} |`);
  L.push('', `Blocking findings: **${report.summary.blockingFindings}** · waived: ${report.summary.waivedFindings} · advisory: ${report.summary.advisoryFindings}`, '');

  L.push('## Automated criteria', '', '| Criterion | Engine | Status | Pages (ok / ko / n.a.) |', '| --- | --- | --- | --- |');
  for (const c of report.summary.criteria.filter((x) => x.automatedBy !== 'manual')) {
    L.push(`| ${c.id} ${c.title} | ${c.automatedBy} | ${c.status}${c.blocking ? ' (blocking)' : ''} | ${c.pages.compliant} / ${c.pages['non-compliant']} / ${c.pages['not-applicable']} |`);
  }

  const groups = new Map();
  for (const p of report.pages) {
    for (const c of p.criteria) {
      for (const f of c.findings) {
        const key = `${c.id}|${f.engine}|${f.rule}`;
        const g = groups.get(key) || { c, f, pages: new Set(), samples: new Map() };
        g.pages.add(`${p.label} (${p.theme || 'default'})`);
        for (const e of f.elements.slice(0, 3)) g.samples.set(e.html, (g.samples.get(e.html) || 0) + 1);
        groups.set(key, g);
      }
    }
    for (const u of p.axeUnmapped || []) {
      const key = `-|axe|${u.rule}`;
      const g = groups.get(key) || { c: { id: '-' }, f: { engine: 'axe', rule: u.rule, impact: u.impact, message: u.message, blocking: u.blocking, fix: u.message, elements: [] }, pages: new Set(), samples: new Map() };
      g.pages.add(`${p.label} (${p.theme || 'default'})`);
      for (const e of u.elements.slice(0, 3)) g.samples.set(e.html, 1);
      groups.set(key, g);
    }
  }
  L.push('', '## Findings', '');
  if (!groups.size) L.push('None.', '');
  for (const g of groups.values()) {
    const f = g.f;
    L.push(`### ${g.c.id === '-' ? 'axe (no RGAA mapping)' : `RGAA ${g.c.id}`} · ${f.engine} · ${f.rule}${f.impact ? ` (${f.impact})` : ''}${f.waived ? ' · waived' : f.blocking ? ' · blocking' : ' · advisory'}`, '');
    L.push(f.message, '', `Fix: ${f.fix}`, '', `Pages (${g.pages.size}): ${[...g.pages].slice(0, 5).join('; ')}${g.pages.size > 5 ? '; ...' : ''}`, '');
    if (f.waived) L.push(`Waived: ${f.waived.reason} (${f.waived.finding})`, '');
    for (const html of [...g.samples.keys()].slice(0, 3)) L.push('```html', html, '```');
    L.push('');
  }
  const errors = report.pages.filter((p) => p.loadError);
  if (errors.length) {
    L.push('## Pages that failed to load', '');
    for (const p of errors) L.push(`- ${p.label} (${p.theme || 'default'}): ${p.loadError}`);
    L.push('');
  }
  L.push('## Not tested automatically', '', `${t['not-tested-automatically']} criteria have no automated test (manual criteria, or automated tests that did not apply). Neither status means "compliant". See docs/accessibility.md.`, '');
  return L.join('\n');
}

// ---------------------------------------------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------------------------------------------
async function main() {
  let o;
  try { o = parseArgs(process.argv.slice(2)); } catch (e) { console.error(`rgaa-audit: ${e.message}\n\n${HELP}`); process.exit(2); }
  const log = (...a) => { if (!o.quiet) console.error(...a); };

  const sources = {};
  try {
    if (o.engines.includes('a11ylint')) {
      const bundle = join(HERE, 'dist/a11ylint.iife.js');
      if (!existsSync(bundle)) throw new Error('dist/a11ylint.iife.js is missing: run `pnpm --filter a11y-tools build`');
      sources.a11ylint = readFileSync(bundle, 'utf8');
      sources.collect = readFileSync(join(HERE, 'src/collect.js'), 'utf8');
    }
    if (o.engines.includes('axe')) sources.axe = readFileSync(join(HERE, 'node_modules/axe-core/axe.min.js'), 'utf8');
  } catch (e) { console.error(`rgaa-audit: ${e.message}`); process.exit(2); }

  const knownIssues = o.knownIssues ? JSON.parse(readFileSync(o.knownIssues, 'utf8')) : [];
  let jobs;
  try { jobs = await resolveJobs(o); } catch (e) { console.error(`rgaa-audit: ${e.message}`); process.exit(2); }
  if (!jobs.length) { console.error('rgaa-audit: no URL to audit'); process.exit(2); }

  let browser;
  try { browser = await launchBrowser(findBrowser(o.browser)); } catch (e) { console.error(`rgaa-audit: ${e.message}`); process.exit(2); }

  const queue = [];
  for (const job of jobs) for (const theme of o.themes) queue.push({ job, theme });
  const pages = new Array(queue.length);
  let next = 0;
  let done = 0;
  const worker = async () => {
    while (next < queue.length) {
      const i = next++;
      const { job, theme } = queue[i];
      pages[i] = await auditOne(browser, o, job, theme, sources, knownIssues);
      done++;
      if (done % 20 === 0 || done === queue.length) log(`rgaa-audit: ${done}/${queue.length}`);
    }
  };
  await Promise.all(Array.from({ length: Math.min(o.concurrency, queue.length) }, worker));
  await browser.close();

  const summary = summarize(pages);
  const allFindings = pages.flatMap((p) => [
    ...p.criteria.flatMap((c) => c.findings),
    ...(p.axeUnmapped || []).map((u) => ({ ...u, engine: 'axe' })),
  ]);
  const loadErrors = pages.filter((p) => p.loadError).length;
  const report = {
    schemaVersion: SCHEMA_VERSION,
    tool: { name: 'rgaa-audit', a11ylint: CATALOG.engines.a11ylint, axe: CATALOG.engines.axe },
    rgaaVersion: CATALOG.rgaaVersion,
    generatedAt: new Date().toISOString(),
    options: { engines: o.engines, themes: o.themes.filter(Boolean), kind: o.kind, axeMinImpact: o.axeMinImpact, knownIssues: o.knownIssues ? basename(o.knownIssues) : null },
    summary: {
      pages: pages.length,
      loadErrors,
      blockingFindings: allFindings.filter((f) => f.blocking).length,
      waivedFindings: allFindings.filter((f) => f.waived).length,
      advisoryFindings: allFindings.filter((f) => !f.blocking && !f.waived).length,
      totals: summary.totals,
      criteria: summary.criteria,
    },
    pages,
  };
  mkdirSync(o.out, { recursive: true });
  if (o.formats.includes('json')) writeFileSync(join(o.out, 'rgaa-report.json'), JSON.stringify(report, null, 2));
  if (o.formats.includes('md')) writeFileSync(join(o.out, 'rgaa-report.md'), markdown(report));
  log(`rgaa-audit: ${pages.length} page(s), ${report.summary.blockingFindings} blocking finding(s), ${loadErrors} load error(s) -> ${o.out}`);
  process.exit(report.summary.blockingFindings ? 1 : loadErrors ? 2 : 0);
}

main().catch((e) => { console.error(`rgaa-audit: ${e.stack || e}`); process.exit(2); });
