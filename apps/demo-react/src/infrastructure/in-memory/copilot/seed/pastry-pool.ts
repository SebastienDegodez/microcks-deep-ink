import type { Example } from '@/domain/shared';

interface Pastry {
  name: string;
  description: string;
  size: 'S' | 'M' | 'L';
  price: number;
  status: 'available' | 'unknown';
}

const P = (name: string, description: string, size: Pastry['size'], price: number, status: Pastry['status'] = 'available'): Pastry => ({
  name, description, size, price, status,
});

/** Pastries the Copilot knows how to dream up (values of `Copilot.dc.html`). `Tarte Tatin` is the one the workflow run #16 lacks. */
export const PASTRY_BOOK: Record<string, Pastry> = {
  'Tartelette Framboise': P('Tartelette Framboise', 'Raspberry tartlet with fresh raspberries on pastry cream', 'S', 3.1),
  'Paris-Brest': P('Paris-Brest', 'Choux pastry ring filled with hazelnut praline cream', 'L', 4.9),
  'Kouign-amann': P('Kouign-amann', 'Caramelised layered butter cake from Brittany', 'M', 3.6),
  'Galette des Rois': P('Galette des Rois', 'Puff pastry with frangipane, baked for Epiphany', 'L', 18.5),
  'Bûche de Noël': P('Bûche de Noël', 'Rolled sponge cake with chocolate buttercream', 'L', 24.0, 'unknown'),
  'Tarte Tatin': P('Tarte Tatin', 'Caramelised apple tart, baked upside down', 'M', 3.2),
  'Eclair Cafe': P('Eclair Cafe', 'Delicious Coffee Eclair, not caloric at all', 'M', 2.5),
};

const DEFAULT_ORDER = ['Tartelette Framboise', 'Paris-Brest', 'Kouign-amann', 'Galette des Rois', 'Bûche de Noël'];

/** The pastry a hint names ("French pastry names, e.g. Tarte Tatin" names Tarte Tatin), if any. */
function hintedPastry(hint: string | undefined): string | undefined {
  const text = hint?.trim().toLowerCase();
  if (!text) return undefined;
  return Object.keys(PASTRY_BOOK).find((name) => text.includes(name.toLowerCase()));
}

const json = (value: unknown) => JSON.stringify(value, null, 2);
const slug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function pastryFor(name: string): Pastry {
  return PASTRY_BOOK[name] ?? P(name, `Delicious ${name}`, 'M', 3);
}

const ai = (e: Omit<Example, 'aiGenerated' | 'reviewState'>): Example => ({ ...e, aiGenerated: true, reviewState: 'pending' });

/** GET /pastries?size= : a list per size (sizes repeat on purpose: the review flags the criteria already used). */
const LIST_POOL: { name: string; size: 'S' | 'M' | 'L'; pastries: string[] }[] = [
  { name: 'Size S · spring', size: 'S', pastries: ['Tartelette Framboise'] },
  { name: 'Size L · summer', size: 'L', pastries: ['Paris-Brest', 'Galette des Rois'] },
  { name: 'Size M · autumn', size: 'M', pastries: ['Kouign-amann'] },
  { name: 'Size L · winter', size: 'L', pastries: ['Bûche de Noël'] },
  { name: 'Size M · Brittany', size: 'M', pastries: ['Kouign-amann', 'Eclair Cafe'] },
];

/** PATCH /pastries/{name}: a price or an availability change. */
const PATCH_POOL: { name: string; target: string; patch: Record<string, unknown> }[] = [
  { name: 'Eclair Cafe · sold out', target: 'Eclair Cafe', patch: { status: 'unknown' } },
  { name: 'Millefeuille · price', target: 'Millefeuille', patch: { price: 4.6 } },
  { name: 'Eclair Chocolat · back in stock', target: 'Eclair Chocolat', patch: { status: 'available' } },
  { name: 'Millefeuille · holiday price', target: 'Millefeuille', patch: { price: 5.2 } },
  { name: 'Eclair Cafe · price', target: 'Eclair Cafe', patch: { price: 2.7 } },
];

const BASE_PASTRIES: Record<string, Pastry> = {
  Millefeuille: P('Millefeuille', 'Delicious Millefeuille, not caloric at all', 'L', 4.4),
  'Eclair Cafe': P('Eclair Cafe', 'Delicious Coffee Eclair, not caloric at all', 'M', 2.5),
  'Eclair Chocolat': P('Eclair Chocolat', 'Delicious Chocolate Eclair, not caloric at all', 'M', 2.4, 'unknown'),
};

/** Proposals for an operation of API Pastry 2.0, in the order the Copilot would offer them. */
export function pastryProposals(opId: string, count: number, hint?: string): Example[] {
  const wanted = Math.max(1, count);
  if (opId === 'get-list') {
    return LIST_POOL.slice(0, wanted).map((row) =>
      ai({
        id: `ai-get-list-${slug(row.name)}`,
        name: row.name,
        request: { params: { size: row.size } },
        response: { status: 200, body: json(row.pastries.map((n) => pastryFor(n))) },
      }),
    );
  }
  if (opId === 'patch-name') {
    return PATCH_POOL.slice(0, wanted).map((row) =>
      ai({
        id: `ai-patch-name-${slug(row.name)}`,
        name: row.name,
        request: { params: { name: row.target }, body: json(row.patch) },
        response: { status: 200, body: json({ ...(BASE_PASTRIES[row.target] ?? pastryFor(row.target)), ...row.patch }) },
      }),
    );
  }
  const named = hintedPastry(hint);
  const hinted = named ? [named] : [];
  const names = [...hinted, ...DEFAULT_ORDER.filter((n) => !hinted.includes(n))].slice(0, wanted);
  return names.map((name) =>
    ai({
      id: `ai-${opId}-${slug(name)}`,
      name,
      request: { params: { name } },
      response: { status: 200, body: json(pastryFor(name)) },
    }),
  );
}
