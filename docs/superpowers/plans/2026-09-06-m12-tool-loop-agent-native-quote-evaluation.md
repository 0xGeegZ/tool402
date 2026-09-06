# M12 ToolLoopAgent Native Quote Evaluation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` for this bounded task.

**Goal:** Compose safe ToolLoopAgent discovery with the local native quote
evaluator without creating a request or payment capability.

**Architecture:** Root first defines the explicit local core dependency and
the public Agent subpath while its executable package test remains RED because
the source target is absent. A new Agent module then delegates one required
injected directory GET to the accepted discovery boundary. Only its cloned
configured native summary becomes a fresh core quote; all other outcomes stay
bounded. The final GREEN suite exercises the public package subpath and never
relies on a hoisted dependency or default global fetch.

**Tech Stack:** Node 22.21.1, TypeScript 5.9.3, npm workspaces, and the
built-in Node test runner.

**Spec:** `docs/specs/m12-tool-loop-agent-native-quote-evaluation.md`

## Global constraints

- Work in the current repository workspace; local policy prohibits a worktree
  without explicit human direction.
- Reuse only `discoverRiskScanQuick` and
  `evaluateRiskScanNativeQuote`. Do not duplicate directory validation,
  reinterpret raw directory data, or alter accepted Agent/Core source.
- The caller must supply the directory fetcher. The composition may delegate
  only that injected credential-free directory GET; it must never default to
  global `fetch`. A missing or non-function JavaScript value returns
  `directory_invalid` before a directory call or policy inspection.
- Do not directly fetch, send a POST, build a body or header, read an
  environment/configuration value, create a client, or access a wallet,
  account, signer, key, recipient, facilitator, backend/store, clock, timer,
  retry loop, request, result, settlement, deployment, or live service.
- Do not inspect the opaque policy before an accepted configured native
  summary is selected. Do not choose or persist a default policy, cap, asset,
  or economic allocation. An eligible result is local compatibility only,
  never payment authority.

---

### Task 1: Root-owned public package boundary

**Files:**

- Modify: `apps/agent/package.json`
- Modify: `package-lock.json`
- Create: `apps/agent/test/riskscan-tool-native-quote-evaluation-package.test.mjs`

**Interfaces:**

- Consumes: the existing local `@tool402/core` workspace package and the
  planned Agent module path.
- Produces: the explicit local core dependency and the public
  `@tool402/agent/riskscan-tool-native-quote-evaluation` subpath.

- [ ] **Step 1: Write the failing public-subpath test**

  Use `createRequire(import.meta.url)` to import only
  `@tool402/agent/riskscan-tool-native-quote-evaluation`, then call its
  `evaluateDiscoveredRiskScanNativeQuote` export. Pass an injected fetcher and
  a `Response.json` body with the accepted one-tool directory descriptor:

  ```js
  const policy = {
    network: "hedera:testnet",
    asset: "0.0.429274",
    maximumAmount: "9007199254740993",
  };
  const nativeSummary = {
    state: "locally_configured",
    protocol: "x402",
    network: "hedera:testnet",
    asset: "0.0.429274",
    amount: "9007199254740993",
  };
  ```

  The descriptor factory must have exactly `version: "v1"`, one
  `riskscan.quick` tool named `RiskScan Quick`, POST `/api/riskscan`, JSON
  content type, all four required declaration fields, the two accepted
  limitations, and `nativeSummary`. Assert one injected fresh
  `GET /api/tools` init with `credentials: "omit"`, then assert the public
  import returns `{ kind: "eligible", network: "hedera:testnet", asset:
  "0.0.429274", amount: 9007199254740993n }`.

- [ ] **Step 2: Observe public RED**

  Run:

  ```sh
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH node --test apps/agent/test/riskscan-tool-native-quote-evaluation-package.test.mjs
  ```

  Expected: FAIL because the public Agent subpath does not exist.

- [ ] **Step 3: Declare the package boundary while it remains RED**

  In `apps/agent/package.json`, add exactly:

  ```json
  "dependencies": {
    "@tool402/core": "file:../../packages/core"
  }
  ```

  Add this entry to the existing `exports` object:

  ```json
  "./riskscan-tool-native-quote-evaluation": "./src/riskscan-tool-native-quote-evaluation.ts"
  ```

  Preserve every existing package field and subpath. Refresh only the root
  lockfile and inspect its matching local Agent record:

  ```sh
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm install --package-lock-only --ignore-scripts
  ```

  Re-run the public-subpath test: it must remain RED because its target source
  file is absent. Then prove the explicit dependency resolves without relying
  on a prior install:

  ```sh
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH node --test apps/agent/test/riskscan-tool-native-quote-evaluation-package.test.mjs
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm ci --dry-run --ignore-scripts --loglevel=error
  ```

