# M48-T010 GREEN scope amendment

## Finding

Three accepted historical tests contain a contemporaneous assertion that M33's
production manifest is the frozen empty literal:

- `packages/backend/tests/stage-b-issuer-ats-create-authority.test.mjs`
- `packages/backend/tests/stage-a-real-issuer-ats-create-authority.test.mjs`
- `packages/backend/tests/ats-receipt-verification.test.mjs`

Those assertions were correct when M37, M42, and M43 were accepted, but they
conflict with the human-approved M48 successor, whose sole purpose is to add
one static local M33 mapping. Leaving any of them unchanged would make the
complete Backend suite require incompatible states.

## Narrow amendment

After independent M48 RED acceptance, M48 may amend only the three named tests
to retire their historical empty-manifest assertions. The M42 test amendment
must retain the M37 preservation, M42 real-issuer projection, frozen/detached
data, canonical preimage and digest, retarget, privacy, no-SDK-dependency, and
no-public-export assertions. In particular, it must keep the assertion that
M33 does not import the M42 Stage-B authority module. The M37 test amendment
must retain its Stage-A projection, privacy, no-public-export, and no-M37-import
assertions. The M43 test amendment must retain the semantic proof that every
ATS operation remains `NOT_CONFIGURED` before Mirror I/O or a durable outcome
write; it may retire only the stale M33 source-text assertion.

The M37/M42/M43 sources are not amendable. M42's eleven-field preimage and its accepted digest
`1880065c5ae64b3fc6279cfdd8c85a6880d43e98ce129ed697c72372204296f9` are not
amendable. These test paths are GREEN-only; they are not authorized for the
durable M48 RED change.

## Design ruling

M48 must use one private, deeply frozen compiled literal in
`packages/backend/convex/ats_prepare_authority.ts`, not an import of the M42
authority projection. The literal may contain the immutable SDK package identity
as descriptor data, but it must not import the SDK or gain an SDK capability.
The matching M48 resolver test must continue to reject SDK imports, dynamic
imports, initialization, request construction, and creation calls rather than
rejecting inert descriptor text.

## Review

Independent read-only design and RED reviews at canonical
`5407fc397832fd8fd3510b41fbf503d6d600425f` are clear. The amendment changes no
runtime behavior by itself and needs no new human decision: it merely keeps the
accepted M37/M42/M43 test suites coherent with the separately human-approved
downstream M48 mapping. Every existing M48 local-only exclusion remains in
force.
