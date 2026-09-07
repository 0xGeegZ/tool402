# M22-T010 — Closed ingress envelope and replay identity

## State

- Tier: CORE_P0
- Queue state: 60-done
- Dependencies: M16-T010 accepted, M17-T010 accepted, M18-T010 accepted,
  M19-T010 accepted, M20-T010 accepted, M21-T010 accepted
- Owner: `packages/core/src/ingress-envelope.ts`,
  `packages/core/test/ingress-envelope.test.mjs`, and
  `packages/core/test/ingress-envelope.types.ts` are accepted implementation
  paths. The root records the public-barrel amendment in
  `packages/core/src/index.ts` and owns this card, local specification/import
  record, plan, queue state, catalog, ownership, decisions, reviews,
  integration evidence, and pushes.
- Human actions: none for this pure local parser. Existing bounded paid-request
  evidence neither grants nor blocks it, and grants no HMAC key, server
  configuration, replay store, ATS, funding, allocation, account, asset,
  wallet, signer, transaction, settlement, clearing, HCS, payout, deployment,
  or live authority.

## Scope

Create the smallest closed Core ingress-envelope parser needed before a later
server verifier may safely evaluate one claimed protected request. The parser
will capture exact descriptor-safe transport fields, construct a fixed
canonical signing input, and derive a correlation-only replay identity. It
will not authenticate the envelope or decide that any nonce is fresh.

The local contract is [M22 closed ingress envelope and replay identity](../../../specs/m22-ingress-envelope.md), the neutral source record is the [specification import ledger](../../../imports/SPEC-IMPORT-LEDGER.md), and execution is in the [M22 closed ingress envelope plan](../../../superpowers/plans/2026-09-07-m22-ingress-envelope.md).

The accepted M16–M21 chain supplies the local semantic predecessor set for
the minimum closed ingress slice. M20 supplies an accepted descriptor-safe
untrusted-record pattern, but this card does not reopen it. The card is a
strictly smaller local prerequisite than a HMAC verifier, generic durable
attempt model, ATS boundary, or holder-distribution lifecycle.

## Candidate ready requirements

- The local contract, neutral import-ledger row, and implementation plan are
  committed before a RED test or code change.
- Every declared predecessor remains accepted locally. The authority maps only
  the minimum ingress-envelope structural slice; it does not claim that any
  broader schema, verification, or durable attempt contract is complete.
- The public output is exactly one frozen envelope value containing the five
  captured fields, fixed method/path, canonical signing input, and
  non-authoritative replay identity.
- The source input is a closed ordinary five-field record. Its timestamp,
  nonce, digest, and signature fields have exact lexical rules, including
  canonical unpadded base64url tails that prohibit alternate nonce text;
  unknown,
  inherited, descriptor-unsafe, or reflection-hostile input fails closed.
- No active card owns the proposed Core paths. The public-barrel amendment is
  a root integration reservation; accepted Core behavior remains otherwise
  unmodified.
- The delivery excludes HMAC/key work, raw body hashing, time/skew checks,
  replay storage, endpoint/HTTP handling, command parsing, generic attempts,
  ATS/configuration, payment, funding, accounts, assets, wallets, signers,
  transactions, settlements, receipts, clearing, HCS, payouts, deployment,
  and live claims.
- An independent review of the committed local contract and plan is clean: no
  Critical, Important, or Minor finding remains.

## Validation

- RED/GREEN tests prove exact frozen output, canonical signing input,
  collision-safe replay identity, canonical base64url-tail rejection, malformed
  lexical values, closed shape,
  descriptor/proxy/reflection resistance, and zero accessor invocation. The
  focused command is `node --test packages/core/test/ingress-envelope.test.mjs`
  from the repository root.
- A public compile-time fixture proves the parser returns a readonly exact
  method/path envelope and a `bigint` timestamp.
- Core/root typecheck, test, lint, clean-install dry run, queue/reference/
  whitespace checks, enabled local guard, independent task review, and two
  fresh clean module-review generations pass before acceptance.

