# M38-T010 — Offering command payloads

## State

- Tier: CORE_P0
- Queue state: 10-ready
- Dependencies: M10-T010 accepted; M20-T010 accepted; M26-T010 accepted;
  M28-T010 accepted; no in-batch predecessor
- Owner: The root owns queue state, catalog, ownership, decisions, reviews,
  commits, and pushes. Proposed implementation paths are exactly:
  `packages/core/src/offering-create-payload.ts`,
  `packages/core/src/directory-publish-payload.ts`,
  `packages/core/src/attach-candidate-payload.ts`,
  `packages/core/src/index.ts`,
  `packages/core/test/offering-create-payload.test.mjs`,
  `packages/core/test/offering-create-payload.types.ts`,
  `packages/core/test/directory-publish-payload.test.mjs`,
  `packages/core/test/directory-publish-payload.types.ts`,
  `packages/core/test/attach-candidate-payload.test.mjs`, and
  `packages/core/test/attach-candidate-payload.types.ts`. Nine are new.
  `packages/core/src/index.ts` is a narrow barrel amendment under a root
  integration reservation: it adds the new exports and changes no accepted
  export line. No accepted Core test is amended, because the accepted barrel
  test asserts only the foundation value and the accepted boundary test scans
  `packages/core/src` generically for prohibited imports.
- Human actions: none for local delivery; this card completes no human action.
  HA-COMMAND-AUTHORITY-002 remains required before any command of these three
  types may be admitted, and it gates M39-T010, not this card. Stage B, the
  issuer account, the Convex deployment, and the retargeted configuration
  remain their own human-owned rows.

## Scope

Add the three closed Core payload shapes the campaign deploy path signs, beside
the accepted M26 external-prepare payload: `offering.create`,
`directory.publish`, and `external.attachCandidate`. Each shape gets one
descriptor-safe parser and one canonical-bytes builder.

The local contract is the
[M38 specification](../../../specs/m38-offering-command-payloads.md). The
approved flow it serves is the
[campaign deploy flow design](../../../superpowers/specs/2026-09-08-campaign-deploy-flow-design.md),
requested through the
[HI-002 intake card](../60-done/HI-002-campaign-deploy-reinstatement.md).

Nested structure is delegated, not duplicated: the offering definition is parsed
by the accepted
[M20 parser](../../../specs/m20-offering-definition-schema.md) and the directory
record by the accepted
[M28 parser](../../../specs/m28-agent-directory-record-candidate-schema.md).
Identifier, idempotency-key, and expiry grammars are the accepted
[M26 rules](../../../specs/m26-external-prepare-payload.md) unchanged.

Core stops at the canonical JCS bytes. Keccak-256 of those bytes is computed by
the consumer that already depends on `viem`, so this card adds no hash function
and no new package dependency.

This card creates no command type, envelope, signature check, authority lookup,
schema, Convex function, HTTP route, wallet or provider behavior, transaction,
or live evidence. Defining a payload shape admits nothing.

## Why this card exists now

The accepted command vocabulary carries exactly one payload, M26
`external.prepare`. The design's now half needs three more shapes before a
multi-type normalizer, a durable admission boundary, or a wizard can be written
against them, and every later card in the backend and web lanes reads these
field sets.

Writing them first is also what keeps the human gate honest. The types are
inert until `HA-COMMAND-AUTHORITY-002` admits them, so the shapes can be fixed,
reviewed, and tested locally without any claim that a new command is accepted.

## Candidate ready requirements

- M10-T010, M20-T010, M26-T010, and M28-T010 remain accepted locally, and this
  card, the M38 specification, catalog, ownership, decision, and state records
  are committed before a RED test or source file.
- The nine new paths are disjoint from every active card, and the tenth is the
  declared barrel amendment under a root integration reservation. No accepted
  Core source, test, schema, package, or lockfile is otherwise eligible.
- The specification fixes, before any code, the closed field set of each
  payload, the delegated M20 and M28 boundaries, the reused M26 identifier and
  time grammars, the narrative and advertised-price bounds, the two retained
  transaction-id forms, and the canonical projection each bytes builder emits.
- An independent review of that committed authority finds no Critical,
  Important, or Minor finding before this card enters `10-ready`.

## Verification

- Durable test-only RED files precede every source and barrel change and fail
  only because the three declared modules do not exist.
- Focused tests prove one exact valid frozen detached payload per type; the
  closed root shapes; the public-ID, idempotency-key, and expiry grammars,
  including `attemptPublicId` under the idempotency-key grammar and its
  rejection when it equals the payload's own `idempotencyKey`; the
  `directory.publish` record-to-payload equality; the `ATS_CREATE` address
  requirement and the rejection of an address under every other kind; both
  transaction-id forms with no conversion between them; the narrative byte
  bounds at the limit and one past it; control-character and
  surrogate rejection; and hostile-reflection and no-invoked-accessor behavior.
- Focused tests prove each bytes builder reproduces the canonical JCS bytes of
  the untrusted fixture, returns a fresh `Uint8Array` per call, and omits an
  absent optional field rather than emitting `null`. A further test proves that
  a record URL which is not already its own normalized `href` fails the
  `directory.publish` parse closed rather than being re-rendered.
- Compile-time fixtures prove the readonly roots, the branded prices, the
  two-member transaction-id union, the optional address, and reuse of the
  accepted M20, M26, and M28 types.
- Focused Node commands from the repository root under Node 22.21.1:

  ```bash
  node --test packages/core/test/offering-create-payload.test.mjs
  node --test packages/core/test/directory-publish-payload.test.mjs
  node --test packages/core/test/attach-candidate-payload.test.mjs
  ```

- `npm run typecheck`, `npm run test`, `npm run lint`, `npm run queue:check`,
  and the enabled local-reference guard pass.
- Independent task review and two fresh clean module-review generations report
  no Critical, Important, or Minor finding.

## Boundary

This card delivers three pure Core parsers, three canonical-bytes builders,
their focused tests, and one narrow barrel amendment. It admits no command type,
verifies no signature, reads no clock, environment, storage, or network, adds no
dependency, writes no record, and touches no accepted parser, schema, route, or
configuration. It creates or funds no account, prompts no wallet, calls no ATS
SDK, submits no transaction, and claims no receipt, publication, activation,
deployment, or live behavior.
