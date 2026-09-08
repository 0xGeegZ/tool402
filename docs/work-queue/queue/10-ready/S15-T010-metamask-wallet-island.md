# S15-T010 — MetaMask wallet island and command relay

## State

- Tier: CORE_P0
- Queue state: 10-ready
- Dependencies: M02-T020 accepted, M11-T020 accepted, M29-T010 accepted, M30-T010 accepted
- Owner: The root owns queue state, catalog, ownership, the UI slice ledger,
  decisions, reviews, commits, and pushes. Proposed implementation paths are
  exactly `apps/web/src/lib/wallet/metamask-provider.ts`,
  `apps/web/src/lib/wallet/tool402-command.ts`,
  `apps/web/src/lib/wallet/wallet-state.ts`,
  `apps/web/src/lib/wallet/command-relay.ts`,
  `apps/web/src/components/wallet/wallet-connect.tsx`,
  `apps/web/src/components/wallet/signature-dialog.tsx`,
  `apps/web/src/app/api/commands/route.ts`,
  `apps/web/tests/metamask-provider.test.mjs`,
  `apps/web/tests/tool402-command.test.mjs`,
  `apps/web/tests/wallet-state.test.mjs`, and
  `apps/web/tests/commands-api.test.mjs`, plus one exact `viem` 2.56.1 pin
  added as an amendment under a root integration reservation to
  `apps/web/package.json`, to the root `package-lock.json`, and to the
  dependency assertion in `apps/web/tests/static-shell.test.mjs`.
- Human actions: none for local delivery. The browser wallet rule is already
  accepted in the
  [HA-COMMAND-AUTHORITY-001 decision](../../evidence/HA-COMMAND-AUTHORITY-001-decision.md).
  Forwarding a signed command to a reachable Convex deployment additionally
  requires the `HA-CAMPAIGN-CONVEX-001` row requested by the
  [HI-002 intake card](../60-done/HI-002-campaign-deploy-reinstatement.md); until those
  environment values exist the relay answers with its explicit not-configured
  outcome and nothing leaves the web host.

## Scope

The accepted repository has no browser wallet surface at all. The accepted
normalizer verifies a signed `external.prepare` command on the server, and the
accepted human decision fixes the EIP-712 domain, the primary type, the nonce
and timestamp grammars, and the MetaMask selection rule, but no local code can
produce such a command and no local route can carry one to a backend.

Add one hand-rolled MetaMask island, one command builder, one closed wallet
state module, one closed relay outcome module, two presentational components,
and one server route that forwards an already-signed command over the accepted
HMAC ingress envelope. The island discovers providers on click, fails closed on
zero or several candidates, gates on chain `0x128`, and hands a signed
`{ command, payload }` body to the relay. It creates no offering, attempt,
asset, directory version, payment, or transaction.

The approved shape is the now half of the
[campaign deploy flow design](../../../superpowers/specs/2026-09-08-campaign-deploy-flow-design.md).
The local contract is the
[UI-S15 wallet island and command relay manifest](../../../ui/UI-S15.md), and
the accepted slice history it builds on is recorded in the
[local UI slice ledger](../../../ui/IMPORT-LEDGER.md).

## Candidate ready requirements

- The slice manifest, card, catalog, ownership, and state records are committed
  before any source change.
- The seven source paths are new files under three new directories,
  `apps/web/src/lib/wallet/`, `apps/web/src/components/wallet/`, and
  `apps/web/src/app/api/commands/`; the four focused tests are new files in the
  existing `apps/web/tests/` directory. All eleven are disjoint from every
  accepted card's owned paths and from every sibling card in this batch.
- `apps/web/package.json`, the root `package-lock.json`, and
  `apps/web/tests/static-shell.test.mjs` belong to accepted cards, so the
  single `viem` 2.56.1 pin needs an explicit root integration reservation
  recorded in the ownership file before the amendment. The sibling ATS SDK seam
  card amends the same three files for its own pin, so the root sequences the
  two reservations rather than granting either card exclusive ownership. The
  blocked B03-T010 card already reserves the root `package-lock.json`, so the
  root confirms that card's lane state before either pin lands.
- The wallet state union, the signature dialog phase union, the relay outcome
  union, and the EIP-712 field order are fixed in the manifest before code, so
  no branch can be added while the slice is implemented.
- The card owns no payload schema and no canonicalizer. The command builder
  computes `payloadHash` as Keccak-256 over canonical payload bytes supplied by
  its caller, so a later card that owns a command type owns its own
  canonicalization.