## Inbox transition

Recorded at 2026-09-07T02:28:28Z after a fresh source-to-runtime critical-path
rescan confirmed that an unverified local `split_confirmed` label cannot
truthfully start holder distribution, and that ATS still needs a broader
schema/attempt chain. This card is the smallest local closed ingress and
replay-identity prerequisite. It authorizes only committed authority and
independent design review; it authorizes neither RED/code nor HMAC, server
configuration, persistence, ATS, payment, funding, allocation, clearing, HCS,
account, wallet, signer, transaction, deployment, or live action.

## Design review

A scoped independent source-to-runtime assessment confirmed this parser is the
smallest dependency-correct local prerequisite: it closes only the ingress
envelope/replay-identity structure while retaining HMAC, server configuration,
replay storage, generic attempts, ATS, and holder distribution as separate
blocked work. An independent Standards review of the committed authority found
preserved root queue ownership, resolvable local links, the enabled local
reference boundary, no foreign-source leakage, no scope expansion, and no
actionable baseline smell. Its narrow follow-up review of the canonical-newline
clarification was also clean. No Critical, Important, or Minor finding remains.

## Ready transition

Ready at 2026-09-07T02:44:06Z after a fresh post-review queue rescan confirmed
all declared M16–M21 predecessors remain accepted, the committed authority is
resolvable, proposed Core paths are disjoint from active work, the local guard
is enabled, direct validation is concrete, and no human blocker applies to this
deterministic local scope. This ready state authorizes only the bounded
test-only RED then minimal Core GREEN parser after root activation; it does not
authorize HMAC, server configuration, replay storage, HTTP/commands, generic
attempts, ATS, payment, funding, allocation, account, asset, wallet, signer,
transaction, settlement, receipt, persistence, clearing, HCS, payout,
deployment, or live behavior.

## Activation

Activated at 2026-09-07T02:45:42Z after a fresh post-ready rescan confirmed
M22-T010 is the sole ready card, all declared M16–M21 dependencies remain
accepted, no active card owns the bounded Core paths, committed authority is
resolvable, the local guard is enabled, and the current human-action record
neither grants external authority nor blocks deterministic local work. This
activation authorizes the specified test-only RED then minimal Core GREEN parser
and verification only; it does not expand authority to HMAC, server
configuration, replay storage, HTTP/commands, generic attempts, ATS, payment,
funding, allocation, clearing, HCS, account, wallet, signer, transaction,
deployment, or live behavior.

## Acceptance

Accepted at 2026-09-07T03:29:50Z after final verification against
`MODULE_BASE` `49430eca23f3c301de7dd27ffa0a0a149b07c655` and `MODULE_HEAD`
`d43cb83e3747c40d688e604c5d8bc8a0aeecfa9f`. The durable test-only RED
commits `00819b8`, `9236430`, and `3d298e0` precede the initial source/public-
barrel commit `d7ca798`; the canonical-base64url correction then used a
test-only RED `6dd3430` before the narrow source correction `8658b23`.
Final evidence-only coverage commits `b56ea15` and `d43cb83` close review
gaps; the latter is intentionally GREEN-only because the already-accepted
parser correctly handled both documented lower bounds.

Focused M22 tests passed 5/5; root tests passed Agent 51/51, Web 87/87,
Backend 68/68, and Core 86/86. Core and root typecheck, root lint,
clean-install dry run, queue/reference/whitespace checks, and the enabled
local guard passed under Node 22.21.1. Independent task review and two fresh
clean Standards/Specification module-review generations found no Critical,
Important, or Minor finding.

This acceptance covers only the pure Core ingress-envelope parser and
correlation-only replay identity. It does not accept HMAC/key handling, server
configuration, replay storage, HTTP/command handling, generic attempts, ATS,
payment, funding, account, asset, wallet, signer, transaction, settlement,
receipt, persistence, clearing, HCS, payout, deployment, or live behavior.
