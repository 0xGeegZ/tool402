# M36-T010 — ATS live-authority intake

## State

- Tier: CORE_P0
- Queue state: 00-inbox
- Dependencies: M32-T010 accepted; M33-T010 accepted; M35-T010 accepted
- Owner: This is a root-owned control record. It owns only this card, the
  secret-free recommended decision packet, HUMAN-ACTIONS.md, queue state,
  catalog, ownership, decisions, commits, and pushes. It owns no source,
  package, configuration, provider, wallet, account, SDK, transaction, or
  deployment path.
- Human action: HA-ATS-LIVE-AUTHORITY-001 is recorded and pending independent
  review. The accepted M35 synthetic issuer and hash are non-executable and
  cannot be upgraded by substitution.

## Scope

This intake requests a complete secret-free Stage A human decision for exactly
one source-only, real-issuer ATS_CREATE authority binding. It deliberately
separates that reviewable mapping from a later Human Ops-only provisioning and
one-shot execution GO.

The historical recommended decision packet is at
[HA-ATS-LIVE-AUTHORITY-001](../../evidence/HA-ATS-LIVE-AUTHORITY-001-recommended-decision.md).
The completed Stage A decision is at
[HA-ATS-LIVE-AUTHORITY-001 decision](../../evidence/HA-ATS-LIVE-AUTHORITY-001-decision.md).

## Candidate requirements

- The human supplied one canonical testnet issuer, exact principal, authority
  version, ownership array, and re-adopted every immutable configuration
  parameter. No credential or wallet material enters the repository.
- The root independently recomputed the full new JCS/Keccak preimage and
  canonical parameters hash after the real issuer replaced the synthetic M35
  owner. It did not reuse M35's hash.
- An independent authority review confirms the exact source-only boundary,
  signer/owner enforcement gap, absence of dynamic operation selection, and
  that M32 has no provisioning path before this control record can be closed.

## Explicit exclusions

This intake authorizes no RED/code, M33 enablement, M32 mutation, durable
state, publication, SDK import/init/constructor/call, provider/wallet action,
authority provisioning, account action, funding, payment, transaction, asset,
holder/compliance action, clearing, HCS, payout, deployment, or live evidence.

No implementation successor may move to ready or active until this packet is
completed, independently reviewed, and accepted.
