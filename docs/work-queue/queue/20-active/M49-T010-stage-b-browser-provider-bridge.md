# M49-T010 — Stage-B browser/provider execution bridge

## State

- Tier: CORE_P0
- Queue state: 20-active
- Dependencies: M42-T010 accepted, M44-T020 accepted, M44-T030 accepted, M47-T010 accepted, M48-T010 accepted, S15-T010 accepted, S16-T010 accepted, S21-T010 accepted
- Consumer/evidence context: M41-T010 and M43-T010 are accepted consumers of
  the resulting candidate. HI-004 supplies fixed public issuer-account
  evidence; HI-007 supplies the candidate transaction-id wire-form ruling.
- Owner: Root owns queue state, catalog, ownership, decisions, readiness,
  activation, reviews, commits, pushes, and integration. A later implementer
  receives only the exact RED/GREEN paths recorded after the normal reviews.
- Human actions: HA-ATS-STAGE-B-001 remains PENDING and is the only authority
  for a real provider interaction, transaction, public Mirror observation, or
  candidate attachment. This card authorizes local source/test work only after
  its own queue gates.

## Purpose

M49 is the browser/provider successor requested by HI-009. It turns the
accepted local Factory + viem seam into one explicit, fail-closed boundary:

```text
stage-2 external.prepare ACCEPTED
→ exact issuer/chain recheck
→ one MetaMask eth_sendTransaction to the fixed Factory
→ bounded receipt and public-Mirror observation
→ one verified local candidate { transactionId, evmAddress }
→ existing, separately signed external.attachCandidate stage
```

It never turns a local candidate into receipt verification, an asset-ready
claim, a lifecycle operation, or live evidence. The human owns every actual
send and signature under HA-ATS-STAGE-B-001.

## Local authority

The implementation contract is
[M49 Stage-B browser/provider bridge](../../../specs/m49-stage-b-browser-provider-bridge.md).
The independent intake review is
[M49-T010 intake review](../../evidence/M49-T010-intake-review.md). The
implementation plan is
`docs/superpowers/plans/2026-09-10-m49-stage-b-browser-provider-bridge.md`.

M49 preserves byte-for-byte the accepted M42 real-issuer preimage and digest:

```text
1880065c5ae64b3fc6279cfdd8c85a6880d43e98ce129ed697c72372204296f9
```

It must never use the S16 display projection or its synthetic digest as Factory
input. M47's six-field stage-2 command projection stays unchanged and cannot
construct calldata.

## Candidate implementation surface

After independent RED acceptance, the exact GREEN scope is:

- `apps/web/src/lib/ats/stage-b-ats-create-execution-projection.ts` (new)
- `apps/web/src/lib/ats/stage-b-browser-provider-bridge.ts` (new)
- `apps/web/tests/stage-b-ats-create-execution-projection.test.mjs` (new)
- `apps/web/tests/stage-b-browser-provider-bridge.test.mjs` (new)
- `apps/web/tests/ats-create-action.test.mjs` (new)
- `apps/web/src/components/provider/deploy/ats-create-action.tsx`
- `apps/web/src/components/provider/deploy/provider-deploy-stages.tsx`
- `apps/web/src/components/provider/deploy/deploy-stage-signing.tsx`
- `apps/web/tests/ats-contracts-bundle-gate.test.mjs`
- `apps/web/tests/deploy-stage-signing.test.mjs`

The execution projection is one frozen public, non-secret transcription of the
complete accepted M42 configuration. It recomputes the accepted digest before
returning and passes the exact configuration only to the accepted M44 Factory
request builder. It is neither a server authority nor caller input. M42 private
source, M47, M44 helper/test source, S16, command bridge, Backend/Convex,
packages, lockfiles, environment, routes, and submission documents remain
outside the card.

M49 has CORE_P0 precedence over the still-inbox S26 reservation of
`deploy-stage-signing.tsx` and its test. S26 must rebase its later header-only
work on the accepted M49 interface.

## Readiness review

The independent current-head review at
[M49-T010 readiness review](../../evidence/M49-T010-ready-review.md) is clear
at clean canonical `0f117ee1ce2d087af6c8e3810c017c51b97618d0` and moved this
card to `10-ready`. The separate activation is recorded below. At readiness,
every production source, existing UI component, provider/wallet/RPC/network
request, transaction, Mirror observation, candidate attachment, verification,
lifecycle, package, environment, deployment, and live path remained prohibited
pending activation and a fresh independent RED review.

## Activation review

The independent current-head activation review at
[M49-T010 activation review](../../evidence/M49-T010-activation-review.md) is
clear at clean canonical `7ba415b75b6acca0550d6c9100adf87d0b817b6a`. This card
is `20-active` only to create durable RED in:

- `apps/web/tests/stage-b-ats-create-execution-projection.test.mjs`
- `apps/web/tests/stage-b-browser-provider-bridge.test.mjs`
- `apps/web/tests/ats-create-action.test.mjs`
- `apps/web/tests/ats-contracts-bundle-gate.test.mjs`
- `apps/web/tests/deploy-stage-signing.test.mjs`

Every source module and UI component remains prohibited pending a fresh
independent RED review. RED uses injected fakes only and cannot make a provider,
wallet, RPC, network, transaction, Mirror, candidate, verification, lifecycle,
deployment, or other live action.

## RED acceptance and GREEN authorization

