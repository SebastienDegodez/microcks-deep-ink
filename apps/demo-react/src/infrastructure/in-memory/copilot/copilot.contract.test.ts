import { describeCopilotPortContract } from '@/application/ports/__contracts__/copilot.contract';
import { FixedClock } from '../shared';
import { createInMemoryCopilotAdapters } from '.';

describeCopilotPortContract('in-memory', () => createInMemoryCopilotAdapters({ clock: new FixedClock() }));
