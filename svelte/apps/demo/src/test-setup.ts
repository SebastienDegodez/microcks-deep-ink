import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/svelte';
import { setDefaultLatencyMode } from '@microcks/demo-core/infrastructure/in-memory/shared';

// Use cases answer without the demo's simulated network latency.
setDefaultLatencyMode('fast');

afterEach(cleanup);
HTMLDialogElement.prototype.showModal = function () {
  this.open = true;
};
HTMLDialogElement.prototype.close = function () {
  this.open = false;
  queueMicrotask(() => this.dispatchEvent(new Event('close')));
};
