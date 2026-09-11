# HI-011 — ATS prepared-attempt human gate

## Purpose

Human intake card. M49 supplies a locally accepted one-shot Factory transaction
bridge, but that bridge can run only after a durable ATS_CREATE attempt exists.
Creating that attempt requires a temporary issuer authority record and two
human-generated EIP-712 signatures. This card separates that no-transaction
preparation from the later one-shot transaction decision, so neither decision
creates its own execution precondition.

## State

- Tier: intake
- Queue state: 00-inbox
- Dependencies: M47-T010 accepted, M48-T010 accepted, M49-T010 accepted, and
  S21-T010 accepted
- Raised by: root reconciliation, 2026-09-11
- Owner: root integrator owns this card, its decision row, the two pending
  human-action rows, State, catalog, ownership, reviews, commits, and pushes.
- Human action: HA-ATS-PREPARED-ATTEMPT-001 is pending. Human Ops alone may
  perform it only after an explicit accepted decision is recorded.

## Requested sequence

1. Present the draft
   [prepared-attempt decision packet](../../evidence/HA-ATS-PREPARED-ATTEMPT-001-recommended-decision.md)
   for an explicit human decision. It permits only the named temporary
   authority record, one offering.create signature, and one external.prepare
   signature; it forbids a transaction, Factory calldata, Mirror read,
   candidate attachment, verification, lifecycle, funding, deployment, and
   retry.
2. If the human accepts and Human Ops returns the required redacted evidence,
   root independently reviews the exact durable PREPARED attempt and linked
   ASSET_PENDING offering fact. ACCEPTED is the relay outcome; PREPARED is the
   durable attempt state. Neither term substitutes for the other.
3. Only after that review may root fill and present the downstream
   [Stage-B decision packet](../../evidence/HA-ATS-STAGE-B-001-recommended-decision-v3.md),
   binding the stage-2 generated idempotencyKey corroborated as the durable
   attemptPublicId and preserving the same browser
   session. A separate explicit human decision remains required before the
   one MetaMask transaction.

## Control constraints

- The current command-authority record has no command-type allowlist or TTL.
  The human packet therefore makes its one record temporary, exact, manually
  bounded to 30 minutes, and terminally revocable.
- The accepted M42 digest, target, issuer, M47 projection, M48 mapping, and
  M49 code remain unchanged. This card creates no source, schema, package,
  environment, deployment, or provider authority.
- The later Stage-B candidate attachment is governed prospectively by
  D-M49-010-002. It may be separately clicked only after the candidate is
  fully corroborated; M43 positive verification and all lifecycle work remain
  separate.

## Completion

This intake is complete only after root records a non-authorizing sequencing
decision, the draft packets, and the independent
[control review](../../evidence/HI-011-control-review.md). It does not accept
either human action, create an authority record, or authorize any external
action.
