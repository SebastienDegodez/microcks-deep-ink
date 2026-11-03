import type { Example } from '@/domain/shared';
import { PASTRY2_EXAMPLES } from '../../shared';

const json = (value: unknown) => JSON.stringify(value, null, 2);

interface Row {
  service: string;
  op: string;
  id: string;
  name: string;
  params?: Record<string, string>;
  body?: unknown;
  status?: number;
  response: unknown;
}

const ROWS: Row[] = [
  // Pastry orders API (AsyncAPI): the example is the message the mock publishes.
  { service: 'orders', op: 'publish-order', id: 'order-created', name: 'Order created', response: { id: 'ord-1042', status: 'CREATED', pastry: 'Millefeuille', quantity: 2 } },
  { service: 'orders', op: 'publish-order', id: 'order-validated', name: 'Order validated', response: { id: 'ord-1042', status: 'VALIDATED', pastry: 'Millefeuille', quantity: 2 } },
  // Movie Graph API
  { service: 'movie', op: 'movies', id: 'movies-all', name: 'All movies', params: { title: '*' }, response: { data: { movies: [{ id: 'm1', title: 'Amélie' }, { id: 'm2', title: 'Le Fabuleux Destin' }] } } },
  { service: 'movie', op: 'movie', id: 'movie-m1', name: 'Amélie', params: { id: 'm1' }, response: { data: { movie: { id: 'm1', title: 'Amélie', year: 2001 } } } },
  { service: 'movie', op: 'people', id: 'people-audrey', name: 'Audrey Tautou', params: { name: 'Audrey Tautou' }, response: { data: { people: [{ name: 'Audrey Tautou', born: 1976 }] } } },
  { service: 'movie', op: 'add-review', id: 'review-m1', name: 'Review of Amélie', params: { movieId: 'm1' }, response: { data: { addReview: { id: 'r1', rating: 5 } } } },
  // HelloService (gRPC) and its SOAP sibling
  { service: 'hellogrpc', op: 'greeting', id: 'greet-laurent', name: 'Laurent', params: { firstname: 'Laurent' }, response: { greeting: 'Hello Laurent!' } },
  { service: 'hellosoap', op: 'say-hello', id: 'say-laurent', name: 'Laurent', params: { name: 'Laurent' }, response: { greeting: 'Hello Laurent!' } },
  // Petstore
  { service: 'petstore', op: 'list-pets', id: 'pets-10', name: 'Ten pets', params: { limit: '10' }, response: [{ id: 1, name: 'Rex' }, { id: 2, name: 'Mistigri' }] },
  { service: 'petstore', op: 'get-pet', id: 'pet-1', name: 'Rex', params: { petId: '1' }, response: { id: 1, name: 'Rex', tag: 'dog' } },
  { service: 'petstore', op: 'create-pet', id: 'pet-new', name: 'New pet', body: { name: 'Pixel' }, status: 201, response: { id: 3, name: 'Pixel' } },
  // API Pastry 1.0
  { service: 'pastry1', op: 'get-list', id: 'v1-size-m', name: 'Size M', params: { size: 'M' }, response: [{ name: 'Eclair Cafe', size: 'M', price: 2.4 }] },
  { service: 'pastry1', op: 'get-name', id: 'v1-millefeuille', name: 'Millefeuille', params: { name: 'Millefeuille' }, response: { name: 'Millefeuille', size: 'L', price: 4.2 } },
  { service: 'pastry1', op: 'patch-name', id: 'v1-price', name: 'Millefeuille · price', params: { name: 'Millefeuille' }, body: { price: 4.4 }, response: { name: 'Millefeuille', size: 'L', price: 4.4 } },
  // User signed-up API
  { service: 'usersignedup', op: 'user-signedup', id: 'user-laurent', name: 'laurent', response: { id: '523e4567', fullName: 'Laurent Broudoux', email: 'laurent@example.com' } },
  // Beer Catalog API
  { service: 'beer', op: 'find-beer', id: 'beer-find', name: 'Belgian beers', params: { name: 'Belgian' }, response: [{ name: 'Rodenbach', country: 'Belgium' }] },
  { service: 'beer', op: 'get-beer', id: 'beer-rodenbach', name: 'Rodenbach', params: { name: 'Rodenbach' }, response: { name: 'Rodenbach', country: 'Belgium', type: 'Fruit', rating: 4.2, status: 'available' } },
  { service: 'beer', op: 'reserve-beer', id: 'beer-reserve', name: 'Reserve two', params: { name: 'Rodenbach' }, body: { quantity: 2 }, response: { reserved: 2 } },
];

/** Examples by `<serviceId>/<operationId>` for every service. API Pastry 2.0 comes from the foundation seed. */
export function seedExamples(): Map<string, Example[]> {
  const map = new Map<string, Example[]>(
    Object.entries(PASTRY2_EXAMPLES).map(([opId, list]) => [`pastry2/${opId}`, list.map((e) => ({ ...e }))]),
  );
  for (const row of ROWS) {
    const key = `${row.service}/${row.op}`;
    const example: Example = {
      id: row.id,
      name: row.name,
      request: { params: row.params ?? {}, ...(row.body !== undefined ? { body: json(row.body) } : {}) },
      response: { status: row.status ?? 200, body: json(row.response) },
    };
    map.set(key, [...(map.get(key) ?? []), example]);
  }
  return map;
}
