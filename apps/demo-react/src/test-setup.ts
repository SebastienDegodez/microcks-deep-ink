import { cleanup, configure } from '@testing-library/react';
import { afterEach } from 'vitest';

// findBy*/waitFor default to 1 s. Route tests chain several in-memory queries before a page settles,
// which can take longer on a loaded machine. 5 s removes false "element not found" failures.
configure({ asyncUtilTimeout: 5_000 });

afterEach(() => {
  cleanup();
});
