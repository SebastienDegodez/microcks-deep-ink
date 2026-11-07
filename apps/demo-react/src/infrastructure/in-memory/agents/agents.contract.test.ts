import { describeAgentsPortContract } from '@/application/ports/__contracts__/agents.contract';
import { FixedClock } from '../shared';
import { createInMemoryAgentAdapters } from '.';

describeAgentsPortContract('in-memory', () => createInMemoryAgentAdapters({ clock: new FixedClock() }));
