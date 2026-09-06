# M12 ToolLoopAgent Native Quote Evaluation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` for this bounded task.

**Goal:** Compose safe ToolLoopAgent discovery with the local native quote
evaluator without creating a request or payment capability.

**Architecture:** A new Agent module delegates one injected directory GET to
the accepted discovery boundary. Only its cloned configured native summary is
converted into a fresh quote for the accepted core evaluator; all other
directory outcomes stay bounded. Root-owned package integration declares the
local core dependency and exposes the single new Agent subpath after the
module's RED/GREEN contract is reviewed.

**Tech Stack:** Node 22.21.1, TypeScript 5.9.3, npm workspaces, and the
built-in Node test runner.

**Spec:** `docs/specs/m12-tool-loop-agent-native-quote-evaluation.md`

## Global constraints

- Work in the current repository workspace; local policy prohibits a worktree
  without explicit human direction.
- Reuse only `discoverRiskScanQuick` and
  `evaluateRiskScanNativeQuote`. Do not duplicate directory validation,
  reinterpret raw directory data, or alter accepted Agent/Core source.
- The composition may delegate only the accepted injected credential-free
  directory GET. It must not directly fetch, send a POST, build a body or
  header, read an environment/configuration value, create a client, or access
  a wallet, account, signer, key, recipient, facilitator, backend/store,
  clock, timer, retry loop, request, result, settlement, deployment, or live
  service.
- Do not inspect the opaque policy before an accepted configured native
  summary is selected. Do not choose or persist a default policy, cap, asset,
  or economic allocation.
- An eligible result is local compatibility only, never payment authority.

---

### Task 1: Agent native quote composition

**Files:**

- Create: `apps/agent/src/riskscan-tool-native-quote-evaluation.ts`
- Create: `apps/agent/test/riskscan-tool-native-quote-evaluation.test.mjs`
- Create: `apps/agent/test/riskscan-tool-native-quote-evaluation-boundary.test.mjs`

**Interfaces:**

- Consumes: `discoverRiskScanQuick(serviceBase, directoryFetcher?)` and
  `evaluateRiskScanNativeQuote(policy, quote)`.
- Produces: `evaluateDiscoveredRiskScanNativeQuote(serviceBase, policy,
  directoryFetcher?)`, returning the two directory failures, the bounded
  `native_summary_unavailable` outcome, or the published core eligibility
  union.

- [ ] **Step 1: Write the failing Agent contract tests**

  Add a test helper that returns the accepted one-tool local directory
  descriptor and import the new module through its source path. Write tests
  for this exact native directory value and local policy:

  ```js
  const payment = {
    state: "locally_configured",
    protocol: "x402",
    network: "hedera:testnet",
    asset: "0.0.429274",
    amount: "9007199254740993",
  };
  const policy = {
    network: "hedera:testnet",
    asset: "0.0.429274",
    maximumAmount: "9007199254740993",
  };
  ```

  Assert the result is eligible with `9007199254740993n`, the controlled
  fetcher receives exactly one fresh
  `GET /api/tools` init with no body or credential, and no second sender is
  available or called. Assert `directory_unavailable` and
  `directory_invalid` return unchanged while a policy Proxy whose
  `getPrototypeOf` throws remains unread. Assert both
  `configuration_required` and configured EVM summaries return only
  `native_summary_unavailable` with that same hostile policy unread. Assert a
  selected native summary lets malformed policy produce the core
  `invalid_policy` decline, a smaller cap produces `amount_exceeds_maximum`,
  and a different canonical asset produces `asset_mismatch`. Call the module
  twice after a controlled fetcher mutates its received URL and init; assert
  the second call still gets the untouched accepted GET shape.

- [ ] **Step 2: Observe RED**

  Run:

  ```sh
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH node --test apps/agent/test/riskscan-tool-native-quote-evaluation.test.mjs
  ```

  Expected: FAIL because the new Agent module does not exist.

