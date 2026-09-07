# B01-T010 — Convex module-naming compatibility

## State

- Tier: CORE_P0
- Queue state: 00-inbox
- Dependencies: M01-T030 accepted; M04-T010 accepted; M04-T030 accepted;
  M04-T040 accepted; M04-T050 accepted; M04-T060 accepted; M04-T070 accepted
- Owner: the root owns this card, its local specification and plan, catalog,
  state, human-action record, decisions, reviews, integration evidence,
  commits, and pushes. Proposed code paths are the five legacy and canonical
  Convex module locations, their five direct backend tests, one new
  compatibility test, and code-styled module-path literals in the five M04
  specifications, five M04 plans, five accepted M04 cards, and
  `docs/work-queue/FILE-OWNERSHIP.md`.
- Human actions: `HA-CONVEX-DEV-001` remains a separate Human Ops
  development-only publish verification. It does not authorize an agent to
  read ignored configuration, publish/deploy, or perform any external action.

## Scope

Normalize only the five existing internal Convex function module filenames,
their direct test import URLs, and their current code-styled locations in the
bounded M04 records, preserving every function export and all code behavior.
The local contract is [B01 Convex module-naming compatibility](../../../specs/b01-convex-module-naming-compatibility.md), and its execution steps are in the
[B01 implementation plan](../../../superpowers/plans/2026-09-07-b01-convex-module-naming-compatibility.md).

This is a compatibility amendment to stable accepted backend function locations,
not a reopening of their RiskScan domain behavior. It is independent of M23
and does not begin M24 protected replay work.

## Candidate ready requirements

- The committed B01 specification, plan, card, catalog, ownership, state,
  decision, and human-action records precede any RED test or rename.
- All declared M01/M04 dependencies remain accepted, and no active card owns
  the exact five source paths or six test paths.
- The source scope is limited to the canonical filename mapping, matching test
  URLs, current code-styled module-path literals in exactly sixteen existing
  M04 records, and a new static compatibility test; no exported identifier,
  function body, validator, schema, index, package, lockfile, configuration,
  generated API, public function, route, or product behavior changes.
- A pre-GREEN tracked-code scan establishes no consumer of the legacy internal
  module address, and a 100%-rename audit establishes source bodies remain
  unchanged. The Human Ops diagnostic records the lack of prior publication.
- Human Ops, not an agent, performs the separately recorded publish check after
  local code acceptance.

## Validation

- A test-only RED contract observes the absent canonical module paths before
  any rename; GREEN proves required Convex-safe filenames, absence of the
  legacy names, unchanged exports, and no stale bounded Markdown pathname
  without freezing future safe modules.
- A 100%-rename diff audit proves the five source moves have no source hunks;
  the direct test URLs and exactly sixteen bounded M04 path literals are the
  only non-new-file updates.
- Backend/root typecheck, test, lint, clean-install dry run, queue/reference/
  whitespace checks, enabled local guard, and independent task review pass.
- Human Ops records the redacted development-only publish result separately;
  it is not substituted by a local test result.

## Inbox transition

Recorded at 2026-09-07T08:14:37Z from a human-reported local-development
diagnostic: the existing function filenames violate the tooling filename rule
before a function can be published. This inbox state authorizes only committed
local authority and independent design review. It authorizes neither RED/code,
configuration access, deployment, external-store proof, payment, settlement,
ATS, funding, wallet, account, signer, transaction, clearing, HCS, payout, or
live behavior.
