# M30-T010 — Authenticated external-prepare command normalizer

## State

- Tier: CORE_P0
- Queue state: 00-inbox
- Dependencies: M25-T010 accepted; M26-T010 accepted; M27-T010 accepted
- Owner: This is a root-owned backend-only implementation record. It owns this
  card, the M30 specification and plan, the focused backend test, the new
  internal ingress source, the explicit backend verifier dependency and
  lockfile resolution, and root-integrator queue records. The root owns state,
  catalog, ownership, decisions, reviews, commits, and pushes.
- Human actions: HA-COMMAND-AUTHORITY-001 is accepted only as the bounded
  secret-free architecture authority recorded in
  [the decision](../../evidence/HA-COMMAND-AUTHORITY-001-decision.md) and
  [review](../../evidence/HA-COMMAND-AUTHORITY-001-review.md). It does not
  authorize a live or external action.

## Scope

Create one internal backend normalizer that consumes only an M25 claimed-body
capability, strictly decodes the one local command-and-payload transport, uses
the accepted M26 parser, recomputes the fixed JCS payload digest, verifies the
exact EIP-712 EOA signature, checks injected signer authority and the fixed
freshness window, and returns a detached frozen normalized DTO.

The local contract is the
[M30 authenticated command normalizer specification](../../../specs/m30-authenticated-external-prepare-normalizer.md).
Its neutral source record is the
[specification import ledger](../../../imports/SPEC-IMPORT-LEDGER.md), and
execution is constrained by the
[M30 implementation plan](../../../superpowers/plans/2026-09-07-m30-authenticated-external-prepare-normalizer.md).

M30-T010 may add only the direct exact verifier dependency required for this
internal check. It does not export a public backend API or modify M22 through
M26. Browser provider discovery and MetaMask invocation remain a future
explicit client boundary.

## Inbox transition

Recorded at 2026-09-07T18:25:00Z after M27-T010 closed on the accepted human
decision and independent review. This inbox state authorizes only committed
local authority and an independent design review. It does not authorize RED
tests or source work yet.

The implementation boundary must not create a replay claim, idempotency claim,
a prepared state, generic durable attempt, ATS target/configuration state,
ATS/provider SDK call, funding intent, wallet/provider invocation, account
action, payment, transfer, Hedera transaction, deployment, settlement,
clearing, HCS, payout, or live evidence. It must not infer expected target,
canonical parameters hash, or operation-to-target authority from the signed
payload, signer, or browser.

## Ready requirements

- M25-T010, M26-T010, and M27-T010 remain accepted locally.
- The local specification, neutral import-ledger row, plan, card, catalog,
  ownership, decision, human-action, and state records are committed before a
  RED test, dependency, lockfile, or source change.
- When the verifier dependency is added after the test-only RED commit, it
  must be exactly version 2.56.1; no transitive verifier resolution is
  accepted.
- The contract fixes the command/payload transport, field grammar, canonical
  nonce tail, strict expiry equality, typed-data fields/domain, authority
  predicate, resolver ordering, and prohibited behavior before code.
- A fresh independent review of the committed M30 authority is clean: no
  Critical, Important, or Minor finding remains.

## Validation

- A test-only RED commit precedes every package, lockfile, source, or export
  change and observes the absent internal normalizer.
- Focused backend tests prove claimed-body-only byte access, strict transport
  parsing, canonical nonce/signature/signer grammar, payload digest and
  typed-data recovery, resolver ordering and authority predicates, time
  checks, frozen output, and absence of durable or external behavior.
- Backend/root typecheck, test, lint, clean-install dry run, queue/reference/
  whitespace checks, enabled local guard, independent task review, and two
  fresh clean module-review generations must pass before acceptance.
