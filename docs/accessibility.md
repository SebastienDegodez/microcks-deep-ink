# Accessibility: RGAA 4.1.2 / WCAG 2.1 AA

> **Status: not audited ("non audité").** Deep Ink and the demo target RGAA 4.1.2 (about WCAG 2.1 level AA), but no human
> audit has been done. Automated checks find some failures; they cannot prove conformance. Nothing in this repository
> claims that the components, the Storybooks or the demo are "conformes".

## The contract

Every work package follows the contract of section 3.5 of [PLAN-v0.2.md](PLAN-v0.2.md). In short:

1. Native HTML first; ARIA only where no native element exists. No `div` with a click handler.
2. Visible focus everywhere (`:focus-visible` rule in `base.css`), never `outline: none` without a replacement.
3. Everything works with the keyboard, no trap, focus order follows the DOM.
4. Contrast of 4.5:1 (text) and 3:1 (UI parts) in both themes, enforced by `pnpm --filter @microcks-deep-ink/tokens test`.
   No text over alpha or `color-mix()` backgrounds: use the opaque `*-tint` tokens.
5. Status is never color only: icon plus word.
6. Icon-only buttons have `aria-label`; decorative icons have `aria-hidden`.
7. Forms: visible `<label>`, help and error linked with `aria-describedby`, `aria-invalid`, an error summary on submit.
8. Live regions are throttled; moving content has a Pause control (RGAA 13.8).
9. `prefers-reduced-motion: reduce` removes transitions and animations (an unlayered rule no component can opt out of).
10. Demo pages: skip link, landmarks, one `<h1>`, ordered headings, unique `document.title`, focus moved to the `<h1>` on route change, `lang`.
11. Primary actions are at least 44px high, other targets at least 24px.
12. Reflow at 320 CSS px and 200% zoom. Wide tables, the Loom and code blocks scroll inside focusable regions.
13. Charts have a data table or text equivalent.
14. Every registry item fills `a11y` (keyboard, aria, rgaa, wcag) in `packages/registry/items/<name>.json`; each story shows it in the docs.
15. Lint: `eslint-plugin-jsx-a11y` (strict) on registry React and the demo; `@angular-eslint/template` accessibility rules on Angular.

## Who checks what

Three kinds of check, from the most automated to the least. The machine-readable map is
[`tools/a11y/rgaa-criteria.json`](../tools/a11y/rgaa-criteria.json) (106 criteria of RGAA 4.1.2; each has
`automatedBy: "a11ylint" | "axe" | "manual"`). Coverage grows by editing that file, not code.

| Check | Where | Covers |
| --- | --- | --- |
| **a11ylint** `@a11ylint/core@1.0.0-alpha.7` | `tools/a11y/rgaa-audit.mjs` (CI: `pnpm a11y`) | RGAA numbering: 1.1, 2.1, 2.2, 3.2, 6.2, 8.1, 8.3, 8.5, 9.1, 11.1 (10 criteria) |
| **axe-core** 4.14.0 | same runner | WCAG rules mapped to RGAA criteria (19 more criteria, partial) |
| **Unit tests** | `packages/registry` (Vitest + axe), `packages/tokens` (contrast), `apps/demo-react` (routes, shell) | Component markup in jsdom (no color contrast), token contrast ratios in both themes |
| **Lint** | `pnpm lint` | `jsx-a11y` strict, `@angular-eslint/template` a11y rules |
| **Human** | not done yet | Everything else (77 criteria), and the judgment calls inside the 29 above |

The automated criteria. "Partial" is always true: an RGAA criterion has several tests and most need human judgment
(is this alternative text *relevant*, is this label *meaningful*).

