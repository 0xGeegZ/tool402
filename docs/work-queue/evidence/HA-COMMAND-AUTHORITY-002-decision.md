# HA-COMMAND-AUTHORITY-002 — Recorded human decision

## Status and scope

**ACCEPTED — bounded local command-authority amendment.**

- Decision owner: `0xGeegZ`
- Root receipt timestamp: `2026-09-09T05:26:04Z`
- Accepted source: [recommended decision](HA-COMMAND-AUTHORITY-002-recommended-decision.md)

The human accepted the recommended decision verbatim. It extends the local
authenticated-normalization boundary from `external.prepare` to the closed
four-member vocabulary:

```text
external.prepare
offering.create
directory.publish
external.attachCandidate
```

The fixed typed-data domain, command grammar, signature, signer recovery,
payload-hash, clock-window, replay, and fail-closed rules of
[HA-COMMAND-AUTHORITY-001](HA-COMMAND-AUTHORITY-001-decision.md) remain
unchanged. The accepted per-type payload, authority, and deferred-ownership
rules are exactly those in the accepted source above; no implicit subject is
introduced for `directory.publish` or `external.attachCandidate`.

## Recorded human declaration

> I accept HA-COMMAND-AUTHORITY-002 exactly as recorded in
> `docs/work-queue/evidence/HA-COMMAND-AUTHORITY-002-recommended-decision.md`.
> I approve only its local normalization/signature-verification extension; all
> stated non-authorizations remain in force.

## Explicit boundary

This acceptance authorizes only M39's independent readiness review. Its
separate queue transition, activation, test-only RED, and
signature-normalization source work remain subject to their normal local
reviews. It authorizes no authority record, wallet, credential, signing,
provider, SDK, environment, durable admission, offering, directory version,
attempt, ATS action, funding, payment, transaction, publication, deployment,
or live behavior.