The two independent current-head reviews recorded in
[M49-T010 RED review](../../evidence/M49-T010-red-review.md) are clear at
clean canonical `dcd60d8d37a3491a900bc007ee882fc83858554c`. The durable RED
diff changes exactly the five test paths declared in the activation review;
`git diff --check` is clear. Under Node 22.21.1, the focused command reports
eight passing tests, six intended absent-source/UI-wiring failures, and fourteen
skips. No source, configuration, environment, provider, wallet, RPC, network,
transaction, Mirror, candidate, verification, lifecycle, deployment, or other
live path changed.

Ruling: M49 remains `20-active` and only the exact GREEN surface declared in
the Candidate implementation surface above is now source-authorized. The five
RED test paths may change only to complete that source work. Every other path
and every real provider request, public Mirror observation, transaction, or
candidate attachment remains prohibited pending later independent acceptance
and the separate human action `HA-ATS-STAGE-B-001`.

## Fixed one-shot execution contract

When and only when a human has separately approved HA-ATS-STAGE-B-001 and
clicks the explicit UI control, the implementation may:

1. Require the existing MetaMask session to report `eth_chainId === "0x128"`
   and exactly one valid `eth_accounts` EVM address that is normalized before
   exact comparison with accepted lowercase issuer
   `0xc89f87052c3e080b4a9b021d4930055031ef378e`; otherwise stop before a
   transaction request. This does not loosen strict-lowercase M42 configuration
   parsing.
2. Construct the full frozen execution projection, require its recomputed M42
   digest, call only M44 `buildFactoryDeployBondRequest` and
   `encodeFactoryDeployBond`, and make exactly one `eth_sendTransaction` with
   the exact issuer `from`, fixed Factory `to`, encoded calldata, and
   `value: "0x0"`.
3. A page-session controller synchronously locks before the first provider
   request. A pre-hash wallet rejection may release its in-flight lock for a
   new explicit click; after any returned hash it latches success or
   `submission_unknown` until reload, so same-tick and later clicks cannot
   cause a second send. After a returned canonical EVM transaction hash, poll only
   `eth_getTransactionReceipt` through a fixed bounded observation window. It
   never sends a second transaction. A missing, malformed, unsuccessful,
   wrong-hash, wrong-Factory, or event-invalid receipt is terminal for this
   local session and produces no candidate.
4. Decode exactly one Factory-emitted `BondDeployed` log through M44. Its event
   emitter must first validate and normalize to the fixed Factory; non-Factory
   or multiple qualifying events reject. Its event address is independently
   non-zero validated and canonicalized by M44.
5. Resolve the candidate's Mirror-form transaction id only through the fixed
   public Mirror contract in the local specification. It must not synthesize an
   id from an EVM address and timestamp, read a non-standard wallet field, or
   infer an id from a receipt.
6. On one fully corroborated result, set browser-session-only candidate
   `{ transactionId, evmAddress }`. It does not automatically sign or relay
   `external.attachCandidate`; the existing stage-3 control remains a separate
   human wallet signature.

Any rejected wallet request before a hash produces a local rejected state.
Mirror indexing may retry only through the fixed three-cycle, five-second,
read-only observation window in the specification. Every failure after a hash,
timeout, ambiguous Mirror record, or response integrity failure is
`submission_unknown`: no candidate, no attach command, no new click/send, and
no resubmission until reload.

## Candidate readiness requirements

- All dependencies remain accepted on clean canonical main.
- The card, specification, plan, intake review, ledger, catalog, ownership,
  State, and decision record resolve locally.
- Each proposed path is absent or an explicit root integration reservation;
  S22/S24 are disjoint and S26 remains inbox-only.
- RED uses injected EIP-1193 provider, receipt, clock/sleep, and fetch fakes;
  it sends no transaction and makes no network request.
- The focused Web command is concrete:

  ```sh
  cd apps/web
  /Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin/node --test \
    tests/stage-b-ats-create-execution-projection.test.mjs \
    tests/stage-b-browser-provider-bridge.test.mjs \
    tests/ats-create-action.test.mjs \
    tests/ats-contracts-bundle-gate.test.mjs \
    tests/deploy-stage-signing.test.mjs
  ```

## Explicit exclusions

Do not change the M42 preimage/digest, M47 command projection, S16 display
literal, M44 Factory helper, M43 verification boundary, M40 offering state,
M33 mapping, a `commandAuthorities` row, Convex publication, package or
lockfile, environment, key, SDK, server signer, generic network configuration,
deployment, funding, allocation, clearing, HCS, payout, or submission record.

Do not execute a wallet request, Mirror request, transaction, candidate
attachment, verification, lifecycle action, or public deployment during local
implementation, RED, GREEN, review, or acceptance. No test may use a real
provider, endpoint, account, or transaction.

## Completion

M49 is accepted only after durable RED precedes source, all focused and
affected Web tests/typecheck/lint pass, queue/reference/whitespace checks and
the local guard pass, and independent task plus module reviews are clear. Once
accepted, root may prepare—not execute—a prefilled HA-ATS-STAGE-B-001 packet
for one human-operated rehearsal. That packet must name the accepted commit and
host, authorize exactly one Factory `deployBond` send, bounded public Mirror
observation, and one separately clicked candidate attachment; it must exclude
positive M43 verification, `ASSET_READY`, lifecycle, funding, allocation,
clearing, HCS, payout, deployment, and automatic retry.
