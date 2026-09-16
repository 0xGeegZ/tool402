# M59-T010 — Public testnet self-service onboarding

## State

- Tier: CORE_P0
- Queue state: 20-active
- Owner: root owns this card, specification, plan, control records, integration,
  review, commits, and draft PR.
- Dependencies: none. M55-T010 and M58-T010 are active compatibility
  constraints; their path reservations are not silently transferred.
- Human actions: enabling public access, configuration, deployment, migration,
  wallet signatures/transfers, and live testnet verification remain human-owned.

## Outcome

A previously unknown authenticated Testnet wallet can create and operate its
own supported provider tool and back another eligible OPEN offering without
manual authority insertion. The server-side public-testnet policy is disabled
by default and preserves all legacy RiskScan/privileged behavior.

The governing architecture is [the public self-service design](../../../superpowers/specs/2026-09-13-public-testnet-self-service-onboarding-design.md)
and its [implementation plan](../../../superpowers/plans/2026-09-13-public-testnet-self-service-onboarding.md).

## Current implementation discipline

Root has activated this PR-local implementation scope after focused RED/GREEN
contracts. Source changes remain serial unless ownership is disjoint. The
implementation covers membership provisioning, command and durable admission,
selected-tool ATS binding, generic backing projection, feature limits/revocation,
user flows, and A/B behavioral contracts. It may not alter B03/x402 behavior,
introduce mainnet, hold a user key, fund gas, automate a transaction, host
arbitrary user code, or fabricate live evidence. Independent final review and
controlled release acceptance remain pending.