- [ ] **Step 4: Commit the intentionally RED package boundary locally**

  Run the enabled guard and whitespace check, then commit only the package
  test, manifest, and lockfile. Do not push while the Agent suite is expected
  to fail:

  ```text
  test: Define Agent Native Quote Package Boundary
  ```

### Task 2: Agent native quote composition

**Files:**

- Create: `apps/agent/src/riskscan-tool-native-quote-evaluation.ts`
- Create: `apps/agent/test/riskscan-tool-native-quote-evaluation.test.mjs`
- Create: `apps/agent/test/riskscan-tool-native-quote-evaluation-boundary.test.mjs`

**Interfaces:**

- Consumes: `discoverRiskScanQuick(serviceBase, directoryFetcher)` and
  `evaluateRiskScanNativeQuote(policy, quote)` through Task 1's explicit local
  package dependency.
- Produces: `evaluateDiscoveredRiskScanNativeQuote(serviceBase, policy,
  directoryFetcher)`, returning directory failures, the bounded
  `native_summary_unavailable` outcome, or the published core eligibility
  union.

- [ ] **Step 1: Write the failing source-contract tests**

  Import the new module through its source path. Assert a valid native summary
  and exact policy return the eligible bigint result after one fresh
  credential-free `GET /api/tools` init. For directory unavailable, directory
  invalid, configuration-required, configured EVM, and missing/non-function
  fetcher cases, use this policy value and assert its traps stay unread:

  ```js
  const unreadablePolicy = () => new Proxy({}, {
    get() { throw new Error("policy property reads are forbidden"); },
    getPrototypeOf() { throw new Error("policy reflection is forbidden"); },
    ownKeys() { throw new Error("policy enumeration is forbidden"); },
    getOwnPropertyDescriptor() { throw new Error("policy descriptors are forbidden"); },
  });
  ```

  Assert a selected native summary sends malformed policy to the core
  evaluator and gets `invalid_policy`; a smaller cap gets
  `amount_exceeds_maximum`; and a different canonical asset gets
  `asset_mismatch`. Call the function twice after the injected fetcher mutates
  its URL and init, then assert the later call still receives the untouched
  accepted GET shape.

- [ ] **Step 2: Observe source RED**

  Run:

  ```sh
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH node --test apps/agent/test/riskscan-tool-native-quote-evaluation.test.mjs
  ```

  Expected: FAIL because the source module does not exist. The public-subpath
  test remains RED for the same absent target.

- [ ] **Step 3: Write the smallest required-fetcher composition module**

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
    directoryFetcher: RiskScanDirectoryFetcher,
  ): Promise<RiskScanNativeQuoteAgentOutcome> {
    if (typeof directoryFetcher !== "function") return { kind: "directory_invalid" };
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

  Do not add a fetcher wrapper, default fetcher, default policy, data store,
  request sender, payment/header abstraction, or output projection beyond the
  declared union.

- [ ] **Step 4: Add the source-boundary test and turn all contracts GREEN**

  Add an exact-source test for the module that permits only the two accepted
  module imports, the required-fetcher guard, and the branch structure above.
  It must fail if direct fetch, POST, request body/header, response-body/result,
  payment client, wallet, account, signer, key, environment, backend/store,
  timer, retry, dynamic import, or other side-effect code enters this source.
  Then run:

  ```sh
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH node --test apps/agent/test/riskscan-tool-native-quote-evaluation.test.mjs apps/agent/test/riskscan-tool-native-quote-evaluation-boundary.test.mjs apps/agent/test/riskscan-tool-native-quote-evaluation-package.test.mjs
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run typecheck --workspace @tool402/agent
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run test --workspace @tool402/agent
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run lint --workspace @tool402/agent
  ```

- [ ] **Step 5: Commit the GREEN Agent implementation and tests**

  Inspect the three owned paths, run the enabled guard and whitespace check,
  then commit:

  ```text
  feat: Add Agent Native Quote Evaluation
  ```

## Root-owned integration after Tasks 1 and 2

1. Obtain independent task review from the module base through the locally RED
   package boundary and GREEN implementation commits; resolve valid findings
   with a new RED/GREEN correction and scoped re-review.
2. Run root clean-install/typecheck/test/lint, production Webpack build,
   queue/reference/whitespace checks, and the enabled local guard. Exercise
   the Agent only against a controlled local directory fetcher and verify one
   GET with no POST.
3. Push the two local task commits only after the complete Agent suite is
   GREEN. If review and verification are clean, record local evidence, accept
   the card, commit the acceptance, push, and verify remote `main`.
