# M44-T010 — ATS SDK issuer client seam

## State

- Tier: CORE_P0
- Queue state: 20-active
- Dependencies: M01-T040 accepted, M02-T020 accepted, M42-T010 accepted,
  S15-T010 accepted, S16-T010 accepted
- Owner: The root owns queue state, catalog, ownership, decisions, reviews,
  commits, and pushes. Proposed implementation paths are exactly
  `apps/web/src/lib/ats/create-bond-request.ts`,
  `apps/web/src/lib/ats/ats-client.ts`,
  `apps/web/src/components/provider/deploy/ats-create-action.tsx`,
  `apps/web/tests/create-bond-request.test.mjs`, and
  `apps/web/tests/ats-client.test.mjs`, plus one dependency pin recorded as an
  amendment under a root integration reservation in `apps/web/package.json`,
  the root `package-lock.json`, and `apps/web/tests/static-shell.test.mjs`.
- Human actions: HA-ISSUER-ACCOUNT-001 is accepted only as bounded public
  testnet issuer-account evidence; HA-ATS-STAGE-B-001 remains pending and
  gates every live behavior of this seam. Local delivery is source, focused
  tests, and the recorded bundle-gate result only. HA-ATS-RETARGET-001 gates
  M42-T010, whose accepted configuration this card consumes.

## Scope

Add the one web module set that lets the human provider create the revenue
note in their own MetaMask through the official Asset Tokenization Studio SDK:
a pure `CreateBondRequest` field builder, a client whose every SDK capability
is injected, and one client island that exposes a single user-initiated
action.

The local contract is the
[M44 ATS issuer client seam](../../../specs/m44-ats-issuer-client-seam.md).
The approved flow it serves is the
[campaign deploy flow design](../../../superpowers/specs/2026-09-08-campaign-deploy-flow-design.md),
and the scope ruling and human-action rows it depends on are requested in the
[HI-002 intake card](../60-done/HI-002-campaign-deploy-reinstatement.md).

This card adds no command payload, no signature, no relay route, no durable
record, no receipt verification, and no key material. It never marks an
offering `READY`; if a separately authorized runtime bridge later invokes it,
it returns only a submitted transaction candidate. It does not give S16-T010 a
signature, a durable attempt, or an `external.attachCandidate` submission.

## Why this card exists now

The accepted configuration projections are private Backend sources that are
forbidden from importing the SDK, initializing it, connecting a provider, or
submitting an operation. Nothing in the repository can construct the creation
request, so the tokenization step of the approved flow has no local execution
seam at all.

The gap is one step wide and it is the only step of Stage B an agent may build
in advance. Everything around it already exists in accepted form: the frozen
parameter set, the fail-closed authority gate, and the browser wallet rule.

## Candidate ready requirements

- The local contract, card, catalog, ownership, and state records are
  committed before a RED test or source change.
- M01-T040 and M02-T020 remain accepted. M42-T010 must be accepted first,
  because it defines the complete private retargeted configuration shape that
  the test-local fixture freezes. S15-T010 and S16-T010 must be accepted first
  because they own the wallet boundary and the provider-deploy host boundary,
  respectively. S16's configuration literal is display-only, has no complete
  parameter set or `diamondOwnerAccount`, and is explicitly not an M44 input;
  S16 owns no durable prepared attempt.
- The three declared source paths and two declared test paths are new and
  disjoint from every other card in this batch.
- The dependency pin is one fact across `apps/web/package.json`, the root
  `package-lock.json`, and the deep-equal dependency assertion in
  `apps/web/tests/static-shell.test.mjs`. Each needs the explicit root
  integration reservation recorded in the ownership file before the amendment,
  and the three files land together. The sibling S15-T010 wallet island card
  amends the same three files for its own `viem` 2.56.1 pin, so the root
  sequences the two reservations rather than granting either card exclusive
  ownership. The blocked B03-T010 card also amends the root
  `package-lock.json`, and the root confirms its lane state before either pin
  lands.
- The contract fixes the injected client seams, the exact builder field set,
  the required configuration values, the ordered gate sequence, and the closed
  outcome union before any code.

## Verification

- The day-one bundle gate is the first executable step after the two durable
  RED files land: with `@hashgraph/asset-tokenization-sdk` `8.0.0` added and
  imported from the client island, `npm run typecheck --workspace @tool402/web`
  and `npm run build --workspace @tool402/web` must pass under Next 16.3.4 with
  `cacheComponents` enabled. The pin and one minimal client-island import are
  the only changes preceding the remaining GREEN source. If either fails
  because of the SDK, the card stops and the observed failure is recorded. The
  SDK is not forked, patched, vendored, shimmed, aliased, mocked, or
  downgraded, and `cacheComponents` is not disabled or narrowed.
- Durable RED files at `apps/web/tests/create-bond-request.test.mjs` and
  `apps/web/tests/ats-client.test.mjs` precede every source, manifest, and
  lockfile change. They fail only because the declared modules do not exist.
- Focused tests prove every builder field by name and value, exact key-set
  equality, rejection of each fixed configuration value's drift, equality of
  the issuer address and `diamondOwnerAccount`, equality of the
  configuration's root `canonicalParametersHash` and the supplied context
  value, and result immutability and detachment.
