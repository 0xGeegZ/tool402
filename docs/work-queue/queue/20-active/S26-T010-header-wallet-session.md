# S26-T010 — Header wallet control and shared session

## State

- Tier: POLISH
- Queue state: 20-active
- Dependencies: M02-T020 accepted, S15-T010 accepted, S16-T010 accepted,
  S21-T010 accepted; the root sequences this card after S25-T010 (shell
  header) is integrated. S18-T010 does not block the card: if it is accepted
  first, the backing-flow island mount is amended under this card's
  reservation; otherwise S18-T010 adapts to the shared session.
- Owner: The root owns queue state, catalog, ownership, the UI slice ledger,
  decisions, reviews, commits, and pushes. Proposed implementation paths are
  exactly the UI-S26 local targets: new
  `apps/web/src/components/wallet/wallet-session.tsx` and
  `apps/web/tests/wallet-session.test.mjs`; and, each under a root
  integration reservation, `apps/web/src/components/wallet/wallet-connect.tsx`,
  the header block and shell wrapper of `apps/web/src/app/layout.tsx`, the
  wallet block of
  `apps/web/src/components/provider/deploy/deploy-stage-signing.tsx`, the
  island mount of `apps/web/src/components/backing/backing-flow.tsx` if
  S18-T010 is accepted first, and the island, header, and landmark
  assertions of the three accepted tests the manifest names.
- Human actions: none. This change creates no authority, wallet permission,
  payment, provider, configuration, account, transaction, deployment, or
  live behaviour.

## Scope

The only wallet connect control lives inside the deploy wizard's signing
card, so a provider reaches the last wizard step before learning MetaMask is
needed, and every later route that needs the wallet would mount its own
island with its own state. This card moves the accepted island to the shell
header as a compact control, shares one session through a React context in
the root layout, and removes the wizard's wallet block; the wizard reads the
shared session and shows one sentence pointing to the header until connected.
Discovery still runs only on a click. Nothing auto-connects or persists.

The local contract is the
[UI-S26 header wallet control manifest](../../../ui/UI-S26.md). The accepted
slices it builds on are the [UI-S00 manifest](../../../ui/UI-S00.md), the
[UI-S15 manifest](../../../ui/UI-S15.md), the
[UI-S16 manifest](../../../ui/UI-S16.md), and the
[UI-S21 manifest](../../../ui/UI-S21.md), recorded in the
[local UI slice ledger](../../../ui/IMPORT-LEDGER.md).

## Candidate ready requirements

- The manifest, card, catalog row, ownership, and state records are
  committed before any source change.
- The two new paths are disjoint from every accepted card's owned paths and
  from every sibling card in the inbox.
- Every amended path belongs to an accepted record named in the manifest;
  each amendment needs an explicit root integration reservation before source
  changes, limited to the island, the header block and wrapper, the wallet
  block, the island mount, or the one assertion, and the root sequences this
  card's amendments after S25-T010, with the backing-flow amendment only
  after S18-T010.
- The session API, the per-kind control labels, the wizard sentence, and the
  live-region rule are fixed in the manifest before code, so no control,
  state kind, or behaviour can be added while the slice is built.

## Verification

- A durable test-only RED commit precedes every source change and fails
  because `wallet-session.tsx` does not exist, the island still holds local
  state, the layout renders no wallet control, and the signing component
  still mounts its own wallet block.
- Focused tests prove the fixed session API, discovery only inside
  `connect`, the layout wrapper and control placement, the per-kind labels,
  and the visually hidden live region.
- The amended accepted tests pass with only their island, header, and
  landmark assertions changed; every other assertion is untouched.
- Web typecheck, test, lint, and build; root typecheck, test, lint,
  `npm run queue:check`, and the enabled local-reference guard pass.
- Desktop and 390px browser checks: connect from the header on `/`, reach
  `/provider/deploy` through in-app links without a full reload, see the
  wizard already connected with no second prompt, the header row wrapping
  without overflow, and visible keyboard focus on the control.
- Independent task review and a fresh module-review generation report no
  Critical finding.

## Boundary

This card changes presentation and client-state composition only. It adds no
state kind, wallet, auto-connect, storage, discovery outside a click,
signature outside the accepted dialog, authority display, balance,
transaction, route, navigation change, or API change. The manifest's
exclusions govern; this card does not restate them.

