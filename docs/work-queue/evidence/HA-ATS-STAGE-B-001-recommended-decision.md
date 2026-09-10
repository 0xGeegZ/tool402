# HA-ATS-STAGE-B-001 — Recommended decision packet (draft)

## Status and scope

**DRAFT — not yet requested.** This packet is prepared ahead of time so the
Stage B GO can be issued without delay once its predecessors are accepted. It
becomes a request only when a later human intake card cites it, and authority
only when the human operator accepts it and the root records that acceptance
as a decision row and the updated human-action row.

- Prepared: 2026-09-09 by the human operator's delegated session.
- Decision owner on acceptance: human operator (repository owner).
- Preconditions before this packet may be requested: M41-T010, M43-T010,
  M44-T020, M47-T010, and S21-T010 accepted; `HA-PUBLIC-DEPLOY-001` recorded,
  or an explicitly named local host for the rehearsal.

## What Stage B authorizes, exactly

1. **Issuer authority row.** The human operator provisions, through their own
   Convex access and outside tracked files, one `commandAuthorities` row with
   role `ISSUER` for the approved issuer `0xc89f87052c3e080b4a9b021d4930055031ef378e`
   at the authority version the accepted normalizer expects. No agent reads or
   writes that row.
2. **Enabled M33 mapping.** One enabled `ATS_CREATE` record bound to the
   retargeted configuration accepted in `HA-ATS-RETARGET-001`: registry
   revision `ats_sdk_8_0_0_testnet_v2`, factory `0.0.9213391`
   (`0xd1f118a40f3b02883d35909ef2517e7edd78379d`), resolver `0.0.9212226`,
   subject `riskscan_revenue_note_demo`, offering version `ats_demo_v1`, and
   the real-issuer canonical parameters hash
   `1880065c5ae64b3fc6279cfdd8c85a6880d43e98ce129ed697c72372204296f9`. The
   record is supplied as a reviewed source revision of the private manifest
   under a root-owned card, not as runtime configuration.
3. **One bounded Factory `deployBond`.** The provider signs stages 1 and 2 in
   the deploy wizard, then executes exactly one Factory `deployBond` call from
   MetaMask on Hedera Testnet through M44-T020's direct Factory artifact +
   viem seam, with the revenue-note parameters transcribed in the accepted M42
   projection. Transaction cap: one Factory `deployBond`, one `ATS_CONTROL_LIST`, and one
   declared lifecycle operation, each attempted at most once. Total HBAR
   spend cap for the rehearsal, fees included: 50 HBAR from the issuer
   account `0.0.10430887`.
4. **Receipt attachment and verification.** The candidate is attached through
   the signed `external.attachCandidate` command, and the M43 verification
   reads Mirror Node for finality. The offering becomes `READY` only from a
   `CONFIRMED` verification record.
5. **One lifecycle operation.** After `READY`, one `ATS_CONTROL_LIST` update
   (whitelist the issuer's own account) and one declared lifecycle operation,
   named here as `ATS_ISSUE` of the minimum unit to the issuer's own account,
   each through the same prepare, execute, attach, verify path.

## Stop conditions and no-retry handling

- Any `REJECTED`, `CONFLICT`, or `UNSUPPORTED_TYPE` from the relay stops the
  rehearsal at that stage. The operator records the outcome and requests a
  ruling before any further action.
- A Factory `deployBond` that MetaMask declines, that fails, or whose receipt
  cannot be found on Mirror Node within 10 minutes stops the rehearsal. No
  second Factory `deployBond` is attempted under this authority.
- An `unknown` relay outcome is treated as possibly recorded: the operator
  checks the provider status route and Mirror Node before anything else and
  never signs the same stage again with a fresh nonce until that check is
  recorded.
- A verification that lands anywhere but `CONFIRMED` leaves the offering in
  `ASSET_PENDING`. The rehearsal ends there as a truthful stopping point.

## Evidence the operator records

- The deployed commit, the host base URL (or the named local host), and the
  time window of the rehearsal.
- The Factory `deployBond` transaction id in mirror form, the resulting bond
  address, and the Mirror Node links for the transaction and the contract.
- The offering public id, its state transitions with timestamps as the
  provider status route reports them, and the directory version published.
- The control-list and lifecycle transaction ids with their Mirror Node links.
- A statement that no key, signed payload, or funded secret entered any
  tracked file, transcript, or chat.

## Cost if wrong

At most 50 HBAR of testnet funds and one afternoon. A failed or partial
rehearsal leaves truthful `ASSET_PENDING` or `unknown` states that the demo
can show as such; nothing false is recorded because no state advances without
a verified record.
