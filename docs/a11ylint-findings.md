# a11ylint findings (`@a11ylint/core@1.0.0-alpha.7`)

Problems and missing rules hit while wiring a11ylint into the Deep Ink accessibility gate
(`tools/a11y/rgaa-audit.mjs`). Each entry is written to be filed as an upstream issue at
<https://github.com/a11ylint/core/issues> (maintainers: Paul Plancq, Mickael Croquet).

Rules of engagement:

- The package is never patched. `tools/a11y/src/collect.js` works around each problem on the caller side
  (workaround ids W1 to W6 are named in that file), so the gate stays meaningful.
- Reproduce the published behaviour, without any workaround, with `node tools/a11y/rgaa-audit.mjs --url <file> --engines a11ylint --upstream-raw --theme none`.
- "Verified" means reproduced in headless Chromium 153 with alpha.7. "By reading" means seen in `build/*.js` but not
  reproduced in a browser.
- Every repro page below is a complete document: `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>T</title></head><body>…</body></html>`.
  Only the body is shown.

Summary

| # | Criterion | Kind | Impact on us | Status |
| --- | --- | --- | --- | --- |
| 1 | – | Cannot be bundled for a browser (`node:fs`, Handlebars) | Needs a stub bundle | Verified |
| 2 | 1.1.1 | False positive: decorative `alt=""` image | Every decorative icon image | Verified |
| 3 | 8.1.3 | Inverted logic: fires when the doctype IS first | Every page | Verified |
| 4 | 3.2.x | False negatives: `rgba()`, `color()`, transparent backgrounds | Contrast silently skipped | Verified |
| 5 | 6.2.1 | False negative: links whose `href` contains `#` are never tested | Every hash-router link | Verified |
| 6 | 6.2.1 | False positive: link named by `<img alt>` or `<svg><title>` | Logo and icon links | Verified |
| 7 | 9.1.1 | False positive: going back up the outline (h4 then h2) | Any page with sections | Verified |
| 8 | 11.1.1 | False positive: field labelled by a wrapping `<label>` | Valid HTML flagged | Verified |
| 9 | 11.1.1 | False positive: `submit`/`button`/`image` inputs (criterion 11.9) | Buttons made of `<input>` | Verified |
| 10 | 11.1.2 | Wrong element and duplicates: reports every field of the form | Noisy, misleading | Verified |
| 11 | 11.1.1 | `document.querySelector('label[for="…"]')` is not escaped nor scoped to the root node | Ids with `:` and shadow DOM | By reading |
| 12 | 3.2.4 | Message says "superior or equal to 24px" for the bold 18.5px rule | Docs | By reading |
| 13 | README / audit | README omits RGAA 11; `DICTIONARY` omits RGAA 9 and 11 (compliance summary ignores them) | Misleading report | By reading |
| 14 | – | `generateAudit` writes into the current directory using `baseUrl` as a file name, logs with `console.info` | Awkward in CI | By reading |
| 15 | 1.x, 3.x, 6.x, 11.x | Result objects carry no `status` for "tested and passed" or "not applicable" | We re-derive applicability | Design note |

---

## 1. The package cannot be bundled for a browser

**Title:** `Core` imports `node:fs`, `node:path`, `node:url` and `handlebars` at module load, so it cannot run in a browser.

**Criterion:** none (packaging).

**Repro:**

```bash
npm i @a11ylint/core@1.0.0-alpha.7 esbuild
cat > entry.js <<'E'
import Core from '@a11ylint/core';
window.__a11ylint = { run: (o) => new Core().run(o) };
E
npx esbuild entry.js --bundle --platform=browser --outfile=out.js
# error: Could not resolve "node:fs" / "node:path" / "node:url"
```

**Expected:** `Core.run` (pure DOM analysis) is usable in a browser, in Playwright, Cypress or a bookmarklet.

**Actual:** `build/core.js` imports `AuditGenerator` (`build/audit/generateAudit.js`), which imports `node:fs`,
`node:path`, `node:url` and `handlebars`. Bundlers cannot resolve them for the browser target.

