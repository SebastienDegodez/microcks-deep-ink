# tools/a11y: RGAA audit runner

Runs [`@a11ylint/core`](https://github.com/a11ylint/core) (RGAA numbering) and [axe-core](https://github.com/dequelabs/axe-core)
against web pages in headless Chromium and writes one stable report. Written so that a Claude skill (or any script) can
wrap it: "run a11ylint, list the RGAA criteria and their status".

```
rgaa-audit.mjs        the runner (CLI, zero dependencies, Node >= 22, speaks CDP to Chromium)
rgaa-criteria.json    RGAA 4.1.2 criteria map: id, theme, title, automatedBy, rule ids (data, edit to grow coverage)
build-a11ylint.mjs    esbuild: @a11ylint/core -> dist/a11ylint.iife.js (browser bundle, node:fs and handlebars stubbed)
src/collect.js        injected in the page: collects the inputs a11ylint needs, applies documented workarounds
smoke.py              Playwright health pass + calls the runner for the whole site (CI: `pnpm a11y`)
demo-routes.json      the demo routes audited by smoke.py
known-issues.json     waivers (each needs a reason and a finding); empty today
```

## Run it

```bash
pnpm install
pnpm --filter a11y-tools build                       # once: dist/a11ylint.iife.js
node tools/a11y/rgaa-audit.mjs --url https://example.com --out a11y-report
node tools/a11y/rgaa-audit.mjs --url ./page.html --format md --theme none
node tools/a11y/rgaa-audit.mjs --urls-from site/react/index.json --base-url http://localhost:8080/react/ --kind story
python3 tools/a11y/smoke.py --site site --out a11y-report   # whole site (needs `pnpm build:site`); = `pnpm a11y`
```

Chromium is found through `--browser`, `$CHROME_PATH`, `$PLAYWRIGHT_BROWSERS_PATH`, `~/.cache/ms-playwright`,
`/opt/pw-browsers` or a system Chrome (`python -m playwright install chromium` installs one). smoke.py needs
`pip install playwright==1.63.0`.

## Inputs

| Option | Meaning |
| --- | --- |
| `--url <url\|file>` | Page to audit, repeatable. A path becomes a `file://` URL. |
| `--urls-from <file\|url>` | A Storybook `index.json` (every `story` entry becomes `iframe.html?id=...`), a routes JSON (array of strings or objects `{url, label, kind}`, or `{baseUrl, routes}`), or a text file with one URL per line. |
| `--base-url <url>` | Base for relative entries. |
| `--kind auto\|page\|story` | `story` skips the page-level criteria (8.1, 8.3, 8.5, 9.1, 12.6, 12.7). `auto` = story when the URL contains `iframe.html`. |
| `--theme dark,light` | Themes to audit (default both). Sets `localStorage["microcks-theme"]`, `&globals=theme:X` for Storybook and `prefers-color-scheme`. `none` leaves the page alone. |
| `--engines a11ylint,axe` | Engines to run (default both). |
| `--axe-min-impact` | axe findings below this impact are advisory, not blocking (default `serious`). a11ylint findings are always blocking. |
| `--known-issues FILE` | Waivers `[{engine, rule, urlPattern, reason, finding}]`. Waived findings stay in the report but do not block. |
| `--format json,md` | Output formats (default both). |
| `--out DIR` | Output directory (default `a11y-report`). Writes `rgaa-report.json` and `rgaa-report.md`. |
| `--include-untested` | Also list manual criteria in every page entry (the summary always has all of them). |
| `--concurrency N`, `--timeout MS`, `--settle MS`, `--limit N`, `--browser PATH`, `--quiet` | Tuning. |
| `--upstream-raw` | Diagnostics: no workaround, the published a11ylint behaviour. Reproduces `docs/a11ylint-findings.md`. Not for gating. |

## Exit codes

| Code | Meaning |
| --- | --- |
| 0 | No blocking finding. This is **not** a conformance claim. |
| 1 | At least one blocking finding (a non-compliant criterion): any a11ylint finding, or an axe violation at or above `--axe-min-impact`, not waived. |
| 2 | Usage error, or the audit could not run completely (no browser, missing bundle, a page failed to load and nothing else failed). |

smoke.py exits 1 on a health failure (page error, console error, missing file) or when the runner exits non-zero, and 2 on a setup error.

## Output: `rgaa-report.json` (schemaVersion 1)

```jsonc
{
  "schemaVersion": 1,
  "tool": { "name": "rgaa-audit", "a11ylint": "@a11ylint/core@1.0.0-alpha.7", "axe": "axe-core@4.14.0" },
  "rgaaVersion": "4.1.2",
  "generatedAt": "2026-11-03T19:20:46.113Z",
  "options": { "engines": ["a11ylint","axe"], "themes": ["dark","light"], "kind": "auto", "axeMinImpact": "serious", "knownIssues": null },
  "summary": {
    "pages": 486, "loadErrors": 0,
    "blockingFindings": 0, "waivedFindings": 0, "advisoryFindings": 0,
    "totals": { "compliant": 24, "non-compliant": 0, "not-applicable": 4, "not-tested-automatically": 78 },
    "criteria": [                                  // all 106 criteria, aggregated over the pages
      { "id": "11.1", "theme": 11, "title": "Each form field has a label", "automatedBy": "a11ylint", "coverage": "partial",
        "status": "compliant",                      // compliant | non-compliant | not-applicable | not-tested-automatically
        "pages": { "compliant": 10, "non-compliant": 0, "not-applicable": 470, "not-tested-automatically": 0 },
        "blocking": false }
    ]
  },
  "pages": [
    {
      "url": "http://127.0.0.1:8000/demo/#/services?fast", "label": "demo /services", "kind": "page", "theme": "dark",
      "title": "APIs & Services · Microcks", "loadError": null,
      "counts": { "img": 0, "link": 12, "field": 1, "headings": 3, "text": 140 },   // elements each a11ylint test applied to
      "workarounds": { "W1": 0, "W2": 12, "W3": 0, "W4": 140, "W5": 1, "W6": 0 },    // see src/collect.js and docs/a11ylint-findings.md
      "criteria": [                                  // automated criteria only, unless --include-untested
        {
          "id": "6.2", "theme": 6, "title": "...", "automatedBy": "a11ylint", "coverage": "partial",
          "status": "non-compliant", "blocking": true,
          "tests": [ { "id": "6.2.1", "engine": "a11ylint", "status": "non-compliant" } ],
          "findings": [
            { "engine": "a11ylint", "rule": "6.2.1", "message": "Each link must have a label (text or alternative)",
              "fix": "Give the link visible text, aria-label, aria-labelledby or a title.",
              "blocking": true, "count": 2,
              "elements": [ { "html": "<a href=\"#/x\"></a>" } ] }       // axe elements also carry "target"; waived findings carry "waived": {reason, finding}
          ]
        }
      ],
      "axeUnmapped": [ { "rule": "...", "impact": "serious", "message": "...", "blocking": true, "elements": [] } ]  // axe violations with no RGAA mapping in rgaa-criteria.json
    }
  ]
}
```

Status rules, per page and criterion:

- `non-compliant`: at least one automated test of the criterion failed.
- `compliant`: at least one test ran on at least one applicable element and none failed. **Never a conformance claim.**
- `not-applicable`: every test of the criterion had nothing to test on this page (no image, no frame, story skipping a page-level rule...).
- `not-tested-automatically`: no automated test (manual criteria), or axe returned "incomplete" for it. Never reported as compliant.

In the summary a criterion is `non-compliant` if any page failed, else `compliant` if any page passed, else `not-applicable` if all were n/a, else `not-tested-automatically`. Manual criteria are always `not-tested-automatically`.

## `rgaa-criteria.json`

```jsonc
{ "rgaaVersion": "4.1.2", "pageLevelOnlyForStories": ["8.1", ...],
  "a11ylintRules": { "6.2.1": { "criterion": "6.2", "applicableWhen": "link", "hint": "..." } },   // fix hint + when the rule has something to test
  "criteria": [ { "id": "6.2", "theme": 6, "themeTitle": "Links", "title": "...", "automatedBy": "a11ylint",
                  "a11ylintRules": ["6.2.1"], "axeRules": ["link-name"], "coverage": "partial", "url": "https://accessibilite.numerique.gouv.fr/..." } ] }
```

To automate a criterion with axe, add the axe rule id to `axeRules` and set `automatedBy`. Titles are short English paraphrases: verify numbers and wording against the official reference.

## What the runner does to a11ylint

`@a11ylint/core@1.0.0-alpha.7` cannot be loaded in a browser as published and has false positives and false negatives that
make a gate unusable. `build-a11ylint.mjs` stubs the Node-only modules; `src/collect.js` applies six documented workarounds
(W1 to W6). Each one is an upstream issue, written up in [`docs/a11ylint-findings.md`](../../docs/a11ylint-findings.md). The upstream package is never patched.

## Skill sketch

A skill can call `node tools/a11y/rgaa-audit.mjs --url <url> --format json --out <dir> --quiet`, read `<dir>/rgaa-report.json`,
and answer from `summary.criteria` (status per criterion) and `pages[].criteria[].findings` (elements and fix hints).
Always report `not-tested-automatically` as "not tested", never as "ok".
