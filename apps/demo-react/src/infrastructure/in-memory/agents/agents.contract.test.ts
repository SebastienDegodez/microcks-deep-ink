import { describeAgentsPortContract } from '@/application/ports/__contracts__/agents.contract';
import { FixedClock } from '@microcks/demo-core/infrastructure/in-memory/shared';
import { createInMemoryAgentAdapters } from '@microcks/demo-core/infrastructure/in-memory/agents';

describeAgentsPortContract('in-memory', () => createInMemoryAgentAdapters({ clock: new FixedClock() }));
