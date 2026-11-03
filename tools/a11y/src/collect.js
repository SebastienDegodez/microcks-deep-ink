// Injected into the page after dist/a11ylint.iife.js. Defines `window.__a11yCollect()`.
//
// It (1) collects the inputs a11ylint needs, walking open shadow roots, (2) runs a11ylint and (3) returns plain,
// serializable data: the findings, how many elements each test applied to, and the workarounds that were used.
//
// Workarounds (each one is an upstream bug, written up in docs/a11ylint-findings.md; the package is never patched):
//   W1  decorative images (alt="", role="presentation") are not passed to RGAA 1.1.1  -> finding 2
//   W2  links get a cloned, '#'-free href and a name taken from img alt / svg title    -> findings 5, 6
//   W3  form fields labelled by a wrapping <label>, and button-like inputs, are not passed to RGAA 11.1.1 -> findings 8, 9
//   W4  RGAA 3.2 runs in "virtual" mode with colours resolved here (alpha, color(), bg stack) -> finding 4
//   W5  RGAA 8.1.3 is evaluated here (upstream logic is inverted)                      -> finding 3
//   W6  RGAA 9.1.1 only flags forward jumps of more than one level (upstream also flags going back up) -> finding 7
(function () {
  const MAX_HTML = 300;
  const trunc = (s) => (s.length > MAX_HTML ? s.slice(0, MAX_HTML) + '…' : s);
  const shallowHtml = (el) => trunc(el.outerHTML);

  function composedParent(el) {
    if (el.parentElement) return el.parentElement;
    const root = el.getRootNode();
    return root && root.host ? root.host : null;
  }

  /** All elements in document order, including the content of open shadow roots. */
  function allElements() {
    const out = [];
    const visit = (node) => {
      if (node.nodeType === 1) {
        out.push(node);
        if (node.shadowRoot) for (const c of node.shadowRoot.children) visit(c);
      }
      for (const c of node.children || []) visit(c);
    };
    visit(document.documentElement);
    return out;
  }

  function inAriaHidden(el) {
    for (let n = el; n; n = composedParent(n)) if (n.getAttribute('aria-hidden') === 'true') return true;
    return false;
  }
  function isRendered(el) {
    return typeof el.checkVisibility === 'function'
      ? el.checkVisibility({ visibilityProperty: true })
      : el.getClientRects().length > 0;
  }
  const exposed = (el) => isRendered(el) && !inAriaHidden(el);

  // ---- colour helpers (W4) -------------------------------------------------------------------------------
  function parseColor(str) {
    if (!str) return null;
    let m = str.match(/^rgba?\(([^)]+)\)/);
    if (m) {
      const t = m[1].split(/[\s,/]+/).filter(Boolean);
      const alpha = t[3] === undefined ? 1 : t[3].endsWith('%') ? parseFloat(t[3]) / 100 : parseFloat(t[3]);
      return [parseFloat(t[0]), parseFloat(t[1]), parseFloat(t[2]), alpha];
    }
    m = str.match(/^color\(srgb\s+([^)]+)\)/);
    if (m) {
      const [vals, a] = m[1].split('/');
      const t = vals.trim().split(/\s+/).map(parseFloat);
      const alpha = a === undefined ? 1 : a.trim().endsWith('%') ? parseFloat(a) / 100 : parseFloat(a);
      return [t[0] * 255, t[1] * 255, t[2] * 255, alpha];
    }
    return null;
  }
  const over = (fg, bg) => [0, 1, 2].map((i) => fg[i] * fg[3] + bg[i] * (1 - fg[3])).concat(1);
  const css = (c) => `rgb(${Math.round(c[0])}, ${Math.round(c[1])}, ${Math.round(c[2])})`;

  /** Effective opaque background colour behind `el`, or null when it cannot be resolved (images, gradients). */
  function resolveBackground(el) {
    const layers = [];
    for (let n = el; n; n = composedParent(n)) {
      const cs = getComputedStyle(n);
      if (cs.backgroundImage && cs.backgroundImage !== 'none') return null;
      const c = parseColor(cs.backgroundColor);
      if (c === null) return null;
      if (c[3] > 0) layers.push(c);
      if (c[3] >= 1) break;
    }
    const dark = (getComputedStyle(document.documentElement).colorScheme || '').includes('dark');
    let acc = layers.length && layers[layers.length - 1][3] >= 1 ? layers.pop() : dark ? [18, 18, 18, 1] : [255, 255, 255, 1];
    while (layers.length) acc = over(layers.pop(), acc);
    return acc;
  }

  function effectiveOpacity(el) {
    let o = 1;
    for (let n = el; n; n = composedParent(n)) o *= parseFloat(getComputedStyle(n).opacity);
    return o;
  }

  const SKIP_TEXT = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'TITLE', 'HEAD', 'OPTION', 'OPTGROUP']);

  function collectContrast(all, counts) {
    const out = [];
    for (const el of all) {
      if (SKIP_TEXT.has(el.tagName)) continue;
      let hasText = false;
      for (const n of el.childNodes) if (n.nodeType === 3 && n.nodeValue.trim()) { hasText = true; break; }
      if (!hasText || !exposed(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue; // visually hidden (.sr-only) text
      if (el.closest && el.closest(':disabled,[aria-disabled="true"]')) { counts.contrastSkippedDisabled++; continue; }
      const cs = getComputedStyle(el);
      const fg = parseColor(cs.color);
      const bg = resolveBackground(el);
      if (!fg || !bg) { counts.contrastSkippedUnresolvable++; continue; }
      if (effectiveOpacity(el) < 1) { counts.contrastSkippedOpacity++; continue; }
      const text = over(fg, bg);
      out.push({
        backgroundColor: css(bg),
        textColor: css(text),
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        outerHTML: shallowHtml(el),
      });
    }
    counts.text = out.length;
    return out;
  }

  // ---- main ----------------------------------------------------------------------------------------------
  window.__a11yCollect = function collect(opts) {
    // opts.raw: no workaround at all, exactly what the published package does (to reproduce upstream issues).
    const raw = !!(opts && opts.raw);
    const all = allElements();
    const counts = {
      img: 0, area: 0, svgImg: 0, frame: 0, link: 0, field: 0, headings: 0, text: 0,
      contrastSkippedUnresolvable: 0, contrastSkippedOpacity: 0, contrastSkippedDisabled: 0,
    };
    const workarounds = { W1: 0, W2: 0, W3: 0, W4: 0, W5: 0, W6: 0 };

    // images
    const images = [];
    for (const el of all) {
      const tag = el.tagName.toLowerCase();
      if (tag !== 'img' && tag !== 'area' && tag !== 'svg') continue;
      if (tag !== 'area' && !exposed(el)) continue;
      if (tag === 'img') {
        const role = el.getAttribute('role');
        if (!raw && (el.getAttribute('alt') === '' || role === 'presentation' || role === 'none')) { workarounds.W1++; continue; }
        counts.img++;
      } else if (tag === 'area') counts.area++;
      else if (el.getAttribute('role') === 'img') counts.svgImg++;
      images.push(el);
    }

    const frames = all.filter((el) => /^(iframe|frame)$/i.test(el.tagName) && isRendered(el));
    counts.frame = frames.length;

    // links (W2)
    const links = [];
    for (const el of all) {
      if (el.tagName !== 'A' || !el.hasAttribute('href') || !exposed(el)) continue;
      if (raw) { links.push(el); continue; }
      const clone = el.cloneNode(true);
      clone.setAttribute('data-original-href', el.getAttribute('href'));
      clone.setAttribute('href', 'https://example.invalid/');
      if (!clone.textContent.trim()) {
        const img = el.querySelector('img[alt]:not([alt=""])');
        const svgTitle = el.querySelector('svg title');
        const name = (img && img.getAttribute('alt')) || (svgTitle && svgTitle.textContent.trim());
        if (name) clone.setAttribute('aria-label', name);
      }
      if ((el.getAttribute('href') || '').includes('#') || clone.getAttribute('aria-label')) workarounds.W2++;
      links.push(clone);
    }
    counts.link = links.length;

    // form fields (W3)
    const formFields = [];
    for (const el of all) {
      if (!/^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName) || el.type === 'hidden' || !exposed(el)) continue;
      if (!raw && /^(button|submit|reset|image)$/.test(el.type)) { workarounds.W3++; continue; } // criterion 11.9, not 11.1
      if (!raw && el.labels && el.labels.length > 0 && !(el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`))) {
        workarounds.W3++; // labelled by a wrapping <label> (valid HTML, unknown to a11ylint)
        counts.field++;
        continue;
      }
      counts.field++;
      formFields.push(el);
    }

    // headings (W6 applied after the run)
    const headings = all.filter((el) => (/^H[1-6]$/.test(el.tagName) || el.getAttribute('role') === 'heading') && exposed(el));
    counts.headings = headings.length;

    const core = window.__a11ylint;
    if (raw) {
      const colorsElements = [];
      for (const el of all) {
        if (SKIP_TEXT.has(el.tagName)) continue;
        if (![...el.childNodes].some((n) => n.nodeType === 3 && n.nodeValue.trim())) continue;
        let bgEl = el;
        while (bgEl && parseColor(getComputedStyle(bgEl).backgroundColor)?.[3] !== 1) bgEl = composedParent(bgEl);
        colorsElements.push({ foregroundElement: el, backgroundElement: bgEl || document.documentElement });
      }
      counts.text = colorsElements.length;
      const rawResults = core.run({ mode: 'dom', document, images, frames, links, formFields, headings, colorsElements });
      return { results: rawResults, counts, workarounds, raw: true, document: { title: document.title, lang: document.documentElement.lang, doctype: !!document.doctype } };
    }
    const domResults = core.run({ mode: 'dom', document, images, frames, links, formFields, headings, colorsElements: [] });
    const contrastElements = collectContrast(all, counts);
    const contrastResults = core.run({ mode: 'virtual', document, colorsElements: contrastElements });
    workarounds.W4 = contrastElements.length;

    const results = {};
    for (const [rule, list] of Object.entries(domResults)) results[rule] = list;
    for (const [rule, list] of Object.entries(contrastResults)) if (rule.startsWith('RGAA - 3.')) results[rule] = list;

    // W5: upstream reports "doctype should be first" when the doctype IS the first node.
    const doctypeFirst = document.firstChild && document.firstChild.nodeType === document.DOCUMENT_TYPE_NODE;
    delete results['RGAA - 8.1.3'];
    if (document.doctype && !doctypeFirst) {
      results['RGAA - 8.1.3'] = [{ element: document.baseURI, rule: 'RGAA - 8.1.3', ruleLink: '', message: 'Document (Page) doctype should be first' }];
    }
    workarounds.W5 = 1;

    // W6: keep only forward jumps of more than one level.
    if (results['RGAA - 9.1.1']) {
      const levelOf = (el) => (/^H[1-6]$/.test(el.tagName) ? Number(el.tagName[1]) : parseInt(el.getAttribute('aria-level') || '0', 10));
      const forward = [];
      let prev = 0;
      for (const h of headings) {
        const lvl = levelOf(h);
        if (lvl <= 0) continue;
        if (prev && lvl - prev > 1) forward.push(shallowHtml(h));
        prev = lvl;
      }
      const kept = results['RGAA - 9.1.1'].filter((f) => forward.some((h) => f.element.startsWith(h.slice(0, 120))));
      workarounds.W6 = results['RGAA - 9.1.1'].length - kept.length;
      if (kept.length) results['RGAA - 9.1.1'] = kept;
      else delete results['RGAA - 9.1.1'];
    }

    for (const list of Object.values(results)) for (const f of list) f.element = trunc(f.element || '');
    return {
      results,
      counts,
      workarounds,
      document: { title: document.title, lang: document.documentElement.lang, doctype: !!document.doctype, doctypeFirst: !!doctypeFirst },
    };
  };
})();
