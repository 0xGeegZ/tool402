# M40-T010 RED contract amendment review

## Scope

At clean baseline `ca5e8d3`, an independent RED review blocked M40 source
authorization. This record resolves only the local specification and durable
RED contract. It does not authorize `schema.ts`, any Convex source, an ATS SDK,
a wallet, a provider, a transaction, publication, or live action.

## Findings

The original tests named `markAssetPending` and `markAssetReady` without
executing their state guards or proving their closed Convex interfaces. The
original ready seam also accepted an offering ID although the future M43 action
has only an attempt ID, and the offering schema had no bounded attempt lookup.
The rebinding vectors did not independently pair malformed M38 payloads with
matching raw JCS hashes, and the fake database cloned hostile stored rows before
the implementation could reject them.

## Local ruling

- M40 adds only `offerings.by_ats_attempt_id` and retains all accepted tables,
  fields, and indexes unchanged.
- `markAssetPending(offeringId, attemptId)` validates the exact `DRAFT`
  offering and matching `PREPARED` `ATS_CREATE` attempt before its one local
  patch.
- `markAssetReady(attemptId, atsAssetEvmAddress)` resolves exactly one pending
  offering from the stored attempt ID; it accepts no caller-selected offering.
  Its address is canonical lowercase and may be supplied by M43 only after the
  M43 pure verifier has bound its stored candidate to the created address.
- The revised RED tests must cover exact args/returns, state/link invariants,
  parser-first hash rebinding, durable-time and replay boundaries, and unsafe or
  duplicate stored rows with no write on rejection.

## Authorization effect

Only the three already-authorized M40 RED test files may be corrected. A fresh
independent RED review must be clear before any M40 schema or source file is
created or changed.
