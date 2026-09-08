# M36-T010 — ATS live-authority intake

## State

- Tier: CORE_P0
- Queue state: 60-done
- Dependencies: M32-T010 accepted; M33-T010 accepted; M35-T010 accepted
- Owner: This is a root-owned control record. It owns only this card, the
  secret-free recommended and completed decision packets, the independent
  review, HUMAN-ACTIONS.md, queue state, catalog, ownership, decisions,
  commits, and pushes. It owns no source, package, configuration, provider,
  wallet, account, SDK, transaction, or deployment path.
- Human action: HA-ATS-LIVE-AUTHORITY-001 is accepted only for a source-only
  Stage A integrity projection. It does not authorize an enabled M33 record,
  M32 change, authority provisioning, SDK use, provider or wallet action, or
  any Stage B/live behavior.

## Scope

This intake requested a complete secret-free Stage A human decision for exactly
one source-only, real-issuer ATS_CREATE authority binding. It deliberately
separates that reviewable mapping from a later Human Ops-only provisioning and
one-shot execution GO.

The historical recommended decision packet is at
[HA-ATS-LIVE-AUTHORITY-001](../../evidence/HA-ATS-LIVE-AUTHORITY-001-recommended-decision.md).
The completed Stage A decision is at
[HA-ATS-LIVE-AUTHORITY-001 decision](../../evidence/HA-ATS-LIVE-AUTHORITY-001-decision.md).
The independent authority review is at
[M36-T010 authority review](../../evidence/M36-T010-authority-review.md).

## Closure criteria

- The human supplied one canonical testnet issuer, exact principal, authority
  version, ownership array, and re-adopted every immutable configuration
  parameter. No credential or wallet material enters the repository.
- The root and independent reviewer recomputed the full new JCS/Keccak
  preimage and canonical parameters hash after the real issuer replaced the
  synthetic M35 owner. M35's hash was not reused.
- The review confirmed the exact source-only boundary, signer/owner enforcement
  gap, absence of dynamic operation selection, and that M32 has no provisioning
  path.

## Acceptance

Accepted at 2026-09-08T12:44:52Z after the completed secret-free Stage A
decision and an independent authority review. The approved issuer is canonical
and equal to `diamondOwnerAccount`; the independently recomputed digest is
`d4eccfb1dbb76c77bf8395aa91377252e6f1a76f3926ec1632eeab909e667250`.
M35's synthetic digest remains inapplicable.

M36-T010 closes without entering ready or active. It authorizes no code by
itself. After a fresh root rescan, only a separately specified and reviewed
private source-only integrity-projection card may begin its own specification,
RED, GREEN, and review cycle. That successor must leave M33 zero-enabled, M32
and Convex schema unchanged, and create no authority record. A separately
reviewed runtime amendment and a distinct Stage B Human Ops GO remain required
before any provisioned or executable ATS behavior.
