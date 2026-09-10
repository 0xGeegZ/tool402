# M48-T010 GREEN scope amendment

## Finding

The accepted M42 test
`packages/backend/tests/stage-b-issuer-ats-create-authority.test.mjs` contains
a contemporaneous assertion that M33's production manifest is the frozen empty
literal. That assertion was correct when M42 was accepted, but it conflicts
with the human-approved M48 successor, whose sole purpose is to add one static
local M33 mapping. Leaving it unchanged would make the complete Backend suite
require both incompatible states.

## Narrow amendment

After independent M48 RED acceptance, M48 may amend only
`packages/backend/tests/stage-b-issuer-ats-create-authority.test.mjs` to retire
that historical empty-manifest assertion. The amendment must retain the M37
preservation, M42 real-issuer projection, frozen/detached data, canonical
preimage and digest, retarget, privacy, no-SDK-dependency, and no-public-export
assertions. In particular, it must keep the assertion that M33 does not import
the M42 Stage-B authority module.

The M42 source, its eleven-field preimage, and its accepted digest
`1880065c5ae64b3fc6279cfdd8c85a6880d43e98ce129ed697c72372204296f9` are not
amendable. This test path is GREEN-only; it is not authorized for the durable
M48 RED change.

## Design ruling

M48 must use one private, deeply frozen compiled literal in
`packages/backend/convex/ats_prepare_authority.ts`, not an import of the M42
authority projection. The literal may contain the immutable SDK package identity
as descriptor data, but it must not import the SDK or gain an SDK capability.
The matching M48 resolver test must continue to reject SDK imports, dynamic
imports, initialization, request construction, and creation calls rather than
rejecting inert descriptor text.

## Review

Independent read-only design review at canonical
`5407fc397832fd8fd3510b41fbf503d6d600425f` is clear. The amendment changes no
runtime behavior by itself and needs no new human decision: it merely keeps the
accepted M42 test suite coherent with the separately human-approved downstream
M48 mapping. Every existing M48 local-only exclusion remains in force.