**Suggestion:** split the package: `@a11ylint/core` (rules, browser-safe) and `@a11ylint/reporter` (or a subpath
export `@a11ylint/core/audit`). At the least, load the generator lazily inside `generateAudit`.

**Workaround:** `tools/a11y/build-a11ylint.mjs` replaces those four modules with throwing stubs (18 KiB bundle). Reports
are produced by `rgaa-audit.mjs`.

## 2. RGAA 1.1.1 flags decorative images (`alt=""`)

**Title:** `<img alt="">` is reported as missing a text alternative.

**Criterion:** RGAA 1.1.1 (informative images) and 1.2.1 (decorative images are ignored by assistive technologies).

**Repro:**

```html
<main><h1>Decorative image</h1><img src="data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAACAkQBADs=" alt=""></main>
```

**Expected:** no 1.1.1 result. `alt=""` is the HTML way to mark an image decorative (criterion 1.2: decorative
images are ignored by assistive technologies). Same for `role="presentation"` and `role="none"`.

**Actual:** `RGAA - 1.1.1: img elements should have alt, aria-label, title or aria-labelledby`.

**Cause:** `RGAA11_dom` tests `!alt`, which is also true for the empty string. It should test `el.hasAttribute('alt')`
(or `alt === null`).

**Workaround (W1):** decorative images are not passed to the rule.

## 3. RGAA 8.1.3 has inverted logic

**Title:** "doctype should be first" is reported when the doctype is the first node.

**Criterion:** RGAA 8.1.3.

**Repro:**

```html
<!-- full document, doctype on line 1 -->
<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Doctype</title></head><body><main><h1>Ok</h1></main></body></html>
```

**Expected:** no result (the doctype is `document.firstChild`).

**Actual:** `RGAA - 8.1.3: Document (Page) doctype should be first`, on every valid page.

**Cause:** `const doctypeIndex = doc.firstChild?.nodeType === doc.DOCUMENT_TYPE_NODE; if (doctypeIndex) { push(...) }`.
The condition is the opposite of the intent. Note also that a leading comment before the doctype is legal in HTML5
and makes `firstChild` a comment: decide what 8.1.3 should test.

**Workaround (W5):** the 8.1.3 result is discarded and re-evaluated by `collect.js`.

## 4. RGAA 3.2.x silently skips non-`rgb()` colours and transparent backgrounds

**Title:** Contrast is not computed for `rgba()`, `color(srgb …)` (what `color-mix()` computes to) or transparent
backgrounds, and the failure is silent.

**Criterion:** RGAA 3.2.1 to 3.2.4.

**Repro:**

```html
<body style="background:#fff"><main><h1>Contrast</h1>
<p style="color:rgba(0,0,0,.15)">Barely visible text, alpha colour</p>
<p style="color:color-mix(in srgb,#ffffff 85%,#000000)">Barely visible text, color-mix</p>
<p style="color:#eeeeee">Barely visible text, opaque</p></main></body>
```

**Expected:** three failures (ratios about 1.4, 1.3 and 1.2).

**Actual:** one failure (the opaque `#eeeeee` paragraph). `Color.getRGBFromCssProperties` only strips `rgb(` and `)`:
`rgba(0, 0, 0, 0.15)` and `color(srgb 0.85 0.85 0.85)` yield `NaN`, every comparison is `false`, and nothing is
reported. The same happens when the caller passes a `backgroundElement` whose `background-color` is
`rgba(0, 0, 0, 0)` (the default, transparent). A contrast checker that returns "no problem" on unparsable input is
dangerous.

**Suggestion:** parse `rgba()`, `color(srgb …)`, `hsl()`, modern space-separated syntax; composite alpha over the
resolved background; throw or report "could not evaluate" instead of passing; skip `:disabled` and invisible text
explicitly (WCAG 1.4.3 exempts inactive controls).

**Also:** the DOM mode makes the caller find the background element, with no guidance for stacked or semi-transparent
backgrounds, `opacity`, or gradients and images.

**Workaround (W4):** `collect.js` resolves colours itself (alpha compositing over the background stack) and calls the
rule in virtual mode with opaque `rgb()` strings. Text on images or gradients is counted as "unresolvable" and left to
a human.