- Focused client tests prove every outcome in the closed union, that a failed
  wallet, signer, or prepared-attempt check reaches no injected seam, that
  `Bond.create` runs at most once per prepared attempt, and that no SDK,
  provider, or network module loads in either test.
- The two RED tests use only a complete test-local fixture. The M44 action is
  disabled until a future scoped Stage B bridge provides both a trusted full
  configuration and a durable prepared attempt; neither value may be read,
  imported, or derived from S16-T010 in this card.
- The accepted web dependency assertion changes by exactly one entry, and no
  other accepted web route, component, or test changes.
- `npm run typecheck`, `npm run test`, `npm run lint`, `npm run queue:check`,
  and the enabled local-reference guard pass, along with independent task
  review and fresh module-review generations reporting no Critical, Important,
  or Minor finding.

## Boundary

This card adds a local capability to construct and submit one creation request
from a wallet the human already controls. It creates no account, funds
nothing, holds no key, signs no command, and claims no note, receipt,
allocation, deployment, or submission.

A returned candidate records only that a transaction was submitted. It is not
evidence that a revenue note exists or that the transaction succeeded; the
M43-T010 mirror verification decides that, and only that verification may move
an offering to `READY`.

HA-ISSUER-ACCOUNT-001 is accepted only as bounded public evidence and grants
no account access. Until HA-ATS-STAGE-B-001 is accepted, the accepted M33
authority manifest stays zero-enabled, no `PREPARED` `ATS_CREATE` attempt can
exist, and the live path is unreachable: the client fails closed before
`Network.init`, connecting a provider, or prompting a wallet, and returns
`attempt_not_prepared` once the wallet and signer gates pass. Provisioning the
authority row, granting the Stage B GO, and running any live SDK call remain
human-only actions tracked in the runtime human-actions record. A later
dedicated bridge must supply the trusted full configuration and durable attempt
after its own authority review; this card must not add or adapt a Web runtime
configuration source.

## Ready review

At clean pushed `c1d25a4bfe9fcd414580441bdd63de8f3524e85e`, an independent
readiness review found M01-T040, M02-T020, M42-T010, S15-T010, and S16-T010
accepted; M41-T010's Backend-only RED phase disjoint; the M44 source/test
paths and dependency pin absent; and the root package reservation intact.
HA-ISSUER-ACCOUNT-001 is accepted bounded evidence only, while
HA-ATS-STAGE-B-001 remains the separate live gate. A fresh activation may
authorize only the two durable test-only RED files; it cannot install the SDK,
read configuration, connect a wallet, or submit an operation.

## Activation review

At clean pushed `00ea2c8bb8dcfd5be7085cb5bcf55e1eb0c43939`, a fresh independent
activation review found M44-T010 ready, all five dependencies accepted, M41's
Backend-only RED lane disjoint, and every M44 source, dependency-pin, and SDK
target absent. This activation authorizes only
`apps/web/tests/create-bond-request.test.mjs` and
`apps/web/tests/ats-client.test.mjs`. It does not authorize the SDK pin,
source, configuration access, wallet/provider/network interaction,
transactions, deployment, or live behavior.

## Configuration-boundary amendment

An M44 scope review found that S16-T010's accepted literal is a deliberately
partial display projection rather than the full real-issuer configuration this
card's builder parses. It lacks the full `parameters` object and
`diamondOwnerAccount`; importing or adapting it would make a partial display
record appear executable. M44 therefore retains its existing caller-supplied
`configuration: unknown` seam, but accepts only the complete real-issuer Stage
B shape under the closed parser. Its durable RED fixtures are complete and
test-local. The action remains disabled because the current Web surface has
neither a trusted configuration nor a durable prepared attempt. A future
separately scoped Stage B bridge, after its own authority review, must provide
both inputs. This amendment does not reopen S16-T010 or authorize a new Web
configuration source, the SDK pin, source, a wallet/provider interaction, a
transaction, deployment, or live behavior.

## RED acceptance

Independent review at `c5d2bf3` is clear for the two durable RED contracts.
The focused Node 22.21.1 run reports only the two declared absent M44 modules,
with the remaining assertions skipped. Before any builder or injected client
source, the root may make exactly one official bundle-gate attempt: pin the
approved SDK, update its lockfile and strict static-shell assertion, and add
the smallest client-island import necessary for the Web typecheck and build.
If either check fails because of the SDK, stop and record the failure. This
does not authorize a configuration bridge, durable attempt, wallet/provider
interaction, transaction, deployment, or live behavior.

## Bundle-gate observation

The exact official SDK pin and integrity resolved, and the strict static-shell
test plus Node 22.21.1 typecheck passed. The default Turbopack build stopped in
the known host CSS-worker port-bind restriction; the equivalent Webpack build
with Cache Components enabled passed with only the existing optional RiskScan
warning. The island was not reachable from a production route, so it did not
enter a client manifest and cannot prove client-bundle compatibility. Further,
the official root entry invokes `dotenv.config()` when evaluated. Mounting it
would exceed this card's no-configuration/no-mount boundary. The gate is
blocked: remove the experimental uncommitted changes, retain the RED contract,
and require a new scoped authority before another bundle attempt. No trusted
configuration, durable attempt, wallet/provider interaction, transaction,
deployment, or live behavior is authorized.
