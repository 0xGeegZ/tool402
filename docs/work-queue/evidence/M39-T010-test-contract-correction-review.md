# M39-T010 test-contract correction review

## Scope

Fresh independent read-only review of the active M39 card, its local
specification, and its durable focused test contract after the first minimal
GREEN iteration.

## Findings

The focused test contained two internal contradictions that no conforming
normalizer source can resolve:

1. `claimedBytesFactory` called an undeclared lexical `claimRawBody` helper,
   so the invalid-UTF-8 shared vector threw before either M39 or the unchanged
   M30 normalizer ran. The narrow repair extracts the already-present claimed
   byte construction from `claimText` into `claimRawBody` and makes `claimText`
   delegate to it. This preserves the malformed-byte vector rather than
   weakening it.
2. The M38-member own-key assertion omitted `issuedAt`, although the M39
   specification requires `issuedAt` for every normalized DTO and other
   focused assertions require the same field. The narrow repair adds only
   `issuedAt` to that expected own-key set.

## Ruling

The test-only repairs restore the existing specification and vector intent;
they add no behavior, vocabulary, capability, or authority. The minimal M39
GREEN scope is therefore the declared normalizer source plus exactly these two
test-contract repairs in
`packages/backend/tests/authenticated-wallet-command-normalizer.test.mjs`.
All existing external, durable, wallet, provider, ATS, transaction,
deployment, and live-action exclusions remain unchanged.
