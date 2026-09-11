# S41-T010 — Sandbox issuer onboarding

## State

- Tier: CORE_P0
- Queue state: 00-inbox
- Dependencies: none. S40-T010 acceptance is an activation gate, not a
  dependency of this speculative inbox intake while S40 remains active.
- Owner: root owns the card, specification, design, UI record, plan, queue
  records, and integration. No source/test path is active.
- Human actions: release configuration for the private Next-to-Convex ingress,
  real wallet account/signature, and any production browser proof remain
  human-owned.

## Scope

After S40 has verified a `personal_sign` proof, provision exactly one
deterministic sandbox `ISSUER` authority for that wallet. It is restricted to
`offering.create` for an isolated personal subject and may create a durable
`DRAFT` via `/provider/deploy`. It cannot act on the shared ATS subject or
perform any on-chain, ATS, attachment, or directory-publish operation.

The minimum local specification is
`docs/specs/s41-sandbox-issuer-onboarding.md`; the architectural decisions are in
`docs/superpowers/specs/2026-09-11-sandbox-issuer-onboarding-design.md`.
S41 must not advance to readiness or activation until S40-T010 is accepted.

## Candidate source and test boundary

Only a future readiness/activation/RED cycle may reserve the exact Core
closed-path ingress envelope and tests, Backend expected-path verifier and
tests, capability-aware schema/normalizer/admission seams, provisioning
mutation/HTTP route, Next server provisioning helper/HMAC relay, the existing
S40 verify-route boundary, and the provider deploy route/bridge/signing state
necessary to carry a server-derived sandbox subject. It must also reserve
focused Core/Backend/Web contracts.

It may not reserve ATS configuration or Stage-B sources, the static shared
authority, an open authority-management API, wallet session implementation,
wallet header, payments, contracts, SDKs, transaction code, package files, or
lockfiles.

## Acceptance requirements

Independent readiness, test-only RED activation, RED acceptance, focused
Core/Backend/Web contracts, full quality checks, and independent task/
specification/standards reviews are required before source acceptance. Browser
proof is limited to a human-authorized wallet creating a `DRAFT`; it is not
evidence of an asset or transaction.