| Criterion | Title | Primary engine | Automated rules |
| --- | --- | --- | --- |
| 1.1 | Each informative image has a text alternative | a11ylint | 1.1.1, 1.1.2, 1.1.5, image-alt, input-image-alt, role-img-alt, svg-img-alt, area-alt, object-alt |
| 2.1 | Each frame has a title | a11ylint | 2.1.1, frame-title |
| 2.2 | Each frame title is relevant | a11ylint | 2.2.1, frame-title-unique |
| 3.2 | Text/background contrast is high enough | a11ylint | 3.2.1, 3.2.2, 3.2.3, 3.2.4, color-contrast |
| 5.6 | Column and row headers of data tables are correctly declared | axe | th-has-data-cells, scope-attr-valid |
| 5.7 | Cells are associated with their headers using the appropriate technique | axe | td-headers-attr, td-has-header |
| 6.1 | Each link is explicit | axe | identical-links-same-purpose, label-content-name-mismatch |
| 6.2 | Each link (except anchors) has an accessible name | a11ylint | 6.2.1, link-name |
| 7.1 | Each script is compatible with assistive technologies when needed | axe | aria-allowed-attr, aria-allowed-role, aria-required-attr, aria-valid-attr, aria-valid-attr-value, aria-roles, aria-required-children, aria-required-parent, aria-command-name, aria-dialog-name, aria-meter-name, aria-progressbar-name, aria-tooltip-name, aria-treeitem-name, aria-toggle-field-name, nested-interactive |
| 7.3 | Each script is operable with keyboard and pointer | axe | scrollable-region-focusable |
| 8.1 | Each page has a document type | a11ylint | 8.1.1, 8.1.3 |
| 8.2 | Generated source code is valid for the document type | axe | duplicate-id, duplicate-id-aria, duplicate-id-active |
| 8.3 | Each page has a default language | a11ylint | 8.3, html-has-lang |
| 8.4 | The default language code is relevant | axe | html-lang-valid, html-xml-lang-mismatch |
| 8.5 | Each page has a title | a11ylint | 8.5, document-title |
| 8.8 | Language codes of language changes are valid and relevant | axe | valid-lang |
| 9.1 | Information is structured with appropriate headings | a11ylint | 9.1.1, 9.1.3, heading-order, page-has-heading-one, empty-heading |
| 9.2 | The document structure is coherent | axe | landmark-banner-is-top-level, landmark-complementary-is-top-level, landmark-contentinfo-is-top-level, landmark-main-is-top-level, landmark-no-duplicate-banner, landmark-no-duplicate-contentinfo, landmark-no-duplicate-main, landmark-one-main, landmark-unique |
| 9.3 | Each list is correctly structured | axe | list, listitem, definition-list, dlitem |
| 10.4 | Text stays readable at 200% character size | axe | meta-viewport |
| 10.6 | Links whose nature is not obvious are visible against surrounding text | axe | link-in-text-block |
| 10.8 | Hidden content is meant to be ignored by assistive technologies | axe | aria-hidden-body, aria-hidden-focus |
| 11.1 | Each form field has a label | a11ylint | 11.1.1, 11.1.2, label, select-name, aria-input-field-name, form-field-multiple-labels |
| 11.9 | Each button label is relevant | axe | button-name, input-button-name |
| 11.13 | The purpose of a field can be deduced for autofill | axe | autocomplete-valid |
| 12.6 | Content regions (header, navigation, main, footer, search) can be reached or skipped | axe | region |
| 12.7 | Each page has a skip link to the main content | axe | bypass, skip-link |
| 12.8 | Tab order is coherent | axe | tabindex |
| 13.1 | The user controls each time limit | axe | meta-refresh |

Criteria with no automated test at all (77), notably: 1.2 to 1.9 (decorative images, relevance, long descriptions),
3.1 (information not conveyed by color alone), 3.3 (contrast of UI components and graphics), 4.x (multimedia),
5.1 to 5.5, 6.1 (link relevance), 7.1 and 7.3 behavior (scripts, keyboard operation), 7.5 (status messages),
8.2 validity, 8.4 and 8.6 relevance, 9.4, 10.1 to 10.3, 10.5, 10.7 (focus visibility), 10.9 to 10.14 (including
10.11 reflow and 10.12 text spacing), 11.2 to 11.13 relevance and error handling, 12.1 to 12.5, 12.8 (tab order), 12.9,
12.10 (single-key shortcuts), 12.11, 13.x (time limits, new windows, flashing, moving content, orientation, gestures).

