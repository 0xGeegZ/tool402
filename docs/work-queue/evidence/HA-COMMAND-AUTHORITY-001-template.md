# HA-COMMAND-AUTHORITY-001 — Human decision template

> **Status: TEMPLATE ONLY — not an approval, implementation authority, or
> evidence of a verified command.** A human must supply a separate completed,
> secret-free decision packet before M27 may be superseded or any successor
> card may be created.

## How to use this template

Replace every `[HUMAN DECISION REQUIRED]` field with one concrete value or
rule. A blank field, `TBD`, reference to an unstated default, or a choice to
be decided later makes the packet incomplete. The completed packet must not
contain credentials, keys, seed phrases, signed payloads, account setup,
funding details, transaction data, or deployment instructions.

This template records no runtime configuration and authorizes no signing,
wallet/provider call, storage action, payment, transaction, ATS operation,
deployment, or other external action.

## Required decision packet

### 1. Command vocabulary and canonical signing serialization

- Command type: `[HUMAN DECISION REQUIRED]`
- Command version: `[HUMAN DECISION REQUIRED]`
- Complete signed field vocabulary: `[HUMAN DECISION REQUIRED]`
- Canonical field order and normalization rules: `[HUMAN DECISION REQUIRED]`
- Exact byte encoding before verification: `[HUMAN DECISION REQUIRED]`
- Reject conditions for unknown fields, duplicate fields, or non-canonical
  input: `[HUMAN DECISION REQUIRED]`

### 2. Permitted wallet/provider and verifier implementation

- Permitted wallet/provider boundary or explicit allowlist:
  `[HUMAN DECISION REQUIRED]`
- Permitted verifier implementation(s), including any approved version or
  selector constraints: `[HUMAN DECISION REQUIRED]`
- Accepted signature envelope and algorithm identifiers:
  `[HUMAN DECISION REQUIRED]`
- Failure behavior for an unavailable, unsupported, or mismatched boundary:
  `[HUMAN DECISION REQUIRED]`

### 3. Fixed chain and signer-recovery rules

- Fixed chain/network identity: `[HUMAN DECISION REQUIRED]`
- Canonical signer-address/account representation: `[HUMAN DECISION REQUIRED]`
- Recovery procedure and accepted recovery result: `[HUMAN DECISION REQUIRED]`
- Rejection behavior for cross-chain, malformed, ambiguous, or unrecoverable
  inputs: `[HUMAN DECISION REQUIRED]`

### 4. Trusted signer-to-principal, role, and ownership authority

- Authoritative signer-to-principal record/source: `[HUMAN DECISION REQUIRED]`
- Required principal role and ownership predicate: `[HUMAN DECISION REQUIRED]`
- Freshness/version rule for that source: `[HUMAN DECISION REQUIRED]`
- Rejection behavior for absent, stale, conflicting, or unauthorized mappings:
  `[HUMAN DECISION REQUIRED]`

### 5. Command nonce and expiry

- Nonce issuer, namespace, and canonical representation:
  `[HUMAN DECISION REQUIRED]`
- Expiry clock/source and exact validity rule: `[HUMAN DECISION REQUIRED]`
- Rejection behavior for missing, malformed, expired, or future-skewed values:
  `[HUMAN DECISION REQUIRED]`

### 6. Durable replay and idempotency handoff

- Exact replay identity and idempotency key derivation:
  `[HUMAN DECISION REQUIRED]`
- Durable claim/store boundary and atomic claim outcome contract:
  `[HUMAN DECISION REQUIRED]`
- Behavior for duplicate, in-progress, completed, failed, expired, and
  indeterminate outcomes: `[HUMAN DECISION REQUIRED]`
- Retry/crash-recovery rule: `[HUMAN DECISION REQUIRED]`

### 7. Link to the accepted detached payload boundary

- Exact command field(s) binding the command to the detached payload:
  `[HUMAN DECISION REQUIRED]`
- Equality/canonicalization rule for that binding: `[HUMAN DECISION REQUIRED]`
- Rejection behavior for absent, mismatched, or replayed payload linkage:
  `[HUMAN DECISION REQUIRED]`

## Explicit human declaration

- Decision owner (non-secret identifier): `[HUMAN DECISION REQUIRED]`
- Decision timestamp: `[HUMAN DECISION REQUIRED]`
- Declaration: `[HUMAN DECISION REQUIRED: I approve every concrete rule above
  and reject all implicit defaults.]`

## Root intake checklist

The root may create a successor card only after confirming all seven sections
are concrete, mutually consistent, secret-free, and explicitly fail closed.
The resulting local card must still define its own minimum contract, owned
paths, negative tests, dependency mapping, and independent-review plan.
