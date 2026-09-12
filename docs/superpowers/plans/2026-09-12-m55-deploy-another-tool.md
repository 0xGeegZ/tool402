# M55 Deploy Another Tool Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:executing-plans` to implement task-by-task, or
> `superpowers:subagent-driven-development` after root has explicitly
> allocated disjoint work. Steps use checkbox (`- [ ]`) tracking.

**Goal:** An authorized provider can deploy two separate tools using identical
prefilled form values and inspect both without replacing either.

**Architecture:** A protected explicit allocator owns per-tool identities.
The existing signed offering/ATS/Directory pipeline consumes the selected
identity, with per-tool configuration and corroborated receipt binding.
Legacy RiskScan remains a separate compatibility path.

**Tech Stack:** Existing TypeScript, Convex, Next.js/React, viem and pinned
Factory artifact; Node 22.21.1. No new dependency is planned.

**Spec:** [M55](../../specs/m55-provider-demo-attempt-restart.md).
Start with the [delegation packet](../../work-queue/evidence/M55-T010-delegation.md).

## Global constraints

- One initial campaign per tool; arbitrary service hosting and additional
  issuer onboarding are outside this slice.
- Equal names and all equal prefilled values are allowed.
- Legacy accepted records, signatures, preimages, hashes, and listings remain
  unchanged. New-tool behavior uses the explicit M55 compatibility amendment.
- No automatic allocation, signature, transaction retry, or live action.
- Local development stays HTTP localhost:3000 with genuine dashboard sign-in.
- Root owns queue transitions, generated output, dependencies, and integration.
  Candidate paths below confer no reservation until the startup gate clears.

## Task 0 — Reconcile the target and activate exact scope

**Files:** M55 card/spec/plan/handoff, root STATE, TASK-CATALOG,
FILE-OWNERSHIP, DECISIONS; existing active cards/evidence for conflicts.

- [ ] Fetch origin/main; record base/head and inspect the PR's complete net
  diff. Preserve the explicitly integrated continuation/auth/env fixes.
- [ ] Run the handoff startup checks. Build an exact path-to-owner map for
  Tasks 1–6 from current control records, including M54 (not just M51).
- [ ] For each collision, root records predecessor final acceptance/release
  or a narrowly scoped transfer plus co-review. Do not relabel predecessors
  done based on their code merely being present.
- [ ] Verify accepted foundation, validator, workspace and integration gates,
  focused baselines, and exact source dependencies; obtain fresh independent
  readiness. Root records 10-ready and then test-only RED activation.
- [ ] Record spec-to-test scope before each slice; commit expected RED, review
  it, then authorize its precise GREEN sources. Run slices serially until
  disjoint ownership has explicitly been established.

**Done when:** a committed readiness/activation record names every permitted
test path, every retained owner, and actual baseline results. No runtime
source has changed as a side effect of documenting the plan.

## Task 1 — Allocate and read owned tool identities

**Candidate new files:**

- `packages/core/src/provider-tool-identity.ts`
- `packages/core/test/provider-tool-identity.test.mjs`
- `packages/backend/convex/provider_tools.ts`
- `packages/backend/convex/provider_session_ingress.ts`
- `packages/backend/tests/provider-tools.test.mjs`
- `packages/backend/tests/provider-session-ingress.test.mjs`
- `apps/web/src/lib/provider-tools-server.ts`
- `apps/web/src/app/api/provider/tools/route.ts`
- `apps/web/tests/provider-tools-api.test.mjs`

**Candidate modifications:** Core index export, Backend schema/http routing.
Read existing dashboard auth, wallet command relay, protected ingress verifier,
and replay store; their fixed command-envelope behavior must stay unchanged.

**Interfaces:**

```ts
// New pure Core API. Entropy is generated only by the server allocator.
type ProviderToolIdentity = Readonly<{
  toolPublicId: string; subjectPublicId: string; offeringPublicId: string;
  serviceId: string; serviceSlug: string;
}>;
function createProviderToolIdentity(entropy: Uint8Array): ProviderToolIdentity;
function parseProviderToolId(value: unknown): string | null;

// Browser route: POST {requestId}; GET ?cursor=... or ?tool=...
// Server handlers derive address from readDashboardSession, never request JSON.
type AllocationResult =
  | { outcome: "allocated" | "replayed"; tool: ProviderToolIdentity }
  | { outcome: "rejected" | "conflict" | "not_configured" | "unavailable" };
type ToolSummary = ProviderToolIdentity & {
  title: string;
  state: "ALLOCATED" | "DRAFT" | "ASSET_PENDING" | "READY" | "OPEN" | "CLOSED";
};
type ToolPage = { tools: readonly ToolSummary[]; nextCursor: string | null };
// Backend internal operations: allocateForIssuer, listOwnedTools, readOwnedTool.
// Each takes a server-verified owner context; writes re-read current authority.
// Public JSON never includes that internal context.
```

