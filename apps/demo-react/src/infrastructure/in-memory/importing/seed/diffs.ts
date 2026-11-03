import type { DiffLine, ImporterDiff } from '@/domain/importing';

/** Parses the compact notation of the diffs: `@@ hunk`, `+ added`, `- removed`, `! skipped`, else context. */
function parse(file: string, from: string, to: string, raw: string[]): ImporterDiff {
  const lines = raw.map<DiffLine>((line) => {
    if (line.startsWith('@@')) return { kind: 'hunk', text: line };
    const text = line.slice(1);
    if (line.startsWith('+')) return { kind: 'added', text };
    if (line.startsWith('-')) return { kind: 'removed', text };
    if (line.startsWith('!')) return { kind: 'skipped', text };
    return { kind: 'context', text };
  });
  return { from, to, file, lines };
}

/** Diffs by revision pair `from:to`. */
export const DIFFS: Record<string, ImporterDiff> = {
  '3c9e1d0:a41f9c2': parse('APIPastry-openapi.yaml', '3c9e1d0', 'a41f9c2', [
    '@@ paths./pastries/{name} @@',
    '     get:',
    '       operationId: GetPastryByName',
    '+    patch:',
    '+      operationId: PatchPastry',
    '+      summary: Update Pastry price or status',
    '+      requestBody:',
    "+        $ref: '#/components/requestBodies/PastryPatch'",
    "+      responses: { '200': { $ref: '#/components/responses/Pastry' } }",
    '@@ components.examples @@',
    '   Eclair Cafe:',
    '-    value: { size: M, price: 2.4, status: available }',
    '+    value: { size: M, price: 2.5, status: available }',
    '   Eclair Chocolat:',
    '-    value: { size: M, price: 2.4, status: available }',
    '+    value: { size: M, price: 2.4, status: unknown }',
  ]),
  'f07b2e4:3c9e1d0': parse('APIPastry-openapi.yaml', 'f07b2e4', '3c9e1d0', [
    '@@ components.examples @@',
    '   Millefeuille:',
    '-    value: { size: L, price: 4.2, status: available }',
    '+    value: { size: L, price: 4.4, status: available }',
  ]),
  '9a1c4f0:2be8d31': parse('APIPastry-postman-collection.json', '9a1c4f0', '2be8d31', [
    '@@ item: PATCH /pastries/{name} @@',
    '+  response "Eclair Chocolat · price":',
    '+    originalRequest.body: { "price": 2.6 }',
    '+    code: 200',
    '+    body: { "name": "Eclair Chocolat", "price": 2.6, "status": "unknown" }',
  ]),
  '8b21e5a:d90c4f7': parse('pastry-workflows.arazzo.yaml', '8b21e5a', 'd90c4f7', [
    '-arazzo: 1.0.1',
    '+arazzo: 1.1.0',
    '@@ info @@',
    '   title: Pastry workflows',
    '-  version: 1.1.0',
    '+  version: 1.2.0',
    '@@ sourceDescriptions @@',
    '+  - name: pastryOrders',
    '+    url: ./pastry-orders-0.1.0-asyncapi.yaml',
    '+    type: asyncapi',
    '@@ workflows @@',
    '+  - workflowId: order-pastry',
    '+    summary: Order a pastry',
    '+  - workflowId: check-menu',
    '+    summary: Check the menu sizes',
    '+    steps:',
    '+      - stepId: listSmall',
    '+        operationId: $sourceDescriptions.apiPastry.GetPastries',
    '+      - stepId: compareSizes',
    '+        dependsOn: [listSmall, listMedium, listLarge]',
  ]),
  '5d2a7c8:c81e09b': parse('pastry-orders-asyncapi.yaml', '5d2a7c8', 'c81e09b', [
    '@@ components.schemas.PastryOrder.properties @@',
    '   status:',
    '     enum: [CREATED, VALIDATED, CANCELLED]',
    '+  deliveryMode:',
    '+    type: string',
    '+    enum: [pickup, delivery]',
    '@@ channels.pastry-orders.subscribe.message.examples @@',
    "-  - payload: { id: 'ord-1042', status: VALIDATED }",
    "+  - payload: { id: 'ord-1042', status: VALIDATED, deliveryMode: pickup }",
  ]),
  '71fe0a2:0d4b6e9': parse('UserSignedUpAPI-asyncapi.yml', '71fe0a2', '0d4b6e9', [
    '@@ channels.user/signedup.subscribe.message.examples @@',
    '   - name: john',
    "-    payload: { id: '523e4567', fullName: 'John Doe', email: 'john@example.com', age: 36 }",
    "+    payload: { id: '523e4567', fullName: 'John Doe', age: 36 }",
    '!  skipped at import: required property "email" missing',
  ]),
  'b3390cd:71fe0a2': parse('UserSignedUpAPI-asyncapi.yml', 'b3390cd', '71fe0a2', [
    '@@ channels.user/signedup.subscribe.message.examples @@',
    '   - name: laurent',
    '+  - name: john',
    '+    headers: { my-app-header: 42 }',
    "+    payload: { id: '523e4567', fullName: 'John Doe', email: 'john@example.com', age: 36 }",
  ]),
  'e4a0b17:6f2c9d3': parse('films.graphql', 'e4a0b17', '6f2c9d3', [
    '@@ type Query @@',
    '   allFilms: FilmsConnection',
    '   film(id: String): Film',
    '+  filmsByDirector(director: String!): [Film]',
  ]),
  'aa04f3e:1c7d5b2': parse('Beer Catalog API (Postman API)', 'aa04f3e', '1c7d5b2', [
    '@@ item: GET /beer/{name} @@',
    '+  response "Rodenbach":',
    '+    code: 200',
    '+    body: { "name": "Rodenbach", "country": "Belgium", "type": "Fruit", "rating": 4.2, "status": "available" }',
  ]),
};