## Verification

- A durable test-only RED commit precedes every source change and fails
  because the declared provider, command, state, relay, and route paths do not
  exist.
- Focused tests prove the EIP-6963 selection rule, including exactly one
  `io.metamask` candidate, zero and several candidates failing closed, the
  legacy fallback admitted only when no candidate was announced and
  `isMetaMask` is true, and no announcement listener registered at module load.
- Focused tests prove the chain gate, the optional switch request, and the
  independent `eth_chainId` re-read after it, so a resolved switch request is
  never treated as evidence that the chain changed.
- Focused tests prove the fixed domain, the primary type, the seven message
  fields in their exact order, the byte-for-byte equality of command and
  payload `expiresAt`, the canonical 22-character base64url nonce, the
  canonical millisecond timestamps, the 300-second lifetime bound, and the
  lower-case signer and payload-hash forms the accepted normalizer requires.
- Focused tests prove the nine-field transport command, the integer `296`
  chainId, and the lower-case 130-hex signature form submitted unchanged.
- Focused tests prove the closed wallet state union, the closed dialog phase
  union, and that the refusal messages the manifest names (unauthorized issuer,
  expired command, replayed idempotency key) are copy carried by an existing
  phase rather than new phases.
- Focused tests prove that `not_issuer` compares the connected address only
  against an approved issuer address supplied as a prop by the composing route,
  and that with no such prop supplied the island never reaches `not_issuer` and
  leaves the server as the only authority.
- Focused tests prove that no path retries automatically, that each signature
  request generates a fresh nonce and re-reads the signer and chain, and that
  no relay call occurs before a signature exists.
- Focused tests prove the relay route returns its not-configured outcome with
  every environment name absent, builds the ingress envelope over the exact
  received bytes, forwards those same bytes to the configured Convex site under
  an explicit timeout and a maximum response size, reports either bound as its
  transport failure outcome, maps only the documented backend outcomes,
  including the transport-only `UNSUPPORTED_TYPE` arm, and never logs, echoes,
  or stores a body, header, key, or signature.
- `npm run typecheck --workspace @tool402/web`,
  `npm run test --workspace @tool402/web`,
  `npm run build --workspace @tool402/web`, root `npm run typecheck`,
  `npm run test`, `npm run lint`, `npm run queue:check`, and the enabled
  local-reference guard all pass.
- A clean install succeeds with the amended lockfile and the amended
  dependency assertion lists `viem` at exactly 2.56.1.
- Browser evidence is limited to what a machine without MetaMask can actually
  produce: the no-provider state, the retry control, keyboard focus order, the
  dialog's polite live region, and the route's not-configured response. No
  signed-command, connected-account, or backend-accepted browser claim is made
  by this card.
- Independent task review and a fresh module-review generation report no
  Critical finding.

## Boundary

This card produces a signature request and relays its result. It advances no
offering, attempt, or directory state, and a wallet callback is never treated
as success. Its exclusions are the manifest's truthfulness and authority
boundary, which governs; this card does not restate them.

## Human worktree lane request

- Requested at `2026-09-08T21:14:15Z` by the human operator (repository
  owner) through the operator's delegated session, under the explicit-request
  rule of the [runtime worktree policy](../../WORKTREE-POLICY.md). The card's
  tier, dependencies, declared paths, verification list, and boundary are
  unchanged.
- Worktree `.worktrees/s15`, branch `work/s15`, pushed to `origin/work/s15`.
  Implementer: the operator's delegated session. Reviewer: the root's
  independent task review and module review, unchanged.
- The lane delivers, in this commit order on that branch: the local
  implementation plan; one test-only RED commit adding exactly the four
  declared focused tests and the amended static-shell dependency assertion,
  failing only because the declared source paths and the `viem` pin are
  absent; the minimal GREEN commits limited to the seven declared source
  paths; and one separate commit carrying only the `viem` 2.56.1 pin in
  `apps/web/package.json` and the root `package-lock.json`, so the root can
  sequence that reservation against M44-T010 and B03-T010.
- The branch changes no queue state, ledger, catalog, ownership, STATE,
  decision, human-action, or evidence file. The root keeps the ready review,
  the activation decision, the independent reviews, the integration decision,
  and every queue record. The branch is mirrored as a pull request for human
  visibility only; nothing from it reaches `main` outside the root's
  integration decision.