- [ ] Add a real Core RED contract (exact mapping, wrong entropy length,
  malformed IDs, and detached/frozen result), including:

```js
import assert from "node:assert/strict";
import { test } from "node:test";
import { createProviderToolIdentity } from "../src/provider-tool-identity.ts";

test("identity is independent of display content", () => {
  const first = createProviderToolIdentity(new Uint8Array(16));
  const second = createProviderToolIdentity(new Uint8Array(16).fill(1));
  assert.equal(first.toolPublicId, "tool_" + "00".repeat(16));
  assert.equal(first.offeringPublicId, "offering_" + "00".repeat(16));
  assert.equal(first.serviceSlug, "tool-" + "00".repeat(16));
  assert.notEqual(first.subjectPublicId, second.subjectPublicId);
  assert.throws(() => createProviderToolIdentity(new Uint8Array(15)));
});
```

- [ ] Follow existing injected Convex database tests to execute allocation
  handlers, not source-text checks. Seed the exact enabled approved authority.
  Run concurrent same-owner/request-ID calls: one row and equal responses.
  Use two request IDs: two distinct rows. Revoke between initial call/retry:
  retry rejects and creates no row. Try sandbox issuer, BACKER, duplicate
  authorities, spoofed address, generated-ID collision, and foreign read.
- [ ] Test HTTP missing/expired session, duplicate/malformed cookie, invalid
  origin, extra JSON keys, oversized streamed body, forged/stale/replayed MAC,
  changed body and cross-domain command MAC. Assert zero allocation calls.
  Test indexed owner-only pagination, invalid cursor, and history after
  revocation. All signing/clock/random/network dependencies are injected.
- [ ] Run Core test plus the three new Backend/Web tests; record actual RED.
- [ ] Implement pure identity validation and indexed providerTools storage.
  Add a separately domain-bound session assertion verifier/endpoint, preserving
  existing command ingress. Allocation's transaction rechecks the current
  approved issuer, replay key, and collisions before insertion.
- [ ] Implement exact-Origin/session-validated Next handlers and the closed
  internal allocate/list/read protocol from the spec. POST allocates only;
  GET never allocates. Return safe projection and typed failure outcomes.
- [ ] Run focused tests and Core/Backend/Web typechecks, independently review
  the new authorization boundary, then commit this slice.

**Done when:** A3/A5/A6 hold through handlers, including concurrency, without
creating an offering or granting issuer authority.

## Task 2 — Bind signed stages to the owned tool

**Candidate new file:** `packages/backend/convex/provider_tool_authority.ts`.

**Candidate modifications:**

- Backend `convex/wallet_command_replay.ts`, `convex/command_dispatch.ts`,
  `convex/offerings.ts`, `convex/external_prepare_command_admission.ts`,
  `src/ingress/authenticated-wallet-command-normalizer.ts`.
- Backend tests `authenticated-wallet-command-normalizer.test.mjs`,
  `authenticated-external-prepare-normalizer.test.mjs`,
  `offering-command-admission.test.mjs`,
  `external-prepare-command-durable-admission.test.mjs`,
  `command-dispatch.test.mjs`.

**Interface:** shared internal selected-subject resolver consumes allocated
tool plus exact current signer/principal/authority version and produces only
the selected owned subject in the normalized authority context. Legacy
subjects still use existing ownedSubjectPublicIds. No public authorization API.

- [ ] RED: seed allocated A/B under the same approved issuer. Admit A and B
  with byte-equal field values and their distinct identities. Assert two
  offerings. Reject swapped offering/subject IDs, fabricated identity, foreign
  owner, revoked authority, and a replay carrying mismatched payload/context.
- [ ] RED: with A and B DRAFT, B's ATS preparation must link only B. Revalidate
  ownership after normalization and before durable write; revoke between the
  two checks and assert no preparation/link.
