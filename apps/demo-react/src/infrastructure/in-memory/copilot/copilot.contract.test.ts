import { describeCopilotPortContract } from '@/application/ports/__contracts__/copilot.contract';
import { FixedClock } from '@microcks/demo-core/infrastructure/in-memory/shared';
import { createInMemoryCopilotAdapters } from '@microcks/demo-core/infrastructure/in-memory/copilot';

describeCopilotPortContract('in-memory', () => createInMemoryCopilotAdapters({ clock: new FixedClock() }));
