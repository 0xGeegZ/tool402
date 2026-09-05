# RiskScan Hedera Testnet x402 Compatibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a locally testable native Hedera testnet x402 seller path while preserving EVM behavior and keeping the Consumer Agent discovery summary accurate.

**Architecture:** The configuration parser becomes a discriminated EVM/Hedera union. The server selects the matching exact scheme and requires the native facilitator’s v2 exact capability plus fee payer. Tool Directory and Consumer Agent propagate only a safe native price summary; neither gets signing capability.

**Tech Stack:** Node 22, TypeScript 5.9, Next 16 Cache Components, x402 v2 core/Next/EVM packages, `@x402/hedera@2.25.0`, and Node’s built-in test runner.

**Spec:** `docs/specs/m06-riskscan-hedera-x402.md`

## Global Constraints

- Preserve existing EVM configuration and unsigned EVM behavior.
- Permit native configuration only for `hedera:testnet` with explicit atomic asset and positive amount values.
- Treat a canonical Hedera identifier as three decimal segments, each `0` or
  `[1-9]` followed by digits. Reject leading-zero segments and `0.0.0` as a
  recipient; permit `0.0.0` only as the native HBAR/tinybar asset sentinel.
- Add `@x402/hedera` exactly at `2.25.0`; do not add a direct Hiero SDK dependency.
- Never add a private key, signer, client-side exact scheme, payment-fetch helper, wallet/account action, live facilitator call in a test, transaction submission, deployment, or live claim.
- Directory output may expose native network/asset/amount, never recipient, facilitator URL, fee payer, header, payload, transaction, receipt, evidence, or result.

---

### Task 1: Native configuration and server registration

**Files:**
- Modify: `apps/web/package.json`
- Modify: `package-lock.json`
- Modify: `apps/web/src/lib/riskscan-x402.ts`
- Modify: `apps/web/tests/riskscan-api.test.mjs`

**Interfaces:**
- Consumes: `readRiskScanX402Configuration(environment)`, `createRiskScanProtectedHandler`, and `handleRiskScanPost`.
- Produces: discriminated `RiskScanX402Configuration`, `hedera:testnet` exact registration, and capability-gated local `402` behavior.

- [x] **Step 1: Write failing native server tests**

Add a controlled `configuredHederaEnvironment()` and assert this parser output:

```js
{
  kind: "hedera",
  payTo: "0.0.1111",
  facilitatorUrl: "https://facilitator.invalid",
  network: "hedera:testnet",
  price: { asset: "0.0.429274", amount: "10000" },
}
```

Add invalid cases for blank/missing asset or amount, zero/non-canonical amount,
invalid recipient (including `0.0.0`), leading-zero recipient/asset segments,
unsupported network, userinfo URL, generic dollar price mixed with native
fields, and native fields mixed with EVM. Assert `0.0.0` remains an allowed
native asset. Each invalid family must parse as `null` or return `503` without
a `payment-required` header.

Create a fake facilitator with one supported kind:

```js
{
  x402Version: 2,
  scheme: "exact",
  network: "hedera:testnet",
  extra: { feePayer: "0.0.2222" },
}
```

Assert an unsigned native request returns `402`; decode the challenge and
assert its accepted requirement preserves network, asset, amount, and fee
payer. Assert Quick, `verify`, and `settle` calls remain zero. Add missing,
mismatched, blank-fee-payer, accessor-backed/malformed-extra, and duplicate
native-kind cases that must fail closed, including an invalid first matching
kind followed by an otherwise valid duplicate.

- [x] **Step 2: Verify RED**

Run: `npm run test --workspace @tool402/web -- --test-name-pattern='Hedera|native'`

Expected: FAIL because neither native configuration nor native server support exists.

- [x] **Step 3: Add the exact package and lock entry**

Add this runtime dependency to `apps/web/package.json`:

```json
"@x402/hedera": "2.25.0"
```

Regenerate only `package-lock.json` with Node 22/npm 10 and scripts disabled.
Confirm that the lock retains the existing x402 `2.25.0` package family and
that the workspace manifest has no direct SDK dependency.

- [x] **Step 4: Implement the closed configuration families and scheme selection**

Implement these closed forms:

```ts
type RiskScanEvmX402Configuration = {
  kind: "evm";
  payTo: `0x${string}`;
  facilitatorUrl: string;
  network: `eip155:${number}`;
  price: `$${string}`;
};

type RiskScanHederaX402Configuration = {
  kind: "hedera";
  payTo: `${number}.${number}.${number}`;
  facilitatorUrl: string;
  network: "hedera:testnet";
  price: { asset: `${number}.${number}.${number}`; amount: `${bigint}` };
};
```

Require one family only. Validate the specified canonical non-native Hedera
recipient, canonical asset (including only the allowed native `0.0.0`
sentinel), and positive canonical atomic amount. Make
`isRiskScanX402ConfigurationUsable` and handler construction dispatch by
`kind`: EVM alone loads `ExactEvmScheme` and parses its dollar price; Hedera
relies on the strict explicit atomic parser and never loads that EVM scheme.
Load `@x402/hedera/exact/server` only for Hedera and register its
`ExactHederaScheme` for testnet. Add controlled loader tests proving each
family cannot invoke the other scheme loader.

