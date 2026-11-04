// Type-level parity test (run by `pnpm -C react typecheck`).
// The element wrappers duplicate the types of packages/core/src/utils/types.ts so that copied code has
// no dependency on core. This file fails to compile if the two drift apart.
import type * as Core from '../../../../packages/core/src/utils/types';
import type { ExtensionPointId, SlotContext } from '../src/plugin-slot';
import type {
  LoomAction,
  LoomCheck,
  LoomCheckState,
  LoomDrop,
  LoomInput,
  LoomOutput,
  LoomProtocol,
  LoomSource,
  LoomStep,
  LoomStepStatus,
  LoomThread,
} from '../src/workflow-loom';
import { EXTENSION_POINTS } from '../../../../packages/plugin-sdk/src/manifest';
import type { SlotContext as SdkSlotContext } from '../../../../packages/plugin-sdk/src/host';

type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? true : false;
function assertEqual<_T extends true>() {}

assertEqual<Equal<LoomProtocol, Core.Protocol>>();
assertEqual<Equal<LoomStepStatus, Core.StepStatus>>();
assertEqual<Equal<LoomCheckState, Core.CheckState>>();
assertEqual<Equal<LoomSource, Core.LoomSource>>();
assertEqual<Equal<LoomAction, Core.LoomAction>>();
assertEqual<Equal<LoomStep, Core.LoomStep>>();
assertEqual<Equal<LoomThread, Core.LoomThread>>();
assertEqual<Equal<LoomInput, Core.LoomInput>>();
assertEqual<Equal<LoomDrop, Core.LoomDrop>>();
assertEqual<Equal<LoomCheck, Core.LoomCheck>>();
assertEqual<Equal<LoomOutput, Core.LoomOutput>>();
assertEqual<Equal<ExtensionPointId, keyof typeof EXTENSION_POINTS>>();
assertEqual<Equal<SlotContext, SdkSlotContext>>();
