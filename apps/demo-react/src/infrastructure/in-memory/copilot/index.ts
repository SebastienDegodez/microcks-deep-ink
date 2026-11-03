import type { Example } from '@/domain/shared';
import type { CopilotGateway } from '@/application/ports/copilot';
import { after, type InMemoryDeps } from '../shared';

export interface CopilotAdapters {
  copilot: CopilotGateway;
}

const PASTRIES = ['Tartelette Framboise', 'Paris-Brest', 'Religieuse', 'Saint-Honoré', 'Opéra', 'Financier'];

/** Deterministic "AI": the hint (or a fixed list) gives the names, the body is derived from the name. */
export function createInMemoryCopilotAdapters(_deps: InMemoryDeps = {}): CopilotAdapters {
  const copilot: CopilotGateway = {
    suggestExamples: (_serviceId, opId, { count, hint }) =>
      after(() => {
        const names = [...(hint ? [hint] : []), ...PASTRIES].slice(0, Math.max(1, count));
        return names.map<Example>((name, i) => ({
          id: `ai-${opId}-${i + 1}`,
          name,
          request: { params: opId === 'get-list' ? { size: ['S', 'M', 'L'][i % 3] as string } : ({ name } as Record<string, string>) },
          response: {
            status: 200,
            body: JSON.stringify({ name, description: `Delicious ${name}`, size: 'S', price: 3 + i * 0.2, status: 'available' }, null, 2),
          },
          aiGenerated: true,
          reviewState: 'pending',
        }));
      }),
  };
  return { copilot };
}
