# Demo core — first increment of #287

`@microcks/demo-core` is a private root-workspace package, not a design system.
React, Svelte and Angular demos are alternative consumers; no rendering code is shared.
This first increment extracts only the existing admin secret-form and membership-draft
policies, unchanged. Ports, use cases, fixtures and the other domains remain in React.

## API

```ts
import {
  validateSecretForm, secretFormHint, secretCredentials,
  membershipKey, membershipChanges,
  SECRET_KIND_HINT, SECRET_KIND_LABEL, SECRET_NAME_PATTERN,
  type SecretFormValues, type SecretFormErrors, type SecretFormKind,
  type MembershipChange,
} from '@microcks/demo-core/govern';
```

Creation validates the name and requires a credential. Editing leaves the fixed name and
stored credential alone when the credential is empty. Summaries mask credential values.
Membership changes preserve draft/saved ordering, with additions before removals.
All functions are synchronous and deterministic; they need no clock, browser or framework.
Hooks, form state, subscriptions and composition belong to each consuming demo.

## Build and verify (repository root)

```sh
pnpm --filter @microcks/demo-core build
pnpm --filter @microcks/demo-core typecheck
pnpm --filter @microcks/demo-core test
pnpm --filter @microcks/demo-core lint:arch
```

Exports resolve to built JavaScript and declarations, not source aliases. The root
`pnpm build` already includes this package via `packages/*`. Build it before starting
the React demo; root `pnpm build:demo` builds it before the consumer automatically.
A future isolated Svelte consumer can use `link:../../../packages/demo-core`
from its app directory, without making the alternative framework workspaces depend on
one another.

The architecture tests allow only TypeScript as a development dependency and reject
runtime dependencies, non-TypeScript source, external
imports (including type-only/dynamic imports), computed module imports and source-level
reference directives. Typechecking excludes ambient packages and the DOM.
Design-system manifest tests forbid dependencies on demo-core/demos; a full
cross-workspace source dependency graph remains a later #287 increment.

React retains its domain facade (`src/domain/govern/secret-form.ts`), so existing
application and page imports stay unchanged. Only the govern domain may import this
subpath under the React dependency rules. Existing admin route and use-case tests
exercise the consuming form, credential-store and membership behavior.
