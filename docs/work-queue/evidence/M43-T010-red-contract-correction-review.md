# M43-T010 RED contract correction review

## Observation

The initial independent M43 RED review found that the local contract combined
three incompatible assertions:

1. M33's compiled production manifest is an immutable empty list, so the
   current repository has no enabled ATS record.
2. The one permitted Mirror ContractResult read exposes a Hedera created-entity
   identifier but no documented created EVM-address field. The M43 fixture
   correctly rejects use of generic `address` as a substitute.
3. M41's accepted regression test still proves that the predeclared
   `external.attachCandidate` entry is disabled, while M43 already owns the
   future enablement of precisely that entry.

No source, schema, dispatch, configuration, SDK, wallet, provider,
transaction, deployment, or live action was performed while recording this
observation.

## Scoped correction

M43 is narrowed to the current fail-closed boundary:

- every ATS_* verification action returns `NOT_CONFIGURED` before any Mirror
  request or its outcome mutation write;
- only non-ATS receipt contexts can make the one bounded ContractResult read
  and record a terminal outcome;
- M43 never calls M40's `markAssetReady` seam;
- the pure verifier rejects an ATS_CREATE expectation carrying a candidate EVM
  address rather than inferring a mapping from a Hedera entity ID or another
  response field;
- a future post-Stage-B card, not M43, must explicitly authorize any second
  fixed metadata observation and its documented exact created-address field;
- the root authorizes only M41's disabled-entry assertion at
  `packages/backend/tests/command-dispatch.test.mjs` lines 851–866 for the
  test-only RED contract for the previously declared M43 dispatch enablement,
  with no public response-union expansion.

The closed mapping for that future test and entry is:

```text
ATTACHED                              -> ACCEPTED / payload.attemptPublicId
ALREADY_ATTACHED or COMMAND_REPLAYED  -> REPLAYED / payload.attemptPublicId
unknown result or thrown boundary     -> REJECTED
```

The durable internal attempt ID is never public.

## Verdict

CLEAR for this documentation and test-only RED reservation only. A fresh
independent RED review must still accept the corrected failure contract before
any M43 schema, source, or dispatch change is allowed.
