# HA-COMMAND-AUTHORITY-001 — Independent decision review

## Verdict

**ACCEPTED as bounded architecture authority.**

The initial packet was reviewed together with the human-approved amendments.
It is secret-free, rejects implicit defaults, and authorizes no live or
external action. The complete authority is recorded in the
[accepted decision](HA-COMMAND-AUTHORITY-001-decision.md).

No Critical or Important issue remains for either of these limited actions:

1. closing the M27 authority-intake record without moving it through ready or
   active; and
2. creating a normalization/signature-only successor with no durable attempt,
   `PREPARED` state, ATS/provider invocation, funding, wallet transaction, or
   other external behavior.

## Confirmed decisions

- The command and M26 detached-payload expiry must be strictly identical and
  satisfy the fixed server-clock window.
- Exact replay takes precedence over idempotency. A new nonce can retrieve a
  same-context existing attempt only at a later authorized durable boundary.
- Signature casing, allowed recovery forms and their normalization, canonical
  signer syntax, and wallet-provider selection/rejection behavior are fixed.
- ATS target, parameter-hash, and operation-to-target authority are expressly
  deferred; the immediate successor cannot create a durable attempt or infer
  them from signer or browser input.
- The successor must use the accepted M26 parser for its detached payload and
  only a claimed M25 body for raw transport bytes.

## Local implementation constraint

The current dependency graph provides the verifier only transitively. The
successor must add the human-approved verifier as an explicit direct,
exactly-pinned dependency and review the lockfile change; that is an
implementation precondition, not another human decision.
