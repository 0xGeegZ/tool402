# M25-T010 — Claimed protected body

## State

- Tier: CORE_P0
- Queue state: 10-ready
- Dependencies: M01-T030 accepted; M22-T010 accepted; M23-T010 accepted;
  M24-T010 accepted
- Owner: `packages/backend/src/ingress/claimed-protected-body.ts` and
  `packages/backend/tests/claimed-protected-body.test.mjs` are proposed
  implementation paths. The root owns this card, local specification, import
  record, plan, queue state, catalog, ownership, decisions, reviews,
  integration evidence, commits, and pushes.
- Human actions: none for this deterministic internal composition. Durable
  storage, external configuration, deployment, and live replay proof remain
  separately authorized future boundaries.

## Scope

Create the smallest internal byte-binding adapter after M24. It makes one
private raw-byte copy, verifies that exact copy through M23, claims its exact
verified replay through M24, then issues a fresh private capability which can
return only fresh byte copies to a later internal caller.

The local contract is the [M25 claimed protected body](../../../specs/m25-claimed-protected-body.md),
the neutral source record is the [specification import ledger](../../../imports/SPEC-IMPORT-LEDGER.md),
and execution is in the [M25 claimed protected body plan](../../../superpowers/plans/2026-09-07-m25-claimed-protected-body.md).

This is the smallest missing boundary that prevents a successful replay claim
from being paired later with arbitrary raw bytes. It does not parse a command
or assert command, identity, durable-storage, or financial authority.

## Candidate ready requirements

- The local contract, neutral import-ledger row, plan, card, catalog,
  ownership, decision, and state records are committed before a RED test or
  source change.
- M01-T030, M22-T010, M23-T010, and M24-T010 remain accepted locally. M23 and
  M24 remain the sole verification and claim authorities; this card only
  composes them with a private byte copy.
- The only proposed source/test paths are disjoint internal backend paths,
  with no public backend-barrel, Convex, schema, M04, Agent, Web/UI, or package
  ownership overlap.
- The sequence is private byte copy, M23 verification, M24 claim, frozen
  private capability, then fresh reader copy. The RED suite must make the M23
  digest hook mutate caller input before it signals its gate, then still
  observe the original bytes. Every failure returns `null` and no body is
  readable.
- The delivery has no JSON parsing, command fields, storage implementation,
  configuration, environment, key provisioning, HTTP, generic attempts, or
  live/external action.
- An independent review of the committed authority is clean: no Critical,
  Important, or Minor finding remains.

## Validation

- A test-only RED contract precedes source and proves exact byte binding, one
  canonical injected replay claim, caller/reader byte-mutation isolation,
  including caller mutation performed synchronously by a gated M23 digest
  hook, forged/copy/proxy rejection, failed-claim non-exposure, and no
  prohibited boundary expansion.
- The focused command is
  `node --test packages/backend/tests/claimed-protected-body.test.mjs` from
  the repository root under Node 22.21.1.
- Backend/root typecheck, test, lint, clean-install dry run, queue/reference/
  whitespace checks, enabled local guard, independent task review, and two
  fresh clean module-review generations must pass before acceptance.

## Inbox transition

Recorded at 2026-09-07T10:08:00Z after a fresh source-to-runtime rescan found
that accepted M23/M24 authenticate and claim only a replay identity but retain
no authenticated byte binding for a later command boundary. This inbox state
authorizes only committed local authority and independent design review. It
authorizes neither RED/code nor JSON/command parsing, storage, generic
attempts, ATS, payment, funding, allocation, clearing, HCS, account, wallet,
signer, transaction, deployment, or live behavior.

## Design review

An independent authority review of the initial committed record found a
concrete asynchronous-byte-copy test gap. A first amendment required a gated
digest mutation case; a follow-up review found that mutation must occur inside
the digest hook before it signals the test gate. The corrected authority at
`8650ec26e1dab08862d89d19feeb0402d1e5dd1d` requires that stricter RED case.
A final independent recheck found no Critical, Important, or Minor finding:
the private pre-verification copy is now testable against both late-copy paths,
M23/M24 remain the only verification/claim authorities, and the scope,
ownership, references, and plan remain bounded.

## Ready transition

Ready at 2026-09-07T10:23:11Z after a fresh post-review rescan confirmed
M01-T030, M22-T010, M23-T010, and M24-T010 remain accepted; the corrected
authority and every local reference resolve; no active owner conflicts with
the two proposed backend paths; the local guard is enabled; and no human
blocker applies to deterministic internal work. This ready state authorizes
only root activation followed by the specified test-only RED and minimal
byte-binding adapter. It does not authorize command parsing, storage,
configuration, Convex, HTTP, generic attempts, ATS, payment, funding,
account/wallet action, deployment, or live behavior.