## 5. RGAA 6.2.1 never tests links whose `href` contains `#`

**Title:** Any link with a `#` in its `href` is skipped, so empty links in hash-routed apps are never reported.

**Criterion:** RGAA 6.2.1 (each link has a name).

**Repro:**

```html
<main><h1>Links</h1>
<a href="#/services"></a>
<a href="/docs#intro"></a>
<a href="/empty"></a></main>
```

**Expected:** three results.

**Actual:** one result (`/empty`). `RGAA62` returns early for `href.includes('#')`, probably meant to skip same-page
anchors (`href="#main"`), but it also skips `/docs#intro` and every hash-router URL (`#/services/pastry2`).

**Suggestion:** skip only fragment-only hrefs that target an element (`href` starting with `#` and
`document.getElementById` matches) or drop the exemption: an anchor link also needs a name.

**Workaround (W2):** links are cloned with a `#`-free href before the rule runs.

## 6. RGAA 6.2.1 does not count `<img alt>` or `<svg><title>` as a link name

**Title:** A link named by its image is reported as having no label.

**Criterion:** RGAA 6.2.1.

**Repro:**

```html
<main><h1>Links</h1><a href="/home"><img src="data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAACAkQBADs=" alt="Home"></a></main>
```

**Expected:** no result (accessible name "Home").

**Actual:** `RGAA - 6.2.1: Each link must have a label`. `hasLinkTitle` only looks at `aria-label`, `aria-labelledby`,
`title` and `textContent`.

**Suggestion:** compute the accessible name (dom-accessibility-api), or at least include `img[alt]` and `svg > title`
descendants.

**Workaround (W2):** the clone gets an `aria-label` from the first `img[alt]` or `svg title`.

## 7. RGAA 9.1.1 reports valid heading outlines

**Title:** Going back up the outline (h4 then h2) is reported as a hierarchy error.

**Criterion:** RGAA 9.1.1.

**Repro:**

```html
<main><h1>One</h1><h2>Two</h2><h3>Three</h3><h4>Four</h4><h2>Back to two</h2></main>
```

**Expected:** no result. A heading may be followed by a heading of any shallower level; only skipping levels downward
(h2 then h4) breaks the outline.

**Actual:** `RGAA - 9.1.1: The hierarchy between headings must be relevant` for `Back to two`, because
`findInvalidHierarchyHeadings` uses `Math.abs(current - previous) > 1`.

**Suggestion:** `current - previous > 1`. Also decide about a first heading deeper than h1 (9.1.1 note).

**Workaround (W6):** results are filtered to forward jumps of more than one level.

## 8. RGAA 11.1.1 does not recognise a wrapping `<label>`

**Title:** An input inside its `<label>` is reported as unlabelled.

**Criterion:** RGAA 11.1.1.

**Repro:**

```html
<main><h1>Forms</h1><form><label>Name <input type="text"></label></form></main>
```

**Expected:** no result (implicit association is valid HTML and gives the field its name).

**Actual:** `RGAA - 11.1.1: Form field should have an accessible label (…)`. The rule only checks
`label[for=id]`, `aria-label`, `aria-labelledby`, `title` and an adjacent button.

**Suggestion:** use `el.labels` (covers `for` and wrapping), or compute the accessible name.

**Workaround (W3):** fields with a non-empty `labels` list are not passed to the rule (and counted as tested).

## 9. RGAA 11.1.1 is applied to buttons made with `<input>`

**Title:** `<input type="submit|button|reset|image">` is reported as an unlabelled field.

**Criterion:** RGAA 11.1.1 (the name of a button is criterion 11.9, tested through its `value`).

**Repro:**

```html
<main><h1>Forms</h1><form><input type="submit" value="Send"></form></main>
```

**Expected:** no 11.1.1 result.

**Actual:** `RGAA - 11.1.1`. The rule treats every `HTMLInputElement` as a text field.

**Workaround (W3):** these inputs are not passed to the rule.

## 10. RGAA 11.1.2 reports the field, once per label, for every field of the form

