# M51 provider durable campaign resume

## Outcome

After a reload, the Provider deploy UI can read and render its one existing
durable `ASSET_PENDING` RiskScan offering and linked `PREPARED` ATS_CREATE
attempt for the same connected issuer. It is a read-only recovery surface.

## Trust boundary

```text
Convex offering + linked attempt
  -> server-side structural revalidation
  -> existing bounded public offering endpoint
  -> browser validates the returned public projection against connected issuer
  -> resume Stage 1 and Stage 2 display facts
```

The browser does not derive a resume state from query parameters, storage,
wallet event payloads, or blockchain reads. `atsAttemptPublicId` is a durable
operation reference, not a secret or a signature. It is exposed only after the
server validates the linked attempt's exact type, network, state, and identity
context.

## Invariants

- Only `ASSET_PENDING` may return `atsAttemptPublicId`; `DRAFT`, `READY`,
  `OPEN`, and `CLOSED` never do.
- The linked attempt must be one canonical `PREPARED` `ATS_CREATE` on chain
  296 / `hedera:testnet`, with the same subject, canonical signer, principal,
  and authority version as the offering.
- The browser resumes only the fixed `riskscan_revenue_note_demo` subject and
  only when the canonical stored signer equals the active wallet address.
- The idempotency reference is canonical base64url and is passed only to the
  existing later detached-signature construction; M51 never signs it.
- Every unavailable, malformed, inconsistent, stale, or changed-wallet read
  preserves the unresumed UI. No timer, storage, or automatic retry exists.
- M51 performs no authoritative mutation. Stage B stays unavailable unless
  separately authorized by `HA-ATS-STAGE-B-001`.

## Acceptance

- A valid fake Convex pending row plus matching prepared attempt produces a
  projection with exactly one optional attempt reference.
- Invalid/missing link, non-PREPARED state, foreign signer/principal/version,
  or invalid idempotency reference rejects the projection rather than exposing
  a reference.
- Browser contracts prove the endpoint is read only after a current wallet
  session, proves exact subject/signer/state/ref matching, and has no direct
  Convex, storage, wallet/provider request, signature, relay, transaction, or
  automatic retry.