- [ ] **Step 3: Write the smallest composition module**

  Add only these imports, outcome type, and branch structure:

  ```ts
  import { evaluateRiskScanNativeQuote } from "@tool402/core";
  import type { RiskScanNativeQuoteEligibility } from "@tool402/core";
  import { discoverRiskScanQuick } from "./riskscan-tool-directory.ts";
  import type { RiskScanDirectoryFetcher } from "./riskscan-tool-directory.ts";

  export type RiskScanNativeQuoteAgentOutcome =
    | { readonly kind: "directory_unavailable" }
    | { readonly kind: "directory_invalid" }
    | { readonly kind: "native_summary_unavailable" }
    | RiskScanNativeQuoteEligibility;

  export async function evaluateDiscoveredRiskScanNativeQuote(
    serviceBase: URL,
    policy: unknown,
    directoryFetcher?: RiskScanDirectoryFetcher,
  ): Promise<RiskScanNativeQuoteAgentOutcome> {
    const discovery = await discoverRiskScanQuick(serviceBase, directoryFetcher);
    if (discovery.kind !== "tool_selected") return discovery;
    const summary = discovery.tool.payment;
    if (summary.state !== "locally_configured" || summary.network !== "hedera:testnet") {
      return { kind: "native_summary_unavailable" };
    }
    return evaluateRiskScanNativeQuote(policy, {
      network: summary.network,
      asset: summary.asset,
      amount: summary.amount,
    });
  }
  ```

  Do not add a fetcher wrapper, a default policy, a data store, a request
  sender, a payment/header abstraction, or any output projection beyond the
  declared union.

- [ ] **Step 4: Add the source-boundary test and turn the contract GREEN**

  Add an exact-source test for the module that permits the two accepted module
  imports and the branch structure above. The test must fail if direct fetch,
  POST, request body/header, response-body/result, payment client, wallet,
  account, signer, key, environment, backend/store, timer, retry, dynamic
  import, or other side-effect code enters this source. Then run:

  ```sh
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH node --test apps/agent/test/riskscan-tool-native-quote-evaluation.test.mjs apps/agent/test/riskscan-tool-native-quote-evaluation-boundary.test.mjs
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run typecheck --workspace @tool402/agent
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run test --workspace @tool402/agent
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run lint --workspace @tool402/agent
  ```

- [ ] **Step 5: Commit the owned Agent module and tests**

  Inspect the three owned paths, run the enabled guard and whitespace check,
  then commit:

  ```text
  feat: Add Agent Native Quote Evaluation
  ```

### Task 2: Root-owned package integration

**Files:**

- Modify: `apps/agent/package.json`
- Modify: `package-lock.json`

**Interfaces:**

- Consumes: accepted local `@tool402/core` workspace package and the Agent
  module created in Task 1.
- Produces: an explicit local core dependency and the public
  `./riskscan-tool-native-quote-evaluation` Agent export.

- [ ] **Step 1: Add the explicit local dependency and subpath export**

  In `apps/agent/package.json`, add:

  ```json
  "dependencies": {
    "@tool402/core": "file:../../packages/core"
  }
  ```

  and add this entry inside `exports`:

  ```json
  "./riskscan-tool-native-quote-evaluation": "./src/riskscan-tool-native-quote-evaluation.ts"
  ```

  Preserve every existing package field and subpath.

- [ ] **Step 2: Refresh only the root lockfile**

  Run:

  ```sh
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm install --package-lock-only --ignore-scripts
  ```

  Inspect `package-lock.json` and retain only the matching local Agent
  dependency record.

- [ ] **Step 3: Verify package-aware GREEN behavior**

  Run:

  ```sh
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm ci --dry-run --ignore-scripts --loglevel=error
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run typecheck --workspace @tool402/agent
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run test --workspace @tool402/agent
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run lint --workspace @tool402/agent
  ```

- [ ] **Step 4: Commit the root-owned package integration**

  Run the enabled guard and whitespace check, then commit:

  ```text
  chore: Export Agent Native Quote Evaluation
  ```

## Root-owned integration after Tasks 1 and 2

1. Obtain independent task review from the module base through the two task
   commits; resolve valid findings with a new RED/GREEN correction and scoped
   re-review.
2. Run root clean-install/typecheck/test/lint, production Webpack build,
   queue/reference/whitespace checks, and the enabled local guard. Exercise
   the Agent only against a controlled local directory fetcher and verify one
   GET with no POST.
3. If review and verification are clean, record local evidence, accept the
   card, commit the acceptance, push, and verify remote `main`.