## Human worktree lane request

- Requested at `2026-09-10T19:00:00Z` by the human operator (repository
  owner) through the operator's delegated session, under the explicit-request
  rule of the [runtime worktree policy](../../WORKTREE-POLICY.md). The card's
  tier, dependencies, declared paths, verification list, and boundary are
  unchanged.
- Worktree `.worktrees/wallet-session`, branch `work/wallet-session`.
  Implementer: the operator's delegated session. Reviewer: the root's
  independent task review and module review, unchanged.
- The lane delivers, in this order on that branch: one test-only RED commit at
  the declared test paths, failing only because the declared source does not
  exist or the declared amendment has not been made; then the minimal GREEN
  commits limited to the declared source paths.
- The branch changes no queue state, ledger, catalog, ownership, STATE,
  decision, human-action, evidence, spec, or manifest file. The root keeps the
  ready review, the activation decision, the independent reviews, the
  integration decision, and every queue record. The branch is mirrored as a
  pull request for human visibility only; nothing from it reaches `main`
  outside the root's integration decision.

## Root integration activation

- At `f8f12637ce4554418a920b7816259a41ca3730bb`, the repository owner
  explicitly directed the root to integrate `work/wallet-session` (PR #63)
  into this S38 branch. The root records S26 as `20-active` only for the
  manifest's declared wallet-session, header, deploy-signing, backing-flow,
  and named-test surfaces, plus only the assertion seams in
  `apps/web/tests/backing-route.test.mjs` (S18),
  `apps/web/tests/wallet-session-sync.test.mjs` (M50),
  `apps/web/tests/wallet-state.test.mjs` (S15), and
  `apps/web/tests/provider-deploy-visual-reconciliation.test.mjs` (S29).
  M49-T010 and S18-T010 are accepted, so the conditional amendments are
  eligible.
- The integration preserves UI-S26's client-state-only boundary: no caller
  supplies an approved issuer address and a connected header session does not
  create authority. The deploy view must use the shared connected provider
  without an issuer-specific local gate or display.
- The repository owner additionally directs each connected-address badge to
  navigate internally to `/dashboard`. This reserves only the badge wrapper
  in `apps/web/src/components/wallet/wallet-connect.tsx` and its assertion in
  `apps/web/tests/wallet-session.test.mjs`. It neither creates an S38 session
  nor reads one on the client; the server guard remains the sole dashboard
  access decision and redirects unsigned users to `/sign-in`.
- The root also reserves only the shared-session composition assertions in
  `apps/web/tests/backing-route.test.mjs` (accepted S18 flow),
  `apps/web/tests/wallet-session-sync.test.mjs` (accepted M50 passive-event
  harness), `apps/web/tests/wallet-state.test.mjs` (accepted UI-S15 state
  contract), and `apps/web/tests/provider-deploy-visual-reconciliation.test.mjs`
  (accepted S29 presentation). They may change only from a second local
  island to the one shared session, and may not alter their owning behavior.
- Final S26 acceptance remains separate: it requires the declared desktop and
  390px connected-header/wizard browser evidence plus fresh task and module
  review. No wallet request, signature, transaction, deployment, or live
  action is authorized by this activation.

## User-directed deploy-form connection amendment

- The repository owner directs that the last deploy/signing form surface an
  actionable shared-session `Connect MetaMask` section when, and only when,
  the wallet kind is `disconnected`. This amends only the existing reserved
  deploy-signing block and its existing focused assertion seam.
- The button invokes the already accepted `connect()` action only after its
  explicit click. It neither creates a second wallet session nor discovers a
  provider, requests an account, switches a chain, signs, or grants authority
  during render. Connected and other non-connected states retain the existing
  shared-session behavior.

## User-directed deploy-form copy correction

- The repository owner found the inherited passive aside sentence `Connect
  MetaMask to sign.` alongside the actionable disconnected-wallet section.
  The existing reserved deploy-signing block and focused test may remove that
  redundant sentence only. The actionable `provider-deploy-connect` section
  remains the sole disconnected-wallet instruction and control; the signing
  explanation card, wallet behavior, authority boundaries, and layout stay
  unchanged.
