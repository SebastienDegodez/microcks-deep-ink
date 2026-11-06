// @vitest-environment node
import { http, HttpResponse, type AnyHandler } from 'msw';
import { describe, expect, it } from 'vitest';
import { NotFoundError, type Subscribe } from '@/application/shared';
import {
  collect,
  expectNotFound,
  expectSilentAfterUnsubscribe,
  useAdapters,
  useFakeTimers,
  type MakeAdapters,
} from '@/application/ports/__contracts__/support.contract';
import { API } from './handlers';
import { describePortContractOverHttp, type HttpAdapterDeps } from './http.contract';

/** A port small enough to check the harness itself: reads, a mutation, a not-found and a polled stream. */
interface GreetingPorts {
  greetings: {
    get(id: string): Promise<string | undefined>;
    rename(id: string, text: string): Promise<void>;
    watch(id: string): Subscribe<string>;
  };
}

function describeGreetingContract(name: string, makeAdapters: MakeAdapters<GreetingPorts>): void {
  describe(`greeting contract · ${name}`, () => {
    const adapters = useAdapters(makeAdapters);

    it('reads a seeded greeting, and undefined for an unknown one', async () => {
      expect(await adapters().greetings.get('fr')).toBe('Bonjour');
      expect(await adapters().greetings.get('xx')).toBeUndefined();
    });

    it('shows a rename on the next read', async () => {
      await adapters().greetings.rename('fr', 'Salut');
      expect(await adapters().greetings.get('fr')).toBe('Salut');
    });

    it('starts every test from the seed (no leak from the previous test)', async () => {
      expect(await adapters().greetings.get('fr')).toBe('Bonjour');
    });

    it('fails with NotFoundError when renaming an unknown greeting', async () => {
      await expectNotFound(adapters().greetings.rename('xx', 'Hi'));
    });

    describe('watch', () => {
      useFakeTimers();

      it('emits every second and stops once unsubscribed', async () => {
        const { values, unsubscribe } = await collect(adapters().greetings.watch('fr'), 3000);
        expect(values).toEqual(['Bonjour', 'Bonjour', 'Bonjour']);
        await expectSilentAfterUnsubscribe(values, unsubscribe, 3000);
      });
    });
  });
}

/** A minimal HTTP adapter: what `src/infrastructure/http/<feature>` will look like. */
function createHttpGreetingAdapters({ http: client }: HttpAdapterDeps): GreetingPorts {
  const get = async (id: string) => {
    try {
      return (await client.get<{ text: string }>(`greetings/${id}`)).text;
    } catch (error) {
      if (error instanceof NotFoundError) return undefined;
      throw error;
    }
  };
  return {
    greetings: {
      get,
      rename: (id, text) => client.put(`greetings/${id}`, { text }),
      watch: (id) => (listener) => {
        const timer = setInterval(() => void get(id).then((text) => text !== undefined && listener(text)), 1000);
        return () => clearInterval(timer);
      },
    },
  };
}

/** Handlers with their own seeded state, built per test. */
function greetingHandlers(): AnyHandler[] {
  const store = new Map([['fr', 'Bonjour']]);
  const notFound = (id: string) => HttpResponse.json({ entity: 'Greeting', id }, { status: 404 });
  return [
    http.get(`${API}/greetings/:id`, ({ params }) => {
      const text = store.get(String(params.id));
      return text === undefined ? notFound(String(params.id)) : HttpResponse.json({ text });
    }),
    http.put(`${API}/greetings/:id`, async ({ params, request }) => {
      const id = String(params.id);
      if (!store.has(id)) return notFound(id);
      store.set(id, ((await request.json()) as { text: string }).text);
      return new HttpResponse(null, { status: 204 });
    }),
  ];
}

describe('describePortContractOverHttp', () => {
  describePortContractOverHttp({ feature: 'greeting', contract: describeGreetingContract, http: createHttpGreetingAdapters, handlers: greetingHandlers });
  describePortContractOverHttp({ feature: 'not-yet-over-http', contract: describeGreetingContract });
});
