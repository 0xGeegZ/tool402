# M41-T010 schema baseline amendment review

## Observation

The M41 atomic `ATS_CREATE` handoff requires the additive M40 offering index
`by_ats_create_draft_binding` over exactly `subjectPublicId`,
`canonicalSignerAddress`, `principalPublicId`, `authorityVersion`, and `state`.
The accepted M40 durable-schema regression fixture predates that required M41
index, so the complete Backend suite fails while the actual schema has the
correct additive index.

## Scoped amendment

The root authorizes one and only one amendment to
`packages/backend/tests/offering-durable-schema.test.mjs`: append the exact
five-field `by_ats_create_draft_binding` entry to the existing
`expectedM40.offerings.indexes` vector. It changes neither the schema nor its
fields, table names, index ordering outside that vector, M40 admission
behavior, M41 dispatch behavior, or any runtime capability.

## Verdict

CLEAR — the expected-schema fixture must describe the already-authorized,
additive M41 index so the required complete Backend regression can distinguish
an absent or altered index from the intended schema. The amendment is limited
to a test expectation and adds no configuration, key, publication, wallet,
provider, SDK, transaction, deployment, or live behavior.
