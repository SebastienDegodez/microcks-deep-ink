// Contrast gate for the Deep Ink tokens (WCAG 2.1 AA / RGAA 4.1.2).
// Text roles need 4.5:1, UI parts 3:1, in BOTH themes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = JSON.parse(readFileSync(new URL('../tokens.json', import.meta.url), 'utf8'));
const tokens = Object.fromEntries(src.color.tokens.map((t) => [t.name, t.value]));
const THEMES = ['dark', 'light'];
const val = (theme, name) => {
  const v = tokens[name]?.[theme];
  assert.ok(v, `token ${name} missing in ${theme}`);
  assert.match(v, /^#[0-9A-Fa-f]{6}$/, `${name} (${theme}) must be an opaque hex`);
  return v;
};

const channel = (c) => {
  c /= 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const luminance = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
};
export const ratio = (a, b) => {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

const GROUNDS = ['bg', 'canvas', 'surface', 'raised', 'selected'];
const TINTS = ['success-tint', 'danger-tint', 'warning-tint', 'info-tint'];
const UI_GROUNDS = ['bg', 'canvas', 'surface', 'raised'];
const TEXT_ROLES = [
  'text', 'text-secondary', 'text-muted', 'link', 'action',
  'success', 'danger', 'warning', 'running', 'live-text',
  'proto-rest', 'proto-soap', 'proto-event', 'proto-grpc', 'proto-graphql', 'proto-direct', 'proto-a2a',
];

for (const theme of THEMES) {
  test(`${theme}: text roles are at least 4.5:1 on grounds and tints`, () => {
    const failures = [];
    for (const role of TEXT_ROLES) {
      for (const ground of [...GROUNDS, ...TINTS]) {
        const r = ratio(val(theme, role), val(theme, ground));
        if (r < 4.5) failures.push(`${role} on ${ground}: ${r.toFixed(2)}`);
      }
    }
    assert.deepEqual(failures, []);
  });

  test(`${theme}: on-action, on-status and on-proto fills are at least 4.5:1`, () => {
    const failures = [];
    const pairs = [
      ['on-action', 'action'],
      ['on-action', 'link'],
      ...['success', 'danger', 'warning', 'running'].map((f) => ['on-status', f]),
      ...['rest', 'soap', 'event', 'grpc', 'graphql', 'direct', 'a2a'].map((p) => ['on-proto', `proto-${p}`]),
    ];
    for (const [fg, bg] of pairs) {
      const r = ratio(val(theme, fg), val(theme, bg));
      if (r < 4.5) failures.push(`${fg} on ${bg}: ${r.toFixed(2)}`);
    }
    assert.deepEqual(failures, []);
  });

  test(`${theme}: border-control, action (focus outline) and live are at least 3:1 on grounds`, () => {
    const failures = [];
    for (const role of ['border-control', 'action', 'live']) {
      for (const ground of [...UI_GROUNDS, 'selected']) {
        const r = ratio(val(theme, role), val(theme, ground));
        if (r < 3) failures.push(`${role} on ${ground}: ${r.toFixed(2)}`);
      }
    }
    // The control boundary must also be visible on the tints rows sit on.
    for (const ground of TINTS) {
      const r = ratio(val(theme, 'border-control'), val(theme, ground));
      if (r < 3) failures.push(`border-control on ${ground}: ${r.toFixed(2)}`);
    }
    assert.deepEqual(failures, []);
  });

  test(`${theme}: status fills (success, danger, warning) are at least 3:1 on grounds`, () => {
    const failures = [];
    for (const role of ['success', 'danger', 'warning', 'running']) {
      for (const ground of UI_GROUNDS) {
        const r = ratio(val(theme, role), val(theme, ground));
        if (r < 3) failures.push(`${role} on ${ground}: ${r.toFixed(2)}`);
      }
    }
    assert.deepEqual(failures, []);
  });
}

test('every token has both themes and the new tokens exist', () => {
  for (const name of ['border-control', ...TINTS]) {
    assert.ok(tokens[name]?.dark && tokens[name]?.light, `${name} needs dark and light values`);
  }
});
