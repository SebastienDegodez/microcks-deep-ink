import { flushSync } from 'svelte';
import { describe, expect, it } from 'vitest';
import { useQuery, type QueryResult } from './query.svelte.js';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

const settle = async () => {
  await new Promise((resolve) => setTimeout(resolve, 0));
  flushSync();
};

describe('useQuery', () => {
  it('ignores a response that arrives after the deps changed', async () => {
    const requests: Record<string, ReturnType<typeof deferred<string>>> = { a: deferred(), b: deferred() };
    let id = $state('a');
    let query: QueryResult<string> | undefined;
    const destroy = $effect.root(() => {
      query = useQuery(() => (requests[id] as ReturnType<typeof deferred<string>>).promise, () => [id]);
    });
    flushSync();
    expect(query?.status).toBe('loading');

    id = 'b';
    flushSync();
    requests.b?.resolve('B');
    await settle();
    expect(query?.status).toBe('success');
    expect(query?.data).toBe('B');

    requests.a?.resolve('A');
    await settle();
    expect(query?.data).toBe('B');
    destroy();
  });

  it('keeps the last data while reloading and reports errors', async () => {
    let calls = 0;
    const second = deferred<string>();
    let query: QueryResult<string> | undefined;
    const destroy = $effect.root(() => {
      query = useQuery(() => {
        calls += 1;
        return calls === 1 ? Promise.resolve('first') : calls === 2 ? second.promise : Promise.reject(new Error('down'));
      });
    });
    await settle();
    expect(query?.data).toBe('first');

    query?.reload();
    flushSync();
    expect(query?.status).toBe('loading');
    expect(query?.data).toBe('first');
    second.resolve('second');
    await settle();
    expect(query?.data).toBe('second');

    query?.reload();
    await settle();
    expect(query?.status).toBe('error');
    expect(query?.error?.message).toBe('down');
    expect(query?.data).toBe('second');
    destroy();
  });
});
