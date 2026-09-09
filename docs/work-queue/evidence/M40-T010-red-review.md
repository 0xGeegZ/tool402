# M40-T010 RED contract review

## Scope

Independent review of the three durable RED contracts against the committed
[M40 card](../queue/20-active/M40-T010-offering-directory-durable-admission.md),
the local [M40 specification](../../specs/m40-offering-directory-durable-admission.md),
and the two scoped control amendments.

The reviewed files are:

- `packages/backend/tests/offering-durable-schema.test.mjs`;
- `packages/backend/tests/offering-command-admission.test.mjs`; and
- `packages/backend/tests/directory-version-writer.test.mjs`.

## Verification

At clean committed control HEAD `e646e2e605d7`, under Node 22.21.1:

- the focused command ran 33 tests and failed exactly three times: the two
  declared absent M40 modules and the absent additive M40 schema tables;
  the remaining 30 source-dependent checks skipped with no incidental
  failure;
- syntax checks passed for all three RED files;
- accepted M04/M32 schema, admission, and recovery regression suites passed
  30/30;
- `npm run queue:check`, whitespace, and the local-reference guard passed.

The review confirms parser-first rejection of matching-hash malformed raw M38
payloads, including a Directory record/offering cross-field mismatch before
any durable access; exact closed Convex validators and returns for all six
M40 functions; bounded current-authority/replay/idempotency checks; and the
safe transition, attempt-link, canonical-address, and projection contracts.

For Directory, `NEW` remains `READY`-only. A fresh-nonce idempotency replay
requires the exact stored `ACTIVE` directory version, exactly one active
record for the slug, and the exact linked `OPEN` offering with canonical
asset provenance. Unsafe or conflicting stored rows write nothing except the
specified unlinked conflict replay claim where the contract permits it.

## Verdict

CLEAR — 0 Critical, 0 Important, and 0 Minor findings.

Only the M40 root-reserved additive schema amendment,
`packages/backend/convex/offerings.ts`,
`packages/backend/convex/directory_versions.ts`, and
`packages/backend/src/offering-command-admission.ts` are authorized for
minimal local GREEN. No wallet, provider, SDK, configuration, network,
transaction, deployment, publication, or live authority is added.
