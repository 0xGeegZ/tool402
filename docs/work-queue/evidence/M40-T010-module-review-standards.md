# M40-T010 durable Directory module review

## Scope

Fresh independent standards and boundary review at clean pushed
`9f45f35a2dd43a80dd8e727be04ea3136e0c5cfa` of:

- `packages/backend/convex/directory_versions.ts`;
- `packages/backend/tests/directory-version-writer.test.mjs`; and
- their interaction with the M40 command-binding helper and specification.

## Review

- The Directory mutation preserves the order: command rebinding, current
  authority, replay-claim lookup, offering/ownership lookup, then bounded
  target-version resolution.
- A singular malformed, non-active, drifted, or otherwise unsafe target
  consumes only an unlinked conflict claim. Duplicate or descriptor-hostile
  rows fail closed with no write.
- An exact fresh-nonce replay remains linked and patch-free only for the exact
  ACTIVE Directory record and its linked OPEN offering. A NEW admission still
  requires a safe READY offering, atomically creates one ACTIVE record,
  supersedes the prior active record, and opens the offering.
- `getActive` remains a sanitized, read-only projection. The final offering
  replay-integrity correction is compatible with these Directory semantics;
  no I/O, provider, SDK, wallet, environment, or live capability appears.

## Verification

Under Node 22.21.1, focused Directory and offering checks passed 33/33,
complete Backend tests passed 202/202, and Backend typecheck, queue
validation, and whitespace checks passed with a clean working tree.

## Verdict

CLEAR — no Critical, Important, or Minor finding. This is the second required
fresh M40 module-review generation.