Make the wrapped `getSupported()` reject every native response except one
unique v2 `exact` / `hedera:testnet` kind whose own, non-accessor data
`extra.feePayer` is a nonblank string. Reject duplicate matching kinds before
passing the accepted original response through, so x402 cannot first-select an
unvalidated duplicate and the challenge receives the validated fee payer.
Keep settlement-result validation, after-handler observer, and exception-to-
`503` mapping. Include `kind` and all native price fields in the handler-cache
key.

- [x] **Step 5: Verify GREEN and commit the server slice**

Run:

```bash
npm run typecheck --workspace @tool402/web
npm run test --workspace @tool402/web -- --test-name-pattern='Hedera|native|x402'
```

Expected: PASS with no live HTTP request, private-key API, or signing API.

```bash
git add apps/web/package.json package-lock.json apps/web/src/lib/riskscan-x402.ts apps/web/tests/riskscan-api.test.mjs
git commit -m "feat: add Hedera x402 server support"
```

### Task 2: Native discovery summary and Consumer Agent validation

**Files:**
- Modify: `apps/web/src/lib/tool-directory.ts`
- Modify: `apps/web/tests/tool-directory-api.test.mjs`
- Modify: `apps/agent/src/riskscan-tool-directory.ts`
- Modify: `apps/agent/test/riskscan-tool-directory.test.mjs`
- Modify: `apps/agent/test/boundary.test.mjs`

**Interfaces:**
- Consumes: the discriminated configuration parser from Task 1.
- Produces: a safe native `locally_configured` summary and cloned Agent selection.

- [x] **Step 1: Write failing directory and Agent tests**

Add web tests that expect exactly:

```js
{
  state: "locally_configured",
  protocol: "x402",
  network: "hedera:testnet",
  asset: "0.0.429274",
  amount: "10000",
}
```

Prove output excludes controlled recipient, facilitator, fee payer, header,
payload, transaction, receipt, evidence, and result values. Add Agent tests
that clone this native summary and reject missing/extra/accessor/proxy-backed
fields, mainnet, malformed or leading-zero asset, zero/non-canonical amount,
and a mixed EVM `price` field. Assert `0.0.0` asset remains valid.

- [x] **Step 2: Verify RED**

Run:

```bash
npm run test --workspace @tool402/web -- --test-name-pattern='native|Hedera'
npm run test --workspace @tool402/agent -- --test-name-pattern='native|Hedera'
```

Expected: FAIL because the current summaries only accept EVM metadata.

- [x] **Step 3: Implement the exact three-way payment union**

In the directory, branch on the parser discriminant. Keep EVM output intact;
for Hedera emit only the exact native shape above. In the Agent define only:

```ts
{ state: "configuration_required" }
| { state: "locally_configured"; protocol: "x402"; network: `eip155:${number}`; price: `$${string}` }
| { state: "locally_configured"; protocol: "x402"; network: "hedera:testnet"; asset: `${number}.${number}.${number}`; amount: `${bigint}` }
```

Validate an exact own-data-property native record before fresh cloning. Retain
the one-shot credential-free GET and extend the source boundary test to reject
client-side Hedera imports, private-key/signer construction, payment-fetch
helpers, and live-client code.

- [x] **Step 4: Verify GREEN and commit the discovery slice**

Run:

```bash
npm run typecheck --workspace @tool402/web
npm run test --workspace @tool402/web
npm run typecheck --workspace @tool402/agent
npm run test --workspace @tool402/agent
npm run lint --workspace @tool402/agent
```

Expected: PASS with controlled metadata only and no outbound payment/signing.

```bash
git add apps/web/src/lib/tool-directory.ts apps/web/tests/tool-directory-api.test.mjs apps/agent/src/riskscan-tool-directory.ts apps/agent/test/riskscan-tool-directory.test.mjs apps/agent/test/boundary.test.mjs
git commit -m "feat: advertise Hedera x402 capability"
```

### Task 3: Integration proof and module acceptance

**Files:**
- Modify: `docs/work-queue/queue/20-active/M06-T010-riskscan-hedera-x402.md`
- Modify: root-owned queue state, catalog, ownership, decision, and evidence records

- [ ] **Step 1: Exercise the controlled local path**

Use controlled configuration and the existing handler's injected fake native
facilitator seam to exercise the Tool Directory plus an unsigned
`POST /api/riskscan`. Record only selected tool, native summary, and `402`
status. Do not use a wallet, account, key, payment signature, remote
facilitator, transaction, or result.

- [ ] **Step 2: Run root verification**

```bash
npm ci --dry-run --ignore-scripts --loglevel=error
npm run typecheck
npm run test
npm run lint
npm run build --workspace @tool402/web -- --webpack
npm run queue:check
git diff --check
```

- [ ] **Step 3: Obtain independent review, fix only confirmed in-scope findings, and accept**

Run the independent task review, focused RED regression/re-review cycle for
confirmed findings, then two fresh module-review generations. Both final
reviews must have no Critical, Important, or Minor issue. Before the root
acceptance commit, run the enabled local-reference guard against staged
content. Record no live facilitator, wallet, transaction, settlement,
finality, receipt, evidence, or result as accepted evidence.

```bash
git add docs/work-queue
git commit -m "chore: accept Hedera x402 service path"
```

## Plan Self-Review

- Spec coverage: Tasks 1 and 2 implement the configuration families, native
  capability gate, local challenge, and safe discovery summary; Task 3 records
  bounded integration and review evidence.
- Placeholder scan: every field, test, command, and human boundary is named.
- Type consistency: `kind`, `network`, `asset`, `amount`, and `price` use the
  same shapes across parser, route, directory, Agent, and tests.