- [ ] Implement the bounded ownership lookup consistently in normalization,
  offering admission, preparation and replay paths. Do not simply remove the
  normalizer's owns-subject predicate or extend all issuer subjects in memory.
- [ ] Preserve version-1 create idempotency. Persist signed fields exactly;
  an admitted offering is never overwritten to reuse the form.
- [ ] Run the listed Backend contracts/typecheck; review and commit GREEN.

**Done when:** A7 and the write/replay portions of A5 pass while all legacy
command tests keep their existing authorization guarantees.

## Task 3 — Derive per-tool ATS command and execution configuration

**Candidate new files:**

- `packages/backend/src/ats/provider-tool-ats-configuration.ts`
- `packages/backend/tests/provider-tool-ats-configuration.test.mjs`
- `apps/web/src/lib/ats/provider-tool-ats-projection.ts`
- `apps/web/tests/provider-tool-ats-projection.test.mjs`

**Candidate modifications:** Backend `convex/ats_prepare_authority.ts`,
`convex/stage_b_ats_create_runtime_binding.ts`, command dispatcher/tool reader;
Web `src/lib/ats/factory-deploy-bond.ts`,
`stage-b-ats-create-execution-projection.ts`,
`stage-b-ats-create-command-projection.ts`,
`stage-b-ats-create-canonical-identity.ts`;
matching existing ATS authority/projection/canonical-identity/Factory tests.

**Interface:**

```ts
type AdmittedToolConfigurationInput = Readonly<{
  toolPublicId: string; subjectPublicId: string;
  title: string; canonicalSignerAddress: string;
}>;
// New private Backend API. Return shape follows the existing Stage-B authority
// projection (atsCreateConfiguration, canonicalPreimage, canonicalParametersHash)
// with validated dynamic string fields, never a planned authority grant.
function createProviderToolAtsConfiguration(input: AdmittedToolConfigurationInput):
  ProviderToolAtsConfiguration;
// ProviderToolAtsConfiguration is the detached immutable configuration/preimage/
// hash result, excluding plannedCommandAuthority.
// The public reader maps it to separately validated command/execution/display
// fields plus toolPublicId/offeringPublicId; browser parsers accept unknown.
```

- [ ] RED: use identical admitted title for two generated identities; assert
  unequal subject/info/hash, equal approved invariant fields, deterministic
  repeat result, and rejection of unallocated/mismatched context by the caller.
  Independently JCS/hash the expected closed preimage in the test, and inspect
  decoded Factory calldata; do not merely compare a helper with itself.
- [ ] Freeze all approved legacy values. Implement the spec's three dynamic
  fields, exact owner/admin match and hash recomputation; rederive from durable
  admitted fields at preparation, never from the caller's projection.
- [ ] Supply selected-tool public deployment projections only after Stage 1;
  validate exact keys/identity/hash and drop private authority fields.
  Adapt the Factory consumer to the validated new path; leave legacy exports
  and behavior available for existing callers.
- [ ] Encoding acceptance (using the existing Factory encode/decode fixture):

```text
same title + tool_A => metadata.name == original title; info contains tool_A
same title + tool_B => metadata.name == original title; info contains tool_B
assert calldata_A != calldata_B
assert target/resolver/default-admin/economics are the approved template
assert legacy calldata and accepted digest remain byte-identical
```

- [ ] Run new configuration/projection contracts and existing ATS/Factory
  contracts, typechecks, review, then commit.

**Done when:** configuration cannot drift across display/signing/execution,
equal fields yield distinct deploy inputs, and legacy constants are preserved.

## Task 4 — Corroborate and exclusively bind each new deployment

**Candidate new files:**

- `packages/backend/src/ats/provider-tool-receipt.ts`
- `packages/backend/convex/provider_tool_receipts.ts`
- `packages/backend/tests/provider-tool-receipt.test.mjs`

**Candidate modifications:** Backend schema, command dispatcher,
`convex/ats_candidate_receipts.ts`, `convex/ats_receipt_verification.ts`
(if used to route the new action; preserve HEDERA_FUNDING);
Web `src/lib/ats/stage-b-browser-provider-bridge.ts`;
existing candidate-receipt and browser-bridge tests.