## How the smoke run works

`pnpm a11y` builds the a11ylint browser bundle and runs `python3 tools/a11y/smoke.py --site site --out a11y-report`:

1. Serves `site/` (landing page, `/react/`, `/angular/`, `/demo/`) on localhost.
2. **Health pass** (Playwright): every story of both Storybooks and every demo route, in the dark and light theme.
   Fails on a page error, a console error or a missing same-origin file. Blocked Google Fonts are ignored.
3. **Accessibility pass**: `tools/a11y/rgaa-audit.mjs` on the same URLs: a11ylint + axe, themes dark and light,
   reduced motion. Stories skip the page-level checks (document language and title, headings, landmarks, skip link).
4. Exit code is 1 on a page error, an axe violation of impact serious or critical, or any a11ylint finding, unless it
   is waived in `tools/a11y/known-issues.json` (each waiver needs a reason and a link to a finding).

Reports (CI artifact `a11y-report`): `audit.md` (summary + criteria table + findings), `rgaa-report.json` (schema in
[`tools/a11y/README.md`](../tools/a11y/README.md)), `results.json`, screenshots of failing pages.

The runner statuses are `compliant`, `non-compliant`, `not-applicable` and `not-tested-automatically`.
"compliant" means only that the automated tests of that criterion found no failure on the audited pages. A criterion
that was not tested is never reported as compliant.

## Component to RGAA map

Generated from `packages/registry/items/*.json` by `node packages/registry/scripts/a11y-table.mjs`.