**Title:** One orphan `label[for]` produces one result per field of the form, each pointing at an unrelated field.

**Criterion:** RGAA 11.1.2.

**Repro:**

```html
<main><h1>Forms</h1><form>
<label for="a">A</label><input id="a" type="text">
<label for="b">B</label><input id="b" type="text">
<label for="ghost">Ghost</label></form></main>
```

**Expected:** one result, on `<label for="ghost">`.

**Actual:** the loop in `RGAA112_dom` iterates fields, then every `label[for]` of the form; each field gets a result
for each label whose target is missing, with the field's `outerHTML` as the element and the message "Label[for]
attribute does not match the field id". The result neither names the label nor says which `for` is broken.

**Suggestion:** iterate labels once, `root.getElementById(label.htmlFor)`, and report the label element.

**Workaround:** none needed for gating (still a failure); the element shown is misleading, read the message.

## 11. 11.1.1 uses unescaped, global selectors

**Title:** `document.querySelector('label[for="' + id + '"]')` breaks on ids with special characters and ignores shadow
roots.

**Criterion:** RGAA 11.1.1.

**Repro (by reading):** `RGAA111_dom` builds `label[for="${id}"]` without `CSS.escape` and queries the global
`document`, whereas 11.1.2 does use `CSS.escape`. With a field whose id contains a quote or a backslash the selector
throws and aborts the whole run; fields inside an open shadow root are never matched with their label.

**Expected:** `el.getRootNode().querySelector(...)` with `CSS.escape`, or `el.labels`.

## 12. RGAA 3.2.4 message

**Title:** Message of 3.2.4 describes the wrong size.

**Actual (by reading):** the rule fires for `textSize >= 18.5 && isBold && ratio < 3` and says "bold element with
fontSize superior or equal to 24px". Expected "18.5px". (Also check the threshold: WCAG large text is 18.66px bold,
RGAA says 18.5px; the 3:1 minimum for large text is the one in RGAA 3.2.3 and 3.2.4.)

## 13. Documentation and compliance summary miss RGAA 11 and 9

**Title:** The README does not list RGAA 11.1.1/11.1.2; `DICTIONARY` has no entry for RGAA 9 or 11.

**Actual (by reading):** `utils/dictionary.js` only knows categories 1, 2, 3, 6 and 8, so
`mapAuditDataCompliance` (HTML report) ignores any 9.x or 11.x result; the README table also omits 11.x.

**Suggestion:** add the categories; list the rules in the README.

## 14. `generateAudit` side effects

**Title:** Report files are written to the current directory with `baseUrl` as the file name.

**Actual (by reading):** `writeFileSync(`${baseUrl.replace(/https?:\/\//, '')}.html`)` and `.json`: a `baseUrl` of
`https://example.com/a/b` writes `example.com/a/b.html` relative to the cwd (fails when the folder does not exist), and
`console.info` logs the paths. There is no `outDir` option and no way to get the report as a string.

**Suggestion:** return the report from `generateAudit` and let the caller write it; add `outDir`.

**Workaround:** not used. `rgaa-audit.mjs` writes its own JSON and Markdown.

## 15. Result shape: only failures are reported

**Title:** `run()` returns only failing rules, so "passed" and "not applicable" cannot be told apart.

**Design note, not a bug.** `run()` returns `{ [rule]: LogMessageParams[] }` with failures only. A page without images
and a page whose images are all fine give the same output. For a gate that must say "compliant" vs "not applicable"
(and never claim a compliance it did not test), the caller has to count the applicable elements itself, which
`rgaa-audit.mjs` does. A `{ rule, tested, failed }` summary per rule would remove that duplication.

## Missing rules we would use

Criteria with no a11ylint test today, in the order we would value them: 1.2 (decorative images ignored), 6.1 (link
purpose: identical names), 7.1 partial (ARIA validity), 9.2 (landmarks), 10.4 and 10.12 (CSS-driven, needs a browser),
11.9 (button names), 11.13 (autocomplete), 12.7 (skip link). axe-core covers part of them; see `docs/accessibility.md`.