**Interface:** new pure receipt verifier consumes server-derived expected
chain/sender/Factory/calldata/hash/asset and untrusted transaction/receipt
documents; returns VERIFIED, REJECTED, or UNKNOWN. Internal action reads only
fixed trusted testnet endpoints. Final mutation takes the corroborated tuple
and revalidates durable command/owner/preparation before atomic attachment.

- [ ] RED: independently constructed transaction/receipt fixtures for A and B
  with identical names. Attach A's successful receipt to B: reject; A's own
  receipt to A: accept once. Change each of sender, chain, target, hash, input,
  status, event address, and event count independently.
- [ ] RED: use a new transaction hash but an already bound asset, legacy
  transaction/asset, concurrent A/B claims, and a revocation during network
  reads. None may advance a foreign/stale offering. Same-offering exact replay
  is idempotent in every legacy-replay repair branch.
- [ ] RED: provider or server timeout/malformed/oversized response and unknown
  receipt preserve pending state and never call eth_sendTransaction on retry.
- [ ] Implement exact input/receipt checks in explicit browser recovery plus
  independent backend read-only corroboration for new-tool signed attachment.
  Trust no caller URL/receipt, use fixed template reader destinations, and
  validate receipt transactionHash/block association against the transaction.
- [ ] Add indexed unique binding checks for canonical network/hash and
  network/asset, including indexed legacy records. Canonicalize transaction
  aliases via corroborated EVM hash. Final transaction rechecks authority,
  signature/replay, offering and expected hash after the action's network read.
  Guard all direct attachment/replay branches for allocated subjects.
- [ ] Keep unknown evidence pending; no READY on a signed assertion alone.
  Preserve existing non-ATS verification and already admitted legacy rows.
- [ ] Run receipt/admission/bridge suites, typechecks, independent review and
  commit. Do not perform a wallet send or live verification during these tests.

**Done when:** A8/A9 hold at the backend trust boundary, not only in the UI.

## Task 5 — Isolate Directory identities and selected projections

**Candidate modifications:**

- Core `src/agent-directory-record-candidate.ts` and its existing
  `test/agent-directory-record-candidate.test.mjs` / types contract.
- Backend schema, `convex/directory_versions.ts`,
  `convex/command_dispatch.ts`, their Directory/HTTP dispatcher tests.
- Web `src/lib/offering-projection.ts`,
  `src/lib/active-directory-version.ts`,
  `src/lib/provider-directory-configuration.ts`,
  `src/lib/provider-directory-configuration-client.ts`,
  `src/components/provider/deploy/directory-record-literal.ts`,
  `src/app/api/offerings/route.ts`;
  existing offerings, active-directory, configuration and tool-directory tests.

**Interface:** selected provider projections include matching offering and
service identities; Directory lookup accepts legacy riskscan or canonical
generated slug and validates its association. No global “current tool” value.

Also modify Backend `convex/offerings.ts` and its public projection contract:
new-tool pre-publication records use the protected owner read, while public
offering/Directory reads expose new tools only at OPEN/CLOSED. Legacy public
projections retain their accepted behavior. Resume for selected new tools must
use the protected read from Task 1 rather than the public offerings endpoint.

- [ ] RED: publish A then B; query both ACTIVE records and compare A's saved
  snapshot before/after B. Query B with A's slug/offering/version: reject.
  Include legacy ACTIVE RiskScan and ensure it remains unchanged.
- [ ] RED: legacy static Directory readers keep their original behavior;
  malformed slug, foreign tool, wrong serviceId and unsupported capability fail.
  An unauthenticated public request for B before publication returns absent;
  its owner's protected read restores B's durable stage without exposing it
  through A's session. Published B becomes publicly inspectable.
- [ ] RED: HTTP localhost auth plus explicit HTTPS service endpoint config is
  valid; no endpoint yields not configured. Credentials/fragment/HTTP service
  endpoint fail. Sign-in must not be switched to HTTPS as a workaround.
- [ ] Extend slug validators narrowly and bind publication/replay to the
  allocated owner/service/offering. Scope supersession to one service.
  Read offering first or through a validated selected-tool projection, then
  query its matching Directory; never fetch the fixed riskscan record for B.
- [ ] Separate explicit service endpoint configuration from auth origin using
  the spec's key/fallback. Do not change real environment values in this slice.
- [ ] Run Core schema, Backend Directory/dispatcher, Web projection/config
  regressions and typechecks; review and commit.

**Done when:** A10 holds without rewriting old data or widening capability/
payment contracts into unchecked strings.