| Item | Tier | Pattern | RGAA criteria | WCAG |
| --- | --- | --- | --- | --- |
| `app-shell` | natural | Landmarks: &lt;header&gt; (banner), &lt;nav aria-label="Main"&gt;, &lt;main id="main" tabindex="-1"&gt; | 10.7, 10.11, 12.6, 12.7, 12.8 | 1.3.1, 1.4.10, 2.1.1, 2.4.1, 2.4.7, 4.1.2 |
| `base` | natural | Global focus-visible ring, .skip-link, .sr-only, reduced-motion media query | 10.7, 12.7, 13.8 | 2.3.3, 2.4.1, 2.4.7 |
| `button` | natural | Native &lt;button&gt; (or &lt;a&gt; for navigation) | 3.3, 7.1, 10.7, 11.9, 11.10 | 1.4.11, 2.1.1, 2.4.7, 4.1.2 |
| `callout` | natural | Static block; role="status" or role="alert" only when live is set | 3.2, 3.3, 13.9 | 1.4.1, 1.4.3, 1.4.11, 4.1.3 |
| `checkbox` | natural | Native &lt;input type=checkbox/radio&gt; inside &lt;label&gt;; groups use &lt;fieldset&gt;&lt;legend&gt; | 3.3, 11.1, 11.5, 11.6, 11.7 | 1.3.1, 1.4.11, 3.3.2, 4.1.2 |
| `chip` | natural | &lt;span&gt; (static), &lt;button aria-pressed&gt; (toggle), nested &lt;button aria-label&gt; (remove) | 3.1, 3.2, 7.1, 11.9 | 1.4.1, 1.4.3, 4.1.2 |
| `code-block` | natural | &lt;figure&gt; + &lt;figcaption&gt; + &lt;pre tabindex="0"&gt;&lt;code&gt; | 1.1, 3.2, 7.3, 10.7 | 1.3.1, 1.4.1, 2.1.1, 2.4.7, 4.1.2 |
| `copy-button` | natural | Native &lt;button&gt; plus a polite live region | 7.1, 7.5, 11.9 | 1.4.1, 4.1.2, 4.1.3 |
| `description-list` | natural | Native &lt;dl&gt; &gt; div &gt; dt + dd | 9.3 | 1.3.1 |
| `dialog` | natural | Native &lt;dialog&gt; opened with showModal() | 7.1, 7.3, 10.7, 12.6 | 2.1.1, 2.1.2, 2.4.3, 4.1.2 |
| `disclosure` | natural | Native &lt;details&gt;/&lt;summary&gt; | 7.1, 9.1, 10.7 | 1.3.1, 2.1.1, 4.1.2 |
| `empty-state` | natural | &lt;section aria-labelledby&gt; with a heading | 9.1, 12.6 | 1.3.1, 2.4.6 |
| `field` | natural | Visible &lt;label for&gt; with aria-describedby help and error | 3.1, 11.1, 11.2, 11.4, 11.10, 11.11 | 1.3.1, 1.4.1, 3.3.1, 3.3.2, 4.1.2 |
| `icon` | natural | Inline SVG, aria-hidden unless a label is given | 1.1, 1.2, 1.3 | 1.1.1, 1.4.11 |
| `input` | natural | Native &lt;input&gt; and &lt;textarea&gt; | 3.3, 11.1, 11.2, 11.10, 11.13 | 1.3.1, 1.3.5, 1.4.11, 3.3.2, 4.1.2 |
| `kbd` | natural | Native &lt;kbd&gt; | 9.3, 10.7 | 1.3.1 |
| `link` | natural | Native &lt;a href&gt; | 6.1, 6.2, 10.7, 13.2 | 1.4.1, 2.4.4, 2.4.7, 3.2.5 |
| `menu` | natural | Disclosure: button[popovertarget][aria-expanded] + div[popover] of buttons and links | 7.1, 7.3, 10.7, 12.6 | 2.1.1, 2.4.3, 4.1.2 |
| `panel` | natural | &lt;section aria-labelledby&gt; with a real heading | 9.1, 9.2, 12.6 | 1.3.1, 2.4.6 |
| `progress` | natural | Native &lt;progress&gt; and &lt;meter&gt; with a visible &lt;label&gt; | 3.2, 7.1, 11.1 | 1.3.1, 1.4.1, 1.4.11, 4.1.2 |
| `segmented` | natural | role=group of &lt;button aria-pressed&gt; | 3.1, 7.1, 7.5, 11.9 | 1.4.1, 4.1.2, 4.1.3 |
| `select` | natural | Native &lt;select&gt; | 3.3, 11.1, 11.6, 11.10 | 1.3.1, 1.4.11, 3.3.2, 4.1.2 |
| `skeleton` | natural | Decorative &lt;span aria-hidden="true"&gt; | 4.1, 10.8, 13.8 | 2.2.2, 4.1.2 |
| `switch` | natural | &lt;input type=checkbox role=switch&gt; inside &lt;label&gt; | 3.3, 7.1, 11.1, 11.9 | 1.4.1, 1.4.11, 2.1.1, 4.1.2 |
| `table` | natural | Native &lt;table&gt; with &lt;caption&gt;, th scope=col, aria-sort and a focusable scroll region | 5.1, 5.4, 5.6, 5.7, 7.1, 10.11 | 1.3.1, 1.4.10, 2.1.1, 4.1.2 |
| `tabs` | natural | WAI-ARIA tabs: role=tablist / tab / tabpanel with roving tabindex | 7.1, 7.3, 10.7, 12.6 | 1.3.1, 2.1.1, 2.4.7, 4.1.2 |
| `theme-toggle` | natural | Native &lt;button aria-pressed&gt; with aria-label="Light theme" | 7.1, 10.7, 11.9 | 1.3.1, 2.4.7, 4.1.2 |
| `tokens` | natural | CSS custom properties on :root, [data-theme=dark] and [data-theme=light] | 3.2, 3.3, 10.4 | 1.4.3, 1.4.11 |
| `ai-ghost-row` | microcks | &lt;div role="group" aria-label="AI suggestion: &lt;name&gt;"&gt; with native buttons | 3.1, 7.1, 10.7, 11.9 | 1.4.1, 2.5.3, 4.1.2 |
| `api-badge` | microcks | Static inline element; the visible text is the accessible name | 3.1, 3.2, 3.3 | 1.4.1, 1.4.3, 1.4.11 |
| `conformance-band` | microcks | &lt;div role="img" aria-label="11 of 12 operations pass, 1 fails"&gt; | 1.1, 3.1, 3.2 | 1.1.1, 1.4.1, 1.4.11 |
| `drop-zone` | microcks | Native &lt;input type="file"&gt; (visually hidden, focusable) + &lt;label&gt; styled as a button | 7.3, 10.7, 11.1, 11.9 | 1.3.1, 2.1.1, 3.3.2, 4.1.2, 4.1.3 |
| `live-indicator` | microcks | Static &lt;span&gt; with a decorative dot and visible label | 3.2, 13.8 | 1.4.1, 1.4.3, 2.2.2 |
| `method-tag` | microcks | Static &lt;span&gt;; the verb is the text | 3.1, 3.2 | 1.4.1, 1.4.3 |
| `mock-url` | microcks | &lt;code&gt; value + native buttons | 7.1, 10.7, 11.9 | 1.4.10, 2.1.1, 4.1.2, 4.1.3 |
| `operation-row` | microcks | &lt;ul aria-label&gt; &gt; &lt;li&gt; &gt; &lt;a&gt; or &lt;button&gt; | 6.1, 7.1, 9.3, 10.7 | 1.3.1, 2.1.1, 2.4.7, 4.1.2 |
| `run-origin` | microcks | Static &lt;span&gt; with visible text | 3.1, 3.2 | 1.4.1, 1.4.3 |
| `run-target` | microcks | Static &lt;span&gt; with visible text | 3.1, 3.2 | 1.4.1, 1.4.3 |
| `status-badge` | microcks | Static &lt;span&gt; with decorative icon and visible word | 3.1, 3.2, 13.8 | 1.4.1, 1.4.3 |
| `step-status` | microcks | Static &lt;span&gt; and &lt;ul&gt; with visible words | 3.1, 3.2, 9.3 | 1.3.1, 1.4.1, 1.4.3 |
| `command-bar` | element | WAI-ARIA 1.2 combobox with listbox popup (aria-activedescendant), in a native &lt;dialog&gt; opened with showModal() | 7.1, 7.3, 7.5, 10.7, 11.1, 12.8 | 1.3.1, 2.1.1, 2.1.2, 2.4.3, 2.4.7, 4.1.2, 4.1.3 |
| `plugin-slot` | element | Light-DOM wrapper: div.plugin-item[data-plugin-id] around each contributed element, no ARIA of its own | 8.2, 9.1, 10.7 | 1.3.1, 2.4.3, 4.1.1 |
| `workflow-loom` | element | role=group with toggle-button nodes (aria-pressed), roving tabindex, and a Show as table view | 1.2, 3.2, 5.4, 7.1, 7.3, 9.1, 10.7, 12.8 | 1.1.1, 1.3.1, 1.4.1, 2.1.1, 2.4.3, 2.4.7, 4.1.2 |

