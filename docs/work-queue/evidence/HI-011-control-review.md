# HI-011 control review

## Scope

Review the root-only control-plane correction that separates the ATS
no-transaction preparation gate from the later one-shot transaction gate.
This review covers only documents added or amended by HI-011. It reviews no
runtime code and authorizes no human or external action.

## Independent results

- Authority/security review: CLEAR. The prepared-attempt draft permits only
  the time-bounded authority record and two signatures; the downstream draft
  cannot recreate that prerequisite. The M42 tuple, 30-minute revocation rule,
  ACCEPTED-versus-PREPARED distinction, session limitation, one-send cap, and
  M43/lifecycle exclusions are explicit.
- Queue/reference review: CLEAR. All local Markdown references resolve;
  historical decisions remain evidence while the prospective override is
  narrow; no source, package, runtime, or live-action scope is added.
- Identifier correction: CLEAR. The relay reports an outcome only. The
  stage-2 generated idempotencyKey is independently corroborated as the
  durable attemptPublicId; no document claims that the relay returns it.

## Local verification

~~~text
git diff --check
npm run queue:check
Result: PASS (QUEUE_CHECK_OK)
~~~

## Ruling

Record D-HA-ATS-PREPARED-ATTEMPT-001-001 and keep both human-action rows
PENDING. The next permitted operation is presentation of the first draft to
the human; no agent may provision an authority, request a signature, send a
transaction, observe Mirror, or attach a candidate.