## Task 6 — Wire explicit creation, selected resume and dashboard list

**Candidate new files:**

- `apps/web/src/components/provider/deploy/new-tool-action.tsx`
- `apps/web/src/lib/provider-tools-client.ts`
- `apps/web/tests/provider-new-tool-flow.test.mjs`

**Candidate modifications:**

- `apps/web/src/app/provider/deploy/page.tsx`, `apps/web/src/app/provider/page.tsx`.
- Provider deploy `provider-deploy-wizard.tsx`, `deploy-stage-signing.tsx`,
  `provider-deploy-stages.tsx`, `provider-deploy-state.ts`,
  `ats-create-action.tsx`, `ats-create-configuration.ts`;
  status `provider-status.tsx` / `provider-status-state.ts`.
- Web libs `provider-campaign-resume.ts`, `wallet/command-bridge.ts`,
  `dashboard-campaign.ts`; dashboard campaign component.
- Existing wizard/state/signing/status/command-bridge/resume/dashboard tests.

**Interface:** selected immutable identity is an explicit input to the wizard,
resume adapter and StageRequestInput. A discriminated legacy/new-tool branch
keeps legacy callers intact. New-tool stages 1/2/4 use its offering/subject/
configuration/Directory; stage 3 uses only its linked preparation candidate.

- [ ] RED: UI/handler tests for A1/A3/A4/A11/A12, including OPEN status CTA,
  Cancel/Escape without calls, sign-in without allocation, double confirm,
  same-request retry after lost response, and no POST on route load.
- [ ] RED: two same-name entries have distinct React keys/IDs/links; pagination
  retains ownership. Session mismatch yields no previous owner's data.
  Route B from an A screen, resolve A's old read afterwards: B stays unchanged.
- [ ] Build the dialog/controller with the spec's copy and pending request-ID
  lifecycle. Allocate only on explicit confirm/retry; successful response
  routes to returned ID. Use validated ID parsing, never route-derived authority.
- [ ] Pass selection through server/client adapters, signed payloads, ATS
  display/execution/recovery, and Directory construction. Reset tool-local
  state on tool/wallet changes. Resume signed fields from durable state.
- [ ] Replace the fixed dashboard card assumption with paginated owned tools,
  preserving the legacy read-only card as an adapter case. Add OPEN status
  action; distinguish Resume, View, and Deploy a new tool.
- [ ] Run Web tests/typecheck and keyboard/mobile browser checks without
  real signatures. Review and commit.

**Done when:** the button is actually visible on the user's OPEN Provider
screen, and the selected new-tool path stays independent throughout the flow.

## Task 7 — Exact-head verification and delivery

- [ ] Run all focused new contracts and the affected Core/Backend/Web suites.
  Commands from repository root (under Node 22.21.1):

```sh
npm run test --workspace=@tool402/core
npm run test --workspace=@tool402/backend
npm run test --workspace=@tool402/web
npm run typecheck
npm run lint
npm run build
npm run queue:check
git diff --check
```

- [ ] Record each exit/result and pre-existing failures distinctly; a host
  build limitation is not a passing build. Keep the local Git guard enabled.
- [ ] Obtain a fresh independent exact-head review of source/security/
  compatibility and acceptance A1–A12. Fix findings and re-review changed head.
- [ ] Apply the handoff's HTTP dev configuration checklist. Verify actual
  route responses and configured auth challenge, then browser OPEN status,
  new-tool dialog, selected form/resume, and two-card dashboard when data is
  available. Record what uses fixtures versus actual dev backend data.
- [ ] Live demo acceptance, only after explicit human authorization for source
  deployment/configuration and each wallet stage: deploy A, use the new-tool
  CTA, leave B's prefill byte-equal, deploy B, then inspect both. Record
  distinct tool IDs/offerings/hashes/assets/slugs and A's unchanged before/after
  evidence. Never send on the user's behalf or call mocks live proof.
- [ ] Refresh origin/main before push, reconcile intended-only commit history,
  and update the existing draft PR with actual scope/tests/remaining live gates.
  Conventional commit/PR title ends with (#93); link the issue in the first
  description section. Preserve the previously integrated requested fixes.
- [ ] Report exact SHA, tests, CI, browser, backend deployment, and testnet
  proof separately. Root closes the card only when its actual local acceptance
  is reviewed, without conflating local acceptance and live evidence.
