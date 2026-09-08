# M33-T010 — ATS prepare-authority gate

## State

- Tier: CORE_P0
- Queue state: 20-active
- Dependencies: M26-T010 accepted; M32-T010 accepted;
  HA-ATS-AUTHORITY-001 accepted as bounded architecture authority
- Owner: This root-owned candidate owns its card, the local M33 specification,
  the M33 plan, its neutral specification-ledger row, the accepted human
  decision, queue/control records, one private underscore-safe Convex helper,
  its focused direct test, one narrow M32 mutation assertion, and its focused
  M32 test amendment. The root owns state, catalog, ownership, decisions,
  reviews, commits, and pushes.
- Human actions: HA-ATS-AUTHORITY-001 authorizes this fail-closed local
  predicate only. It does not authorize target enablement, provider use,
  wallet/account action, funding, payment, transaction, configuration,
  deployment, or live behavior.

## Scope

M33 narrows M32's accepted internal admission flow only for `ATS_CREATE`,
`ATS_CONTROL_LIST`, `ATS_ISSUE`, `ATS_TRANSFER`, and `ATS_COUPON`.
After M32 has independently rebound the command/payload/time context and
revalidated the current signer authority, M33 resolves one immutable
server-owned authority manifest and requires an exact target and canonical
parameters hash comparison before M32 can read replay or idempotency state.

The committed production manifest contains no enabled record. Therefore every
current ATS payload rejects after the command-authority lookup and before any
replay/idempotency lookup or durable write. `HEDERA_FUNDING` remains outside
M33 and follows M32's current BACKER path unchanged.

This card is an admission predicate, not execution authority. It creates no
schema, record, public function, generated API, configuration, provider,
wallet, ATS SDK, account, funding, payment, transaction, settlement, clearing,
HCS, payout, deployment, or live evidence.

The local authority is the [M33 specification](../../../specs/m33-ats-prepare-authority-gate.md),
the [accepted human decision](../../evidence/HA-ATS-AUTHORITY-001-decision.md),
and the [M33 implementation plan](../../../superpowers/plans/2026-09-08-m33-ats-prepare-authority-gate.md).

## Candidate ready requirements

- All declared dependencies remain accepted locally, and the human decision,
  M33 specification, plan, card, ledger, catalog, ownership, decision, and
  state records are committed.
- An independent review of that committed authority finds no Critical,
  Important, or Minor finding.
- The only candidate runtime paths are
  `packages/backend/convex/ats_prepare_authority.ts`,
  `packages/backend/convex/external_prepare_command_admission.ts`, and their
  two focused backend tests. No schema, recovery, Core, package, lockfile,
  Web, Agent, public API, configuration, or external path is eligible.
- The test-only RED must precede every M33 production source change. It must
  prove exact source matching and that ATS rejection does not reach M32 replay,
  idempotency, or writes, while every existing M32 durable-path regression is
  migrated to a HEDERA_FUNDING/BACKER control fixture and retains its accepted
  replay/idempotency behavior.

## Validation

- Focused Node commands from the repository root under Node 22.21.1:

  ~~~bash
  node --test packages/backend/tests/ats-prepare-authority.test.mjs
  node --test packages/backend/tests/external-prepare-command-durable-admission.test.mjs
  ~~~

- Before acceptance, run backend/root typecheck, test, lint, clean-install dry
  run, queue/reference/whitespace checks, the enabled local guard, independent
  task review, and two fresh clean module-review generations.

## Inbox transition

Recorded at 2026-09-08T06:24:09Z after the human approved
HA-ATS-AUTHORITY-001. A fresh source-to-runtime rescan found M26-T010 and
M32-T010 accepted, no active lane or ownership conflict, and no eligible
existing CORE_P0 successor. The human decision deliberately fixes a
server-owned zero-enabled manifest rather than inventing a live ATS target,
ABI, or parameter set.

This inbox state authorizes only committed local control records and
independent design review. It does not authorize RED/code, target enablement,
Convex publication, BFF/HTTP behavior, provider/wallet action, funding,
payment, transaction, deployment, or live behavior.

## Ready transition

Ready at 2026-09-08T06:40:00Z after a fresh rescan at pushed
`a55a29965e123007084b3274dee5a3edf6b3482a` confirmed M26-T010 and M32-T010
accepted, no active lane or ownership conflict, exact origin/main equality,
local references, and an enabled guard. The independent committed-authority
review at [M33-T010-authority-review.md](../../evidence/M33-T010-authority-review.md)
found no Critical, Important, or Minor finding after the durable-fixture and
ATS-fixture corrections.

This ready state authorizes only root activation followed by the specified
test-only RED. It does not authorize target enablement, Convex publication,
BFF/HTTP behavior, provider/wallet action, funding, payment, transaction,
deployment, or live behavior.

## Activation

Activated at 2026-09-08T06:45:00Z after a fresh ready-state rescan at pushed
`72f327607b05fa8f5f72ad1609b51e2029192b01` confirmed M33-T010 as the sole
ready card; M26-T010/M32-T010 remained accepted; no active ownership conflict,
human blocker, reference issue, or guard issue existed.

This activation authorizes only the committed test-only RED contract. It does
not authorize a production manifest entry, target enablement, Convex
publication, BFF/HTTP behavior, provider/wallet action, funding, payment,
transaction, deployment, or live behavior.

## RED acceptance

Accepted at 2026-09-08T07:16:53Z after a fresh root rescan at pushed
`95a5d26bbd43b82cfbea5e1f97ae782ebf65719c` confirmed exact origin/main
equality, a clean worktree, local references, an enabled guard, accepted
M26-T010/M32-T010 dependencies, and no active ownership conflict or new human
blocker. The test-only RED commits
`a28ab895b768e3e37c4556bfcbfee8ee77eae85e` and
`95a5d26bbd43b82cfbea5e1f97ae782ebf65719c` were independently reviewed
cleanly after remediation. They establish exact manifest tuple matching,
funding no-observation, ATS pre-durable failure, and retained funding durable
behavior.

This acceptance authorizes only the remaining serial plan steps: the declared
private zero-enabled resolver and one ordered M32 assertion. It does not
authorize a production manifest entry, target enablement, Convex publication,
BFF/HTTP behavior, provider/wallet action, funding, payment, transaction,
deployment, or live behavior.
