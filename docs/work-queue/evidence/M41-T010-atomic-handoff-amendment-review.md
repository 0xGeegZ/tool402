# M41-T010 atomic handoff amendment review

## Finding

The original M41 design admitted an `ATS_CREATE` command through M32 and then
called M40 `markAssetPending(offeringId, attemptId)` in a second Convex
mutation. The M32 result carries only `attemptId`; its payload carries only
`subjectPublicId`, which is correlation vocabulary rather than an offering
document identity. The HTTP action cannot safely derive that ID.

More importantly, the two mutations cannot be atomic. A failed second mutation
would leave a durable `PREPARED` attempt while its offering remained `DRAFT`.
A command replay cannot safely repair the state: a command replay has no
attempt ID, and a fresh idempotency replay must not implicitly bind an orphaned
attempt.

## Scoped correction

The correction introduces no human or live boundary. It adds only a local M32
internal `admitAtsCreateAndMarkAssetPending` mutation and an M40
non-registered helper. Both consume the existing serialized M32 command; no
browser-supplied offering ID or new signed field is added.

Within one transaction, a fresh ATS_CREATE command:

```text
rebinds and revalidates under M32
→ inserts its PREPARED attempt
→ resolves exactly one safe DRAFT M40 offering by
  (subjectPublicId, canonicalSignerAddress, principalPublicId,
   authorityVersion, state)
→ patches ASSET_PENDING with the exact attempt ID
→ inserts its NEW replay claim
```

The M40 lookup is an additive `by_ats_create_draft_binding` index. Any unsafe,
missing, duplicate, linked, or cross-context offering rolls back the full
transaction. Exact idempotency replay requires the existing attempt to be
linked through `by_ats_attempt_id` to exactly one matching `ASSET_PENDING`
offering; otherwise it fails closed as `IDEMPOTENCY_CONFLICT`.

The generic M32 internal mutation rejects `ATS_CREATE`. It remains unchanged
for every other operation kind; M41 selects the atomic mutation only for the
ATS_CREATE operation. `markAssetPending(offeringId, attemptId)` remains intact
but is no longer reachable from M41.

## Review verdict

CLEAR — the correction is smaller and safer than a resolver in the HTTP action
or a second post-admission mutation. It changes no target, parameter, authority,
configuration, wallet, provider, SDK, transaction, deployment, or live
behavior. It authorizes only focused M32/M40/M41 RED tests proving rollback,
ambiguous/no match, cross-context rejection, generic ATS_CREATE rejection,
linked replay, and no M41 dispatch-side offering transition. Production source
remains prohibited until a separate RED review accepts the exact failures.
