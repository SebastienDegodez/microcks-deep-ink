/**
 * The port contracts must not assume WHEN a stream delivers: an HTTP adapter gets its first value after a request.
 * This runs every in-memory contract again with each stream delivering through a timer (never synchronously,
 * values in order, nothing after unsubscribe): the suites must still pass.
 */
import { describeAgentsPortContract } from '@/application/ports/__contracts__/agents.contract';
import { describeArazzoPortContract } from '@/application/ports/__contracts__/arazzo.contract';
import { describeImportingPortContract } from '@/application/ports/__contracts__/importing.contract';
import { describeObservePortContract } from '@/application/ports/__contracts__/observe.contract';
import { describeTestingPortContract } from '@/application/ports/__contracts__/testing.contract';
import type { Listener, Unsubscribe } from '@microcks/demo-core/application/shared';
import { createInMemoryAgentAdapters } from '@microcks/demo-core/infrastructure/in-memory/agents';
import { createInMemoryArazzoAdapters } from '@microcks/demo-core/infrastructure/in-memory/arazzo';
import { createInMemoryImportingAdapters } from '@microcks/demo-core/infrastructure/in-memory/importing';
import { createInMemoryObserveAdapters } from '@microcks/demo-core/infrastructure/in-memory/observe';
import { FixedClock } from '@microcks/demo-core/infrastructure/in-memory/shared';
import { createInMemoryTestingAdapters } from '@microcks/demo-core/infrastructure/in-memory/testing';

type Subscribe<T> = (listener: Listener<T>) => Unsubscribe;

/** Delivers every value of `subscribe` on a later timer turn instead of synchronously. */
function deferred<T>(subscribe: Subscribe<T>): Subscribe<T> {
  return (listener) => {
    let active = true;
    const unsubscribe = subscribe((value) => {
      setTimeout(() => {
        if (active) listener(value);
      }, 0);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  };
}

const NAME = 'in-memory, streams delivered asynchronously';
const clock = () => ({ clock: new FixedClock() });

describeTestingPortContract(NAME, () => {
  const { testRuns } = createInMemoryTestingAdapters(clock());
  return { testRuns: { ...testRuns, watch: (id) => deferred(testRuns.watch(id)) } };
});

describeArazzoPortContract(NAME, () => {
  const adapters = createInMemoryArazzoAdapters(clock());
  return { ...adapters, runner: { ...adapters.runner, watch: (id) => deferred(adapters.runner.watch(id)) } };
});

describeImportingPortContract(NAME, () => {
  const adapters = createInMemoryImportingAdapters(clock());
  return { ...adapters, importers: { ...adapters.importers, run: (id) => deferred(adapters.importers.run(id)) } };
});

describeObservePortContract(NAME, () => {
  const adapters = createInMemoryObserveAdapters(clock());
  return {
    ...adapters,
    traces: { ...adapters.traces, subscribe: (filter, listener) => deferred<Parameters<typeof listener>[0]>((l) => adapters.traces.subscribe(filter, l))(listener) },
    traffic: { ...adapters.traffic, subscribe: deferred(adapters.traffic.subscribe) },
  };
});

describeAgentsPortContract(NAME, () => {
  const adapters = createInMemoryAgentAdapters(clock());
  return { ...adapters, tasks: { ...adapters.tasks, watch: (id) => deferred(adapters.tasks.watch(id)) } };
});
