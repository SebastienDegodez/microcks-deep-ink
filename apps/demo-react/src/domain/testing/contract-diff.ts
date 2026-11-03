import type { TestStepResult } from './types';

export interface DiffRow {
  n: number;
  text: string;
  /** The row breaks the contract. */
  bad: boolean;
}

export interface ContractDiff {
  left: DiffRow[];
  right: DiffRow[];
  /** Number of mismatching properties. */
  badCount: number;
}

const pad = (key: string) => `${key}:             `.slice(0, 13);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Aligns the contract (the resolved schema) with the actual response, row by row.
 * Arrays show their first item and a "+ n more" row. Rows whose property is listed in the step's
 * violations are marked `bad` (the page also writes them as text, never color alone).
 */
export function buildContractDiff(step: Pick<TestStepResult, 'payload' | 'contract' | 'violations'>): ContractDiff {
  const contract = step.contract ?? [];
  const bad = new Set(step.violations.map((v) => v.path.replace(/^\$\./, '')));
  const isArray = Array.isArray(step.payload);
  const items = isArray ? (step.payload as unknown[]) : [];
  const first = isArray ? items[0] : step.payload;
  const obj: Record<string, unknown> = isRecord(first) ? first : {};

  const left: { text: string; bad: boolean }[] = [];
  const right: { text: string; bad: boolean }[] = [];
  const push = (l: string, r: string, b = false) => {
    left.push({ text: l, bad: b });
    right.push({ text: r, bad: b });
  };

  const indent = isArray ? '    ' : '  ';
  if (isArray) {
    push('type: array', '[');
    push('items:', '  {');
    push('  type: object', '');
    push('  properties:', '');
  } else {
    push('type: object', '{');
    push('properties:', '');
  }
  contract.forEach((prop, i) => {
    const last = i === contract.length - 1;
    push(
      indent + pad(prop.key) + prop.schema,
      `${indent}${JSON.stringify(prop.key)}: ${JSON.stringify(obj[prop.key])}${last ? '' : ','}`,
      bad.has(prop.key),
    );
  });
  if (isArray) {
    const more = items.length - 1;
    if (more > 0) {
      push('', '  },');
      push('', `  { … }   + ${more} more ${more === 1 ? 'item' : 'items'}, also valid`);
      push('', ']');
    } else {
      push('', '  }');
      push('', ']');
    }
  } else {
    push('', '}');
  }
  const number = (rows: { text: string; bad: boolean }[]): DiffRow[] => rows.map((r, i) => ({ n: i + 1, ...r }));
  return { left: number(left), right: number(right), badCount: bad.size };
}