| RGAA theme | Items that cite it |
| --- | --- |
| 1. Images | 4 |
| 3. Colors | 22 |
| 4. Multimedia | 1 |
| 5. Tables | 2 |
| 6. Links | 2 |
| 7. Scripts | 19 |
| 8. Mandatory elements | 1 |
| 9. Structure | 9 |
| 10. Presentation | 21 |
| 11. Forms | 15 |
| 12. Navigation | 9 |
| 13. Consultation | 6 |

## Known limits

- **Automation is partial.** Only a minority of RGAA tests can be run by a machine.
  Passing the smoke run means "no automated failure found", not "accessible".
- **a11ylint is alpha** and has bugs that matter to this gate. `tools/a11y/src/collect.js` works around them (six
  documented workarounds), and each one is written up as an upstream issue in
  [a11ylint-findings.md](a11ylint-findings.md). The workarounds are code we maintain, which is a risk in itself.
- **Contrast is computed per text node.** Text over images or gradients cannot be resolved and is left to a human, as is
  disabled text (exempt from WCAG 1.4.3) and non-text contrast (RGAA 3.3), which only the tokens test covers.
- **Stories are tested in isolation.** Page-level criteria (landmarks, headings, skip link) are only meaningful on the
  landing page and the demo.
- **Dynamic states** (open dialogs, menus, error summaries, tooltips, the Loom with a selected step) are only tested
  when a story or a route shows them by default.
