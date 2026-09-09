# HI-003 — Decision packet acceptance intake

## Purpose

Human intake card. The human operator (repository owner) has accepted the
three recommended decision packets that every remaining source card waits on.
This card records that acceptance so the root can record the decision rows,
update the human-action rows, and resume the dependency-correct cards. It
accepts no product behavior and authorizes no external action.

## State

- Tier: intake
- Queue state: 60-done
- Dependencies: none
- Raised by: human operator, 2026-09-09
- Owner: root integrator on intake. Each acceptance is human-owned and
  root-recorded; the root owns every decision, human-action, and queue record
  it creates from this card.
- Human actions: the three acceptances below are complete. Every other
  pending human-action row is untouched and stays separately human-owned.

## Human acceptance

At `2026-09-09T02:23:41Z` the human operator confirmed, through the
operator's delegated session and with each packet presented with its
replaced values and digests, acceptance of the following packets exactly as
written. Nothing is inferred beyond the packets' own text.

- [HA-COMMAND-AUTHORITY-002 recommended decision](../../evidence/HA-COMMAND-AUTHORITY-002-recommended-decision.md):
  the closed `offering.create`, `directory.publish`, and
  `external.attachCandidate` command extension under the accepted EIP-712
  domain, retaining the fixed signer, payload-hash, role, ownership, replay,
  and fail-closed rules and the deferred subject-ownership references.
- [HA-ATS-RETARGET-001 recommended decision](../../evidence/HA-ATS-RETARGET-001-recommended-decision.md):
  registry revision `ats_sdk_8_0_0_testnet_v2`, expected target
  `0xd1f118a40f3b02883d35909ef2517e7edd78379d`, factory `0.0.9213391`,
  resolver `0.0.9212226` (`0xba2d5fc2083a0b8f164c50e65d782087fba18e0a`),
  the synthetic-issuer digest
  `39a4d53db2aa60dd40b50c97738f53a888fdadcb350e1e85984fbd4dd76abc9a`, and the
  real-issuer digest
  `1880065c5ae64b3fc6279cfdd8c85a6880d43e98ce129ed697c72372204296f9`, local
  and disabled until a later Stage B decision.
- [HA-ATS-RUNTIME-BINDING-001 recommended decision](../../evidence/HA-ATS-RUNTIME-BINDING-001-recommended-decision.md):
  the operator authorizes the local ATS check that rejects an `ATS_CREATE`
  command unless its M32 already-normalized canonical signer exactly matches
  the configured ATS owner address, with the manifest remaining disabled and
  no wallet, Hedera call, asset creation, transaction, deployment, or
  publication authorized.

## Requested root records

1. One decision row per packet, each naming the packet file, recording the
   acceptance as bounded local authority with the packet's own exclusions,
   and for HA-ATS-RETARGET-001 recorded only after the root has independently
   recomputed both digests as the packet requires.
2. The three human-action rows marked accepted with the same bounds, leaving
   HA-ISSUER-ACCOUNT-001, HA-CAMPAIGN-CONVEX-001, HA-ATS-STAGE-B-001, and
   HA-B03-AGENT-PAYMENT-001 pending and unchanged.
3. The dependency-correct successors evaluated in batch order: M39-T010 and
   M42-T010 for their own ready reviews, M40-T010 and M43-T010 after their
   predecessors, S16-T010 once M42-T010 supplies its frozen configuration
   literal, and the local ATS runtime-binding amendment the root proposed as
   its own small card.

## Explicit non-authorizations

This card authorizes no wallet, key, signature, account, funding,
provisioning, environment access, SDK use, transaction, asset creation,
deployment, publication, or live action. Every executable ATS step and every
live relay remains gated by its own pending human-action row.

## Resolution

The root recorded the three bounded human decisions and reviewed the resulting
control records. `HA-COMMAND-AUTHORITY-002` and `HA-ATS-RETARGET-001` remain
local-only readiness authority; `HA-ATS-RUNTIME-BINDING-001` permits only a
future separately scoped local safety amendment while the manifest stays
disabled. No card moved to ready, no RED contract was created, and no source or
external capability is authorized by this intake closure.
