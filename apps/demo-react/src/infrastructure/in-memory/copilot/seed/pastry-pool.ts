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

/** Pastries the Copilot knows how to dream up. `Tarte Tatin` is the one the workflow run #16 lacks. */
export const PASTRY_BOOK: Record<string, Pastry> = {
  'Tarte Tatin': P('Tarte Tatin', 'Caramelised apple tart, baked upside down', 'M', 3.2),
  'Paris-Brest': P('Paris-Brest', 'Choux ring filled with hazelnut praline cream', 'L', 4.8),
  'Kouign-amann': P('Kouign-amann', 'Buttery caramelised Breton cake', 'M', 3.4),
  Religieuse: P('Religieuse', 'Two stacked choux filled with coffee pastry cream', 'S', 2.9),
  'Saint-Honoré': P('Saint-Honoré', 'Puff pastry crowned with caramelised choux and chantilly', 'L', 5.1),
  'Gâteau Basque': P('Gâteau Basque', 'Almond shortcrust cake filled with cherry jam', 'M', 3.6, 'unknown'),
  'Tartelette Framboise': P('Tartelette Framboise', 'Raspberry tartlet with fresh raspberries on pastry cream', 'S', 3.1),
};

const DEFAULT_ORDER = ['Paris-Brest', 'Kouign-amann', 'Religieuse', 'Saint-Honoré', 'Gâteau Basque'];

const json = (value: unknown) => JSON.stringify(value, null, 2);
const slug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function pastryFor(name: string): Pastry {
  return PASTRY_BOOK[name] ?? P(name, `Delicious ${name}`, 'M', 3);
}

const ai = (e: Omit<Example, 'aiGenerated' | 'reviewState'>): Example => ({ ...e, aiGenerated: true, reviewState: 'pending' });

/** GET /pastries?size= : a list per size (sizes repeat on purpose: the review flags the criteria already used). */
const LIST_POOL: { name: string; size: 'S' | 'M' | 'L'; pastries: string[] }[] = [
  { name: 'Size S · spring', size: 'S', pastries: ['Tartelette Framboise'] },
  { name: 'Size L · summer', size: 'L', pastries: ['Paris-Brest', 'Saint-Honoré'] },
  { name: 'Size M · autumn', size: 'M', pastries: ['Tarte Tatin'] },
  { name: 'Size L · winter', size: 'L', pastries: ['Saint-Honoré'] },
  { name: 'Size M · Brittany', size: 'M', pastries: ['Kouign-amann', 'Gâteau Basque'] },
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
  const hinted = hint?.trim() ? [hint.trim()] : [];
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