- **No screen reader pass.** NVDA with Firefox and VoiceOver with Safari are required before any claim. Same for keyboard
  walkthroughs, zoom at 200% and reflow at 320px (criteria 10.4 and 10.11 are only partly checked by axe).
- **Live data** in the demo (Traces, Cockpit ticker, TestRun stream) is simulated; the Pause control is present but its
  effect on real assistive technology is untested.
- **Web Components** (`workflow-loom`, `command-bar`, `plugin-slot`): the runner walks open shadow roots; the
  Loom has a table alternative. Plugin elements are not covered at all.
- The criterion numbers and wording in `rgaa-criteria.json` are short English paraphrases. Verify them against the
  official list at <https://accessibilite.numerique.gouv.fr/> before publishing anything.

## Tool findings

Bugs and missing rules found in a11ylint alpha.7 (inverted doctype check, `alt=""` flagged, links with `#` skipped,
silent contrast skips, ...) are in [a11ylint-findings.md](a11ylint-findings.md), written as issues ready to file.

## Draft "Déclaration d'accessibilité"

> Brouillon. À compléter et à valider après un audit humain. Ne pas publier en l'état.

**Microcks Deep Ink (DEMO)** s'engage à rendre ses sites accessibles conformément à l'article 47 de la loi n° 2005-102
du 11 février 2005.

Cette déclaration d'accessibilité s'applique à la démo « Microcks Deep Ink » (page d'accueil, Storybooks React et
Angular, démo cliquable), publiée à titre de proposition. Ce n'est pas une version officielle de Microcks.

### État de conformité

**Microcks Deep Ink (DEMO) n'a pas été audité** : son niveau de conformité au Référentiel général d'amélioration de
l'accessibilité (RGAA), version 4.1.2, n'est pas connu. Aucun taux de conformité n'est annoncé.

### Résultats des tests

Des tests automatisés sont exécutés à chaque modification (axe-core 4.14.0 et @a11ylint/core 1.0.0-alpha.7, thèmes
sombre et clair, sur toutes les stories et tous les écrans de la démo). Ils ne remplacent pas un audit : ils ne couvrent
qu'une partie des critères du RGAA (voir la liste ci-dessus). Les critères non testés automatiquement n'ont pas été
évalués.

### Technologies utilisées

HTML, CSS (propriétés personnalisées, `@layer`), JavaScript, WAI-ARIA, Web Components (Stencil), React, Angular.

### Environnement de test

Aucun audit manuel n'a eu lieu à ce jour. Les tests automatisés s'exécutent dans Chromium (Playwright). Les combinaisons
à tester par un auditeur : NVDA + Firefox, VoiceOver + Safari, clavier seul, zoom 200 %, affichage 320 px.

### Contenus non accessibles

Non évalués. Les écarts connus (limites des outils, contenus non testés) sont listés dans ce document.

### Établissement de cette déclaration

Déclaration rédigée le 3 novembre 2026 à partir des seuls tests automatisés.

### Retour d'information et contact

[À compléter : adresse de contact ou formulaire du responsable de la démo.]

### Voies de recours

[À compléter : formulation officielle (Défenseur des droits) du modèle de déclaration.]
